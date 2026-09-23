// The one P0 happy-path e2e test (SPEC.md §9.2 Phase 9 "one Playwright test
// for the full P0 core flow", AGENTS.md §6 "5.2"). Drives the real app
// (pnpm dev) against the real cropket-dev cloud project - no mock server,
// only two things are faked: the browser's own camera/mic (Chromium's fake
// device flags, playwright.config.ts) and Cashfree (already mocked server
// side, "Pay (demo)"). Everything else - OTP login, upload, grading, bids,
// consent audio, escrow, delivery photo, OTP, Khata - is the real system.
//
// Three browser contexts stand in for the three phones/screens in the real
// flow: farmer (360px, the phone), buyer (desktop, SPEC.md §4.10), driver
// (360px, no login - the link the farmer sends). Button/label text is
// imported from en.json, not typed by hand, so a copy change breaks this
// test loudly instead of silently drifting.
import { test, expect, type Page } from "@playwright/test";
import en from "../../src/locales/en.json" with { type: "json" };

const FARMER_PHONE = "9090910010";
const FARMER_OTP = "910010";
const BUYER_PHONE = "9090920001";
const BUYER_OTP = "920001";

// A fresh kg each run: >=500kg never gets swept into a mega lot
// (supabase/migrations/20260922170000_mega_lots.sql's v_target_kg), and the
// odd number makes this run's own deal easy to find in a shared table full
// of other lots (Khata row text, "My deals" row text).
const KG = 500 + (Date.now() % 400);

async function login(page: Page, phone: string, otp: string): Promise<void> {
  await page.goto("/login");
  await page.locator("#phone").fill(phone);
  await page.getByRole("button", { name: en.login.sendOtp }).click();
  await page.locator("#otp").fill(otp);
  await page.getByRole("button", { name: en.login.verify }).click();
}

/**
 * Empties Dexie's persisted query cache (offline/persist.ts's `cache`
 * table) before a reload/goto that needs to see something another actor
 * (a different browser context - buyer, driver) changed. staleTime is 5
 * minutes and nothing here has realtime, so a plain reload restores the
 * *persisted* snapshot from before that change and shows it as still
 * "fresh" - not a test quirk, a real gap (several "No Realtime on
 * escrow:{dealId}" notes in docs/progress.md say so already; out of this
 * item's scope to add). Clearing just this one table forces the next
 * mount's queries to fetch for real, without touching the login session
 * (Supabase's own session lives in localStorage, a different store) or the
 * outbox/drafts/blobs tables.
 */
async function clearPersistedCache(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.open("cropket");
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("cache")) {
            resolve();
            return;
          }
          const tx = db.transaction("cache", "readwrite");
          tx.objectStore("cache").clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        };
        req.onerror = () => resolve();
      }),
  );
}

test("P0 core flow: scan -> lot -> bid -> accept -> pay -> dispatch -> deliver -> paid", async ({ browser }) => {
  test.setTimeout(240_000);

  const farmerCtx = await browser.newContext({
    viewport: { width: 360, height: 800 },
    permissions: ["camera", "microphone", "geolocation"],
    geolocation: { latitude: 20.0847, longitude: 74.1116 },
  });
  const buyerCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const driverCtx = await browser.newContext({
    viewport: { width: 360, height: 800 },
    permissions: ["camera", "geolocation"],
    geolocation: { latitude: 20.0847, longitude: 74.1116 },
  });

  // lib/i18n.ts defaults to config.defaultLang (Marathi, the pilot's own
  // default - SPEC.md §1) when localStorage has nothing yet, which a fresh
  // context always doesn't - force English up front so every t()-sourced
  // locator below matches. accounts.sql's profiles.language has no runtime
  // effect on the UI language, only i18n.ts's own localStorage key does.
  for (const ctx of [farmerCtx, buyerCtx, driverCtx]) {
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem("cropket.lang", "en");
      } catch {
        /* ignore, same as i18n.ts's own writeStoredLang */
      }
    });
  }

  const farmer = await farmerCtx.newPage();
  const buyer = await buyerCtx.newPage();

  try {
    // ── 1. Farmer: scan a crop, create a lot, list it for sale ──
    await login(farmer, FARMER_PHONE, FARMER_OTP);
    await expect(farmer).toHaveURL("/farmer", { timeout: 20_000 });

    await farmer.goto("/farmer/scan");
    for (let shot = 0; shot < 3; shot++) {
      await farmer.getByRole("button", { name: en.scan.capture }).click();
    }
    await farmer.waitForURL(/\/farmer\/scan\/result\//, { timeout: 30_000 });

    // Grading runs through the outbox (upload_blob, then request_grade) -
    // useGradeResult() polls until it settles. Any grade (A/B/C) passes,
    // whether the AI service is real or INTEGRATIONS_MOCK=ai.
    await expect(farmer.getByText(/^Grade [ABC]$/)).toBeVisible({ timeout: 60_000 });
    await farmer.getByRole("link", { name: en.grade.createLot }).first().click();

    await farmer.waitForURL(/\/farmer\/lots\/new/);
    for (const digit of String(KG)) {
      await farmer.getByRole("button", { name: digit, exact: true }).click();
    }
    await farmer.getByRole("button", { name: en.lots.save }).click();

    await farmer.waitForURL(/\/farmer\/lots\/[0-9a-f-]+$/, { timeout: 15_000 });
    const lotUrl = farmer.url();
    const lotId = lotUrl.split("/").pop() as string;

    // "Sell on Cropket" only renders once lot.pending is false
    // (LotDetailPage.tsx) - insertLot() (services/lots.ts) now dequeues its
    // own outbox row before invalidating, so this needs no reload/wait (a
    // real "stuck On phone only" bug lived here until that fix - see this
    // item's progress.md handoff note).
    await expect(farmer.getByRole("button", { name: en.lots.sell })).toBeEnabled({ timeout: 15_000 });
    await farmer.getByRole("button", { name: en.lots.sell }).click();
    // status badge flips draft -> listed once listLot()'s RPC lands.
    await expect(farmer.getByText(en.lots.status.listed)).toBeVisible({ timeout: 15_000 });

    // ── 2. Buyer: bid on that lot ──
    await login(buyer, BUYER_PHONE, BUYER_OTP);
    await expect(buyer).toHaveURL("/buyer", { timeout: 20_000 });

    await buyer.goto(`/buyer/lots/${lotId}`);
    // Well above any seeded onion floor price, so FloorWarning never blocks
    // the button (SPEC.md §6.7 "the floor price warns, never blocks" - it
    // never blocks either way, this just keeps the test's own screen calm).
    await buyer.getByLabel(en.bid.yourBid).fill("3000");
    await buyer.getByRole("button", { name: en.bid.place }).click();
    // usePlaceBid() clears the input on success (LiveBidBox.tsx) - the
    // clearest signal the RPC actually landed, not just that the click fired.
    await expect(buyer.getByLabel(en.bid.yourBid)).toHaveValue("", { timeout: 15_000 });

    // ── 3. Farmer: accept the bid with voice consent ──
    // The farmer's own page has been sitting on this lot's detail screen
    // the whole time the buyer bid (useLotBidsRealtime is live there while
    // status === "listed") - click the real "Offers (N)" link instead of a
    // fresh goto(): a goto() is a full page reload, which would read the
    // *persisted* query cache (IndexedDB, up to 5 min stale) instead of the
    // in-memory cache Realtime already refreshed, and could show "No
    // offers yet" for a bid that is really there (the same staleTime trap
    // dequeue() fixed for the lot page above, but this side has no
    // handler-ordering fix available - the realtime subscription IS the
    // fix, as long as nothing reloads past it).
    await expect(farmer.getByRole("link", { name: /^Offers \([1-9]/ })).toBeVisible({ timeout: 15_000 });
    await farmer.getByRole("link", { name: /^Offers \([1-9]/ }).click();

    await farmer.waitForURL(new RegExp(`/farmer/lots/${lotId}/bids$`));
    await expect(farmer.getByRole("link", { name: en.bids.accept })).toBeVisible({ timeout: 15_000 });
    await farmer.getByRole("link", { name: en.bids.accept }).click();

    await farmer.waitForURL(/\/consent$/);
    const micButton = farmer.getByRole("button", { name: en.consent.holdPrompt });
    await micButton.dispatchEvent("pointerdown");
    await farmer.waitForTimeout(1_500);
    await micButton.dispatchEvent("pointerup");
    await expect(farmer.getByText(en.consent.recorded)).toBeVisible({ timeout: 10_000 });
    await farmer.getByRole("button", { name: en.consent.agree }).click();

    await farmer.waitForURL(new RegExp(`/farmer/lots/${lotId}$`), { timeout: 15_000 });
    await expect(farmer.getByText(en.lots.deal.soldTitle)).toBeVisible({ timeout: 15_000 });

    // ── 4. Buyer: pay (mock Cashfree) - escrow FUNDED ──
    // Buyer's first /buyer visit (right after login) already cached "My
    // deals" as empty - clearPersistedCache() before this second visit,
    // see its own comment.
    await clearPersistedCache(buyer);
    await buyer.goto("/buyer");
    const dealRow = buyer.getByRole("link").filter({ hasText: `${KG} ${en.lots.kg}` });
    await expect(dealRow).toBeVisible({ timeout: 15_000 });
    await dealRow.click();

    await buyer.waitForURL(/\/buyer\/deals\//);
    await buyer.getByRole("button", { name: en.deal.payButton }).click();
    await expect(buyer.getByText(en.deal.lockedTitle)).toBeVisible({ timeout: 15_000 });
    await expect(buyer.getByText(en.deal.deliveryCodeTitle)).toBeVisible({ timeout: 15_000 });
    // OtpDigits (components/money/OtpDigits.tsx) has no visible text node
    // per digit that Playwright would read as one string - it's the div's
    // own aria-label ("4 8 1 7") that carries the code, so scan every
    // aria-label on the page for that shape rather than guess a locator.
    const ariaLabels = await buyer.locator("[aria-label]").evaluateAll((els) =>
      els.map((el) => el.getAttribute("aria-label")),
    );
    const deliveryCode = (ariaLabels.find((label) => /^\d( \d){3}$/.test(label ?? "")) ?? "").replace(/\s/g, "");
    expect(deliveryCode).toMatch(/^\d{4}$/);

    // ── 5. Farmer: mark dispatched, send a driver link ──
    // The farmer's lot page has been cached with the CREATED escrow state
    // since accept_bid - the buyer paid on a different browser entirely, so
    // only a real fetch (clearPersistedCache(), see its own comment) will
    // show FUNDED.
    await clearPersistedCache(farmer);
    await farmer.reload();
    await expect(farmer.getByRole("button", { name: en.lots.deal.markDispatched })).toBeVisible({ timeout: 15_000 });
    await farmer.getByRole("button", { name: en.lots.deal.markDispatched }).click();
    await expect(farmer.getByText(en.lots.deal.onTheWay)).toBeVisible({ timeout: 15_000 });

    await farmer.getByLabel(en.lots.deal.driverLinkVehicleLabel).fill("MH15AB1234");
    await farmer.getByLabel(en.lots.deal.driverLinkPhoneLabel).fill("9876543210");
    await farmer.getByRole("button", { name: en.lots.deal.driverLinkSend }).click();

    const tripUrlText = await farmer.getByText(/\/t\//).textContent();
    const tripPath = tripUrlText?.match(/\/t\/[\w-]+/)?.[0];
    expect(tripPath).toBeTruthy();

    // ── 6. Driver: no login, delivery photo then the buyer's code ──
    const driver = await driverCtx.newPage();
    await driver.goto(tripPath as string);
    await expect(driver.getByText(new RegExp(`^${KG} kg`))).toBeVisible({ timeout: 15_000 });
    await driver.getByRole("button", { name: en.scan.capture }).click();

    await expect(driver.getByText(en.trip.enterCode)).toBeVisible({ timeout: 20_000 });
    // The 4-digit code input has no accessible label (TripPage.tsx) - it's
    // the only maxlength=4 input on this screen.
    await driver.locator('input[maxlength="4"]').fill(deliveryCode);
    await driver.getByRole("button", { name: en.trip.submitCode }).click();
    await expect(driver.getByText(en.trip.done)).toBeVisible({ timeout: 20_000 });

    // ── 7. Farmer: Khata turns green ──
    // /farmer/khata is this farmer's first visit this run, so it always
    // fetches for real regardless of staleTime - no clear needed. The lot
    // page below is a *re*-visit though (cached IN_TRANSIT since "Mark
    // dispatched"; the driver moved it to DELIVERED then RELEASED on its
    // own browser) - same clearPersistedCache() as step 5.
    await farmer.goto("/farmer/khata");
    await expect(farmer.getByText(new RegExp(`^${KG} kg`))).toBeVisible({ timeout: 20_000 });
    await clearPersistedCache(farmer);
    await farmer.goto(`/farmer/lots/${lotId}`);
    await expect(farmer.getByText(en.lots.deal.received)).toBeVisible({ timeout: 20_000 });
  } finally {
    await farmerCtx.close();
    await buyerCtx.close();
    await driverCtx.close();
  }
});
