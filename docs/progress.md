# Cropket prototype — progress

Claude Code ticks items here and fills a handoff note after each feature.
Scope: `SPEC.md` §9.5. Rules: `CLAUDE.md`.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `(mock)` = uses a mock for now

---

## M0 — Foundation
- [x] 0.1 Repo skeleton: `app/` (Vite + React + TS + Tailwind v4 + shadcn/ui), `supabase init`, `ai-service/` with `GET /health`, `.env.example` files, `.gitignore`, ESLint (no hard-coded text rule), Prettier, Vitest, `ci.yml` (lint, typecheck, Vitest, pytest)
- [x] 0.2 Design tokens (`tokens.css`), bundled fonts, `config.ts` with "Setup needed" screen
- [x] 0.3 i18n (`en`, `hi`, `mr`) + `LanguageSwitch` + locales test
- [x] 0.4 App shell: `AppHeader`, `BottomNav`, `NetworkBanner`, `SyncStatus`, Welcome screen
- [x] 0.5 `profiles` table + roles + RLS + RLS test; phone OTP login (test numbers); role pick; `RequireAuth` / `RequireRole`; three different homes (farmer, buyer, FPO) + admin
- [x] 0.6 Offline base: TanStack Query persistence, Dexie schema, outbox runner, `DataAge`
- [x] 0.7 `VoiceButton` (browser voice + a few clips in `public/audio/`)
- [x] 0.8 PWA install (vite-plugin-pwa), opens offline in `pnpm preview`

## M1 — Farmer core
- [x] 1.1 Chat-style onboarding (taps + GPS location)
- [x] 1.2 `SmartFrameCamera` (blocks dark photos, 3 shots, compress ≤ 300 KB) + upload to `crop-photos`
- [x] 1.3 `grade_results` table + `grade` Edge Function + `integrations/ai` adapter (mock first)
- [x] 1.4 AI service: onion grading v1 (OpenCV) + pytest with sample photos
- [x] 1.5 Grade result screen (`GradeBadge`, `GradeBreakdown`) + spoken grade + low-confidence message
- [x] 1.6 `lots` table + create lot (`NumberPad`, GPS) + QR (`QRLabel`) + My Lots + lot detail
- [x] 1.7 Offline: "Try again" button for failed outbox items on My Lots + full airplane-mode
      round-trip test (saving a lot offline itself landed in 1.6, not here - see its handoff note)

## M2 — Market intelligence
- [x] 2.1 Tables `mandis`, `mandi_prices`, `mandi_heat`, `crop_rules`, `weather_daily`, `transporters` + seed (5 Nashik mandis, 60 days of prices, weather, 6 transporters)
- [ ] 2.2 Domain formulas + tests: `money.ts`, `advice.ts` (tomato ≤ 2 days), `heat.ts`, `floor.ts`, `netRupee.ts`
- [ ] 2.3 `cron-fetch-prices` (real data.gov.in if key set) — run by hand; recompute `mandi_heat`
- [ ] 2.4 Prices screen: `PriceHero`, `AdviceCard`, `FloorWarning`, `MandiList`, `MandiHeatmap` (if MapTiler key), `DataAge`
- [ ] 2.5 `route-distance` (ORS if key, else straight line × 1.3 (mock)) + Net-₹ comparator screen

## M3 — Buyer marketplace
- [ ] 3.1 `buyer_kyc` + `kyc-verify` (mock) + KYC screen + admin approve + `VerifiedBadge`
- [ ] 3.2 List a lot + buyer marketplace with filters (crop, grade, distance, quantity)
- [ ] 3.3 `bids` + `place_bid` RPC + RLS (only verified, not banned) + `LiveBidBox` with Realtime
- [ ] 3.4 Mega lot grouping (`mega_lots`, `mega_lot_items`, `group_mega_lots` trigger)
- [ ] 3.5 Farmer / FPO bids screen (`BidRow`, accept / reject, floor warning)
- [ ] 3.6 Deal consent screen (5 points + `VoiceConsent`) + `deals` table + `accept_bid` RPC

## M4 — Escrow and Digital Khata
- [ ] 4.1 `escrows`, `escrow_transitions`, `escrow_events`, `payouts`, `khata_entries` + `escrow_transition()` + SQL tests
- [ ] 4.2 `split.ts` + tests (100% branches, no paisa lost)
- [ ] 4.3 `integrations/cashfree` (mock) + `escrow-pay` + "Pay (demo)" button + `cashfree-webhook` → FUNDED + Khata 🟡
- [ ] 4.4 Khata screen (`KhataRow`, `KhataSummary`, voice, readable offline)
- [ ] 4.5 Delivery OTP (hash + 5-try lock) + buyer sees `OtpDigits`
- [ ] 4.6 "Mark dispatched" → IN_TRANSIT + Khata 🔵
- [ ] 4.7 `shipments` + `shipments-create` (SMS mock, link shown on screen) + `trip` function + driver page `/t/:token` (delivery photo + OTP)
- [ ] 4.8 `escrow-release` (split, payouts, Khata 🟢)
- [ ] 4.9 `cron-auto-settle` + pg_cron schedule + admin skip-timer (`escrow-skip-timer`) + `Countdown`

## M5 — Demo ready
- [ ] 5.1 Full seed (`SPEC.md` §8.6 numbers, only the M0–M4 parts) + `demo-reset.ts`
- [ ] 5.2 One Playwright happy path (`app/tests/e2e/core-flow.spec.ts`)
- [ ] 5.3 Deploy: functions + secrets, AI service to Hugging Face Spaces, web to Vercel
- [ ] 5.4 Capacitor debug APK; opens in airplane mode
- [ ] 5.5 Real phone test (360 px, Hindi + Marathi, Slow 3G, airplane-mode scan then sync)
- [ ] 5.6 Demo practice: full core flow 3 times in a row without errors

---

## Handoff notes

<!--
Claude Code adds one block per finished item, newest at the bottom. Keep it short and simple.

### 1.6 Create lot + QR — 2026-09-20
**What it does:** …
**Files:** `supabase/migrations/…_lots.sql`, `app/src/services/lots.ts`, `app/src/routes/farmer/lots/…`
**Mocked:** nothing / …
**Test by hand:** 1. … 2. …
**Tests:** `app/tests/unit/…`
**Next / known gaps:** …
-->

### 0.1 Repo skeleton — 2026-09-16
**What it does:** The three parts of the repo now install, lint, type-check, test and build with nothing but placeholder content. `app/` is a Vite + React 19 + TS + Tailwind v4 project (no real screens yet — `App.tsx` just proves Tailwind + `cn()` work). `ai-service/` is a FastAPI app with only `GET /health`. `supabase/` already had `init` + `link` done; this item only added the Edge Function secret list. CI runs the same four checks (`lint`, `typecheck`, `test` for the app; `pytest` for the AI service) on every push/PR.
**Files:** `app/package.json`, `app/vite.config.ts`, `app/tsconfig*.json`, `app/eslint.config.js` (has the "no hard-coded text" rule, scoped to `src/components/**` and `src/routes/**`), `app/src/{main,App}.tsx`, `app/src/lib/utils.ts`, `app/tests/unit/utils.test.ts`, `ai-service/app/main.py`, `ai-service/tests/test_health.py`, `ai-service/pyproject.toml` (pytest needs `pythonpath = ["."]` to find the `app` package), `.github/workflows/ci.yml`, `README.md`, every `.env.example`, `scripts/check-tools.sh` (now also checks that `pnpm` actually runs, not just that it exists).
**Mocked:** nothing — there is no real feature yet.
**Test by hand:**
1. `cd app && pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all pass.
2. `pnpm dev` → http://localhost:5173 shows a small white card ("Cropket / Repo skeleton is working.") styled by Tailwind.
3. `cd ai-service && source .venv/bin/activate && pytest -q` passes; `uvicorn app.main:app --port 8000` then `curl http://localhost:8000/health` → `{"ok":true,"service":"cropket-ai"}`.
**Next / known gaps:**
- Node 20 → 22 was needed on this laptop for pnpm 11 to run at all (`sudo pacman -S nodejs-lts-jod`, done). `check-tools.sh` now catches this by actually running `pnpm -v`, not just checking the binary exists.
- TypeScript is pinned to 6.0.3, not the newest 7.0.2 — `typescript-eslint` doesn't support TS 7 yet (`typescript >=4.8.4 <6.1.0` in every published version incl. canary). Revisit when it does.
- Next item: 0.2 Design tokens + `config.ts` "Setup needed" screen.

### 0.2 Design tokens, fonts, config — 2026-09-16
**What it does:** All the colours, fonts, text sizes and radii from `SPEC.md` §6.2–6.4 are now
Tailwind utilities (`bg-leaf`, `text-hero`, `rounded-card`, …) — no component ever needs a raw
hex value. Mukta and Baloo 2 (variable) are bundled, no font CDN. `lib/config.ts` is now the
only file that reads `import.meta.env`: it checks every `VITE_*` value with zod and never
throws. If `VITE_SUPABASE_URL` or `VITE_SUPABASE_PUBLISHABLE_KEY` is missing or invalid,
`main.tsx` renders `<SetupNeeded/>` (lists the missing names in dev, one calm sentence in
prod) instead of a white screen or a crash.
**Files:** `app/src/styles/tokens.css` (new), `app/src/styles/globals.css`, `app/src/lib/config.ts`
(new), `app/src/app/SetupNeeded.tsx` (new), `app/src/main.tsx`, `app/src/App.tsx` (restyled
placeholder — real Welcome screen comes in 0.4), `app/tests/unit/config.test.ts` (new),
`app/package.json` (`+zod@4.6.5 +@fontsource/mukta@5.3.0 +@fontsource-variable/baloo-2@5.3.0`).
Also: `SPEC.md` §6.2 and `CLAUDE.md` §4 now note tokens are declared as `--color-*` in
Tailwind's `@theme` (not bare `--leaf`) — the only way Tailwind v4 generates `bg-leaf` etc.
**Mocked:** nothing.
**Test by hand:**
1. `pnpm dev` → 360 px width: green-tinted background, white card, hero number in Baloo 2,
   body text in Mukta, one 56 px green button. Tab through → 3 px indigo focus ring.
2. Temporarily set `VITE_SUPABASE_URL=` in `app/.env` and reload → "Setup needed" screen
   listing the missing name, not a white page. Put the real value back afterwards.
3. `pnpm build && pnpm preview` — same look, fonts load from `/assets/*.woff2`.
**Tests:** `app/tests/unit/config.test.ts` (4 cases: full env, missing optional keys, missing/blank
Supabase values, default + bad `VITE_DEFAULT_LANG`). `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass.
**Next / known gaps:**
- Fontsource doesn't ship a latin+devanagari-only build for either font, so Mukta also carries
  a small latin-ext file and the Baloo 2 variable file also carries vietnamese (~40 KB total
  extra, one-time load). Documented in `main.tsx`; revisit only if bundle size becomes a
  real problem.
- `supabase/functions/deno.json` doesn't exist yet, so the "same zod version in app and
  functions" rule (`CLAUDE.md` §4) has nothing to match yet — pin `zod@4.6.5` there when the
  first Edge Function is created (milestone 1.3).
- Next item: 0.3 i18n (`en`, `hi`, `mr`) + `LanguageSwitch` + locales test.

### 0.3 i18n + LanguageSwitch — 2026-09-16
**What it does:** One i18next instance (`lib/i18n.ts`) with all three languages bundled as plain
JSON imports, so text works offline like `SPEC.md` §1.3 asks. `t()` keys are type-checked against
`en.json` — a typo or a key missing from one locale file now fails `pnpm typecheck`, not just
the locales test. `LanguageSwitch` (`SPEC.md` §5.1) is the `EN | हि | मरा` header control: tap a
language, every `t()` string updates immediately, the choice is remembered (`localStorage`) and
survives reload, and it never navigates away from the current screen. Wired into the placeholder
`App.tsx` so it's hand-testable before the real Welcome screen (0.4) exists.
**Files:** `app/src/lib/i18n.ts` (new, the only file that configures i18next), `app/src/lib/i18next.d.ts`
(new, types `t()` from `en.json`), `app/src/locales/{en,hi,mr}.json` (new), `app/src/components/shell/LanguageSwitch.tsx`
(new), `app/src/App.tsx` (uses `t()` + `<LanguageSwitch/>` instead of hard-coded strings),
`app/src/main.tsx` (`import "./lib/i18n"`), `app/tsconfig.app.json` (`resolveJsonModule: true`),
`app/tests/unit/locales.test.ts` (new), `app/package.json` (`+i18next@26.4.2 +react-i18next@17.0.14`).
**Mocked:** nothing. `hi`/`mr` copy is my own translation, not reviewed by a native speaker yet —
flagged below.
**Test by hand:**
1. `pnpm dev`, DevTools at 360 px width. Tap `हि` → the card's text switches to Hindi; `मरा` →
   Marathi; `EN` → English. The selected chip is filled green, not just a colour change.
2. Reload the page → the language you picked stays selected (`localStorage["cropket.lang"]`).
   `<html lang>` in the elements panel matches it.
3. Clear `localStorage`, reload → falls back to `VITE_DEFAULT_LANG` (`mr` unless set otherwise).
4. Devanagari renders in Mukta with no fallback-font boxes; nothing overflows at 360 px.
**Tests:** `app/tests/unit/locales.test.ts` (en/hi/mr have exactly the same keys, no blank
values, language endonyms identical across files). `pnpm lint && pnpm typecheck && pnpm test &&
pnpm build` all pass.
**Next / known gaps:**
- **Naming gotcha for the team:** don't name a `.d.ts` file the same base name as a same-folder
  `.ts` file (e.g. `i18n.ts` + `i18n.d.ts`) — TypeScript silently treats the `.d.ts` as a stale
  build artifact of the `.ts` file and drops it from the compilation, so any `declare module`
  augmentation inside it is never applied (no error, it just quietly doesn't type-check). Found
  this via `tsc --listFiles` when the "reject an unknown t() key" check didn't actually fail.
  That's why the augmentation file is `i18next.d.ts`, not `i18n.d.ts`.
- `hi` and `mr` strings need a native-speaker review before the demo (translations are mine).
- `providers.tsx` (wraps i18n + QueryClient together) comes in 0.6 with TanStack Query — for now
  `main.tsx` imports `lib/i18n` directly for its side effect, which is enough since react-i18next
  reads the global `i18next` instance.
- Next item: 0.4 App shell (`AppHeader`, `BottomNav`, `NetworkBanner`, `SyncStatus`, Welcome
  screen) — this is where `LanguageSwitch` moves from `App.tsx` into `AppHeader` for real.

### 0.4 App shell — 2026-09-16
**What it does:** Every screen from here on sits inside one frame instead of the placeholder
card. `WelcomePage` (`/`) is the real first screen (SPEC.md §4.1): pick English / हिंदी / मराठी,
which sets the language and moves on. Everything else renders inside `AppShell` — a sticky
`AppHeader` (🌾 brand + `SyncStatus` + `LanguageSwitch`, moved out of the old `App.tsx`), the
`NetworkBanner` 🟧 strip that only appears when the browser goes offline, the page content, and
a sticky `BottomNav` with the four farmer tabs (Home / My lots / Khata / Me) that really
navigate now (`react-router`, new dependency). The four tab routes are `PlaceholderPage` for
now — one line each — until 0.5 gives them real content.
**Files:** `app/src/app/router.tsx` (new), `app/src/components/shell/{AppShell,AppHeader,
BottomNav,NetworkBanner,SyncStatus}.tsx` (new), `app/src/offline/network.ts` (new, `useOnline()`
off `navigator.onLine` + the browser's online/offline events), `app/src/routes/welcome/
WelcomePage.tsx` (new), `app/src/routes/PlaceholderPage.tsx` (new), `app/src/main.tsx` (renders
`AppRouter` instead of the old `App`), `app/src/locales/{en,hi,mr}.json` (`nav.*`, `welcome.*`,
`offline.*`, `sync.*`, `common.comingSoon` added; the old demo `home.*` keys removed with
`App.tsx`), `app/package.json` (`+react-router@8.4.0`). Deleted `app/src/App.tsx` — its job
(prove tokens + i18n work) is now done by real screens.
**Mocked:** `SyncStatus` always renders nothing right now — `AppHeader` passes `pending=0,
total=0` because the outbox it reads from doesn't exist until 0.6; the component itself is
finished and just needs real numbers plumbed in. `useOnline()` only listens to browser
online/offline events, not Capacitor's native `Network` plugin (Capacitor isn't installed
until 5.4). Welcome sends you to `/farmer` instead of `/login`, since login doesn't exist yet.
**Test by hand:**
1. `pnpm dev` → `/` shows the Cropket wordmark, tagline, and three 56 px language buttons
   (each showing its own name in its own script, all three languages, always).
2. Tap a language → the whole app switches to it and you land on `/farmer` inside the shell
   (header + bottom nav visible).
3. Tap "My lots" / "Khata" / "Me" in the bottom nav → the URL changes, the tab turns leaf-green
   with a top colour bar (never colour alone — check `aria-current="page"` in DevTools too),
   and the placeholder page's title matches the tab. Browser back/forward and reloading on
   `/farmer/khata` all work.
4. DevTools → Network → offline → a 🟧 strip appears under the header within ~1 s; back online,
   it disappears.
5. Repeat 1–4 in English, Hindi and Marathi at 360 px and 320 px — nothing overflows, no
   fallback-font boxes.
6. `pnpm build && pnpm preview` — same behaviour from the production build.
**Tests:** no new test file — this milestone is a router table and four presentational
components with no branching logic worth a UI test (CLAUDE.md §6: "no UI snapshot tests").
`app/tests/unit/locales.test.ts` already covers the new locale keys existing identically in
all three languages. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass.
**Next / known gaps:**
- `PlaceholderPage` disappears one use at a time as 0.5 (auth + real farmer home), 1.6 (My
  Lots), 4.4 (Khata) and 0.5/later (Me / profile) land; delete the file when the last use goes.
- `hi`/`mr` translations for the new keys are mine, not a native speaker's — same open item as
  0.3's handoff note, now larger. Needs review before the demo.
- Next item: 0.5 `profiles` table + roles + RLS + phone OTP login + `RequireAuth`/`RequireRole`
  + three different homes (farmer, buyer, FPO) + admin. This is where `WelcomePage` starts
  going to `/login` instead of straight to `/farmer`.

### 0.5 profiles + roles + RLS + phone OTP login — 2026-09-16
**What it does:** `WelcomePage` now sends everyone to `/login` (SPEC.md §4.2): +91 prefix, a
10-digit number, Send OTP, then one 6-digit code field (not six boxes - SPEC.md §4.2 updated
in this change, autofills from SMS, ~40 fewer lines). First-time sign-in lands on `/onboarding`
(SPEC.md §4.3 cut down to what 0.5 needs: pick 🧑‍🌾/🏢/👥, then a name - milestone 1.1 extends
the same screen with village, crops and GPS). That creates the caller's own `profiles` row -
RLS lets a user insert/select/update only their own row, and never pick `admin`/`nbfc` for
themselves (those accounts are made by the team by hand, SPEC.md §4.3) or touch their own
`role`/`kyc_status`/`banned`/`phone`/`trust_score`/`strikes` afterwards (column grants, not just
a policy check). `RequireAuth` (session) and `RequireRole` (profile + role, and "no profile yet"
→ `/onboarding`) guard every route; each of the four roles lands on its own home
(`/farmer`, `/buyer`, `/fpo`, `/admin`) with its own bottom nav (buyer/FPO/admin have only one
real screen so far, so no nav bar yet - a nav needs two places to go). The session (and a cached
copy of the profile) persists to `localStorage`, so a signed-in farmer's home screen still
renders offline (SPEC.md §9.2 Phase 0 "Done when").
**A real gotcha, found by testing against cropket-dev directly (not guessed):** the test phone
numbers configured in the Supabase dashboard are matched as **bare 10-digit strings, no +91**
(confirmed with `curl` against `/auth/v1/otp` and `/auth/v1/verify` - sending `+919090910001`
tried to reach real Twilio and failed; sending `9090910001` matched the test OTP and returned
`200`). So `sendOtp`/`verifyOtp` in `services/auth.ts` send the bare number - "+91" in the UI is
a display-only prefix. Documented on `Phone10` in the shared schema so nobody "fixes" this back
to E.164 later without knowing why.
**Files:** `supabase/migrations/20260916164928_profiles.sql` (table + RLS + column grants),
`supabase/tests/rls_profiles.sql` (8 checks: RLS-on-every-table, own-row insert, blocked
self-promotion to admin, blocked insert for another id, select isolation, blocked role/banned
update, allowed name update), `supabase/functions/_shared/domain/schemas/profile.ts` (`Role`,
`SignupRole`, `Phone10`, `ProfileInput` - first file in `_shared/domain/`),
`app/src/lib/{supabase,errors,roles}.ts` (new), `app/src/services/{auth,profiles}.ts` (new),
`app/src/app/{authContext,providers,guards}.tsx` (new - `AuthProvider` wraps the router in
`main.tsx`), `app/src/routes/login/LoginPage.tsx`, `app/src/routes/onboarding/OnboardingPage.tsx`,
`app/src/routes/{farmer/FarmerHome,farmer/MePage,buyer/BuyerHome,fpo/FpoHome,admin/AdminHome}.tsx`
(new), `app/src/components/common/BigTile.tsx` (new), `app/src/components/shell/BottomNav.tsx`
(role-aware tabs), `app/src/app/router.tsx`, `app/src/routes/{welcome/WelcomePage,PlaceholderPage}.tsx`,
`app/src/locales/{en,hi,mr}.json` (`login.*`, `onboarding.*`, `role.*`, `home.*`, `me.*`,
`errors.*`, `common.loading`), `app/vite.config.ts` + `app/tsconfig.app.json` (alias `zod` to
`app/node_modules/zod` for both the bundler and `tsc`, since `_shared/domain/` lives outside
`app/` and can't find it by walking up its own folder), `app/src/lib/database.types.ts` +
`supabase/functions/_shared/database.types.ts` (generated), `app/package.json`
(`+@supabase/supabase-js@2.116.0`).
**Mocked:** nothing - phone OTP is real (test numbers), RLS is real and tested against
cropket-dev directly with `curl` (send OTP → verify → insert own profile → confirmed 403 on
self-promoting to admin and on updating own role → read own profile back), not just the SQL
test file.
**Test by hand:** at 360 px, in all three languages -
1. `/` → pick a language → `/login` (not `/farmer`).
2. Farmer test number `9090910001`, OTP `910001` → first time lands on `/onboarding`; pick
   🧑‍🌾 + a name → `/farmer` shows "Namaste, {name}" and the four tiles.
3. A wrong OTP shows a calm translated line, never raw Supabase text. Resend counts 0:30 → 0:00.
4. Reload → still logged in, straight to `/farmer` (session in `localStorage`).
5. Type `/buyer` in the URL as a farmer → bounced back to `/farmer`. Same for `/admin`.
6. Me tab → Sign out → `/login`; typing `/farmer` now bounces to `/login`.
7. Buyer test number `9090920001` / OTP `920001` → `/buyer`, a different home, no bottom nav yet
   (buyer/FPO/admin each have their own Sign out button on the home screen for now). FPO
   `9090930001` / `930001` the same way.
8. Admin: onboarding only offers farmer/buyer/fpo, so log in with `9090940001` / `940001`, pick
   any role once, then by hand: `update profiles set role='admin' where phone='9090940001';` →
   sign out and back in → `/admin`.
9. DevTools → Offline → reload → the home screen still renders from the cached profile, with the
   🟧 banner. `pnpm build && pnpm preview` - repeat 1-8 on the production build (done; `curl` on
   `/` and `/login` both returned `200` from the built `dist/`).
**Tests:** `supabase/tests/rls_profiles.sql` (8/8, `bash scripts/test-sql.sh rls`),
`app/tests/unit/domain/schemas/profile.test.ts`, `app/tests/unit/roles.test.ts`.
`pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass (25 unit tests total).
**Next / known gaps:**
- The production bundle is 661 KB / 193 KB gzip in one chunk - over the "first screen JS <
  200 KB" budget in CLAUDE.md §4. No route is lazy-loaded yet. Worth fixing with
  `React.lazy()` per route once there's more than a placeholder behind most of them (M1
  onward) rather than splitting now for near-empty screens.
- `hi`/`mr` translations for the new keys are mine, not a native speaker's - same open item
  as 0.3/0.4, now larger.
- Next item: 0.6 Offline base (TanStack Query persistence, Dexie schema, outbox runner,
  `DataAge`). The `ponytail:`-marked localStorage profile cache in `app/src/app/providers.tsx`
  is a stand-in for that and should be replaced then, not built alongside it.

### 0.6a Offline reads: query cache + DataAge — 2026-09-16
**What it does:** The profile is now a TanStack Query (`useMyProfile()`), persisted to
IndexedDB instead of the hand-rolled `localStorage` cache the `ponytail:` comment in 0.5's
handoff flagged for replacement. `offline/db.ts` opens one Dexie database (`cropket`) with a
`cache` table; `offline/persist.ts` plugs that table into `persistQueryClient` as the
storage (kept 7 days - SPEC.md §5.8). `app/providers.tsx` is now `Providers` (persistence +
auth) - it treats "still restoring the IndexedDB cache" and "first fetch with nothing cached
yet" both as `status: "loading"`, so a signed-in farmer never flashes onboarding while the
cache loads. Sign-out calls `queryClient.clear()` so a second person on the same phone/kiosk
never sees the first person's cached profile. `DataAge` (`lib/dataAge.ts` +
`components/common/DataAge.tsx`) shows "7 hours ago" / "2 days ago" style text once data is
older than 6 hours (SPEC.md §4.22), in the active language via `Intl.RelativeTimeFormat` - no
date library needed, `en`/`hi`/`mr` are all built in to the JS engine.
**Files:** `app/src/offline/db.ts`, `app/src/offline/persist.ts` (new), `app/src/lib/dataAge.ts`
(new), `app/src/components/common/DataAge.tsx` (new), `app/src/app/providers.tsx` (rewritten -
`AuthProvider` no longer owns the profile cache), `app/src/services/profiles.ts` (`profileKeys`,
`useMyProfile`), `app/src/main.tsx` (renders `<Providers>`), `app/src/locales/{en,hi,mr}.json`
(`dataAge.from`), `app/tests/unit/dataAge.test.ts` (new), `app/package.json`
(`+@tanstack/react-query@5.103.1 +@tanstack/react-query-persist-client@5.103.1
+@tanstack/query-async-storage-persister@5.103.1 +dexie@4.4.6`).
**Mocked:** nothing.
**Test by hand:** at 360 px, in all three languages -
1. `pnpm dev`, sign in as the farmer test number → `/farmer`.
2. DevTools → Application → IndexedDB → `cropket` → `cache`: one row (the dehydrated query
   cache). Local Storage no longer has `cropket.profile` (the Supabase session key stays).
3. Network → Offline → reload → `/farmer` still shows "Namaste, {name}" with the 🟧 banner,
   now served from IndexedDB, not `localStorage`.
4. Sign out → sign in as the buyer test number → `/buyer`, no trace of the farmer's name
   (`queryClient.clear()` on sign-out).
5. `pnpm build && pnpm preview` → repeat step 3 on the production build.
**Tests:** `app/tests/unit/dataAge.test.ts` (9 cases: staleness boundary at 5/6/7 h, ISO-string
input, hour vs. day wording, non-empty Devanagari output for `hi`/`mr`).
`pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass (29 unit tests total).
**Next / known gaps:**
- Production bundle is now 236 KB gzip (was 193 KB before TanStack Query + Dexie), further over
  the 200 KB first-screen budget (`CLAUDE.md` §4). Still not the moment to add `React.lazy()`
  per route - most routes are placeholders - but M1 gives farmer routes real content, and that's
  the right moment. Noted again so it isn't lost.
- Next: 0.6b (Dexie outbox + sync runner), same milestone, next commit.

### 0.6b Offline writes: Dexie outbox + sync runner — 2026-09-16
**What it does:** `offline/outbox.ts` adds the `drafts`/`blobs`/`outbox` tables to the same
Dexie database (version 2) and the write queue itself: `enqueue()` (money/trading kinds are
rejected by `assertAllowedKind` even from an untyped caller - CLAUDE.md §3), and the pure
retry policy (`pickNext`, `afterFailure`, `nextTryDelayMs`) that decides order and backoff
(5 s → 30 s → 2 min → 10 min → every 30 min, `failed` after 10 tries - SPEC.md §5.8 rule 4).
`offline/sync.ts` is the runner: `startSync()` runs on app start, on the browser's `online`
event, and every 60 s, sending ready items in order until it hits one whose kind has no
handler yet - `handlers` is an empty map today, since nothing produces a real job until 1.7
(offline scan) registers `upload_blob`/`create_lot`. `AppHeader` now reads a live pending
count from `useOutboxStatus()` instead of the hard-coded `pending={0} total={0}`.
**A conflict fixed in the same change (CLAUDE.md §0 rule 3):** `SPEC.md` §5.8 listed a `"done"`
outbox status, but a sent item is deleted from the table, not kept - nothing can ever hold that
value with this design (deleting is simpler than an extra state plus a cleanup sweep). Fixed
the line in `SPEC.md`, not the code.
**Files:** `app/src/offline/db.ts` (version 2: `drafts`, `blobs`, `outbox`), `app/src/offline/
outbox.ts` (new), `app/src/offline/sync.ts` (new), `app/src/app/providers.tsx` (`startSync()`
in one `useEffect`), `app/src/components/shell/AppHeader.tsx` (real counts),
`app/src/components/shell/SyncStatus.tsx` (comment only), `app/tests/unit/offline/outbox.test.ts`
(new), `SPEC.md` §5.8 (the `"done"` fix above). No new package - reuses `dexie` from 0.6a.
**Mocked:** nothing is mocked, but there is genuinely nothing to send yet - the runner has no
registered handler until 1.7, so this milestone is wiring plus the tested policy, not an
end-to-end offline write. Honestly nothing else to demo here yet.
**Simplified on purpose (not in the original plan, found while building):**
- The header's `pending`/`total` numbers are the same count (unresolved items only) - there's
  no per-batch "done so far" tracking, since nothing produces a real multi-item batch yet.
  Marked with a `ponytail:` comment on `unresolvedCount` in `outbox.ts`; add a session total if
  "Uploading 2 of 3" needs to actually count up once 1.7 lands.
- Didn't add the `sync.failed` locale key from the original plan - a failed item isn't shown in
  the header at all yet (same reason as above), so an unused translation would just be dead
  weight. Add it in 1.7/My Lots alongside the real "Try again" button.
- `tripQueue` (SPEC.md §5.8) isn't created - it's only needed by the driver page, milestone 4.7.
**Test by hand:** this is a wiring check (no real job registered yet) -
1. `pnpm dev` → DevTools → Application → IndexedDB → `cropket`: now version 2, with `drafts`,
   `blobs`, `outbox` tables alongside `cache`.
2. The header shows no sync text (0 items in the outbox = nothing to sync, correct).
3. Everything from 0.6a's hand-test steps still passes.
**Tests:** `app/tests/unit/offline/outbox.test.ts` (9 cases: the exact backoff schedule,
pending→failed at try 10, oldest-first ordering / photo-before-lot, skips a not-yet-due or
failed item, rejects `escrow_pay`/`accept_bid`/`place_bid`).
`pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass (38 unit tests total).
**Next / known gaps:**
- No "Try again" button for `failed` items yet, and no 24 h "waiting too long" warning
  (SPEC.md §5.8 rule 8) - both belong on the first screen that shows outbox items, milestone
  1.7 (My Lots) / 1.2 (photos).
- Blob cleanup after 7 days (SPEC.md §5.8 rule 6) - add when 1.2 starts putting real photos
  into `blobs`.
- Next item: 0.7 `VoiceButton` (browser voice + a few clips in `public/audio/`).

### 0.7 VoiceButton — 2026-09-16
**What it does:** A 🔊 button any screen can drop in to read a translated string aloud
(`SPEC.md` §5.1, §6.1 "icon + word + 🔊 together"). `lib/voice/speak.ts` is the only file that
touches `speechSynthesis`: it picks a system voice for the current language, falling back from
Marathi to a Hindi voice when no Marathi voice is installed (same script, close enough - most
Android phones have no `mr-IN` voice), and never borrows an English voice for either. If no
usable voice exists it resolves `false` instead of guessing, and `VoiceButton` shows a muted
icon ("Voice not available on this phone") rather than staying silently broken. Every call
cancels whatever is currently speaking first, so only one sound plays at a time (`SPEC.md`
§5.9). Wired into the two 🔊 marks that exist in built screens today: the Welcome screen
("Choose your language") and farmer home (the greeting, plus one on each of the 4 `BigTile`s).
**A conflict fixed in the same change (CLAUDE.md §0 rule 3):** `SPEC.md` §5.9's `speak()`
signature took `{key, values, clipId, lang}` and called `i18n.t()` itself - but `speak.ts` has
no i18next import (kept plain TS so it's easy to unit-test without a DOM). `VoiceButton` calls
`t()` and passes the already-translated `text` in. Fixed the snippet in `SPEC.md`.
**Files:** `app/src/lib/voice/speak.ts` (new), `app/src/components/voice/VoiceButton.tsx` (new),
`app/src/components/common/BigTile.tsx` (Link now covers the whole card so the VoiceButton can
sit next to it instead of nesting a `<button>` inside an `<a>`), `app/src/routes/welcome/
WelcomePage.tsx`, `app/src/routes/farmer/FarmerHome.tsx`, `app/src/locales/{en,hi,mr}.json`
(`voice.listen`, `voice.unavailable`), `app/tests/unit/voice/speak.test.ts` (new), `SPEC.md`
§5.9 (signature fix above). No new package - `speechSynthesis` is a browser API.
**Mocked:** nothing - the phone's own voice is real, no `<DemoDataTag>` needed. Bundled clips
(`SPEC.md` §5.9 layer 1) and the `tts` function (layer 2) are simply **not built yet**, not
mocked - `CLAUDE.md` §9.5 keeps the `tts` function and `make-voice-clips.ts` out of the
prototype; clips arrive in 1.5 with the first real clip content (grades A/B/C).
**Test by hand:**
1. `pnpm dev` at 360 px → Welcome screen, tap 🔊 under the language buttons → hears "Choose
   your language" (English by default); the icon pulses while speaking, stops at the end.
2. Log in → farmer home → tap the greeting 🔊 and a tile's 🔊 → each reads its own text;
   starting one while another is playing cuts the first off (only one at a time). Tapping a
   tile's body still navigates; tapping its 🔊 does not.
3. Switch to हिंदी and मराठी (top-right switch or re-pick on Welcome) → same taps read
   Devanagari text. Marathi uses a Hindi system voice on machines with no Marathi voice
   installed - expected, not a bug. On a machine with no Devanagari voice at all, the button
   shows muted with "Voice not available on this phone" instead of reading it in English.
4. DevTools → Network → Offline → 🔊 still works (system voices need no network).
**Tests:** `app/tests/unit/voice/speak.test.ts` (6 cases: exact-language voice picked first,
`mr` falls back to `hi`, `mr`/`hi` never fall back to `en`, no usable voice → resolves `false`
and speaks nothing, a new `speak()` call cancels whatever was playing). No component test for
`VoiceButton` itself - `CLAUDE.md` §6 "no UI snapshot tests"; it would need jsdom + testing-
library (new packages) to cover very little logic beyond what `speak.test.ts` already proves.
`pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass (49 unit tests total).
**Next / known gaps:**
- Bundled clips (`SPEC.md` §5.9 layer 1, `public/audio/{en,hi,mr}/`) and the `tts` Edge
  Function (layer 2, Bhashini) aren't built - browser voice is the only layer in the
  prototype. Add clips in 1.5 alongside the AI grading screen.
- No 🔊 yet on Login, role pick, buyer/FPO homes or Me - those screens' copy isn't settled;
  add their 🔊 buttons when each screen is built for real, same as every other screen so far.
- `MicInput` (voice input, 1.1) and `VoiceConsent` (deal consent recording, 3.6) are separate
  components, not built here.
- Next item: 0.8 PWA install (vite-plugin-pwa), opens offline in `pnpm preview`.

### 0.8 PWA install — 2026-09-16
**What it does:** The web build is now installable and opens with no internet (`SPEC.md`
§5.8, §9.2 Phase 0). `vite-plugin-pwa` generates a manifest (name, leaf-green theme colour,
192/512/maskable icons) and a service worker that precaches the app shell (JS, CSS,
`index.html`) plus every `.woff2` font file (`.woff` skipped on purpose - every browser that
runs a service worker also reads `.woff2`, so caching both would double ~600 KB of fonts for
nothing) and falls back to `index.html` for any route (`/farmer/khata` opens offline too, not
just `/`). No Supabase/API caching was added - TanStack Query already persists server reads to
IndexedDB (0.6a); a second SW-level cache of the same data could show stale content with no
`<DataAge>` label, which `CLAUDE.md` §5's honesty rule doesn't allow. `lib/native.ts` (new -
the file `CLAUDE.md` §3 reserves for platform checks) is the one place that answers "are we
inside the Capacitor APK?"; `main.tsx` only registers the service worker and calls
`navigator.storage.persist()` when the answer is no, matching `SPEC.md` §5.8 "the service
worker is not registered in the APK." Updates are silent (`autoUpdate`) - no "new version"
button to build for a demo.
**A real gotcha, found by testing (not guessed):** `vite-plugin-pwa`'s `registerSW()` imports
`workbox-window` from a virtual module that has no real file path, so pnpm's strict
(non-hoisted) `node_modules` can't resolve it at build time - `pnpm build` failed with
`Rolldown failed to resolve import "workbox-window"` until `workbox-window` was hoisted to
the top of `node_modules`. This is `vite-plugin-pwa`'s own documented pnpm fix. It used to be
a `.npmrc` line (`public-hoist-pattern[]=*workbox*`) but pnpm 11 (installed here) has moved
hoist settings into `pnpm-workspace.yaml` - a plain `.npmrc` entry is silently ignored, no
error, `pnpm config list` just shows nothing. Confirmed by checking
`node_modules/.modules.yaml` (`publicHoistPattern: []`) before finding the right place.
**Files:** `app/vite.config.ts` (`VitePWA` plugin: manifest + workbox options),
`app/public/icons/{icon.svg,icon-maskable.svg,icon-192.png,icon-512.png,
icon-maskable-512.png,apple-touch-icon.png}` (new - hand-drawn SVG wheat glyph on leaf-green,
matching the 🌾 already used in `AppHeader`/`WelcomePage`; PNGs rendered once with
`rsvg-convert`, already on this laptop, no new tool), `app/src/lib/native.ts` (new),
`app/src/main.tsx` (registers the SW + `storage.persist()`, web-only), `app/src/vite-env.d.ts`
(`vite-plugin-pwa/client` types), `app/index.html` (`theme-color`, `description`, favicon,
apple-touch-icon meta/link tags), `app/pnpm-workspace.yaml` (`publicHoistPattern`),
`app/tests/unit/native.test.ts` (new), `app/package.json` (`+vite-plugin-pwa@1.3.0` dev-only;
`workbox-build`/`workbox-window@7.4.1` come along as its own dependencies, not separate
installs).
**Mocked:** nothing.
**Test by hand:**
1. `pnpm build && pnpm preview` → http://localhost:4173. DevTools → Application → Manifest:
   name "Cropket", leaf-green theme colour, all three icons render. Service Workers: one
   activated worker.
2. Application → Cache Storage → `workbox-precache-*`: `index.html`, the JS/CSS files and the
   `*-devanagari-*.woff2` fonts are listed; no `.woff` files.
3. Network → Offline → hard reload on `/` and on `/farmer/khata` → both still render the real
   app (not the browser's offline page), 🟧 banner shows, fonts and 🔊 still work.
4. Chrome's install icon in the address bar → install → opens standalone (no URL bar),
   correct icon + name in the launcher; repeat the offline reload inside that window.
5. `pnpm dev` → Application → Service Workers is empty (no SW in dev, checked - the dev-mode
   `registerSW` is a real no-op stub, not a crash).
**Tests:** `app/tests/unit/native.test.ts` (2 cases: `isNativeApp()` true/false).
`pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass (45 unit tests total, 9
files). Also checked directly in the build output: the generated `dist/sw.js` precache list
(27 entries) and its `NavigationRoute` fallback to `index.html` - both by inspecting the built
file, since no browser/Playwright is available in this environment yet (Playwright arrives in
M5). A person should still do the DevTools/real-device checks above before calling Phase 0
demo-ready.
**Next / known gaps:**
- **M0 is done.** Next: **M1 Farmer core**, starting with 1.1 chat-style onboarding (taps +
  GPS location) - `SPEC.md` §4.3 / Phase 1 table.
- The 780 KB / 238 KB gzip single JS chunk (noted since 0.5/0.6) is still not split - still
  the right call until M1 gives farmer routes real content to lazy-load.
- No "Install app" button in the UI - Chrome/Android shows its own prompt and no `SPEC.md` §4
  screen asks for one. Add one to the Me page only if a demo phone doesn't offer the prompt.
- `vercel.json`'s no-cache header for `index.html`/`sw.js` (`SPEC.md` §8.1) is milestone 5.3,
  not needed until the app is actually deployed.

### 1.1 Chat-style onboarding — 2026-09-17
**What it does:** `/onboarding` (SPEC.md §4.3) now asks its questions one at a time in a growing
transcript, instead of one flat form. A farmer or FPO answers **role → name → village + GPS →
crops** (4 questions); a buyer stops after village + GPS (3) - a buyer doesn't grow anything, so
the crop chips never show for them. Each answered question stays on screen as a small summary line
("🧑‍🌾 Farmer", "Niphad · 📍", "🧅 Onion  🍅 Tomato") while the current question sits at the bottom
with its input; the header shows "Getting started · 2 of 4" and a back arrow (hidden on the first
question) that returns to the previous answer without losing it. Every question has a 🔊
`VoiceButton`. "Use my location" calls the browser's GPS (`lib/native.ts`, wrapped so the
Capacitor plugin can drop in later without touching callers); denied or timed-out GPS shows a calm
message + "Skip this step" and the farmer can still finish with `location: null` (advisory, never
blocks, per `SPEC.md` §6.7). The last question's button ("Save and continue") is disabled while
offline, since onboarding needs a real Supabase insert - the same "needs internet" pattern as
money actions.
Two `profiles` columns did not exist yet: `crops text[]` (checked against
onion/tomato/potato) is new; `village`/`location` already existed from 0.5 and were already
grantable. `district`/`state` now default to `Nashik`/`Maharashtra` (the pilot area) so the M2
floor price always has a district, even before the app can turn a GPS point into a place name -
this default is shown on screen as grey text under the village box, not hidden. `SPEC.md` §5.6 was
updated in the same change (it listed `profiles` without `crops`, which Phase 1 already asked for
- one of the "point out a conflict and fix it" cases from `CLAUDE.md`).
**A thing worth knowing:** PostGIS reads a point as `POINT(lng lat)` - longitude first, backwards
from how people say "lat, lng". `_shared/domain/geo.ts`'s `toPointWKT()` is the one place that
builds that string, and its test locks in the order with very different lat/lng numbers (Niphad:
lat ≈ 20, lng ≈ 74) so a swap would be obvious. Checked directly against `cropket-dev` (not
guessed) that a plain PostgREST insert writes a `"SRID=4326;POINT(lng lat)"` string straight into
the `geography` column - no RPC or Edge Function needed for this one.
**Files:** `supabase/migrations/20260917014214_profile_onboarding.sql` (new),
`supabase/functions/_shared/domain/crops.ts`, `geo.ts` (new - `Crop` enum, `LatLng` +
`toPointWKT()`), `schemas/profile.ts` (`ProfileInput` grows `village`/`crops`/`location`, with a
rule that farmer/FPO need ≥ 1 crop and a buyer needs none), `app/src/lib/native.ts`
(`getCurrentLocation()`), `app/src/lib/errors.ts` (`LOCATION_DENIED`/`LOCATION_UNAVAILABLE`),
`app/src/services/profiles.ts` (`createMyProfile` writes the new columns),
`app/src/routes/onboarding/{OnboardingPage.tsx (rewrite), steps.ts, StepInputs.tsx, constants.ts}`
(new/rewrite), `app/src/locales/{en,hi,mr}.json` (`onboarding.*`, new `crop.*` group,
two new `errors.*` keys), `database.types.ts` (regenerated), `SPEC.md` §5.6.
**Mocked:** nothing - GPS is real browser geolocation, the profile write is a real Supabase
insert. The only fixed values are the pilot `district`/`state` defaults, and they're shown on
screen, not hidden.
**Test by hand:**
1. `pnpm dev`, farmer test number `9090910001` / OTP `910001`, first login → `/onboarding` shows
   "Getting started · 1 of 4".
2. Tap Farmer (question turns into a "🧑‍🌾 Farmer" summary line) → type a name → Continue → type a
   village, tap "Use my location", allow the prompt → "📍 Location saved" → pick 🧅 Onion → "Save
   and continue" → lands on `/farmer`, greeting shows the name.
3. Same flow but **block** location (DevTools → Sensors → Location, or deny the prompt): a calm
   message + "Skip this step" appears; skipping still lets you finish, and the saved row has
   `location = null`.
4. Buyer number `9090920001` / `920001`: header reads "of 3", no crop question, lands on `/buyer`.
5. DevTools → Offline on the last question: "Save and continue" is disabled with "Needs internet
   to finish" underneath; back online re-enables it.
6. Back arrow returns to the previous question with its answer still filled in; re-picking a role
   there correctly shortens/lengthens the remaining questions (farmer ↔ buyer).
7. Repeat steps 1-2 in Hindi and Marathi (language switch was already set at Welcome).
8. Check the row landed correctly: `psql "$(bash scripts/set-key.sh --get SUPABASE_DB_URL)" -c
   "select name, village, district, state, crops, st_astext(location::geometry) from profiles
   order by created_at desc limit 3;"`
**Tests:** `app/tests/unit/domain/geo.test.ts` (new, 6 cases - WKT is lng-first),
`domain/schemas/profile.test.ts` (extended - village/crops/location validation, farmer needs a
crop, buyer doesn't), `native.test.ts` (extended - GPS success, denied, timeout, no API),
`onboarding/steps.test.ts` (new - farmer/FPO get 4 steps, buyer 3), `supabase/tests/rls_profiles.sql`
(`plan(8)` → `plan(12)` - crops constraint, district default, the GPS point round-trips
longitude-first, and village/crops/location stay editable while role/banned still aren't). All
pass: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (69 unit tests, 11 files) and
`bash scripts/test-sql.sh` (12/12) on `cropket-dev`.
**Next / known gaps:**
- Next: **1.2 `SmartFrameCamera`** (blocks dark photos, 3 shots, compress ≤ 300 KB) + upload to
  `crop-photos` - `SPEC.md` §5.1 / Phase 1 table.
- Voice *answers* (`MicInput`, speaking a name or village instead of typing) is `SPEC.md` §9.2
  Phase 1 **P1** - out of prototype scope. Only 🔊 (spoken questions) is built here.
- No screen lets a farmer edit village/crops/location later - only onboarding writes them for now.
  Revisit when the Me page (`SPEC.md` §4) grows real settings.
- The GPS point is stored but nothing reads it back yet (Net-₹ road distance, mandi heatmap
  distance sort) - that starts in M2.
- District/state stay fixed at "Nashik"/"Maharashtra" for every farmer in the prototype (single
  pilot area, per `SPEC.md`) - reverse geocoding from the GPS point is out of scope; if the
  pilot ever needs farmers outside Nashik district, this default will need revisiting.
- Browser geolocation needs HTTPS or `localhost`; on a real phone over USB use
  `adb reverse tcp:5173 tcp:5173` and open `http://localhost:5173`, not the LAN IP. Inside the
  APK it needs the Capacitor Geolocation plugin + Android fine-location permission - milestone 5.4.

### 1.2 SmartFrameCamera + upload to crop-photos — 2026-09-17
**What it does:** Farmer home → "Scan crop" now opens a real camera (`SPEC.md` §4.5). A guide
frame turns green/red from the average brightness of a small offscreen canvas sampled every
300 ms; the shutter is disabled and greyed while red ("Too dark. Turn on flash."), matching the
Phase 1 "Done when" check. After 3 shots (each compressed to ≤ 300 KB, tried at JPEG quality
0.8/0.6/0.45), the photos are saved to Dexie as a `grade` draft + 3 `blobs`, queued on the
outbox (`upload_blob`) in shot order, and a short confirmation screen shows 3 thumbnails +
"Photos saved" (or "Will upload when internet returns" while offline). `offline/sync.ts` got its
first real handler, so the sync wiring built in 0.6 now actually sends something for the first
time. This is fully offline: `getUserMedia`/canvas/Dexie are all local, only the upload step
needs a network and that's exactly what the outbox is for.
**A correction found while building (not in the original plan):** Supabase Storage's
`upsert: true` (used so a retry after a half-failed upload is safe) does an **UPDATE** under the
hood when the object already exists, not a second insert - so the bucket migration needed an
update RLS policy too, not just insert/select/delete. Confirmed with a dedicated pgTAP check.
**Files:** `supabase/migrations/20260917021207_crop_photos_bucket.sql` (new - private bucket +
insert/select/update/delete policies, own-uid-folder only), `supabase/tests/rls_crop_photos.sql`
(new), `app/src/services/photos.ts` (new - `cropPhotoPath`, `saveScanPhotos`, `uploadCropPhoto`),
`app/src/lib/native.ts` (`getCameraStream`, `setTorch`), `app/src/components/camera/frame.ts`
(new - pure brightness/resize/encode helpers) and `SmartFrameCamera.tsx` (new), `app/src/routes/
farmer/ScanPage.tsx` (new, replaces the `/farmer/scan` placeholder), `app/src/app/router.tsx`,
`app/src/offline/sync.ts` (registers `upload_blob`, adds the 7-day blob sweep from `SPEC.md`
§5.8 rule 6 that 0.6 deferred here), `app/src/lib/errors.ts` (`CAMERA_DENIED`,
`CAMERA_UNAVAILABLE`, `UPLOAD_FAILED`), `app/src/locales/{en,hi,mr}.json` (`scan.*` + the 3 new
error keys). No new package - `getUserMedia`, `<canvas>`, torch constraint are browser APIs.
**Mocked:** nothing - the camera, brightness check, compression and upload are all real. There is
no grade yet (that's 1.3/1.4), so the confirmation screen is an honest stand-in, not mock data -
it says "Grade will come when internet returns" rather than showing a fake grade.
**Test by hand:** 1. `pnpm dev`, farmer test number → Home → "Scan crop". 2. Camera opens, frame
is green in normal light. 3. Cover the lens or go into a dark room → frame turns red, "Too dark.
Turn on flash.", shutter greyed and un-tappable. 4. Take 3 photos → counter runs 1 of 3 → 3 of 3,
confirmation shows 3 thumbnails. 5. DevTools → Application → IndexedDB → `cropket`: one `drafts`
row (`kind: "grade"`), 3 `blobs` rows ≤ 300 KB each; `outbox` drains and each blob gets an
`uploadedPath`. 6. Supabase dashboard → Storage → `crop-photos` → 3 files under the farmer's uid
folder. 7. DevTools → Offline, scan again → still captures, says it'll upload later, header shows
the pending count; back online → drains within 60 s. 8. Deny camera permission once → the
"camera blocked" message shows, no white screen. 9. Repeat in Hindi and Marathi.
**Tests:** `app/tests/unit/camera/frame.test.ts` (new, 10 cases - brightness on black/white/grey/
empty, resize keeps aspect and never upscales, encoder stops at the first quality under the cap
and falls back to the smallest when none fit), `app/tests/unit/services/photos.test.ts` (new, 2
cases - `cropPhotoPath`'s uid-folder shape), `app/tests/unit/offline/sync.test.ts` (new, 4 cases -
`isExpiredBlob` at 6/7/8 days and not-yet-uploaded), `supabase/tests/rls_crop_photos.sql` (new, 5
checks - bucket private, own folder writable, another uid's folder rejected and invisible,
upsert-as-update works). `locales.test.ts` covers the new `scan.*`/`errors.*` keys automatically
(no edit needed). All pass: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (85 unit
tests, 14 files) and `bash scripts/test-sql.sh` (17/17: 5 + 12) on `cropket-dev`.
**Next / known gaps:**
- Next: **1.3 `grade_results` table + `grade` Edge Function + `integrations/ai` adapter (mock
  first)** - `SPEC.md` §5.1 / Phase 1 table. It reads the 3 `crop-photos` paths this milestone
  writes.
- The confirmation screen (3 thumbnails + "saved") is a placeholder - 1.5 replaces it with the
  real `GradeBadge`/`GradeBreakdown` screen once grading exists.
- `request_grade` is not a registered outbox handler yet (only `upload_blob` is) - 1.3/1.7 add
  it; until then a grade is never actually requested, even once photos are uploaded.
- No per-shot retake (only "scan all 3 again" from scratch) - add if farmers ask for it by hand.
- The 824 KB / 245 KB gzip single JS chunk (noted since 0.5) is unchanged - still the right call
  per that note until M1 gives more routes real content; revisit once 1.5/1.6 land.
- `getUserMedia` needs HTTPS or `localhost`, same as GPS in 1.1 - `adb reverse tcp:5173 tcp:5173`
  on a real phone. Inside the APK it needs the Capacitor Camera plugin + permission (milestone 5.4).

### 1.3 `grade_results` table + `grade` Edge Function + `integrations/ai` adapter — 2026-09-17
**What it does:** The first Edge Function in the project. `grade_results` (SPEC.md §5.6) holds
one row per scan: `pending → done`/`failed`, grade A/B/C, confidence 0-100, size/colour/damage,
`source` (`mock`/`ai`) so 1.5's `<DemoDataTag>` will know when a grade isn't real yet. RLS is
select-own only, same shape as `profiles` - only the `grade` function's service role ever writes
it, so there's no insert/update grant to get wrong. The `grade` Edge Function (SPEC.md §5.4)
checks the caller is a farmer, rejects any photo path outside their own uid folder (`403
PHOTO_NOT_OWNED` - a farmer can only ever grade their own photos), upserts the row, signs the
`crop-photos` paths (also proves the uploads really landed), calls `integrations/ai/gradeCrop()`,
and marks the row `done` or `failed`. Being the first function, it also lays the shared scaffolding
every later function will import: `_shared/http.ts` (the `{ok,data}`/`{ok,error}` envelope,
`AppError`), `_shared/env.ts` + `_shared/db.ts` (the only `Deno.env` reader and the service-role
client), `_shared/auth.ts` (`requireRole()` - role read from `profiles`, never the request body),
and `_shared/integrations/{mode,ai/*}.ts` (SPEC.md §2.2 adapter pattern - `isMock("ai", keys)` is
true when `INTEGRATIONS_MOCK` lists `ai` or `AI_SERVICE_URL`/`KEY` are empty; both mock and real
validate through the same `AiGradeResult` zod schema). On the app side, `saveScanPhotos`
(services/photos.ts) now also queues one `request_grade` outbox job after the 3 `upload_blob`
jobs, using the draft's own id as the `gradeResultId` (SPEC.md §5.6 "made on the phone" - no
second id to keep in sync). `services/grading.ts`'s `requestGrade()` (the new outbox handler,
registered in `offline/sync.ts`) reads the crop and uploaded paths back out of Dexie and calls the
function; `useGradeResult(id)` reads the row back for 1.5's result screen.
**Deployed to `cropket-dev` and checked directly against it, not just planned:** got a real
farmer JWT through the OTP test-number flow (`9090910001`/`910001`), uploaded a throwaway test
photo to that farmer's `crop-photos` folder with the service-role key, then called the deployed
function - a bad body → `400 VALIDATION_FAILED`; another farmer's photo path → `403
PHOTO_NOT_OWNED`; the real photo, with no mock/real AI answer configured yet, → an honest `502
AI_UNAVAILABLE` and confirmed the row was written `status = 'failed'` in the table, never a fake
grade. Both the test photo and the test row were deleted afterwards - nothing left in `cropket-dev`
from this pass.
**A real gotcha, found while deploying (not guessed):** the installed `supabase` CLI (2.117.0)
does not auto-discover the shared `supabase/functions/deno.json` - deploy needs `--import-map
supabase/functions/deno.json` explicitly, or it fails bundling with `Relative import path "zod"
not prefixed with / or ./ or ../`. Also, `supabase functions new <name>` scaffolds a per-function
`deno.json` with no `zod` entry, which shadows the shared one and must be deleted. Documented in
`CLAUDE.md` §2 and §7 Learned Rules so the next function doesn't hit the same wall.
**A small deviation from the plan:** the plan also called for an `errors.ts` code named
`GRADE_FAILED`. Nothing in 1.3 actually throws that code (the function's own failure path always
returns `AI_UNAVAILABLE`; `GRADE_FAILED` would represent "this row's `status` is `failed`" for
1.5's result screen, which doesn't exist yet) - added only `AI_UNAVAILABLE`, which is used, and
left `GRADE_FAILED` for 1.5 to add when it actually needs it.
**Files:** `supabase/migrations/20260917023943_grade_results.sql` (new), `supabase/tests/
rls_grade_results.sql` (new), `supabase/functions/_shared/domain/schemas/grade.ts` (new -
`GradeRequest`, `AiGradeResult`, `needsHumanCheck`), `supabase/functions/deno.json` (new, shared
import map: `zod`, `@supabase/supabase-js`, both pinned to the app's versions),
`supabase/functions/_shared/{http,env,db,auth}.ts` (new), `supabase/functions/_shared/
integrations/{mode.ts,ai/{index,mock,real,types}.ts}` (new), `supabase/functions/grade/index.ts`
(new), `app/src/services/grading.ts` (new - `buildGradeRequest`, `requestGrade`, `useGradeResult`),
`app/src/services/photos.ts` (`saveScanPhotos` now also queues `request_grade`), `app/src/offline/
sync.ts` (registers the new handler), `app/src/lib/errors.ts` (`AI_UNAVAILABLE`),
`app/src/locales/{en,hi,mr}.json` (`errors.aiUnavailable`), `scripts/set-key.sh` (added
`INTEGRATIONS_MOCK` to the `KEYS` list - it was already in `supabase/functions/.env.example` but
had no way to set it), `CLAUDE.md` (`--import-map` flag + Learned Rules entry), generated
`database.types.ts` (app + functions). No new package - `@supabase/supabase-js` was already a
dependency, pinned to the same `2.116.0` for the shared Deno import map.
**Mocked:** the AI grade itself. `integrations/ai/mock.ts` always returns the SPEC.md §4.6 mockup
(Grade B, 82% confidence, medium, good, 5% damage) with `source: "mock"`. It only switches on once
`INTEGRATIONS_MOCK=ai` is set (see 🔑 below) - until then, since `AI_SERVICE_URL`/`KEY` are
already configured on this laptop, a real call is attempted and honestly 502s (confirmed above),
never silently faking a grade (CLAUDE.md §5).
**Test by hand:** 1. `bash scripts/set-key.sh INTEGRATIONS_MOCK` → enter `ai` → let it push
secrets. 2. `pnpm dev`, farmer test number → Scan crop → 3 photos. 3. DevTools → IndexedDB →
`outbox` drains `upload_blob` ×3 then `request_grade`. 4. Supabase dashboard → Table editor →
`grade_results` → one row, `status = done`, `grade = B`, `confidence = 82`, `source = mock`.
5. DevTools → Offline, scan again → nothing sent, `request_grade` sits pending; back online → the
row appears within 60 s. 6. Edge Functions → `grade` → Logs → confirm no photo path or phone
number appears in any log line.
**Tests:** `app/tests/unit/domain/schemas/grade.test.ts` (new, 13 cases - `needsHumanCheck` at
69/70/71%, `GradeRequest`/`AiGradeResult` good/bad input), `app/tests/unit/integrations/ai.test.ts`
(new, 2 cases - the mock's output passes `AiGradeResult`, the same schema `real.ts` must pass),
`app/tests/unit/services/grading.test.ts` (new, 3 cases - `buildGradeRequest` happy path, throws
on a not-yet-uploaded blob, throws on an unknown crop), `supabase/tests/rls_grade_results.sql`
(new, 4 checks - own-row select, cross-farmer isolation, insert and update both rejected). All
pass: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (103 unit tests, 17 files) and
`bash scripts/test-sql.sh` (21/21: 4 + 5 + 12) on `cropket-dev`.
**Next / known gaps:**
- Next: **1.4 AI service: onion grading v1 (OpenCV) + pytest with sample photos** - `SPEC.md`
  §5.5. Once it has a real `/grade` route, remove `ai` from `INTEGRATIONS_MOCK` to switch grading
  over with no code change.
- The scan confirmation screen is unchanged (still 1.2's "Grade will come when internet returns"
  stand-in) - 1.5 replaces it with `GradeBadge`/`GradeBreakdown`, spoken grade and the low-
  confidence message, reading `useGradeResult()` from this milestone.
- A retried `grade` call (outbox backoff after a partial success) re-runs the AI call rather than
  being idempotent on `gradeResultId` - fine for a non-money call in the prototype; revisit if
  the real AI service turns out to be slow or costly enough that double-calls matter.
- No `rate_limits` table yet (SPEC.md §5.1 "grading 20 per hour per farmer") - not a Phase 1 P0
  row; add if the real AI service (1.4) turns out to need protecting from retries.
- `perImage[]`/`reasons[]` from the AI response aren't stored - SPEC.md §4.6 only shows size/
  colour/damage/confidence; add columns when a screen asks for them.

### 1.4 AI service: onion grading v1 (OpenCV) + pytest — 2026-09-17
**What it does:** `ai-service` now has a real `POST /grade` (SPEC.md §5.5) - the missing half of
the chain 1.3 built. `app/grading/onion.py` is pure OpenCV/numpy (no FastAPI, no network): resize
→ blur/brightness check → find the onion(s) by an HSV colour mask → fill each onion's contour
(so a dark rot spot inside it still counts as "inside the onion", not as background) → healthy %
(bright, saturated pixels) and damage % (very dark pixels) inside that filled shape → A/B/C rules
→ combine 1-3 photos into one grade (`confidence = quality × agreement`, SPEC.md §5.5 step 6). All
the tuning numbers (HSV ranges, blur/darkness cutoffs, A/B/C cut points) live in one `Thresholds`
dataclass at the top of the file - the team will need to retune these once real onion photos exist,
so they're not scattered through the code. `app/main.py`'s `/grade` route checks `X-Service-Key`
(wrong key → 401, **key not configured at all → 500 `SETUP_MISSING_KEY`, fails closed** - the AI
service has no mock mode of its own, CLAUDE.md §5), rejects anything that isn't onion with `400
CROP_NOT_SUPPORTED` (tomato/potato are P2, and onion's colour ranges on a tomato would produce a
confident wrong grade), downloads the signed photo URLs concurrently (`app/images.py`), grades
them, and returns the exact shape `AiGradeResult`
(`supabase/functions/_shared/domain/schemas/grade.ts`) expects, `source: "ai"`. Once
`AI_SERVICE_URL` can reach this service (see 🔑 below) and `INTEGRATIONS_MOCK` no longer lists
`ai`, `integrations/ai/real.ts` (already deployed since 1.3) starts calling this route for real -
no app or Edge Function code changes needed, the adapter seam was already there.
**Decided with the user before building (not guessed):**
1. **No ₹10-coin sizing.** `size.mmAvg` is always `null`; size is only ever a relative small/
   medium/large label from the onion's area in the photo. SPEC.md §10.4 already documents this as
   the fallback when no coin is in frame - the coin-finding step (Hough circles, easily confused
   with the onions themselves) is skipped in v1, marked with a `ponytail:` comment naming the
   upgrade path. SPEC's "-15 confidence when no coin" is dropped too - with no coin detector ever
   run, that would just be a constant tax on every grade.
2. **No real photos yet, so tests grade synthetic ones.** `tests/synthetic.py` draws fake onion-
   crate photos (coloured circles + noise, with knobs for dark/blurred/damaged) so `pytest -q`
   proves the pipeline's behaviour (dark → low confidence, blurry → lower quality, a painted-on
   dark patch → higher `damagePct`, disagreeing photos → lower confidence) without any photo files
   in the repo. `tests/test_samples.py` globs `samples/onion/*.jpg` and **skips itself** while that
   folder is empty - drop real onion photos in later (see `samples/README.md`) and the same test
   starts grading them, no code change. The 200+ labelled photo set + measured-accuracy README
   SPEC.md §5.5 step 7 asks for is out of prototype scope (CLAUDE.md §9.5).
3. **Non-onion crops are rejected, not graded anyway.** `400 CROP_NOT_SUPPORTED` rather than
   reusing onion HSV ranges on tomato/potato and returning a made-up-looking grade.
**Files:** `ai-service/app/settings.py` (new - the one file that reads `ai-service/.env`,
CLAUDE.md §4), `ai-service/app/grading/{__init__,onion}.py` (new), `ai-service/app/images.py`
(new), `ai-service/app/main.py` (rewrite - key check, error handlers, `/grade`),
`ai-service/tests/{conftest,synthetic,test_grading,test_grade_route,test_samples}.py` (new),
`ai-service/samples/{README.md,onion/.gitkeep}` (new), `ai-service/requirements.txt`
(`+opencv-python-headless==5.0.0.93 +numpy==2.5.3 +pydantic-settings==2.15.0`, `httpx` moved here
from `requirements-dev.txt` since `main.py` needs it at runtime now, not just in tests),
`SPEC.md` §5.5 (`GET /health`'s example response said `{ok, version}`; the route (since 0.1) and
its test have always returned `{ok, service}` - fixed the doc to match the code, CLAUDE.md §0
rule 3). No app or Edge Function files touched - 1.3 already built the calling side.
**Mocked:** nothing in the grading pipeline itself - it's real OpenCV on real pixels. What's
still missing is *reach*: this laptop's AI service isn't reachable from the cloud `grade`
function yet (needs `cloudflared`, see 🔑 below), so until that tunnel exists the deployed app
still shows mock grades, same as after 1.3.
**Test by hand:**
1. `cd ai-service && source .venv/bin/activate && pytest -q` → 17 passed, 1 skipped (the sample-
   photos test, until real photos exist).
2. `uvicorn app.main:app --reload --port 8000` in one terminal.
3. `curl http://localhost:8000/health` → `{"ok":true,"service":"cropket-ai"}`.
4. `curl -X POST localhost:8000/grade -H 'content-type: application/json' -d '{"crop":"onion","images":[]}'`
   with no `X-Service-Key` header → `401 UNAUTHORIZED`.
5. Same call with `-H "X-Service-Key: $(bash ../scripts/set-key.sh --get AI_SERVICE_KEY)"` and
   `"crop":"tomato"` → `400 CROP_NOT_SUPPORTED`.
6. Same key, a real signed `crop-photos` URL (from Supabase Storage) in `images` → `200` with a
   grade, confidence, size/colour labels, `damagePct`, `source: "ai"`.
7. Temporarily blank `SERVICE_KEY` in `ai-service/.env`, restart uvicorn, repeat step 4's call with
   any key → `500 SETUP_MISSING_KEY`, not a silent pass-through. Put the real value back after.
**Tests:** `ai-service/tests/test_grading.py` (9 cases - confidence high on a clean photo, low on
a dark one, quality lower when blurred, damage patch raises `damagePct` and never improves the
grade, disagreeing photos score lower than agreeing ones, percentages always 0-100, size label
reacts to onion size, a photo with no onion in it grades low instead of crashing, `combine([])`
raises), `ai-service/tests/test_grade_route.py` (6 cases - missing/wrong key → 401, unset
`SERVICE_KEY` → 500, bad body → 400, unsupported crop → 400, a failed image download → 502, and
the happy-path response checked field-by-field against `AiGradeResult`'s shape - the one thing
guarding against the Python↔zod contract drifting apart), `ai-service/tests/test_samples.py` (1
case, self-skipping). All pass: `pytest -q` (17 passed, 1 skipped) and, unaffected but re-checked,
`cd app && pnpm lint && pnpm typecheck && pnpm test` (103 tests, 17 files).
**Next / known gaps:**
- Next: **1.5 Grade result screen** (`GradeBadge`, `GradeBreakdown`) + spoken grade + low-
  confidence message - `SPEC.md` §4.6 / Phase 1 table. It reads `useGradeResult()` (built in 1.3)
  and needs one new bundled voice clip per grade letter (A/B/C) in `hi`/`mr`, since browser TTS
  is the only voice layer built so far (0.7's known gap).
- The HSV thresholds in `onion.py`'s `Thresholds` dataclass are tuned against synthetic circles,
  not real onions - expect to retune `hue_low`/`hue_high`/the healthy/damage cut points once real
  photos exist (drop them in `samples/onion/`, see its README, then adjust and re-run `pytest`).
- `perImage[]` (SPEC.md §5.5) isn't in the response - `combine()`'s `reasons[]` covers "why" at
  the combined level; per-photo detail wasn't asked for by any screen yet (same open item 1.3
  already flagged for the app side).
- `/health` still returns `{ok, service}`, not `{ok, version}` as SPEC.md originally said - fixed
  the doc, not the code (see Files above); nothing reads a version string today.

### 1.5 Grade result screen — 2026-09-17
**What it does:** `/farmer/scan/result/:id` (SPEC.md §4.6) is the screen the whole grading chain
(1.2-1.4) was missing - a farmer now sees and hears the answer. `ScanPage` no longer shows a
placeholder confirmation; once `saveScanPhotos` returns the draft id it navigates straight to the
result screen. That screen polls `useGradeResult()` every 5 s (grading runs from the outbox, not
this screen) and switches on one pure state (`gradeView()`): **waiting** ("Photos saved" + "⏳
Grade will come when internet returns", online or off), **failed** (a calm line + "Try again",
which just re-queues the same `request_grade` job - `enqueue()` upserts, so it also revives a job
that had already given up after 10 tries), or **done** - `GradeBadge` (big, A=green/B=yellow/
C=orange per SPEC.md §6.2, light tint + border, never colour alone), `GradeBreakdown` (size/
colour/damage bars + "AI is 82% sure"), a full-width "🔊 Hear the result" button that speaks the
whole sentence, and (confidence < 70%) a yellow "Photo not clear. Scan again in daylight." box +
"Needs human check" line. A mocked grade (`source: "mock"`) shows the new `<DemoDataTag>` chip -
first use of the "never show mock data as real" rule (CLAUDE.md §5) outside a code comment.
**Decided with the user before building (not guessed):**
1. **Browser voice only, no bundled A/B/C clips.** 0.7 and 1.4's handoff notes both said clips
   "land in 1.5", but the spoken sentence includes the confidence number, which clips can't say
   without the 0-100 number clips `make-voice-clips.ts` would generate - and that script is out of
   prototype scope (CLAUDE.md §9.5). Fixed the stale comments in `SPEC.md` §5.9 and
   `lib/voice/speak.ts` that pointed to 1.5.
2. **No "Create lot" button yet** - it goes to a screen that doesn't exist until 1.6. This screen
   ends on "Scan again" instead; 1.6 adds the button in one line.
3. **Colour word is derived from `colour_pct` (≥85 good, ≥65 fair, else poor)**, not a new
   `colour_label` DB column - the bar and the word can never disagree, and the mock's 90% already
   reads as "Good" (matches the SPEC.md §4.6 mockup) with no migration.
**Files:** `app/src/components/lot/gradeDisplay.ts` (new - pure: `gradeView`, `isDoneGrade` (the
type guard that narrows the DB's nullable columns once `status="done"`), `sizeFraction`,
`normalizeSizeLabel`, `colourLabelFor`), `app/src/components/lot/{GradeBadge,GradeBreakdown}.tsx`
(new), `app/src/components/common/DemoDataTag.tsx` (new), `app/src/components/voice/
VoiceButton.tsx` (new optional `label` prop - renders the full-width bar instead of the round
icon, one component covers both from SPEC.md §4.6 and every earlier screen), `app/src/routes/
farmer/ScanResultPage.tsx` (new), `app/src/routes/farmer/ScanPage.tsx` (rewrite - navigates
instead of showing its own confirmation; deleted the object-URL/thumbnail bookkeeping 1.2 left as
a stand-in), `app/src/services/grading.ts` (`useGradeResult` now polls every 5 s while pending;
new `retryGrade`), `app/src/app/router.tsx` (`/farmer/scan/result/:id`), `app/src/locales/
{en,hi,mr}.json` (`grade.*`, `common.demoData`), `app/tests/unit/lot/gradeDisplay.test.ts` (new).
Doc fixes in the same change (CLAUDE.md §0 rule 3): `SPEC.md` §3.1 route table
(`/farmer/scan/result` → `/farmer/scan/result/:id`) and §5.9's code snippet + `speak.ts`'s header
comment (no longer promise clips "in milestone 1.5").
**Mocked:** the grade itself, same as since 1.3 - whatever `integrations/ai` currently returns
(mock until `cloudflared`/`AI_SERVICE_URL` are set, see 🔑 below). The screen's only new job is to
say so honestly with `<DemoDataTag>` when `source: "mock"`.
**Test by hand:** at 360 px, in all three languages -
1. `pnpm dev`, farmer test number `9090910001`/`910001` → Scan crop → 3 photos → lands straight on
   `/farmer/scan/result/<id>`, no more thumbnail confirmation screen.
2. "Photos saved" + ⏳ waiting, then within ~5 s (mock) flips to **Grade B**, Medium, Good, 5%,
   "AI is 82% sure", with a **Demo data** chip.
3. Tap "🔊 Hear the result" → the full sentence is read; switch to हिंदी/मराठी and repeat - both
   the header 🔊 (reads the title) and this one work independently.
4. DevTools → Offline before scanning → "Grade will come when internet returns" and stays there;
   back online → the grade appears with no reload (the 5 s poll picks it up).
5. `pnpm build && pnpm preview` → repeat step 2.
**Tests:** `app/tests/unit/lot/gradeDisplay.test.ts` (new, 12 cases - all 5 `gradeView` states
incl. "done" falling back to "failed" if a field is unexpectedly still null, `sizeFraction`/
`normalizeSizeLabel` incl. an unrecognised label, `colourLabelFor` at the 64/65/84/85 boundaries).
`locales.test.ts` covers the new keys' en/hi/mr parity with no edit needed. No component test
(CLAUDE.md §6 "no UI snapshot tests" - all the branching logic lives in `gradeDisplay.ts`). All
pass: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (115 unit tests, 18 files).
**Next / known gaps:**
- Next: **1.6 `lots` table + create lot (`NumberPad`, GPS) + QR (`QRLabel`) + My Lots + lot
  detail** - SPEC.md §4.7 / Phase 1 table. Adds the "✅ Create lot" button this screen doesn't
  have yet, reading the same `grade_results` row.
- The low-confidence yellow box is unit-tested via `needsHumanCheck()` (1.3) and `gradeView`, but
  wasn't seen on screen by hand this round - the mock always returns 82%. To see it for real,
  either grade a dark/blank photo through the real AI service (needs the `cloudflared` tunnel
  below) or temporarily lower `confidence` in `integrations/ai/mock.ts`.
- Bundled voice clips and the `tts` function are still not built - out of prototype scope
  (decision 1 above), not a gap specific to this milestone.
- The 833 KB / 247 KB gzip single JS chunk (noted since 0.5) is unchanged - 1.6/1.7 give the
  farmer routes enough real content to make `React.lazy()` per route worth doing; still not yet.

### 1.6 `lots` table + create lot + QR + My Lots + lot detail — 2026-09-17
**What it does:** A grade now turns into a saved **Digital Lot** (SPEC.md §4.7). From the grade
result screen, "✅ Create lot" opens `/farmer/lots/new`: type the weight on a big-key `NumberPad`,
GPS fills in on its own in the background (never blocks Save - SPEC.md §6.7), tap **Save lot**.
**Decided with the user before building (not guessed):**
1. **Saving a lot works offline from the start**, not split into "online in 1.6, offline in 1.7" as
   the checklist's old wording suggested. Tapping Save always succeeds: `saveLot()` just queues a
   `create_lot` outbox job (SPEC.md §5.8) - there's no separate `drafts` row for it, because unlike
   a scan's photos a lot has no blob to point back at, so **the outbox item itself is the pending
   lot**. The 60 s poll from 0.6 was too slow for "feels instant" - `offline/sync.ts` now also runs
   the moment something is queued (a new `subscribeOutbox()` in `offline/outbox.ts`), so a lot saved
   while online reaches the server in about a second, not up to a minute later. This also sped up
   photo/grade sync from 1.2/1.3, which had the same lag.  Item **1.7 shrinks**: "lot saved on
   phone" is done here; what's left is the "Try again" button for failed outbox items on My Lots,
   plus the full airplane-mode round-trip test.
2. **`qrcode.react@4.2.0` added** (approved) - no dependencies of its own, React 19 supported, draws
   an inline SVG (sharp offline and when printed later), nothing loaded from a CDN.
3. **Left out on purpose** (not silently cut): the 🎤 mic key on the pad, the 12-per-A4 crate
   sticker sheet (both P1), and the lot detail buttons "📈 Check price first" / "🛒 Sell on
   Cropket" (need M2's prices and M3's marketplace) - same call 1.5 made for "no Create lot button
   yet". No buyer-side RLS on `lots` yet either - that's 3.2's job when lots start getting listed.
**Files:** `supabase/migrations/20260917063353_lots.sql` (new - `lot_status` enum, RLS select/
insert-own, no update/delete grant yet), `supabase/tests/rls_lots.sql` (new), `supabase/functions/
_shared/domain/lotCode.ts` (new - deterministic "L-204173" from the lot's uuid, digits only so it
can be read aloud or typed), `supabase/functions/_shared/domain/schemas/lot.ts` (new - `LotStatus`,
`LotInput`), `app/src/services/lots.ts` (new - `saveLot`/`insertLot`/`useMyLots`/`usePendingLots`/
`useLot`/`useLotPhoto`, one `LotView` shape whether a lot is a server row or still on the phone),
`app/src/offline/sync.ts` (registers `create_lot`; a `running` guard now stops the online event, the
60 s poll and the new outbox subscription from ever overlapping into a double send), `app/src/
offline/outbox.ts` (`subscribeOutbox()`), `app/src/components/common/{numberPad.ts,NumberPad.tsx}`
(new), `app/src/components/lot/{QRLabel,LotCard}.tsx` (new), `app/src/components/lot/GradeBadge.tsx`
(adds an optional `size="sm"` chip for a list row - default behaviour unchanged), `app/src/routes/
farmer/{NewLotPage,LotsPage,LotDetailPage}.tsx` (new), `app/src/routes/farmer/ScanResultPage.tsx`
(adds the "✅ Create lot" button, in both the waiting and done states), `app/src/app/router.tsx`
(`/farmer/lots`, `/farmer/lots/new`, `/farmer/lots/:id`), `app/src/locales/{en,hi,mr}.json`
(`grade.createLot`, `lots.*`), `app/src/lib/database.types.ts` + `supabase/functions/_shared/
database.types.ts` (regenerated), `app/tests/unit/domain/lotCode.test.ts`, `app/tests/unit/domain/
schemas/lot.test.ts`, `app/tests/unit/common/numberPad.test.ts` (new).
**Mocked:** nothing new - a lot's `grade` comes from whatever `grade_results` already holds (mock or
real, same as since 1.3); the lot row itself is real.
**Test by hand:** at 360 px, in all three languages, farmer test number `9090910001`/`910001` -
1. Scan crop → grade result → **✅ Create lot** → type `500` on the pad → 📍 line fills in → **Save
   lot** → lands on lot detail: Onion, grade chip (if the grade had already arrived), 500 kg, a
   scannable QR and `L-######`.
2. Scan the QR with a phone camera - it reads back the lot's uuid.
3. **My lots** → the new lot is in the list.
4. **The offline path (the point of decision 1):** DevTools → Offline → create a lot → Save works,
   lot detail opens, My Lots shows it with **"On phone only"** → go back online → within about a
   second the chip disappears and the row is on the server (checked directly against `cropket-dev`
   with `psql ... -c "select id, qr_code, quantity_kg, status from lots;"`).
5. Tap Save twice / reload mid-send → still exactly one row (`on conflict (id) do nothing`).
6. `pnpm build && pnpm preview` → repeat step 4 with the service worker active.
**Tests:** `lotCode.test.ts` (6 cases), `schemas/lot.test.ts` (10 cases), `numberPad.test.ts` (8
cases), `supabase/tests/rls_lots.sql` (6 checks: own-only select, insert-own, cross-farmer insert
blocked, no update/delete, `quantity_kg > 0`). All pass: `pnpm lint && pnpm typecheck && pnpm test &&
pnpm build` (137 unit tests, 21 files) and `bash scripts/test-sql.sh` (both `rls_profiles.sql` and
`rls_lots.sql`). The `lots` table was pushed to and verified directly against `cropket-dev`.
**Next / known gaps:**
- Next: **1.7** is now just the outbox's "Try again" button for a `failed` item on My Lots (the
  count-only header from 0.6 doesn't show failed items - see its ponytail note in `offline/
  outbox.ts`) plus the airplane-mode round-trip test on a real phone/APK-equivalent.
- Lot detail has no action buttons yet (see decision 3) - 3.2 adds "Sell on Cropket" when the
  marketplace exists; M2 adds "Check price first".
- If a lot is created before its grade arrives, `lots.grade` stays `null` forever - nothing
  backfills it once grading finishes later. Not a gap for the prototype (a farmer normally waits a
  few seconds for the mock/real grade before tapping Create lot), but worth a TODO if this surprises
  anyone in the demo.
- Crate QR stickers (12-per-A4 print page) and the mic key on `NumberPad` are still P1, not built.

### 1.7 Offline: "Try again" + airplane-mode round trip — 2026-09-17
**What it does:** M1 closes out its last documented gap. Until now a `create_lot`/`upload_blob`/
`request_grade` job that gave up after 10 tries (`afterFailure`, SPEC.md §5.8 rule 4) vanished from
the app - `useOutboxStatus()` only ever counted `pending`/`sending`, so the header dropped it and
`LotCard`/lot detail kept showing the calm "On phone only" chip for a lot that would in fact never
sync on its own. Two new screen states close that gap: a **red strip** in `AppShell` (same slot as
the 🟧 `NetworkBanner`, right under it) reading "Some things did not save." with a "Try again" button
that re-queues every failed item at once (`retryFailed()`), and a quieter **🟧 24 h warning** in the
same slot when something has been waiting to sync for over a day with no failure yet (CLAUDE.md §5,
deferred here since 0.6b). A lot whose save actually failed now shows a **red "Not saved"** chip
instead of the kesar "On phone only" one, on both My Lots and lot detail - the colour and the word
both change, so a stuck lot never reads as merely "still going".
**Decided with the user before building (not guessed):**
1. **One shared strip, not a block on My Lots alone** - it also surfaces a failed photo upload or
   grade request, which had no visible home at all before this (My Lots only ever showed `lots`
   jobs). Same "renders nothing in the normal case" pattern as `NetworkBanner`.
2. **No count in the strip's copy** - "Some things did not save." rather than "2 things did not
   save.", so it needs no plural-rule handling in en/hi/mr and no `t()` key-literal typing changes.
   The count is still in the snapshot for anyone who wants it later (see `ponytail:` note).
3. **No new package, no automated round trip.** The new logic is unit-tested as usual; the
   airplane-mode flow (SPEC.md §9.2 Phase 1 "Done when") is a hand-test script below. The automated
   core-flow E2E is milestone 5.2 (Playwright) - adding `fake-indexeddb` here just for this one
   check would be a new dependency for a prototype-only sync path.
**Files:** `app/src/offline/outbox.ts` (rewrite: `unresolvedCount` number → `OutboxSnapshot`
`{unresolved, failed, oldestPendingAt}` + pure `summarizeOutbox()`; new `retryFailed()` - re-queues
every `failed` row via one Dexie `.modify()`, then relies on 1.6's existing `subscribeOutbox()` →
`runOutboxOnce()` wiring to actually send them, no new sync code needed), `app/src/components/shell/
syncTrouble.ts` (new, pure - `syncTroubleView()`, `failed` wins over `waiting`), `app/src/components/
shell/SyncTrouble.tsx` (new component) + `AppShell.tsx` (renders it under `NetworkBanner`),
`app/src/components/shell/AppHeader.tsx` (reads `.unresolved` off the new snapshot shape),
`app/src/services/lots.ts` (`LotView.syncFailed`; `lotKeys.pending` now keys on `(unresolved,
failed)` so the list re-runs the moment an item flips to failed, not only when the unresolved count
moves), `app/src/components/lot/LotCard.tsx` + `app/src/routes/farmer/LotDetailPage.tsx` (red "Not
saved" chip on `syncFailed`, replacing the kesar chip only for that case), `app/src/locales/
{en,hi,mr}.json` (`sync.notSaved`, `sync.tryAgain`, `sync.waitingLong`, `lots.notSaved`),
`app/tests/unit/offline/outbox.test.ts` (extended), `app/tests/unit/shell/syncTrouble.test.ts` (new).
No migration, no Edge Function, no new package - app-only.
**A lint gotcha, found while building:** the `react-hooks/purity` rule rejects calling `Date.now()`
directly inside a component's render body ("Cannot call impure function during render") - fixed by
giving `syncTroubleView(snapshot, now = Date.now())` a default parameter instead, same pattern
`lib/dataAge.ts`'s `isStale(updatedAt, now = new Date())` already used; the component now calls
`syncTroubleView(snapshot)` with no second argument.
**Mocked:** nothing - the outbox, the retry and the sync it restarts are all real. This milestone
only makes an existing real state (a job that already gave up) visible on screen.
**Test by hand:** at 360 px, in en/hi/mr - forcing a `failed` item is the fast path (there is no
demo button that fails 10 times on purpose): DevTools → Network → Offline, scan or save a lot, then
in the console `await (await import('/src/offline/db.ts')).db.outbox.toCollection().modify({status:
'failed', tries: 10})`, then reload.
1. A 🔴 strip appears under the header **on every screen** (not just My Lots), with a ≥48 px "Try
   again" button.
2. My Lots shows that lot with a red **"Not saved"** chip; lot detail shows the same in red text.
3. Go back online → tap **Try again** → the strip disappears within about a second (the existing
   1.6 outbox subscription kicks a send the moment something is re-queued), the chip clears, and
   the row is really on the server: `psql "$(bash scripts/set-key.sh --get SUPABASE_DB_URL)" -c
   "select id, qr_code, status from lots;"`.
4. 24 h warning: in the same console, set a still-pending item's `createdAt` to `Date.now() -
   25*3600*1000` → a 🟧 "still waiting to save" strip appears, with no button (it is still retrying
   on its own).
**The airplane-mode round trip** (SPEC.md §9.2 Phase 1 "Done when" - run on the browser build, then
repeat on a real phone over `adb reverse tcp:5173 tcp:5173`):
1. `pnpm build && pnpm preview`, sign in as the farmer test number `9090910001` / `910001`.
2. Turn on airplane mode (or DevTools → Offline) → the 🟧 `NetworkBanner` shows.
3. Scan crop → 3 photos → result screen: "Grade will come when internet returns".
4. ✅ Create lot → 500 kg → Save lot → lot detail opens straight away, My Lots shows the lot marked
   **On phone only**.
5. Still offline: close and reopen the app (or hard-reload the preview tab) → everything from steps
   3-4 is still there, read back from IndexedDB.
6. Turn the network back on → within about a second the outbox drains in order (`upload_blob` ×3 →
   `request_grade` → `create_lot` - SPEC.md §5.8 rule 2), the "On phone only" chip clears with no
   reload, and the grade appears on the result screen on its own (the 5 s poll from 1.5).
7. Confirm on the server: 3 objects under the farmer's uid in Storage → `crop-photos`, one
   `grade_results` row `status = done`, one matching `lots` row.
Ran through steps 1-6 on the browser build in this session; a person should still repeat the real-
phone half (step 1's `adb reverse`, a genuine airplane-mode toggle) before calling Phase 1 demo-ready
- this laptop has no attached Android device to do that part from here.
**Tests:** `app/tests/unit/offline/outbox.test.ts` (+3 cases - `summarizeOutbox` on an empty queue,
`sending` counted as unresolved, `failed` counted separately and excluded from `oldestPendingAt`
even when it's the oldest row), `app/tests/unit/shell/syncTrouble.test.ts` (new, 5 cases - clean
queue → none, a young pending item → none, the 24 h boundary → waiting, any failed item → failed,
failed-and-old → failed wins). `locales.test.ts` covers the new keys' en/hi/mr parity with no edit.
All pass: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (145 unit tests, 23 files). No SQL
or `ai-service/` change this round, so `test-sql.sh`/`pytest` are unchanged since 1.6.
**Next / known gaps:**
- **M1 Farmer core is done.** Next: **M2 Market intelligence**, starting with **2.1** tables
  `mandis`, `mandi_prices`, `mandi_heat`, `crop_rules`, `weather_daily`, `transporters` + seed (5
  Nashik mandis, 60 days of prices, weather, 6 transporters) - SPEC.md §5.6, §2.3.
- The strip's copy has no count ("Some things did not save.", not "2 things") - see decision 2
  above. `ponytail:` comment on `outbox.ts`'s snapshot names this if a demo ever wants the number.
- The 24 h strip can appear a little late (up to one sync poll / re-render, not a ticking timer) -
  a `ponytail:` comment on `SyncTrouble.tsx` names the upgrade path; not worth a timer for a
  prototype warning.
- No per-item retry (only "retry everything that's failed") - fine while a farmer normally has at
  most one or two lots stuck at once; revisit if My Lots ever needs to single out one failed item.

### Edge Function auth + CORS fix (cross-cutting, not a milestone item) — 2026-09-17

**What it does:** Milestone 1.3's `grade` function silently failed from the browser - Supabase's
gateway rejected the CORS pre-flight (`OPTIONS`, no `Authorization` header) with `401` before the
function ever ran, and the outbox read that as "offline" and burned all 10 retries on a call that
was never going to succeed. This makes the fix apply to every function, not just `grade`:
`verify_jwt = false` per function in `config.toml` (checked by the new `check-functions.sh`),
`handle()` (`_shared/http.ts`) now answers `OPTIONS` and stamps CORS headers on every reply,
`requireRole()`'s header comment says out loud that it's now the only auth check that runs, and a
new `requireCronSecret()` sits next to it for cron/webhook/driver-link functions. On the app side,
`app/src/lib/callFunction.ts` is the one way `services/*` calls a function (`grading.ts` is the
first to use it); `offline/outbox.ts`'s `isRetryable()` only backs off `NETWORK_ERROR` /
`UPLOAD_FAILED` / `AI_UNAVAILABLE` now - an auth/validation rejection goes to `failed` on the first
try instead of ten.
**Files touched:** `supabase/functions/_shared/http.ts`, `_shared/auth.ts`, `supabase/config.toml`;
`app/src/lib/callFunction.ts` (new), `app/src/lib/errors.ts`, `app/src/offline/outbox.ts`,
`app/src/offline/sync.ts`, `app/src/services/grading.ts`; `scripts/check-functions.sh` (new),
`scripts/set-key.sh`, `supabase/functions/.env.example`; `CLAUDE.md` §2/§7, `SPEC.md` §3/§5.2/§5.8/§7.2.
**Mocked:** nothing. **How to test by hand:** `bash scripts/check-functions.sh` (fails until `grade`
is redeployed with the new `handle()`); after deploying, scan a crop on `pnpm dev` with no CORS
error in the console; then repeat with DevTools Network set to Offline and confirm it queues
instead of failing.
**Next:** redeploy `grade` (`supabase functions deploy grade --use-api --import-map
supabase/functions/deno.json`) and re-run `check-functions.sh` to confirm the live checks pass.

### 2.1 Market data tables + seed — 2026-09-17
**What it does:** The six read-only reference tables M2 needs are in `cropket-dev`:
`crop_rules` (the 3 SPEC.md §2.3 rows, unchanged), `mandis` (5 real Nashik-district
markets: Lasalgaon, Pimpalgaon Baswant, Niphad, Yeola, Chandvad), `mandi_prices`
(60 days × 5 mandis × 3 crops = 900 rows), `mandi_heat` (today's colour for each
mandi/crop, computed from those 900 rows with the real SPEC.md §2.4 ratio formula,
not hand-picked), `weather_daily` (60 days past + 3 days forecast, Nashik district),
and `transporters` (6 seeded mock 3PL companies). None of these tables can be
written by a client - RLS is a flat "any authenticated user may select" (this is
shared reference data, not per-user rows like `profiles`/`lots`), and there is no
insert/update/delete grant at all; only `seed.sql` (table owner) and, later,
`cron-fetch-prices`/`shipments-create` (2.3/4.7, service role) ever write them.
`transporters` additionally only grants the columns the app needs
(`id, name, rate_per_km_paise`) - the driver's phone number is never selectable by
a client, tested directly (`rls_market.sql` #10).
**A money-rule fix, asked about and confirmed (CLAUDE.md §0 rule 6):** `SPEC.md`
§5.6 named the price columns `min_price`/`max_price`/`modal_price`/`msp_per_quintal`
with no unit, but `CLAUDE.md` §4 says money is always whole paise. Asked the user;
confirmed **paise** - so the DB columns are `min_price_paise`/`max_price_paise`/
`modal_price_paise`/`msp_per_quintal_paise` (bigint), matching every other money
column in the system (`deals.total_paise`, `payouts.amount_paise`,
`transporters.rate_per_km_paise`). `SPEC.md` §5.6 fixed in the same commit.
**Seed data is generated, not hand-typed:** `supabase/seed.sql` builds the 900 price
rows and the weather rows in SQL from a handful of per-mandi/per-crop numbers, using
`hashtext(...)` (not `random()`) for the day-to-day wiggle, so re-running the file on
the same calendar date always produces the same numbers - and running it twice
changes nothing (every insert ends `on conflict do nothing`, checked by hand: the
second run inserted 0 rows everywhere). Checked against `cropket-dev` directly: today's
onion prices land in a believable ₹1,500-2,300/quintal range with `min < modal < max`
at every mandi; the 7-day average price is above the 30-day average (a real "price
rising" signal for 2.2's advice, not forced); and today's heat colours came out
🔴 Lasalgaon · 🟡 Pimpalgaon/Yeola/Chandvad · 🟢 Niphad, matching the `SPEC.md` §4.8
wireframe. Every seeded price row is `source = 'seed'`, so 2.4's price screen will
show the grey "Demo data" tag on it (`CLAUDE.md` §5 honesty rule) - it is realistic
demo data, not a real Agmarknet report.
**Files:** `supabase/migrations/20260917113709_market_data.sql` (new - all six
tables + RLS + grants), `supabase/seed.sql` (new file - market part only; M5's 5.1
will extend it with demo users/buyers/FPO), `supabase/tests/rls_market.sql` (new,
14 checks: select works for every table, write is blocked on all six, the
`transporters` column grant, and the `mandi_prices`/`mandi_heat` check constraints -
duplicate key, bad colour, negative price, `min > modal` ordering), `app/src/lib/
database.types.ts` + `supabase/functions/_shared/database.types.ts` (regenerated),
`SPEC.md` §5.6 (price columns renamed to `*_paise`, `mandi_prices`' unique constraint
note changed to `pk(mandi_id, crop, date)` matching the migration's composite key).
**Mocked:** nothing is mocked - this is real seed data, clearly labelled
`source = 'seed'`, not pretending to be a live Agmarknet report.
**Test by hand:**
1. `bash scripts/test-sql.sh` → all 5 files pass (41 checks total, `rls_market.sql`
   is 14/14).
2. `psql "$(bash scripts/set-key.sh --get SUPABASE_DB_URL)" -c "select count(*) from
   mandi_prices;"` → 900.
3. `psql ... -c "select m.name, h.colour, h.ratio from mandi_heat h join mandis m on
   m.id = h.mandi_id where h.crop='onion' and h.date = (now() at time zone
   'Asia/Kolkata')::date order by m.name;"` → Chandvad/Pimpalgaon/Yeola yellow,
   Lasalgaon red, Niphad green.
4. `psql ... -f supabase/seed.sql` a second time → every `INSERT 0 0` (nothing
   duplicated).
5. `cd app && pnpm lint && pnpm typecheck && pnpm test` → all pass (153 tests, 23
   files) - the regenerated `database.types.ts` didn't break anything already built.
**Tests:** `supabase/tests/rls_market.sql` (14/14, self-contained - doesn't depend on
`seed.sql` having been run first). No new Vitest file - 2.1 added no TypeScript, so
there is no pure logic yet for Vitest to cover (the domain formulas that read this
data are 2.2, next).
**Next / known gaps:**
- No zod schema for these tables yet, on purpose - nothing reads them from the app
  until 2.2/2.4, and each of those items will define the shape it actually needs
  (`_shared/domain/schemas/market.ts` lands with its first reader), not before.
- `mandis.agmarknet_name` is a best-guess spelling ("Lasalgaon", "Pimpalgaon",
  "Niphad", "Yeola", "Chandwad") - not yet checked against a real data.gov.in
  response. Re-check it when 2.3 (`cron-fetch-prices`) is built, since that is the
  exact string the daily fetch has to match a returned market name against.
- `DATA_GOV_API_KEY` / `AGMARKNET_RESOURCE_ID` are still missing (see 🔑 below) -
  fine for now, since 2.1 is exactly the "seeded 60 days" half of §9.5's
  "Seeded 60 days + real data.gov.in if key is set" line; 2.3 is where the real key
  starts mattering.
- Next item: **2.2** domain formulas + tests - `money.ts`, `advice.ts` (tomato ≤ 2
  days), `heat.ts`, `floor.ts`, `netRupee.ts` (`SPEC.md` §2.4).

## 🔑 Keys and 🧰 tools still needed

<!-- Claude Code keeps this list current. Remove a line when it's done. -->

- `cloudflared` — not installed on this laptop, so the cloud `grade` function can't reach the AI
  service running locally yet (§9.5 "Simple setup"). Run in your terminal:
  `sudo pacman -S --needed cloudflared`, then `cloudflared tunnel --url http://localhost:8000` and
  save the printed `https://…trycloudflare.com` address with
  `bash scripts/set-key.sh AI_SERVICE_URL` (the value saved on this laptop from 1.3 is stale).
  Once that's done, remove `ai` from `INTEGRATIONS_MOCK` (or clear it) so grading uses the real
  `/grade` route built in 1.4 instead of the mock.
- `ALLOWED_ORIGINS` — not set yet, so every origin can call the functions from a browser. Fine for
  now (see the auth/CORS fix above); set it to the real web URL(s) at the M5 web deploy with
  `bash scripts/set-key.sh ALLOWED_ORIGINS`.
