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
- [x] 2.2 Domain formulas + tests: `money.ts`, `advice.ts` (tomato ≤ 2 days), `heat.ts`, `floor.ts`, `netRupee.ts`
- [x] 2.3 `cron-fetch-prices` (real data.gov.in if key set) — wired with pg_cron (18:10 IST + 18:20 IST retry); recompute `mandi_heat`
- [x] 2.4 Prices screen: `PriceHero`, `AdviceCard`, `FloorWarning`, `MandiList`, `MandiHeatmap` (if MapTiler key), `DataAge`
- [x] 2.5 `route-distance` (ORS if key, else straight line × 1.3 (mock)) + Net-₹ comparator screen

## M3 — Buyer marketplace
- [x] 3.1 `buyer_kyc` + `kyc-verify` (mock) + KYC screen + admin approve + `VerifiedBadge`
- [x] 3.2 List a lot + buyer marketplace with filters (crop, grade, distance, quantity)
- [x] 3.3 `bids` + `place_bid` RPC + RLS (only verified, not banned) + `LiveBidBox` with Realtime
- [x] 3.4 Mega lot grouping (`mega_lots`, `mega_lot_items`, `group_mega_lots` trigger)
- [x] 3.5 Farmer / FPO bids screen (`BidRow`, accept / reject, floor warning)
- [x] 3.6 Deal consent screen (5 points + `VoiceConsent`) + `deals` table + `accept_bid` RPC

## M4 — Escrow and Digital Khata
- [x] 4.1 `escrows`, `escrow_transitions`, `escrow_events`, `payouts`, `khata_entries` + `escrow_transition()` + SQL tests
- [x] 4.2 `split.ts` + tests (100% branches, no paisa lost)
- [x] 4.3 `integrations/cashfree` (mock) + `escrow-pay` + "Pay (demo)" button + `cashfree-webhook` → FUNDED + Khata 🟡
- [x] 4.4 Khata screen (`KhataRow`, `KhataSummary`, voice, readable offline)
- [x] 4.5 Delivery OTP (hash + 5-try lock) + buyer sees `OtpDigits`
- [x] 4.6 "Mark dispatched" → IN_TRANSIT + Khata 🔵
- [x] 4.7 `shipments` + `shipments-create` (SMS mock, link shown on screen) + `trip` function + driver page `/t/:token` (delivery photo + OTP)
- [x] 4.8 `escrow-release` (split, payouts, Khata 🟢)
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
  pilot area, per `SPEC.md`) - server-side reverse geocoding into those two columns is still out
  of scope (see the 2026-09-17 fix note below for the client-side village autofill that *is*
  built); if the pilot ever needs farmers outside Nashik district, this default will need
  revisiting.
- Browser geolocation needs HTTPS or `localhost`; on a real phone over USB use
  `adb reverse tcp:5173 tcp:5173` and open `http://localhost:5173`, not the LAN IP. Inside the
  APK it needs the Capacitor Geolocation plugin + Android fine-location permission - milestone 5.4.

### 1.1 fix — "Use my location" alone couldn't pass the village step — 2026-09-17
**Bug (found by hand-testing):** tapping "Use my location" on the village step saved GPS fine,
but Continue stayed disabled with no explanation - `canAdvance` for that step only checked
`village.trim().length > 0`, and nothing filled `village` from a GPS fix, so the farmer had to
type a name anyway with no hint why.
**What changed:** (1) a saved GPS point alone now unlocks Continue -
`village.trim().length > 0 || locationStatus === "saved"`; (2) `handleUseLocation` also calls
MapTiler's geocoding API directly from the browser (same public `VITE_MAPTILER_KEY` the map
already uses, no new secret/Edge Function) to autofill `village` - best-effort only, never
overwrites text the farmer already typed, and quietly does nothing if the key is missing or the
call fails/times out; (3) a disabled step now shows *why* ("Type a village name, or use your
location.") the same way the last step already explains "Needs internet to finish"; (4)
`ProfileInput.village` is now optional - a blank value becomes `null` (not `""`) so it's a real
"no village on file" instead of an empty string, matching the fallback `NewLotPage.tsx` already
had (`profile?.village ?? locationUnknown`).
**Mocked:** nothing new. The MapTiler geocoding call is real when the key is set (same key as the
map); with no key it just skips the autofill, same as the map itself falling back to `MandiList`.
**Files:** `app/src/lib/geocode.ts` (new - `reverseGeocodeVillage()`),
`app/src/routes/onboarding/{OnboardingPage.tsx, StepInputs.tsx}`,
`supabase/functions/_shared/domain/schemas/profile.ts` (`village` optional, blank → `null`),
`app/src/locales/{en,hi,mr}.json` (`onboarding.placeNeeded`).
**Test by hand:** `pnpm dev`, farmer test number `9090910001` / OTP `910001` → at the village
question, tap "Use my location" without typing anything → Continue enables as soon as "📍
Location saved" shows, and (if `VITE_MAPTILER_KEY` is set) the text field fills with a name you
can still edit. With the key unset, the field stays empty but Continue still enables.
**Tests:** `app/tests/unit/geocode.test.ts` (new - good response, empty features, non-200,
network failure, malformed body, and no-key-skips-fetch, 6 cases),
`domain/schemas/profile.test.ts` (blank/missing village now asserted to become `null`). All pass:
`pnpm lint && pnpm typecheck && pnpm test` (32 files, 242 tests). No migration touched (`village`
was already a nullable DB column), so `test-sql.sh` wasn't re-run.
**Next / known gaps:** rural Maharashtra villages are often thin in commercial geocoders (MapTiler
is OSM-backed), so the autofilled name can be the nearest town/taluka rather than the exact
village - that's exactly why it stays editable rather than locking the field. District/state
autofill from the GPS point is still not built (see the bullet above).

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

### 2.2 Domain formulas + tests — 2026-09-17
**What it does:** Five pure TypeScript files in `_shared/domain/` turn the 2.1 tables
into the five numbers M2's screens need, so 2.4 (prices screen) and 2.5 (Net-₹
comparator) will be thin components over these, and 2.3's `cron-fetch-prices` will
recompute `mandi_heat` with the same `heat.ts` the app uses. `money.ts` (paise↔rupee
conversion, the one rounding rule, `formatRupees` with Indian grouping). `floor.ts`
(Reference Floor Price, `SPEC.md` §2.3 - p20 of 30-day modal prices or MSP; `null`
when there's no data, never a warning with no data - advisory, never blocks).
`heat.ts` (mandi heatmap colour, thresholds copied exactly from `seed.sql`'s SQL
version of the same formula). `netRupee.ts` (`SPEC.md` §2.4 you-keep formula).
`advice.ts` (sell/hold v1 - `null` with under 7 days of history rather than guessing).
**A money rule fixed, asked about and confirmed (`CLAUDE.md` §0 rule 6):** `SPEC.md`
§2.4 said `fees = mandi commission % × gross` with no number anywhere, and 2.1's
`mandis` table has no commission column. A real APMC rate chart is actually two
things - a % of sale value (commission, market fee, supervision) and flat per-quintal
charges (hamali, tolai) - so a single blended % drifts by about a percentage point as
Nashik onion prices swing, in the one screen whose job is an honest comparison. Asked
the user; confirmed the two-term shape, sourced from one exported constant today
(`MANDI_CHARGES` in `netRupee.ts`: 1.05% market fee + supervision, ₹12/quintal
hamali + tolai, from the APMC Vashi rate chart - no published Lasalgaon chart was
found) with a `ponytail:` comment naming the upgrade path (a per-mandi DB column once
the team has each real APMC's chart). Also confirmed the ~6.5% adat (broker's
commission) is **not** charged to the farmer - Maharashtra's 2016 F&V deregulation
puts that on the trader. `SPEC.md` §2.4 updated in the same commit.
**A second gap, asked about and confirmed:** `SPEC.md` §5.1 gives `AdviceCard` a
`pctChange?` prop and the §4.8 wireframe shows "Price may rise about 10%", but §2.4's
advice rules never define how to compute one and there's no forecast model until the
P2 v2 model. Confirmed `advise()` returns no `pctChange` in v1 - the prop stays
optional and undefined; the card shows "Hold for N days" + the Why list only, nothing
that reads as a forecast we don't have (`SPEC.md` §10.7 honesty rule).
**Files:** `supabase/functions/_shared/domain/{money,floor,heat,netRupee,advice}.ts`
(new), `app/tests/unit/domain/{money,floor,heat,netRupee,advice}.test.ts` (new, 39
tests), `SPEC.md` §2.4 (fees formula rewritten to the two-term shape + the adat note).
**Mocked:** nothing - these are pure formulas over real 2.1 seed data.
**Test by hand:**
1. `cd app && pnpm lint && pnpm typecheck && pnpm test` → all pass (192 tests, 28
   files, up from 153/23 before this item).
2. Cross-checked `heatColour()` against today's real `mandi_heat` rows in
   `cropket-dev` (`psql ... where crop='onion' and date = today`): Lasalgaon
   1.495→red, Niphad 0.549→green, the other three (0.848, 1.022, 1.087)→yellow -
   every row's TypeScript colour matched the SQL-computed colour already stored.
**Tests:** all 5 files above. `advice.test.ts` proves the two CLAUDE.md §6
requirements directly: tomato (`maxHoldDays` 2) with all 3 up-signals holds 2 days,
never 5; a loop over onion/potato/tomato × up/down history × with/without rain proves
`holdDays` never exceeds `maxHoldDays`. `netRupee.test.ts` proves parts sum exactly to
`youKeep` to the paisa, and a tiny lot sent far is **not** clamped at ₹0 (a real loss,
shown plainly - that's the comparator's point).
**Next / known gaps:**
- `MANDI_CHARGES` is one blended rate for every mandi, sourced from the APMC Vashi
  chart (no Lasalgaon chart was found published) - flagged with a `ponytail:` comment
  in `netRupee.ts`. Re-check against a real Nashik/Lasalgaon rate chart before the
  demo if the team can get one; until then this is a labelled estimate, not a
  confirmed local rate.
- `heat.ts`'s thresholds (`> 1.3` red, `< 0.8` green) are duplicated in `seed.sql`
  (SQL can't import TypeScript) - if either ever changes, check both. 2.3
  (`cron-fetch-prices`) will be the second place that matters.
- Next item: **2.3** `cron-fetch-prices` (real data.gov.in if key set) - run by
  hand; recompute `mandi_heat`.

### 2.3 `cron-fetch-prices` — 2026-09-17
**What it does:** an Edge Function, run by hand (`curl` below, no pg_cron schedule in
the prototype), that fetches today's Nashik onion/tomato/potato prices, writes them to
`mandi_prices`, then recomputes `mandi_heat` for every date it just wrote. Checked both
upstreams live before building (see the plan): data.gov.in's daily-price resource has
**no arrivals column at all** and its old Agmarknet HTML scrape is dead (now a React
SPA that ignores every query param) - so prices come from data.gov.in and arrivals
come separately from Agmarknet's own (undocumented, no key needed) dashboard API. The
two are only ever paired up when they agree on the exact same calendar day; otherwise
a price is stored with `arrivals_tonnes = null` rather than a guessed number next to
`source = 'agmarknet'` (honesty rule).
**A gap found and fixed along the way:** `seed.sql`'s five `agmarknet_name` guesses
("Lasalgaon", "Niphad", "Pimpalgaon", "Chandwad") don't match anything either live feed
actually reports - real Nashik onion markets today are named things like
`Lasalgaon(Vinchur)` and `APMC Pimpalgaon Baswant`. Remapped all five mandis to their
real Agmarknet names **and** numeric market ids (needed for the arrivals API, which
keys by id, not name) - `seed.sql`'s mandi insert is now `on conflict do update` so
re-running it repairs an already-seeded `cropket-dev` too.
**Files:** `supabase/migrations/20260917125931_agmarknet_link.sql` (new -
`mandis.agmarknet_market_id`, `mandi_prices.arrivals_tonnes` made nullable,
`mandi_heat_inputs()` SQL function that gathers today's arrivals + 30-day average +
nearby Digital Lots for `heat.ts` to score), `supabase/seed.sql` (real mandi mapping),
`supabase/functions/_shared/domain/schemas/prices.ts` (new, `DailyPrice`),
`supabase/functions/_shared/integrations/agmarknet/{types,parse,real,mock,index}.ts`
(new adapter - `parse.ts` holds all the real logic so Vitest can reach it, `real.ts`
just does the two `fetch()` calls), `supabase/functions/cron-fetch-prices/index.ts`
(new), `supabase/config.toml` (+`[functions.cron-fetch-prices]`),
`app/tests/unit/integrations/agmarknet.test.ts` (new, 16 tests using fixtures captured
from the real responses), `supabase/tests/heat_inputs.sql` (new, 5 pgTAP checks),
`app/src/lib/database.types.ts` + `supabase/functions/_shared/database.types.ts`
(regenerated), `CLAUDE.md` §7 (a `supabase functions new` gotcha found while wiring
this up - see below).
**Mocked:** only when `DATA_GOV_API_KEY` / `AGMARKNET_RESOURCE_ID` are missing (both
were already set on this laptop, so every check below ran against the real APIs, not
mock). The mock walks ±5% from each mandi/crop's last stored price/arrivals so the
demo prices screen (2.4) still moves day to day.
**Test by hand:**
1. `bash scripts/check-functions.sh` → all ✅ (local + live pre-flight/auth).
2. `curl -X POST "$(bash scripts/set-key.sh --get SUPABASE_URL)/functions/v1/cron-fetch-prices" -H "Authorization: Bearer $(bash scripts/set-key.sh --get CRON_SECRET)"`
   → ran twice against `cropket-dev`: `{"ok":true,"data":{"rows":4,"heatRows":11,"source":"agmarknet"}}`
   both times (idempotent - still exactly 15 `mandi_prices` rows for today after the
   second run). 4 real onion rows landed (Chandvad, Lasalgaon, Niphad, Pimpalgaon
   Baswant - Yeola's onion market didn't report today, so it kept its seeded price);
   tomato/potato stayed seeded, since Nashik reported neither to data.gov.in today.
   None of the 4 real rows got a same-day arrivals match, so all four kept
   `arrivals_tonnes = null` and no new heat row was written for them - exactly the
   "never guess" behaviour the honesty rule asks for, not a bug.
3. Wrong/missing `CRON_SECRET` → `401 UNAUTHENTICATED`, checked both ways.
**Tests:** `app/tests/unit/integrations/agmarknet.test.ts` (mock passes `DailyPrice`
and walks from history; date parsing both directions; a trailing-space market name
matches; ₹→paise; an unmatched market is dropped; arrivals only attach on a matching
date; a broken min>modal row is dropped, not written). `supabase/tests/heat_inputs.sql`
(30-day average; a lot within 50 km counts, one at 60 km doesn't; a null-arrivals
mandi/crop is left out entirely; `authenticated` can't call the function directly).
**Next / known gaps:**
- No pg_cron schedule - out of scope for the prototype (§9.5), run by hand for the demo.
- The Agmarknet arrivals API (`api.agmarknet.gov.in/v1/dashboard-data/`) is an
  undocumented internal endpoint behind their public site, not something data.gov.in
  or Agmarknet publish as a stable contract. It can change shape without notice -
  `parse.ts` validates its shape with zod and drops what it can't read rather than
  crashing, but if it ever goes away entirely, arrivals simply go to `null` everywhere
  (prices keep working) until someone finds a replacement.
- `real.ts` hardcodes Maharashtra's state id (20) and Nashik's district id (361) for
  the arrivals call, marked with a `ponytail:` comment - fine for a one-district pilot,
  needs a per-mandi lookup if a second district is ever onboarded.
- Next item: **2.4** Prices screen (`PriceHero`, `AdviceCard`, `FloorWarning`,
  `MandiList`, `MandiHeatmap`, `DataAge`) - the first screen that actually reads what
  this item writes.

### 2.4 Prices screen — 2026-09-17
**What it does:** the farmer-facing screen at `/farmer/prices` (was a placeholder) that shows
everything 2.1-2.3 built: today's headline price, a mandi heat map (or a coloured list offline /
with no MapTiler key), sell/hold advice with its "Why" reasons, and the reference-floor warning.
No new formulas - `advise()`, `referenceFloorPaise()`, `isBelowFloor()`, `heatColour()` were all
already built and tested in 2.2/2.3; this item is data plumbing (`services/prices.ts`) plus UI.
**The one new decision:** which mandi is the headline price (SPEC.md's wireframe shows one
number, not five). A highly perishable crop (tomato, `crop_rules.perishability` = 9) shows the
**nearest** mandi - time in a truck is the risk, not the price. Onion/potato (perishability 3)
show the **best price today**. No saved farmer GPS -> always best price, never a guessed
"nearest" (`pickHeroMandi()` in `services/prices.ts`). Distance is straight-line km
(`geo.ts`'s new `haversineKm()`) - marked `ponytail:` for 2.5's real ORS travel time to replace.
**A SPEC/CLAUDE conflict found and fixed:** SPEC.md §9.2 Phase 2 listed the advice "Why?" reasons
as **P1**, but §2.4 ("Show the Why? line from the signals that fired") and the §4.8 wireframe both
put it in the P0 advice card. Kept it P0 (built it) and fixed the §9.2 row to read "30-day price
chart" only, in the same commit (CLAUDE.md §0 rule 3).
**A `seed.sql` idempotency bug found and fixed along the way:** re-running `supabase/seed.sql`
after `cron-fetch-prices` (2.3) had already written a real, null-arrivals `agmarknet` price for
today crashed the seed's own `mandi_heat` insert (`ratio` computed on a null, hitting the
not-null column check) - `seed.sql`'s hand-rolled heat formula pre-dates 2.3's `mandi_heat_inputs()`
SQL function and was missing the same `arrivals_tonnes is not null` guard that function already
has. Added it to both sides of `seed.sql`'s query (today's row and the 30-day average), matching
`mandi_heat_inputs()` exactly. Without this, `CLAUDE.md`'s "seed data must be safe to run twice"
rule was silently broken the moment the real cron ran once.
**Files:** `supabase/migrations/20260917133249_mandi_latlng.sql` (new - generated `lat`/`lng`
columns on `mandis` and `profiles`, decoding PostGIS's `geography` type into plain numbers
PostgREST/MapLibre can use), `supabase/seed.sql` (the idempotency fix above),
`supabase/functions/_shared/domain/geo.ts` (+ `haversineKm()`), `app/tests/unit/domain/geo.test.ts`
(+3 tests), `app/src/services/prices.ts` (new - `useMarketData()` + `pickHeroMandi()`,
`buildAdviceInput()`, `latestPerMandi()`, `isDemoPrice()`), `app/tests/unit/services/prices.test.ts`
(new, 10 tests), `app/src/components/market/{PriceHero,AdviceCard,FloorWarning,MandiList,
MandiHeatmap}.tsx` (new), `app/src/routes/farmer/PricesPage.tsx` (new, replaces the
`PlaceholderPage` route), `app/src/app/router.tsx`, `app/src/locales/{en,hi,mr}.json`
(+`prices.*`, `advice.*`, `floor.*`, `heat.*`), `app/package.json` (+`maplibre-gl@6.10.0`, exact
version, approved by the user before installing), `app/src/lib/database.types.ts` +
`supabase/functions/_shared/database.types.ts` (regenerated).
**Mocked:** the rain signal in `AdviceCard` always shows `<DemoDataTag>` - `weather_daily` is
seeded, not a live forecast (the weather cron is out of prototype scope, CLAUDE.md §9.5).
`PriceHero`/`MandiList` show `<DemoDataTag>` only for a mandi/day whose price row is
`source != 'agmarknet'` (seeded history, or a keyless mock day) - a real `cron-fetch-prices` row
shows with no tag, per the honesty rule. The map and today's onion prices are real (MapTiler and
data.gov.in keys are both set on this laptop).
**Test by hand:**
1. `pnpm dev`, sign in as a seeded farmer, open "Today's price" from the home screen.
2. Onion: hero shows the highest-priced Nashik mandi today, with a ⬆/⬇ vs that mandi's own
   yesterday; the map shows 5 coloured markers + 📍; the list below repeats the same colours
   with the legend.
3. Tomato: hero shows the *closest* mandi to the farmer's saved location and says so; the advice
   card never offers more than 2 hold days (`crop_rules.max_hold_days = 2`).
4. Floor warning: in `psql`, inside a transaction, drop one mandi's today price below the 30-day
   p20 and reload - the warning appears; `rollback` after. The app never blocks the sale either way.
5. Offline: `pnpm build && pnpm preview`, DevTools → Offline, reload `/farmer/prices` - the map
   is replaced by the list, everything else renders from IndexedDB, and `<DataAge>` shows once
   the cached snapshot is older than 6 hours.
6. 360 px width, all three languages - no clipping, no missing translation.
**Tests:** `app/tests/unit/services/prices.test.ts` (`latestPerMandi`, `pickHeroMandi` - best
price for onion, nearest for tomato, best price when GPS is missing even for tomato,
`buildAdviceInput` ordering + null-arrivals handling, `isDemoPrice`), `app/tests/unit/domain/geo.test.ts`
(+`haversineKm`: zero for the same point, a known ~13.5 km Nashik pair, symmetric),
`app/tests/unit/locales.test.ts` (already covers the new keys - all pass).
**Bundle size note (not fixed here, pre-existing):** the main JS chunk was already 866.6 kB raw /
257.4 kB gzip *before* this item (checked with `git stash`) - well over CLAUDE.md's 200 KB
first-screen budget, from earlier milestones' dependencies. This item adds only ~14 kB raw
(~4 kB gzip) to that chunk; `maplibre-gl` (~1 MB) is `React.lazy`-loaded into its own chunk that
only downloads when the map actually renders (online + MapTiler key set), so it doesn't add to
the number above. The pre-existing overage is a separate, cross-cutting cleanup (likely
`@supabase/supabase-js`, full `lucide-react`, `dexie`, `qrcode.react`) - flagging it here rather
than fixing it silently, since it's outside this item's scope.
**Next / known gaps:**
- "Nearest mandi" is straight-line distance. **Next item: 2.5** `route-distance` (real ORS travel
  time when the key is set, else straight-line × 1.3) - swap `pickHeroMandi()`'s ranking key from
  `haversineKm` to real travel time there if a short bad road ever needs to beat a long good one,
  and build the Net-₹ comparator screen this same service data feeds into.
- No 30-day price chart (SPEC.md §9.2 Phase 2, now correctly marked P1).
- The main bundle's pre-existing 200 KB overage (above) - worth a dedicated look, not part of
  this item.

**Correction (2026-09-17, found hand-testing):** the line above claiming "the map ... [is] real"
was wrong - the map never drew tiles. `MandiHeatmap` mounted (attribution + coloured pins showed),
but the base map was blank, with the dev console warning `The file does not exist at
".../node_modules/.vite/deps/maplibre-gl-worker.mjs"`. **Root cause:** maplibre-gl 6 guesses its
tile-parsing worker's URL by resolving a relative path against its own `import.meta.url`
(`maplibre-gl/src/util/web_worker.ts`), which is only correct when the library is served straight
from `node_modules` - any bundler that moves it (Vite's dev cache, the production `/assets`
folder, the APK) makes that guess 404, and a worker `new Worker(url)` 404 fails silently (an
`error` event nobody listens to), not a thrown exception. Confirmed this broke the production
build too, not just dev: `dist/assets/` had no worker file before the fix. **Fix:** import the
worker through Vite (`maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url`) so Vite emits it as a
real file and hands back its real URL, and call maplibre's own `setWorkerUrl()` with it before any
`Map` is constructed; added `worker: { format: "es" }` to `vite.config.ts` since the worker uses
`import()` and is loaded as `{ type: "module" }`, which Vite's default `iife` worker format can't
bundle. **Files:** `app/src/components/market/MandiHeatmap.tsx`, `app/vite.config.ts`. **No unit
test added** - every Vitest test in this repo runs in the `node` environment (see `vite.config.ts`
`test.environment`), so nothing here can observe a browser Worker/bundler wiring bug; verified
instead with `pnpm build && ls dist/assets | grep worker` (empty before the fix, a
`maplibre-gl-worker-<hash>.js` file after) plus by hand in both `pnpm dev` and `pnpm preview`.
**Side effect:** the worker is now its own ~500 KB chunk, precached by the PWA's existing
`globPatterns` alongside the ~1 MB `MandiHeatmap` chunk (both already lazy/online-only) - rolls
into the pre-existing bundle-size gap noted above, not fixed here.

### 2.5 `route-distance` + Net-₹ comparator screen — 2026-09-17
**What it does:** answers the question 2.4 left open - "Where do you keep the most?" A new
`route-distance` Edge Function gets real road distance/time from OpenRouteService (24 h cache in
a new `route_cache` table) or a straight-line × 1.3 mock when `ORS_API_KEY` is missing, and a new
screen at `/farmer/lots/:id/compare` (reached from a button on the lot detail page) shows one row
per Nashik mandi, sorted by what the farmer actually keeps (`netRupee()`, already built and
tested in 2.2). Tapping a row opens transport/fees/weight-loss underneath, using a native
`<details>` disclosure - no bottom-sheet component needed. Mandis only for now: no 🏆
Cropket-buyer row and no "Sell on Cropket" button - real bids don't exist until 3.3, and an
invented Cropket price would be exactly the mock-shown-as-real thing CLAUDE.md §0 rule 10
forbids (decided with the user before building).
**A SPEC.md fix in the same commit (CLAUDE.md §0 rule 3):** §5.6's `route_cache` row was
`from_hash, to_hash, km, minutes, alternatives (jsonb), fetched_at`. Built instead with rounded
`from_lat/from_lng/to_lat/to_lng` (numeric(8,3), ~110 m buckets) - no hashing code needed, and
the table stays readable when debugging a distance - and no `alternatives` column, since
alternative routes only feed P2 risk-aware routing (§9.2), not built in the prototype. SPEC.md
§5.6 now describes the real shape.
**How it fits together:**
- `route_cache` (migration) - service-role only, same "no client access at all" shape as
  `escrows`/`escrow_events`/`payouts`. Only real ORS results are cached; a mock result is free to
  recompute, so caching it would freeze the "Demo data" tag in place after a key is added.
- `_shared/domain/schemas/route.ts` - `RouteRequest`/`RouteLeg` zod shapes.
- `_shared/domain/geo.ts` - new `straightLineRoute()` (haversine × 1.3, at a fixed 30 km/h rural
  speed for `minutes` - SPEC.md has no mock number for travel time, only distance, so this is a
  new assumption, called out as one). Shared by `integrations/ors/mock.ts` **and** the app's
  offline fallback (`services/routes.ts`), so the exact same number shows on screen whether the
  mock ran on the server or on the phone.
- `_shared/integrations/ors/` - `mock.ts`/`real.ts`/`index.ts`, same three-file adapter shape as
  `integrations/agmarknet` and `integrations/ai`. `real.ts` makes one ORS Matrix API call for all
  destinations at once (not N directions calls) and is the one place that flips `{lat,lng}` to
  ORS's `[lng,lat]` order, with a comment - the same trap `geo.ts`'s `toPointWKT()` already
  documents. A set key whose call fails 502s (`ROUTE_UNAVAILABLE`) - never a quiet fallback to
  mock (CLAUDE.md §5 honesty rule).
- `route-distance/index.ts` - thin: `requireRole(farmer)` → parse → (real mode only) read
  `route_cache` for anything cached inside the last 24 h → call the adapter for what's missing →
  upsert those rows → reply in the caller's `to[]` order.
- `services/routes.ts` (new) - `useRouteDistances(from, to)`, `staleTime` 24 h to match the
  server cache. Lets a network error throw (never caught) so TanStack Query's saved copy stays on
  screen instead of being overwritten by a guess; only when there is truly nothing yet (first
  load, offline, no farmer location) does it compute the same `straightLineRoute()` fallback.
- `services/prices.ts` - `fetchMarketSnapshot()` now also reads `crop_rules.transit_loss_pct` and
  the cheapest seeded transporter (`transporters` order by rate asc limit 1 - one flat rate
  whatever the load, marked `ponytail:`, real vehicle choice arrives with truck booking in Phase
  4 P1). New pure `buildComparisonRows()` calls `netRupee()` once per mandi and sorts by
  `youKeepPaise` - not clamped at zero, same as `netRupee()` itself, so a losing row is shown, not
  hidden. New `mandisWithCoords()` helper (mandi has a saved lat/lng) is shared by
  `pickHeroMandi()` (small simplification, same behaviour) and the new comparator.
**Mocked:** road distance, only when `ORS_API_KEY` is empty (it is currently **set** on this
laptop, so the screen runs on real ORS distances/times day to day - confirmed by hand below).
Everything else (prices, transit loss, transporter rate) was already real-or-mock from 2.1-2.4.
**Tested by hand against `cropket-dev`** (curl, farmer test number `9090910001`/`910001`):
1. Real call (Nashik → Lasalgaon/Niphad coordinates) → `200`, real km/minutes,
   `source: "ors"` - cross-checked against Google Maps' road distance (56.65 km / 33.08 km, both
   within a few km of the map's own numbers).
2. `route_cache` had 2 rows afterward with the right rounded coordinates.
3. The exact same call repeated → identical numbers, **same `fetched_at`** - proves the cache was
   read, not a second ORS call made. Test rows deleted afterward so `cropket-dev` stays clean.
4. Missing body field → `400 VALIDATION_FAILED`. No `Authorization` header → `401`.
5. `bash scripts/check-functions.sh` - config block, CORS pre-flight and auth-check all ✅.
**Manual UI check not done this session:** no browser tool was available, so the screen itself
(360 px width, all three languages, `pnpm build && pnpm preview` + DevTools Offline) was not
opened and looked at - only typechecked, linted, unit-tested and built successfully. Please do
that pass by hand before the next demo.
**Files:** `supabase/migrations/20260917141016_route_cache.sql` (new),
`supabase/functions/_shared/domain/schemas/route.ts` (new),
`supabase/functions/_shared/domain/geo.ts` (+`straightLineRoute`, `ROAD_DETOUR_FACTOR`,
`RURAL_SPEED_KMH`), `supabase/functions/_shared/integrations/ors/{index,mock,real,types}.ts`
(new), `supabase/functions/route-distance/index.ts` (new), `supabase/config.toml`
(`[functions.route-distance]`), `app/src/services/routes.ts` (new), `app/src/services/prices.ts`
(+`transitLossPct`, `cheapestTransporter`, `buildComparisonRows`, `mandisWithCoords`),
`app/src/routes/farmer/ComparePage.tsx` (new), `app/src/routes/farmer/LotDetailPage.tsx` (+the
"Where do you keep the most?" button), `app/src/app/router.tsx` (+the `/compare` route),
`en.json`/`hi.json`/`mr.json` (+`compare.*`), SPEC.md §5.6 (route_cache fix).
**Tests:** `app/tests/unit/domain/geo.test.ts` (+`straightLineRoute`: detour factor, rural-speed
minutes, zero for the same point), `app/tests/unit/integrations/ors.test.ts` (new - mock legs
pass the same `RouteLeg` schema real.ts must pass, farther = more km),
`app/tests/unit/services/prices.test.ts` (+`buildComparisonRows`: best-you-keep row first even
when a farther mandi's price is higher, a negative you-keep is shown not hidden, `isDemo` from
either a mock price or a mock distance, transport+fees+loss+youKeep sums back to gross;
+`mandisWithCoords`), `supabase/tests/rls_market.sql` (+`route_cache` has RLS on, `authenticated`
can neither select nor insert it). `pnpm lint && pnpm typecheck && pnpm test` (235 tests, all
green) and `bash scripts/test-sql.sh` both pass.
**Bundle size note (pre-existing, not fixed here):** the main JS chunk grew from 866.6 kB raw /
257.4 kB gzip (2.4's number) to 889.9 kB raw / 263.9 kB gzip - this item's own share is ~23 kB
raw / ~6.5 kB gzip of that. The pre-existing overage past CLAUDE.md's 200 KB budget is still the
separate cleanup 2.4 flagged, not part of this item.
**Next / known gaps:**
- **Next item: 3.1** `buyer_kyc` + `kyc-verify` (mock) + KYC screen + admin approve +
  `VerifiedBadge` - the start of M3, the buyer marketplace.
- No manual UI/offline/360px pass this session (see above) - worth doing before the demo.
- The 🏆 Cropket-buyer row from SPEC.md §4.9's wireframe is still missing on purpose; add it in
  3.5 once a real top bid exists to price it from.

### UI polish: tap feedback + purposeful motion — 2026-09-17
**What it does:** Not a milestone item - a cross-cutting refinement of the screens M0-M2 already
shipped, since none of them had any transition at all (buttons and cards just snapped). One rule
in `globals.css`, keyed off the `rounded-button`/`rounded-card` utility classes every screen
already uses, gives every existing button and card link a 150 ms press-scale + colour transition
for free - no per-screen edits needed for that part. A `fade-slide-in` keyframe (also added once)
is used in the handful of spots where something state-changes into view rather than always being
on screen: the offline banner and the "sync failed / waiting" strip ease in instead of popping,
the sync header's "⟳" now actually spins while something is pending, the bottom nav's active tab
colour-transitions instead of snapping, each new question in onboarding's chat-style transcript
eases in as it appears (the one screen that's explicitly a sequence), and the A/B/C grade badge
on the scan result screen fades/settles in on reveal (the pay-off moment of a scan). `BigTile`
needed its own `has-[a:active]:scale-[0.97]` since its tap target is a link laid over a div, so
the global button rule can't reach it. SPEC.md §6.1's "very little motion, only on state change"
was the brief throughout - nothing here is decorative, and the existing global
`prefers-reduced-motion` rule in `globals.css` already collapses all of it to ~0 ms, so no new
per-animation media query was needed.
**Files:** `app/src/styles/globals.css`, `app/src/components/shell/{NetworkBanner,SyncTrouble,
SyncStatus,BottomNav}.tsx`, `app/src/components/common/BigTile.tsx`,
`app/src/routes/onboarding/OnboardingPage.tsx`, `app/src/routes/farmer/ScanResultPage.tsx`. No
new package, no new file, no folder change.
**Mocked:** nothing.
**Test by hand:** at 360 px, in all three languages -
1. `pnpm dev` → farmer home: tap a tile → it presses in slightly; tap a bottom-nav tab → the
   colour eases instead of snapping.
2. DevTools → Offline → the 🟧 strip eases in under the header instead of popping; back online, it
   eases back out.
3. Onboarding → each new question fades/slides in as you answer the one before it.
4. Scan a crop → on the result screen, the grade badge settles in rather than appearing instantly.
5. If anything is queued in the outbox, the header's "⟳" spins until it clears.
6. DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → repeat 1-4, everything above
   is near-instant, nothing is missing (no animation-only content).
**Tests:** none new - this is CSS/markup-only motion with no branching logic (`CLAUDE.md` §6 "no
UI snapshot tests"). `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass (242 tests,
unchanged - this item added no test-worthy logic). Ran the impeccable mechanical detector over
the changed files: no findings.
**Next / known gaps:**
- Buyer/FPO/admin homes get only the free global button-press feedback - they're single-screen
  stubs until M3 gives them real content worth animating.
- No manual on-device check this session (no browser/Playwright available here yet - same gap
  M2.5's handoff already flagged); do the DevTools pass above, and the real-device Slow-3G pass,
  before the demo.

### App Redesign: Bold Agritech Vanguard Mobile UI — 2026-09-19
**What it does:** Complete visual transformation across the entire Cropket application, moving boldly beyond flat "mandi-slip" aesthetics into a vibrant, modern "Agritech Vanguard" mobile design language. Elevates visual presence with deep emeralds (`#126835`), glowing gold haldi, rich cobalt, vivid pass greens, and warm saffron accents. Introduces modern elevation hierarchies (`shadow-card`, `shadow-dock`, `shadow-float`, `shadow-premium`, `shadow-hero`, `shadow-glow-leaf`, `shadow-glow-haldi`), high-impact typography (44px hero numerals in Baloo 2, 26px titles, 18px body in Mukta), modern app launcher blocks on the Farmer dashboard, futuristic HUD viewfinder brackets and concentric shutter on the camera, showstopping 60px grade shield emblems, radiant headline market price cards with tabular currency formatting, receipt-style Net-₹ deductions, and glassmorphic backdrop-blur navigation.
**Compliance & Verification:**
- Retains 100% of rural accessibility: high outdoor sunlight contrast (AA compliance on all text against `--color-surface` and tinted backdrops), large 48–56px minimum touch targets, Devanagari typography preservation, audio voice affordances (`VoiceButton`) on all key cards and numbers.
- Zero hard-coded text: all UI copy strictly flows through `t()` from `app/src/locales/*.json`.
- Impeccable mechanical detector: 0 anti-patterns across `app/src`.
- Verification suite: `pnpm lint` (0 errors), `pnpm typecheck` (passed), `pnpm test` (32 test files, 242 tests passed), `pnpm build` (clean 7.3s production build with PWA manifest and service worker).
**Files:**
- Tokens & styles: `app/src/styles/tokens.css`, `app/src/styles/globals.css`
- Components: `app/src/components/camera/SmartFrameCamera.tsx`, `app/src/components/common/{BigTile,DemoDataTag,NumberPad}.tsx`, `app/src/components/lot/{GradeBadge,GradeBreakdown,LotCard,QRLabel}.tsx`, `app/src/components/market/{PriceHero,AdviceCard,FloorWarning,MandiList}.tsx`, `app/src/components/shell/{AppHeader,BottomNav,LanguageSwitch}.tsx`, `app/src/components/voice/VoiceButton.tsx`
- Routes: `app/src/routes/welcome/WelcomePage.tsx`, `app/src/routes/login/LoginPage.tsx`, `app/src/routes/onboarding/StepInputs.tsx`, `app/src/routes/farmer/{FarmerHome,ScanResultPage,LotsPage,LotDetailPage,NewLotPage,PricesPage,ComparePage,MePage}.tsx`, `app/src/routes/buyer/BuyerHome.tsx`, `app/src/routes/fpo/FpoHome.tsx`, `app/src/routes/admin/AdminHome.tsx`, `app/src/routes/PlaceholderPage.tsx`
**Mocked:** unchanged.
**Tests:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass cleanly (32 test files, 242 tests passing, 0 lint errors, bundle built). Impeccable detector passed with 0 findings.
**Next / known gaps:**
- Ready to proceed to M3 (Buyer marketplace, KYC verification, live bidding).

## 🔑 Keys and 🧰 tools still needed

<!-- Claude Code keeps this list current. Remove a line when it's done. -->

- `cloudflared` — not installed on this laptop, so the cloud `grade` function can't reach the AI
  service running locally yet (§9.5 "Simple setup"). Run in your terminal:
  `sudo pacman -S --needed cloudflared`, then `cloudflared tunnel --url http://localhost:8000` and
  save the printed `https://…trycloudflare.com` address with
  `bash scripts/set-key.sh AI_SERVICE_URL` (the value saved on this laptop from 1.3 is stale).
  Once that's done, remove `ai` from `INTEGRATIONS_MOCK` (or clear it) so grading uses the real
  `/grade` route built in 1.4 instead of the mock.
- `ALLOWED_ORIGINS` is now set (`https://cropket-dev.vercel.app,http://localhost:5173` - found
  while verifying 3.1's `kyc-verify` deploy, this note was stale). One side effect:
  `scripts/check-functions.sh`'s live OPTIONS check sends no `Origin` header, so every function
  now fails it with "OPTIONS answered 204 but sent no access-control-allow-origin header" - this
  is correct CORS behaviour (`corsHeaders()` in `_shared/http.ts` only echoes an origin that's on
  the allow-list), not a function bug. Confirmed by hand with
  `curl -X OPTIONS .../kyc-verify -H "Origin: http://localhost:5173"` -> the header comes back
  fine. `check-functions.sh` itself needs a `-H "Origin: <one of ALLOWED_ORIGINS>"` on its probe to
  stay useful now that this is set; not fixed here (script change, out of this item's scope).
- `APP_URL` — 4.7 added it to `scripts/set-key.sh`'s `KEYS` list (it builds a driver trip link's
  full URL), but it was never actually set. Found while hand-testing 4.8: `shipments-create` fails
  closed with `SETUP_MISSING_KEY APP_URL`, so a farmer can't make a driver link today. Run in your
  terminal: `bash scripts/set-key.sh APP_URL` (the web app's own URL, e.g.
  `https://cropket-dev.vercel.app` or `http://localhost:5173` for local testing), then
  `supabase secrets set --env-file supabase/functions/.env`.

### Adapt — Responsive layout for laptops, bigger phones, big screens — 2026-09-19

**What it does:** Adapts every screen to look great on tablets, laptops, and large displays — not just on 320–448px phones.

**Layout change:**
- `AppShell` switches from a narrow centred phone column to a two-column layout on `md+` (≥768px): a left sidebar + wider content column. On mobile it's unchanged.
- New `SideNav` component: hidden on mobile, shows as a 64px icon rail on md, expands to a 220px labelled sidebar on lg. Carries the brand mark, nav links (same set as BottomNav), and sync status.
- `AppHeader` hides its brand on md+ (sidebar has it); stays slim with just the right-side controls.
- `BottomNav` now has `md:hidden` — only shows on mobile.

**Content pages:**
- `FarmerHome`: tiles switch from 2-column to 4-column on `lg+`.
- `LotsPage`: lot cards go from a single stack to a 2-column grid on `lg+`.
- `PricesPage`: two-column layout on `lg+` — price hero + advice left, heatmap + mandi list right.
- `ComparePage`: two-column on `lg+` — lot context panel left, mandi cards right.
- `LotDetailPage`: two-column on `lg+` — lot summary + QR left, action buttons right.
- `WelcomePage`: card widens to `max-w-md/lg`, emblem grows, ambient glows scale up.
- `LoginPage`: centres vertically on md+, widens to `max-w-md`.
- `OnboardingPage`: widens to `max-w-lg` on md+.

**Files touched:**
- `app/src/components/shell/AppShell.tsx` — two-column flex row on md+
- `app/src/components/shell/SideNav.tsx` — **new** component
- `app/src/components/shell/AppHeader.tsx` — brand hidden on md+
- `app/src/components/shell/BottomNav.tsx` — md:hidden
- `app/src/routes/farmer/FarmerHome.tsx` — 4-col grid on lg+
- `app/src/routes/farmer/LotsPage.tsx` — 2-col grid on lg+
- `app/src/routes/farmer/LotDetailPage.tsx` — 2-col on lg+
- `app/src/routes/farmer/PricesPage.tsx` — 2-col on lg+
- `app/src/routes/farmer/ComparePage.tsx` — 2-col on lg+
- `app/src/routes/welcome/WelcomePage.tsx` — wider card on md+
- `app/src/routes/login/LoginPage.tsx` — wider + centred on md+
- `app/src/routes/onboarding/OnboardingPage.tsx` — wider on md+
- `app/src/locales/{en,hi,mr}.json` — added `nav.sidebarLabel`

**Mocked:** nothing — purely layout/CSS changes, no data or logic changes.

**Test by hand:**
1. `pnpm dev` → open in a laptop browser at ≥768px → should see the left sidebar rail (icon-only), wider content area, no bottom nav.
2. Resize to 1024px+ → sidebar should expand to show labels next to icons.
3. Resize to <768px → bottom nav returns, sidebar disappears, layout is identical to before.
4. Check FarmerHome at lg+ — 4 tiles in a row.
5. Check LotsPage at lg+ — 2 lot cards side by side.
6. Check PricesPage at lg+ — price hero on left, mandi list on right.
7. WelcomePage / LoginPage / Onboarding — centred card, bigger on wider screens.

**Next:** Modern Consumer App Layout (Uber / Swiggy / Flipkart inspired).

### Modern Consumer App Redesign — Uber / Swiggy / Flipkart inspired — 2026-09-19

**What it does:** Replaced the boxy, toy-like "card-like" design (card-itis: isolated chunky floating boxes everywhere) with modern consumer app design patterns inspired by Uber, Swiggy, Flipkart, and Zomato.

**Key Changes:**
1. **Farmer Home (`FarmerHome.tsx`):**
   - **Context Bar:** Greeting with farmer name, registered crop, village location tag, and audio button.
   - **Hero Action Banner (Uber "Where to?" / Swiggy Instant Delivery):** Elevates crop scanning as the core action with prominent headline, description, 56px high-contrast CTA button, and camera viewfinder anchor.
   - **Quick-Service Pods (`BigTile.tsx`):** Replaced 4 chunky floating squares with a 3-pod service grid (My Lots, Mandi Rates, Digital Khata) featuring category-tinted squircle icons, clean typography, live count/price badges, and audio buttons.
   - **Live Market Pulse Ticker:** A live price glance showing today's best mandi price for the farmer's crop with tabular numbers and daily trend pill (+₹150).
   - **Recent Activity Section:** Shows the farmer's latest active lot or a clean scan CTA.
2. **Unified Divided Lists (`LotCard.tsx`, `LotsPage.tsx`, `MandiList.tsx`):**
   - Replaced fragmented floating card boxes with unified, edge-to-edge list containers with hairline dividers (`divide-y divide-line/60`).
   - `LotCard`: Crop emblem, bold tabular quantity, QR label, status pill, grade badge, and sleek `ChevronRight` affordance.
   - `MandiList`: Unified market sheet with heat status dot, tabular numerals, and integrated legend.
   - `LotsPage`: Header with lot count badge and quick "Scan Now" action.
3. **Streamlined Financial Cards (`PriceHero.tsx`, `AdviceCard.tsx`, `FloorWarning.tsx`):**
   - Removed artificial wavy SVG clutter and 2px thick borders in favor of crisp 1px borders, tabular numerals, and clear trend pills.
4. **Shell & Navigation (`AppHeader.tsx`, `BottomNav.tsx`):**
   - Refined to sleek hairline borders and clean active states.
5. **Translations (`en.json`, `hi.json`, `mr.json`):**
   - Added matching keys for all new action labels and subheadings across English, Hindi, and Marathi.

**Files touched:**
- `app/src/routes/farmer/FarmerHome.tsx`
- `app/src/components/common/BigTile.tsx`
- `app/src/components/lot/LotCard.tsx`
- `app/src/routes/farmer/LotsPage.tsx`
- `app/src/components/market/PriceHero.tsx`
- `app/src/components/market/MandiList.tsx`
- `app/src/routes/farmer/PricesPage.tsx`
- `app/src/components/market/AdviceCard.tsx`
- `app/src/components/market/FloorWarning.tsx`
- `app/src/components/shell/AppHeader.tsx`
- `app/src/components/shell/BottomNav.tsx`
- `app/src/components/shell/SyncBar.tsx`
- `app/src/locales/en.json`
- `app/src/locales/hi.json`
- `app/src/locales/mr.json`
- `DESIGN.md`

**Verification:**
- Impeccable mechanical detector: 0 anti-patterns.
- `pnpm --dir app lint`: 0 errors (0 hardcoded text).
- `pnpm --dir app typecheck`: 0 errors.
- `pnpm --dir app test`: 32 files passed, 242 tests passed.
- `pnpm --dir app build`: production build succeeded.

**Next:** M3 buyer marketplace.

### Camera Viewport & Floating HUD Redesign — 2026-09-19
**What it does:**
- Made the camera frame cover 100% of the viewport between the top `AppHeader` (64px) and bottom `BottomNav` (68px), completely eliminating vertical scrolling on mobile.
- Embedded all scanning controls as floating layers above the live camera video with directional contrast scrims:
  - Top floating bar: "Scan crop" header with glassmorphic Back button, title, `VoiceButton`, and multi-crop selector pills.
  - Center HUD: Ambient light indicator ("✅ Good light" / "⚠ Too dark") and framing reticle with ₹10 reference coin guide.
  - Bottom floating bar: Photos taken indicator pill ("Photo X of 3" with glowing progress dots), 80px tactile shutter button, and flashlight toggle.
- Adapted `AppShell` so that on `/farmer/scan` it allocates full height without scrollbars, reserving exact bottom padding on mobile for `BottomNav`, while preserving standard layout and scroll behavior on all other routes.
**Files touched:**
- `app/src/components/shell/AppShell.tsx`
- `app/src/components/shell/AppHeader.tsx`
- `app/src/components/camera/SmartFrameCamera.tsx`
- `app/src/routes/farmer/ScanPage.tsx`
**Verification:**
- Impeccable mechanical detector: 0 anti-patterns (`[]`).
- `pnpm --dir app lint`: 0 errors (0 hardcoded text).
- `pnpm --dir app typecheck`: 0 errors.
- `pnpm --dir app test`: 32 files passed, 242 tests passed.
- `pnpm --dir app build`: production build succeeded.
**Next:** M3 buyer marketplace.

### Mandi Price pg_cron Automation & Retry (Option C) — 2026-09-19
**What it does:**
- Scheduled automated daily mandi price top-up via `pg_cron` and `pg_net` to call the `cron-fetch-prices` Edge Function:
  - **Primary fetch**: runs daily at **18:10 IST** (`12:40 UTC`, cron `40 12 * * *`), immediately after APMC mandis upload evening auction prices at ~18:00 IST.
  - **Retry fetch**: runs daily at **18:20 IST** (`12:50 UTC`, cron `50 12 * * *`) with a guard condition `WHERE NOT EXISTS (SELECT 1 FROM mandi_prices WHERE date = (now() AT TIME ZONE 'Asia/Kolkata')::date)`. If the 18:10 fetch succeeded, the retry skips cleanly; if the initial fetch failed or upstream data was delayed/empty, it retries 10 minutes later.
- Created `public.trigger_cron_fetch_prices()` helper function (`SECURITY DEFINER`, search_path secured, granted to postgres and service_role) that retrieves `functions_url` and `cron_secret` from Supabase `vault.decrypted_secrets` and sends an HTTP POST via `net.http_post()` with a 30s timeout.
- Added `scripts/sync-vault-secrets.sh` to populate `functions_url` and `cron_secret` in `vault.secrets` via `psql`.
**Files touched:**
- `scripts/sync-vault-secrets.sh`
- `supabase/migrations/20260919161110_cron_fetch_prices.sql`
- `supabase/tests/cron_fetch_prices.sql`
- `app/src/lib/database.types.ts`
- `supabase/functions/_shared/database.types.ts`
- `docs/progress.md`
**Verification:**
- `bash scripts/test-sql.sh`: all 6 test suites (44 pgTAP tests) passed.
- Tested `trigger_cron_fetch_prices()` live in Supabase: invoked Edge Function, returned HTTP 200 with real Agmarknet data (`{"rows":5,"heatRows":10,"source":"agmarknet"}`).
- Tested retry guard: when today's row exists, retry query returns 0 rows and does not invoke HTTP.
- `pnpm --dir app lint`: 0 errors.
- `pnpm --dir app typecheck`: 0 errors.
- `pnpm --dir app test`: 32 test files passed, 242 unit tests passed.
**Next:** M3 buyer marketplace.
### Branding PNG replacement — 2026-09-20
**What it does:** Replaces the placeholder wheat-glyph SVG icon and plain-text "Cropket" headings with the real brand assets — a full-colour logo PNG and a stylised CropKet wordmark PNG — everywhere in the app.

**What changed:**

*Icons & favicon (all under `app/public/icons/` + `app/public/favicon.ico`):*
- Generated 8 resized logo variants: 16, 32, 48 px (favicon sizes), 192, 512 px (PWA), 180 px (apple-touch-icon), and maskable 192/512 (logo centred at 80% on a `#F3F6F0` bg so any OS mask shape looks good).
- Generated a multi-res `favicon.ico` (16 + 32 + 48).
- Deleted the old hand-drawn wheat SVGs (`icon.svg`, `icon-maskable.svg`) — replaced entirely by PNGs.

*HTML / PWA manifest:*
- `app/index.html`: updated favicon `<link>` tags to point at the new PNG + `.ico` files; added explicit `sizes="180x180"` on apple-touch-icon.
- `app/vite.config.ts`: added `icon-maskable-192.png` (192 px maskable) to the PWA manifest icons array — Android prefers this size for the home-screen grid.

*React components:*
- Created `app/src/components/common/AppLogo.tsx` — a small reusable component that renders the logo PNG + optional wordmark PNG side by side (props: `showText`, `logoClassName`, `textClassName`, `className`). Used in header and sidebar.
- `AppHeader.tsx`: replaced the 🌾 emoji + `t("app.name")` text with `<AppLogo>` (mobile only; md+ sidebar unchanged). Removed the now-unused `useTranslation` import.
- `SideNav.tsx`: replaced the 🌾 + text block with `<AppLogo showText={false}>` on the narrow md rail and `<AppLogo>` (logo + wordmark) on the lg expanded sidebar, using two responsive `<span>` wrappers.
- `WelcomePage.tsx`: replaced the 🌾 floating emblem with the logo PNG (animation + glow ring kept). Replaced the `<h1>` text heading with the wordmark PNG; the original `<h1>` is still rendered as `sr-only` so screen readers announce the page title correctly.
- `FarmerHome.tsx`: replaced the 🌾 greeting bar icon with the logo PNG at 48×48.
- `OnboardingPage.tsx`: replaced the 🌾 question-step badge with the logo PNG at 32×32.

*Source PNGs:* copied from project root to `app/src/assets/` (Vite-imported, cache-busted on build). The originals at the repo root were kept.

**Mocked:** nothing — these are pure static assets, no API or DB involved.

**Test by hand:**
1. `pnpm dev` → Welcome screen: logo animates with float + glow; wordmark PNG below it; tagline and language buttons unchanged.
2. Mobile width (360 px): AppHeader shows logo + wordmark. Switch to ≥ 768 px: header brand disappears, sidebar shows logo-only icon on the rail, logo + wordmark text on the expanded sidebar.
3. `/farmer` home: logo appears in the greeting bar next to the farmer's name.
4. `/onboarding` (first login): logo appears as the question-step badge.
5. Browser tab icon: the Cropket logo (not the old wheat glyph). Bookmarking on iOS: the logo on `#F3F6F0` background.
6. DevTools → Application → Manifest: all four icon variants listed (any-192, any-512, maskable-192, maskable-512).
7. `pnpm build && pnpm preview` → install the PWA → home-screen icon is the maskable logo.

**Files touched:**
- `cropket-logo.png` → `app/src/assets/cropket-logo.png` (copied)
- `cropket-text.png` → `app/src/assets/cropket-text.png` (copied)
- `app/public/favicon.ico` (new)
- `app/public/icons/icon-16.png`, `icon-32.png`, `icon-48.png` (new)
- `app/public/icons/icon-192.png`, `icon-512.png` (replaced)
- `app/public/icons/apple-touch-icon.png` (replaced, 180×180)
- `app/public/icons/icon-maskable-192.png` (new)
- `app/public/icons/icon-maskable-512.png` (replaced)
- `app/public/icons/icon.svg`, `icon-maskable.svg` (deleted)
- `app/index.html`
- `app/vite.config.ts`
- `app/src/components/common/AppLogo.tsx` (new)
- `app/src/components/shell/AppHeader.tsx`
- `app/src/components/shell/SideNav.tsx`
- `app/src/routes/welcome/WelcomePage.tsx`
- `app/src/routes/farmer/FarmerHome.tsx`
- `app/src/routes/onboarding/OnboardingPage.tsx`

**Verification:**
- `pnpm --dir app typecheck`: 0 errors.
- `pnpm --dir app lint`: 0 errors.
- `pnpm --dir app test`: 32 files passed, 242 tests passed.

**Fix applied after commit (lint):** The `no-hard-coded-text` ESLint rule flagged `alt="CropKet"` in `AppLogo.tsx` and `WelcomePage.tsx`. Fixed by replacing with `alt={t("app.name")}` in both; `AppLogo` also needed `useTranslation` added. Committed separately as `fix(lint): use t("app.name") for wordmark alt text`.

**Next:** M3 buyer marketplace.

### 3.1 Buyer KYC (mock) + admin approve + `VerifiedBadge` — 2026-09-22

**What it does:** the first M3 item and the reason M3 can be demoed at all - 3.3's `place_bid` RLS
will read `profiles.kyc_status = 'verified'`, so a buyer needs a way to reach that state on demand.
A buyer fills in business name, GSTIN and PAN at `/buyer/kyc`; the mock verify rule (decided with
the user) checks whether the PAN matches the PAN embedded in the GSTIN (a real GSTIN's characters
3-12 *are* the holder's PAN) - a match verifies instantly, a mismatch goes to an admin queue at
`/admin/kyc` where an admin approves or rejects. Either way a `buyer_kyc_sync` trigger mirrors the
result into `profiles.kyc_status` in the same transaction, so nothing can leave the two tables out
of sync. `VerifiedBadge` shows next to a verified buyer's name; `BuyerHome` shows a yellow "Finish
KYC to place bids" banner until then, per `SPEC.md` §4.10's wireframe.
**How it fits together:**
- `buyer_kyc` (migration) - `select-your-own` for a buyer, `select`+`update(status)` for an admin
  only (RLS subquery on the caller's own `profiles` row, same trust boundary `profiles_select_own`
  already grants - no helper function, no widened `profiles` RLS). No insert grant at all: only the
  service role, inside `kyc-verify`, ever creates a row - same shape as `grade_results`.
- `buyer_kyc_sync()` trigger (`before insert or update`, `security definer`) - sets `verified_at`
  and writes `profiles.kyc_status` whichever caller wrote the row (the function's service-role
  insert, or an admin's column-grant update), so the sync lives in one place instead of two.
- `_shared/domain/schemas/kyc.ts` - `KycRequest`/`KycResult`, `GSTIN_RE`/`PAN_RE`, and
  `panFromGstin()` (chars 3-12), shared by the schema, the mock adapter and its test.
- `_shared/integrations/digilocker/` - `mock.ts`/`real.ts`/`index.ts`, the same three-file adapter
  shape as `ors`/`ai`/`agmarknet`. `real.ts` is a stub that `requireEnv("DIGILOCKER_API_KEY")`s
  then throws `KYC_UNAVAILABLE` - never built for the prototype (`SPEC.md` §9.5), and `real.ts`
  failing loud rather than quietly acting like the mock is the same honesty rule `ors`/`ai` follow.
- `kyc-verify/index.ts` - thin, same shape as `route-distance`: `requireRole(buyer)` → parse →
  block a resubmit once already `verified` (`409 KYC_ALREADY_VERIFIED`) → call the adapter →
  upsert `buyer_kyc`. The trigger, not this file, writes `profiles.kyc_status`.
- `services/kyc.ts` - `useMyKyc()`/`submitKyc()` for the buyer, `usePendingKyc()`/`setKycStatus()`
  for the admin queue. Online-only by design (`SPEC.md` §10.3 lists KYC alongside money and
  bidding) - `submitKyc()` is a direct `callFunction()` call, never queued to the outbox
  (`OUTBOX_KINDS` already excludes it). `KycStatus` is a hand-written literal union because
  `buyer_kyc.status` is `text` + `check`, not a Postgres enum (same reason `lots.ts` needs
  `LotStatus` from a real enum but `grading.ts` doesn't bother - here the union is needed purely so
  the admin screen's `t(\`kyc.status.${status}\`)` template key type-checks, GradeBadge's `Grade`
  pattern).
- `KycPage.tsx` (`/buyer/kyc`) - three states (no record/rejected → form, pending → status card,
  verified → badge + masked PAN), submit disabled offline with a reason (same pattern
  OnboardingPage's last step uses).
- `AdminKycPage.tsx` (`/admin/kyc`) - queue sorted pending-first, Approve/Reject on each pending
  row, `<DemoDataTag>` when `source === 'mock'`. Linked from `AdminHome`'s "coming soon" card,
  which the link replaced. `BuyerHome` gets the KYC banner + badge.
- `VerifiedBadge` (`components/common/`, not a new `trade/` folder - `DemoDataTag.tsx`'s own
  comment already named it as a future occupant of `common/`).
**A route-guard note, not a bug:** `/admin/kyc` sits inside the existing `RequireRole
roles={["admin","nbfc"]}` block (`SPEC.md` §3.1 groups the admin routes that way), but
`buyer_kyc`'s RLS only admits `role = 'admin'` - an `nbfc` user would see an empty queue with no
error. No `nbfc` account exists in the prototype, so this is unverified in practice; worth a real
look whenever an `nbfc` user shows up (loans, later).
**Mocked:** the KYC verdict (`INTEGRATIONS_MOCK` needs no entry - `DIGILOCKER_API_KEY` was never
set, so `isMock()` is true from the missing-key path alone, same as `ors`/`ai` on this laptop).
**A SPEC.md fix in the same commit** (`AGENTS.md` §0 rule 3): added `DIGILOCKER_API_KEY` to §7.2's
secrets table (was missing even though `kyc-verify`'s row already named "DigiLocker / GST adapter
(mock)").
**Tested by hand against `cropket-dev`** (curl + `psql`, buyer test number `9090910002`/`910002`,
admin `9090910003`/`910003` - both existed already from an earlier session at `role='farmer'`,
switched to `buyer`/`admin` for this; farmer `9090910001`/`910001` for the wrong-role check):
1. No `Authorization` → `401 UNAUTHENTICATED`. Farmer JWT → `403 FORBIDDEN`. Malformed GSTIN as
   buyer → `400 VALIDATION_FAILED`.
2. Matching PAN (`27ABCDE1234F1Z5` + `ABCDE1234F`) → `200 {status:"verified",source:"mock"}`;
   confirmed in `psql`: `profiles.kyc_status` flipped to `verified` and `buyer_kyc.verified_at` was
   set by the trigger.
3. Resubmit after verified → `409 KYC_ALREADY_VERIFIED`.
4. `bash scripts/test-sql.sh buyer_kyc` - all 7 pgTAP checks green (own-row isolation, no insert,
   no self-verify even via the column grant - silently 0 rows updated by RLS, not an exception, so
   the test checks the row is unchanged rather than using `throws_ok`; admin sees every row; admin
   approve → trigger sync). `bash scripts/test-sql.sh` (full suite) - all green, nothing else broke.
5. `bash scripts/check-functions.sh` - config block ✅; the live CORS check fails for `kyc-verify`
   the same way it now fails for every other function (see the 🔑 Keys note above) - confirmed with
   an explicit `Origin` header that CORS itself is fine.
6. Test rows deleted / reset afterward (`buyer_kyc` row removed, `profiles.kyc_status` set back to
   `pending`) so `cropket-dev` stays clean for 3.1b's manual pass - the buyer/admin **profiles**
   (role only) were kept, since M3 will keep needing a buyer and an admin test account.
**Manual browser/offline/360px pass:** not done this session (no browser tool available, same gap
earlier M2/M3 handoffs already flagged) - only typechecked, linted, unit-tested, built, and the
impeccable detector run (0 anti-patterns) on every file touched. Please do the pass in
`SPEC.md`'s Verification list (submit, pending, admin approve/reject, verified badge, offline
disabled-button) by hand before the demo.
**Files:** `supabase/migrations/20260922120000_buyer_kyc.sql` (new),
`supabase/functions/_shared/domain/schemas/kyc.ts` (new),
`supabase/functions/_shared/integrations/digilocker/{index,mock,real,types}.ts` (new),
`supabase/functions/kyc-verify/index.ts` (new), `supabase/config.toml` (`[functions.kyc-verify]`),
`supabase/functions/.env.example` (+`DIGILOCKER_API_KEY`), `supabase/tests/rls_buyer_kyc.sql`
(new), `app/src/services/kyc.ts` (new), `app/src/lib/errors.ts` (+2 codes),
`app/src/lib/database.types.ts`, `supabase/functions/_shared/database.types.ts` (regenerated),
`app/src/components/common/VerifiedBadge.tsx` (new),
`app/src/routes/buyer/{KycPage.tsx (new),BuyerHome.tsx}`,
`app/src/routes/admin/{AdminKycPage.tsx (new),AdminHome.tsx}`, `app/src/app/router.tsx`,
`app/src/locales/{en,hi,mr}.json` (+`kyc.*`, +2 error keys), `SPEC.md` §7.2.
**Tests:** `app/tests/unit/domain/schemas/kyc.test.ts` (new - valid/invalid GSTIN+PAN, trim+
uppercase, `panFromGstin`), `app/tests/unit/integrations/digilocker.test.ts` (new - mock output
passes `KycResult`, matching PAN verifies, mismatched stays pending, always `source: "mock"`),
`supabase/tests/rls_buyer_kyc.sql` (new, 7 checks). `pnpm lint && pnpm typecheck && pnpm test`
(254 tests, all green, 13 new) and `pnpm build` all pass.
**Next / known gaps:**
- **Next item: 3.2** List a lot + buyer marketplace with filters (crop, grade, distance,
  quantity) - the first screen a verified buyer actually uses.
- No manual UI/offline/360px pass this session (see above) - worth doing before the demo.
- The `nbfc`-can-reach-`/admin/kyc`-but-sees-nothing gap noted above.
- `TrustStars`/`trust_score` (`SPEC.md` §5.1 pairs them with `VerifiedBadge`) is a P1 ratings
  feature, out of prototype scope - not built here.

### 3.2a List a lot — 2026-09-22

**What it does:** the farmer half of 3.2 (SPEC.md §4.7 "Sell on Cropket", §9.2 Phase 3). `lots` had
no update grant at all until now - the original 1.6 migration said "nothing changes a lot's status
until 3.2". A farmer can now flip their own graded `draft` lot to `listed` from the lot detail
screen. This is a single-row update, not an RPC or an outbox job - listing isn't an all-or-nothing
multi-table change (`accept_bid`/escrow are; this isn't), and trading actions stay online-only
(`AGENTS.md` §3), so the button is disabled with a reason when offline, same pattern `KycPage`'s
submit already uses.
**How it's enforced:** one RLS policy does the whole state rule, in the database, not just the UI -
`using (farmer_id = auth.uid() and status = 'draft') with check (farmer_id = auth.uid() and status =
'listed' and grade is not null)` - own row, `draft → listed` only, must already have a grade (decided
with the user: an ungraded lot in the marketplace would make 3.2b's grade filter meaningless). No
un-listing grant - nothing in M3 needs it yet.
**A subtlety worth knowing (found while writing the pgTAP test, not guessed):** a USING mismatch
(wrong farmer, or the row isn't `draft`) makes the row invisible to the UPDATE, so it silently
touches 0 rows. A WITH CHECK mismatch on a row that *did* match USING (an ungraded draft trying to
become `listed`) instead raises a real Postgres error. Both shapes are tested; `rls_buyer_kyc.sql`
had already documented the first one, this one is new.
**Files:** `supabase/migrations/20260922140000_lot_listing.sql` (new), `app/src/services/lots.ts`
(`listLot()`, `useListLot()`), `app/src/routes/farmer/LotDetailPage.tsx` (the button - `ShoppingCart`
icon + word + `VoiceButton`, disabled offline / when ungraded, error line on failure),
`app/src/lib/errors.ts` (`LOT_NOT_LISTABLE`), `app/src/locales/{en,hi,mr}.json` (`lots.sell*`,
`errors.lotNotListable`), `supabase/tests/rls_lots.sql` (rewritten, not just appended - the old
file asserted update was impossible; `plan(6)` → `plan(12)`).
**Mocked:** nothing.
**Test by hand:** farmer `9090910001` / OTP `910001` -
1. Scan a crop, save the lot → lot detail shows "🛒 Sell on Cropket", enabled. Tap it → status pill
   flips from "Draft" to "For sale", button disappears.
2. A lot with no grade yet (still `pending` on the phone, or grading failed) → button disabled,
   "Scan the crop first" underneath.
3. DevTools → Offline on a graded draft's lot detail → button disabled, "Needs internet to list";
   back online re-enables it.
4. `psql` check: `select status from lots where id = '<id>';` reads `listed` after step 1.
**Tests:** `supabase/tests/rls_lots.sql` (12/12 - own-row insert, blocked cross-farmer insert, select
isolation, ungraded-draft listing throws, graded-draft listing succeeds and sticks, `listed → sold`
is blocked (0 rows), listing another farmer's lot is blocked (0 rows), `quantity_kg`/delete still
have no grant, the `quantity_kg > 0` check). `bash scripts/test-sql.sh lots` - 12/12 on `cropket-dev`.
`pnpm lint && pnpm typecheck && pnpm test` (254 tests, all green - no new unit test file, `listLot()`
is a thin Supabase call with no branching logic of its own; the real logic lives in the RLS policy,
which the SQL test covers) and `pnpm build` all pass. `impeccable detect --json app/src` → `[]`.
**Next / known gaps:**
- No second "Sell on Cropket" button on `ComparePage`, which SPEC §4.9 also draws it on - one
  insertion point is enough for the flow; revisit if the demo script wants both.
- No un-list (`listed → draft`) - not needed until a farmer needs to pull a lot back, out of scope
  for now.

### 3.2b Buyer marketplace — 2026-09-22

**What it does:** the other half of 3.2 (SPEC.md §4.10) - `/buyer` (`BuyerHome`, which had only a
"Coming soon" card) is now a real grid of every listed lot, any farmer's, with a real scan photo,
filterable by crop, grade, distance and minimum quantity, sortable nearest/newest. Cards aren't
`Link`s yet - bidding (3.3) is what makes tapping one worth building, so `BuyerLotCard` is a plain
card for now, same call the plan made with the user up front. Browsing stays open to an unverified
buyer (only bidding is blocked, SPEC.md §4.10) - no new route guard, `BuyerHome` keeps its existing
KYC banner.
**How it's enforced:** three narrow new select policies, nothing else - `lots_select_listed`
(`status = 'listed'`, any farmer), and matching ones on `grade_results` and the `crop-photos`
bucket scoped through *that* lot being listed. A draft's photo, grade and row stay exactly as
private as before; only what a farmer already chose to list becomes visible. `lots` carries no
phone number, so this needs no column allow-list to keep "buyer queries never return the farmer's
phone" (`AGENTS.md` §4) true. `lots` also grew generated `lat`/`lng` columns, the same fix
`mandis`/`profiles` already got - PostgREST serves `geography` as hex EWKB the browser can't read.
**Distance is client-side, on purpose:** `route-distance` (2.5) is `requireRole(["farmer"])` and
one ORS call per lot per filter tick would be wasteful anyway, so `filterAndSortLots()`
(`routes/buyer/marketplace.ts`, pure, no Supabase) reuses `straightLineRoute()` from
`@shared/geo.ts` - the exact same haversine × 1.3 number the Net-₹ comparator already shows, tagged
`<DemoDataTag>` since it isn't a real road route. All four filters run over one already-fetched,
`.limit(200)` query, so ticking a checkbox re-renders instantly with no refetch - a `ponytail:`
comment in `marketplace.ts` names the upgrade path (an `ST_DWithin` RPC + a GiST index) if listed
lots ever outgrow one page.
**Photos are signed in one batched call, not one per card:** `useListedLotPhotos()` collects every
visible lot's `grade_result_id`, does one `grade_results` select and one plural
`storage.createSignedUrls()` call (the same plural call the `grade` function already uses) for the
whole grid - this is the reason `LotCard`'s own header comment gave for staying text-only, now
actually built the way it was reserved for.
**Verified live against `cropket-dev`, not just pgTAP** (curl, farmer `9090910001`/`910001`, buyer
`9090910002`/`910002`): a graded draft lot is invisible to the buyer; `PATCH status=listed` by the
farmer makes it appear immediately with `lat: 20, lng: 73.79` read back correctly (not swapped);
the buyer's own `PATCH status=sold` attempt returns `200` with an empty array - 0 rows touched, not
an error, because buyers have no update grant on `lots` at all. Test row deleted afterward via
`psql` so `cropket-dev` stays clean.
**Files:** `supabase/migrations/20260922150000_lots_marketplace.sql` (new - `lat`/`lng`, the
status index, three select policies), `app/src/routes/buyer/marketplace.ts` (new -
`filterAndSortLots()`, pure), `app/src/routes/buyer/BuyerHome.tsx` (rewritten in place - same
route, no new one), `app/src/services/lots.ts` (`useListedLots()`, `useListedLotPhotos()`),
`app/src/components/lot/BuyerLotCard.tsx` (new), `app/src/components/market/LotFilters.tsx` (new),
`app/src/locales/{en,hi,mr}.json` (`market.*`, 16 keys), `supabase/tests/{rls_lots.sql (plan 12 →
15), rls_grade_results.sql (plan 4 → 6), rls_crop_photos.sql (plan 5 → 7)}` (all extended, not
replaced).
**Mocked:** the distance shown on every card (straight-line × 1.3, tagged `<DemoDataTag>` on the
filter panel) - everything else (the lots, the photos, the grades) is real.
**Test by hand:** buyer `9090910002` / OTP `910002`, with at least one lot already listed (3.2a's
hand-test step 1) -
1. `/buyer` → the listed lot appears with its real scan photo, grade badge, kg and `~N km`.
2. Filters: pick a different crop → it disappears. Untick its grade → it disappears. Set distance
   below its actual km → it disappears. Minimum kg above its quantity → empty state shows, with a
   hint to loosen the filters.
3. Sort Nearest ↔ Newest reorders the grid. If the buyer's own profile has no GPS from onboarding,
   the "Turn on location to sort by distance" hint shows and sort quietly falls back to newest.
4. Any other farmer's `draft` lots, and lots belonging to a different farmer than the one who
   listed, do not leak in - confirm with `psql` that drafts exist but aren't in the grid.
5. `pnpm build && pnpm preview` → repeat 1-3 on the production build.
**Tests:** `app/tests/unit/buyer/marketplace.test.ts` (new, 12 cases - crop/grade/quantity/distance
filters, empty-grade-list-means-any, a location-less lot kept without a distance filter and dropped
with one, nearest sort with null-km last, nearest falls back to newest with no buyer location,
newest default, empty input). `supabase/tests/rls_lots.sql` (15/15 - the six new/changed checks
from 3.2a plus three for the buyer read + the lat/lng order trap), `rls_grade_results.sql` (6/6),
`rls_crop_photos.sql` (7/7). `bash scripts/test-sql.sh` - full suite green on `cropket-dev`.
`pnpm lint && pnpm typecheck && pnpm test` (266 tests, all green - 12 new) and `pnpm build` all
pass. `impeccable detect --json app/src` → `[]`.
**Next / known gaps:**
- **Next item: 3.3** `bids` + `place_bid` RPC + RLS + `LiveBidBox` with Realtime - the first thing
  that makes a marketplace card worth tapping.
- Cards aren't clickable - `/buyer/lots/:id` with the real detail view (photos, `GradeBreakdown`,
  trust stars, `LiveBidBox`) is 3.3's, not built here.
- No village, trust stars, mega-lot badge or salvage filter on the card - SPEC §4.10's wireframe
  shows them; mega lots are 3.4, trust/ratings are P1 (out of prototype scope).
- `.limit(200)` + client-side filtering, see the `ponytail:` comment in `marketplace.ts` for the
  upgrade path once a real number of lots exist.

### 3.3 Bids + `place_bid` RPC + `LiveBidBox` (Realtime) — 2026-09-22

**What it does:** the first thing that makes a marketplace card worth tapping. `BuyerLotCard` is
now a `Link` to a new `/buyer/lots/:id` detail page (photo, `GradeBadge`, `GradeBreakdown` - reused
as-is from the farmer's own `LotDetailPage`/`useGradeResult()`, RLS already opened both to a listed
lot's buyer in 3.2b) with a `LiveBidBox` beside it: highest bid, a reference-floor line, a bid
form, and a recent-bids list that updates live through Supabase Realtime - the first Realtime
subscription and the first `supabase.rpc()` call in this project. Recent bids show price + time
only, not the bidder's business name - `buyer_kyc` stays select-own + admin-only (a call made with
the user up front); the farmer sees buyer identity in 3.5's `BidRow`, where it actually drives a
decision.
**How it's enforced:** `place_bid` (`security definer`) is the *only* writer to `bids` - `bids` has
no client insert grant at all, tighter than SPEC §5.6's literal "insert RLS policy" reading, so the
verified/not-banned check and the atomic rate-limit bump live in one place. It checks, in order:
signed in, `profiles.role='buyer' and kyc_status='verified' and banned=false`, `target_type='lot'`
(mega lots don't exist until 3.4 - the column, the RPC and `BidTargetType` all reject anything
else for now), the target lot is `status='listed'` (row-locked `for update`, AGENTS.md §4), a
10-bids-per-minute-per-buyer cap in a new `rate_limits` table (SPEC §5.2) that self-heals at the
cap since a `RATE_LIMITED` raise rolls its own bump back with the rest of the transaction, then
inserts the bid and computes `below_floor` by mirroring `floor.ts`'s percentile math in SQL (MSP or
nearest-rank 20th-percentile of `mandi_prices`, same Asia/Kolkata day boundary as `todayIso()`) -
**a below-floor bid still succeeds**, it only comes back flagged (CLAUDE.md §6 "the floor price
warns, never blocks"). Two select policies on `bids`: anyone can read bids on a lot that is
currently `listed`, and a buyer can always read their own bid even after it isn't. `rate_limits`
has RLS on and zero grants - only `place_bid` ever touches it.
**Column naming call:** `bids.price_per_quintal_paise`, not SPEC §5.6's shorthand
`price_per_quintal` - every money value elsewhere in this codebase ends in `_paise`
(`modal_price_paise`) and both `money.ts`/`floor.ts` already name the value
`pricePerQuintalPaise`. Followed the code, not the doc table; called out in the migration's header
comment.
**Files:** `supabase/migrations/20260922160000_bids.sql` (new - `bids`, `rate_limits`,
`place_bid()`, `alter publication supabase_realtime add table bids`),
`supabase/functions/_shared/domain/schemas/bid.ts` (new), `app/src/services/bids.ts` (new -
`useLotBids`, `useLotBidsRealtime`, `usePlaceBid`, `highestBid`), `app/src/components/trade/`
(new folder) `LiveBidBox.tsx`, `app/src/components/common/RequireOnline.tsx` (new - AGENTS.md §4's
"wrap money and trading buttons" convention, only inlined by hand until now),
`app/src/routes/buyer/BuyerLotDetailPage.tsx` (new), `app/src/app/router.tsx`
(`/buyer/lots/:id`), `app/src/components/lot/BuyerLotCard.tsx` (now a `Link`),
`app/src/lib/errors.ts` (`BUYER_NOT_VERIFIED`, `LOT_NOT_LISTED` + a new `rpcError()` helper - RPC
errors come back as the raised exception text, not the `{ok:false,error:{code}}` shape
`callFunction.ts` already unwraps), `app/src/lib/dataAge.ts` (`formatAgo()` gained minute
granularity for the recent-bids list; the existing 6-hour `<DataAge>` caller is unaffected),
`app/src/locales/{en,hi,mr}.json` (`bid.*`, 9 keys + 2 new error keys),
`supabase/tests/{place_bid.sql, rls_bids.sql}` (new).
**Mocked:** nothing new - `below_floor` runs against real seeded `mandi_prices`; with no history
the floor is `null` and no warning shows, never a guessed ₹0.
**Verified live against `cropket-dev`, not just pgTAP** (curl, farmer `9090910001`/`910001`, buyer
`9090910002`/`910002` real-verified through the actual `kyc-verify` function for this test - it is
now a genuinely verified buyer, useful for your own manual testing too): an unverified buyer's
`place_bid` call returns `BUYER_NOT_VERIFIED`; the verified buyer's bid returns
`{bid_id, is_highest:true, below_floor:false}`; a second buyer who never bid can read that bid back
through `bids_select_listed`; a bid at ₹1,000/quintal against the real onion floor of ₹1,684.51
returns `below_floor:true` and still succeeds. Test lot, bids and `rate_limits` rows deleted
afterward via `psql`. **Not verified: the Realtime websocket push itself** - no browser tool was
available this session, so the live "buyer B's screen updates with no reload" behavior described
below needs a manual check.
**Test by hand:** two browser windows, buyer `9090910002` / OTP `910002` (now verified) in one,
any other buyer in the other -
1. Farmer `9090910001` lists a graded lot; both buyers open `/buyer` → tap it → `/buyer/lots/:id`.
2. The verified buyer types a price and taps "Place bid" → the highest bid and recent-bids list
   update on **both** windows without a reload (the live realtime proof).
3. The unverified buyer's form is disabled with "Finish KYC to place bids."; neither buyer's window
   shows the other's business name in the recent-bids list.
4. DevTools → Offline → the "Place bid" button is disabled with a reason line, nothing queues.
5. Type a price below the reference floor shown → the red floor warning shows before submitting;
   submitting still succeeds and the warning stays.
6. Check at 360 px and in all three languages.
**Tests:** `supabase/tests/place_bid.sql` (11/11 - highest/not-highest, below-floor still inserts,
unverified/banned buyer, draft/unknown lot, `mega_lot` rejected, 11th-bid-in-a-minute rate limit),
`supabase/tests/rls_bids.sql` (8/8 - no insert/update/delete grant on `bids`, select scoped to
listed-or-own, `rate_limits` fully locked down). `bash scripts/test-sql.sh` - full suite green on
`cropket-dev`. `app/tests/unit/domain/schemas/bid.test.ts` (7 new), `app/tests/unit/dataAge.test.ts`
(+1 for minute granularity). `pnpm lint && pnpm typecheck && pnpm test` (274 tests, all green) and
`pnpm build` all pass.
**Next / known gaps:**
- **Next item: 3.4** Mega lot grouping (`mega_lots`, `mega_lot_items`, `group_mega_lots` trigger) -
  `place_bid`'s `target_type` check and `bids.mega_lot_id` (no FK yet) are both already shaped for
  it; 3.4 opens the RPC with `create or replace function`, not a new one.
- 3.5 (farmer's bids screen) is what finally shows a buyer's business name and trust score next to
  their bid - `LiveBidBox`'s recent-bids list deliberately doesn't.
- No push notification to the farmer on a new bid (P1, out of prototype scope).

### 3.4 Mega lot grouping — 2026-09-22

**What it does:** a 150 kg lot was too small for a trader who wants a truckload - nobody would bid
on it. `group_mega_lots()` fires (`after update of status on lots ... when (new.status = 'listed')`)
every time a lot is listed, and bundles it with nearby small lots of the same crop and grade:
unsold, smaller than 500 kg, within 10 km (`st_dwithin`), and **not already carrying a bid** - a
bid in flight is never orphaned by a regroup (decided with the user, along with keeping the §9.1
demo's 500 kg lot safe from being swallowed mid-demo, since a lot already at the target never
bundles). Once the group reaches 500 kg, it inserts one `mega_lots` row + one `mega_lot_items` row
per member and flips every member `listed -> in_mega` - a lot is sellable in exactly one place at a
time. `place_bid` is reopened (`create or replace`, per 3.3's own header comment) for
`target_type = 'mega_lot'` alongside `'lot'`; everything after the row lock (rate limit, floor,
insert, `is_highest`) is unchanged in shape. On the buyer side, a mega lot shows up in the
marketplace grid as a "Mega lot (n)" pill card (crop emoji tile, no single photo - there isn't
one) with its own "Mega lots" filter checkbox (on by default), and `/buyer/mega-lots/:id` reuses
the same `LiveBidBox` bidding on the bundle instead of one lot, with a member-lot list showing kg +
grade only, never a farmer's name (same call 3.3 made for a rival bidder's identity).
**Files:** `supabase/migrations/20260922170000_mega_lots.sql` (new - `mega_lots`,
`mega_lot_items`, `group_mega_lots()` + trigger, widens `lots_select_listed` /
`grade_results_select_listed` / `crop_photos_select_listed` to include `in_mega` so a lot stays
visible to buyers once it's bundled, adds the `bids.mega_lot_id` FK 3.3 promised + a
`bids_select_mega_listed` policy, `create or replace function place_bid`), `supabase/tests/
{group_mega_lots,rls_mega_lots}.sql` (new), `supabase/tests/place_bid.sql` (mega_lot cases replace
the old `UNSUPPORTED_TARGET` stub), `_shared/domain/schemas/bid.ts` (`BidTargetType` gains
`mega_lot`), `app/src/services/megaLots.ts` (new - read-only, grouping only ever happens through
the trigger), `app/src/services/bids.ts` (generalized lot-only -> `lot | mega_lot`, keyed and
channelled by target type per SPEC §5.6's `bids:lot:{id}` / `bids:mega:{id}`),
`app/src/routes/buyer/BuyerMegaLotDetailPage.tsx` (new), `app/src/components/lot/BuyerLotCard.tsx`
(mega tag + routing), `app/src/components/market/LotFilters.tsx` ("Mega lots" checkbox),
`app/src/routes/buyer/{BuyerHome,marketplace}.ts`, `app/src/app/router.tsx`
(`/buyer/mega-lots/:id`), `app/src/locales/{en,hi,mr}.json` (`mega.*` + `market.filterMegaLots`).
**Mocked:** nothing.
**Verified live against `cropket-dev`, not just pgTAP** (farmer `9090910001`, verified buyer
`9090910002`/`910002`): four real 150 kg onion Grade A lots at the same point, listed one at a
time - no mega lot at 450 kg, one `mega_lots` row (`total_kg=600`, `status='listed'`) the moment
the fourth lists, all four lots flip to `in_mega`. As the buyer: sees the mega lot and its 4
members through the widened RLS policies, places a real `place_bid('mega_lot', ...)` bid
(`is_highest:true, below_floor:false`), reads it back through `bids_select_mega_listed`. Test rows
deleted afterward via `psql`. **Not verified: the `bids:mega:{id}` Realtime push in a browser** -
no browser tool was available this session (the same gap 3.3 left for `bids:lot:{id}`).
**Test by hand:** two browser windows, buyer `9090910002` / OTP `910002` -
1. Farmer lists four small same-crop, same-grade lots within 10 km of each other → the marketplace
   shows one "Mega lot (4)" card instead of four small ones.
2. Untick "Mega lots" in the filter panel → the card disappears; tick it → it comes back. Crop /
   grade / distance / min-kg filters and sort still apply to it.
3. Tap it → `/buyer/mega-lots/:id`: member list (kg + grade, no farmer names), photo strip,
   `LiveBidBox`.
4. Bid in one window → the highest bid and recent-bids list update in the **other** window with no
   reload (the `bids:mega:{id}` Realtime proof, not yet checked in a browser).
5. Unverified buyer: form disabled with the KYC line. 360 px width, all three languages.
**Tests:** `supabase/tests/group_mega_lots.sql` (12/12 - reaches target and groups, stays below and
doesn't, a different grade isn't swept, a lot >10 km away isn't swept, a lot with an existing bid
is excluded so the group never completes, a single already-big lot never bundles, `unique(lot_id)`
holds), `supabase/tests/rls_mega_lots.sql` (10/10 - no client writes on either table, buyer sees a
listed mega lot + its members + its bids, a sold mega lot is invisible except to its own member),
`supabase/tests/place_bid.sql` (13/13, mega_lot cases added). `app/tests/unit/domain/schemas/
bid.test.ts`, `app/tests/unit/buyer/marketplace.test.ts` (+2 mega-filter cases). `bash
scripts/test-sql.sh` - full suite green **except `rls_buyer_kyc.sql`, pre-existing and unrelated
to this change** (a real `buyer_kyc` row for buyer `9090910002` that 3.3's own handoff note
deliberately left "verified... useful for your own manual testing too" makes that file's admin-row
count assertion count 3 instead of 2 against live seed data - not touched by this migration).
`pnpm lint && pnpm typecheck && pnpm test` (277 tests) `&& pnpm build` all pass. `impeccable detect
app/src` - 0 anti-patterns.
**Next / known gaps:**
- **Nobody can accept a mega-lot bid yet.** SPEC §5.3 gives that to the FPO, and there is no FPO in
  `supabase/seed.sql` and no `/fpo/megalots` screen (P1, SPEC §9.2) - `FpoHome.tsx` is still just a
  "coming soon" placeholder. 3.5/3.6 have to decide who accepts a mega-lot bid; until then a mega
  lot collects bids and stops there. This is the one thing 3.4 leaves dangling.
- `mega_lots.fpo_id` is created and never written.
- Grouping never un-groups: no path back from `in_mega` to `listed` if a farmer changes their mind.
- `mega_lot_target_kg` is a `ponytail:`-marked constant (500) in the SQL function, not a row in
  SPEC §5.6's `app_config` table - that table doesn't exist yet. Move it there when M4's
  `platform_fee_bps` gives `app_config` a second reason to exist.
- Grouping only runs on lot-*listed*. A lot listed before its neighbours isn't retroactively
  swept by itself, but it doesn't need to be - the next neighbour's own listing re-runs the full
  candidate query and picks up every nearby listed lot, not just newly listed ones.
- **Next item: 3.5** Farmer / FPO bids screen (`BidRow`, accept / reject, floor warning) - this is
  also where the mega-lot-accept gap above most naturally gets closed.

### 3.5 Farmer bids screen — 2026-09-23

**What it does:** until now a farmer had no way to see who was bidding on their listed lot -
`LiveBidBox` is buyer-only. The farmer opens a listed lot's new "Offers" button and sees every
active bid as a `BidRow` (buyer's business name + `VerifiedBadge`, price, "you get ₹X"), best price
first, live (same `bids:lot:{id}` Realtime channel 3.3 built). A below-floor offer shows the same
red `FloorWarning` the buyer's own `LiveBidBox` shows, from the same `@shared/floor.ts` call, so
neither side ever sees a different number. "Say no" rejects a bid in place (RLS policy, no
function needed). **"Accept" does not transact** - it navigates to
`/farmer/lots/:id/bids/:bidId/consent` (decided with the user: 3.6 owns `accept_bid` + voice
consent and will swap that route's placeholder element for the real screen, so nothing here is
throwaway). A farmer whose lot got swept into a mega lot (3.4) sees a **read-only** "In a mega lot -
best offer ₹X" line instead of any buttons (also decided with the user: SPEC §5.3 gives mega-lot
accept to the FPO, and there's still no FPO in the seed - 3.4's dangling gap stays a gap, just a
visible one now instead of a silent dead end).
**Files:** `supabase/migrations/20260923100000_lot_bids.sql` (new - `lot_bids(p_lot_id)` security
definer function returning the buyer's business name + verified flag without widening
`buyer_kyc`'s RLS past select-own/admin, since that row also carries `gst_number`/`pan_last4`; a
`bids_reject_own_lot` update policy + `grant update (status)`, `with check (status = 'rejected')`
so a farmer can never self-accept), `supabase/tests/lot_bids.sql` (new, 9 checks),
`supabase/tests/rls_bids.sql` (test 5 rewritten - it asserted "no update grant at all", which this
migration changes on purpose; it now asserts RLS filters out a row the caller has no policy over,
0 rows affected, not an exception), `app/src/services/bids.ts` (`FarmerBidView`, `useMyLotBids`,
`useRejectBid` - the farmer's query key nests under the existing `bidKeys.forTarget("lot", id)`
prefix, so 3.3's `useLotBidsRealtime` invalidates it with no change to that hook),
`app/src/services/megaLots.ts` (`useMegaLotForLot` - reads `mega_lot_items` by `lot_id`, a policy
3.4 already left in place for exactly this), `app/src/lib/errors.ts` (`LOT_NOT_FOUND`,
`BID_NOT_ACTIVE`), `app/src/components/trade/BidRow.tsx` (new), `app/src/routes/farmer/BidsPage.tsx`
(new, route `/farmer/lots/:id/bids`), `app/src/routes/farmer/LotDetailPage.tsx` ("Offers (n)"
button when listed, read-only mega-lot line when `in_mega`), `app/src/routes/PlaceholderPage.tsx`
(titleKey union gains `bids.consentTitle`), `app/src/app/router.tsx` (2 new routes, the consent one
pointing at `PlaceholderPage` until 3.6), `app/src/locales/{en,hi,mr}.json` (`bids.*` + 2 error
keys), `app/src/lib/database.types.ts` + `supabase/functions/_shared/database.types.ts`
(regenerated after the migration).
**Mocked:** nothing - real bids, real RLS, real Realtime, verified live against `cropket-dev`.
**How to test by hand:** two browser windows, farmer `9090910001`, verified buyer `9090910002` /
OTP `910002` - list a lot as the farmer, bid on it twice as the buyer (once above, once below the
reference floor); the farmer's lot detail shows "Offers (2)"; opening it shows both rows, best
price first, the buyer's business name + verified tick, and a red floor warning on the low one; a
third bid from the buyer window updates the farmer's list with no reload (the `bids:lot:{id}`
Realtime proof 3.3 and 3.4 both left unchecked in a browser - checked here); "Say no" removes a row
and the buyer's own `LiveBidBox` no longer counts it; "Accept" lands on the placeholder consent
screen; bundling a lot into a mega lot shows the read-only best-offer line with no buttons;
airplane mode disables both buttons with a calm reason; 360 px width in all three languages.
**Tests:** `supabase/tests/lot_bids.sql` (9/9 - farmer reads own bids best-first with buyer name,
rejected bids excluded, another farmer/unknown lot both refused with `LOT_NOT_FOUND`, the buyer
can't reject their own bid, the farmer can, `status='accepted'` and a price edit are both refused).
`bash scripts/test-sql.sh` - full suite green, 13/13 files including the rewritten
`rls_bids.sql` and (unlike 3.4's run) `rls_buyer_kyc.sql` too - didn't reproduce its known
flakiness this time. `pnpm lint && pnpm typecheck && pnpm test` (277 tests) `&& pnpm build` all
pass. `impeccable detect app/src` - 0 anti-patterns.
**Next / known gaps:**
- Mega-lot bids still cannot be accepted by anyone - needs an FPO seeded, `mega_lots.fpo_id`
  actually written, and a real `/fpo/megalots` screen (`FpoHome.tsx` is still a placeholder). 3.5
  makes the dead end visible (the read-only best-offer line) instead of silent.
- A rejected buyer gets no notification - push is out of prototype scope.
- No un-reject once a farmer says no.
- **Next item: 3.6** Deal consent screen (5 points + `VoiceConsent`) + `deals` table + `accept_bid`
  RPC - replaces this item's placeholder consent route with the real screen.

### 3.6 Deal consent screen + deals + accept_bid — 2026-09-23

**What it does:** closes the gap 3.5 left on purpose - BidRow's "Accept" used to just navigate to
a placeholder. It now lands on the real consent screen: SPEC §4.13's 5-point summary (price,
quantity, grade, pickup, payment) read from the same `useMyLotBids()` list BidsPage already shows
(so a bid another tab just changed shows "offer no longer available" instead of a broken screen),
then `VoiceConsent` (hold-to-record with the browser's own `MediaRecorder`, max 10 s, "record
again"), then "I agree" - dead until a clip exists and while offline. Tapping it uploads the clip
to the new `consent-audio` bucket and calls `accept_bid(bid_id, consent_audio_path)`, which in one
transaction (under the same lot row lock `place_bid` uses) creates the `deals` row, accepts the
winning bid, rejects every other active bid on the lot, and marks the lot `sold` - then the farmer
lands back on lot detail, which now shows a "Sold" card (total, pickup date, "waiting for buyer
payment") from `useDealForLot()`.
**Decided with the user:** no escrow or OTP here even though SPEC §5.3's one-liner mentions both -
`escrows` doesn't exist until 4.1, which reopens `accept_bid` with `create or replace` the same way
3.4 reopened `place_bid`; pickup date is fixed at today + 2 days computed server-side, with a
`ponytail:` comment marking the upgrade path (`p_pickup_date date default null`, reopened the same
way, plus a native `<input type="date">` on the consent screen - no schema change, no caller
breaks) for whenever a real pickup-date decision is needed; after accepting, the farmer goes back
to lot detail, not a new deal route - 4.3 (buyer pay screen) and 4.4 (Khata) are what eventually
replace the sold card's tail.
**Files:** `supabase/migrations/20260923150000_consent_audio_bucket.sql` (new - private bucket,
policies copied from the crop-photos bucket), `supabase/migrations/20260923160000_deals.sql` (new -
`deals` table with a unique index on `lot_id` making the idempotent-repeat check structural, RLS
select for either party, and `accept_bid()` security definer: `NOT_SIGNED_IN` /
`CONSENT_REQUIRED` (path must sit under the caller's own storage folder) / `LOT_NOT_FOUND` (one
error for "no such bid", "not yours" and mega-lot bids, same reasoning `lot_bids()` gives) /
idempotent repeat / `BID_NOT_ACTIVE` / `LOT_NOT_LISTED`, then the money math mirroring
`grossPaise()` and the fee/pickup-date constants), `supabase/tests/accept_bid.sql` (new, 11
checks), `supabase/tests/rls_deals.sql` (new, 6 checks), `supabase/functions/_shared/domain/schemas/deal.ts`
(new, `AcceptBidInput`/`AcceptBidResult`), `app/src/lib/native.ts` (`getMicStream()`),
`app/src/lib/errors.ts` (`CONSENT_REQUIRED`, `MIC_DENIED`, `MIC_UNAVAILABLE`),
`app/src/components/voice/VoiceConsent.tsx` (new), `app/src/services/deals.ts` (new -
`consentAudioPath`, `uploadConsentAudio`, `useAcceptBid`, `useDealForLot`),
`app/src/routes/farmer/ConsentPage.tsx` (new, replaces the placeholder at
`/farmer/lots/:id/bids/:bidId/consent`), `app/src/routes/farmer/LotDetailPage.tsx` (the "Sold"
card), `app/src/routes/PlaceholderPage.tsx` (`bids.consentTitle` dropped from the `titleKey`
union - nothing points at the placeholder for it any more), `app/src/app/router.tsx` (swapped the
placeholder route for `ConsentPage`), `app/src/locales/{en,hi,mr}.json` (`consent.*`,
`lots.deal.*`, 3 new error keys), `app/src/lib/database.types.ts` +
`supabase/functions/_shared/database.types.ts` (regenerated after the migrations).
**Mocked:** nothing - real table, real RLS, real RPC verified against `cropket-dev`, real
`MediaRecorder` recording (no package - browser API only).
**How to test by hand:** two browser windows, farmer `9090910001`, verified buyer `9090910002` /
OTP `910002` - list a lot as the farmer, bid on it twice as the buyer; on the farmer's offers
screen tap "Accept" on the higher bid - the consent screen shows the real price/quantity/grade/
pickup date; "I agree" stays disabled until you hold the mic button and record (allow microphone
permission); after releasing, "record again" replaces the button and "I agree" enables; tapping it
returns to lot detail showing "Sold" with the deal total and pickup date; the buyer's `LiveBidBox`
no longer shows either bid and the lot disappears from the marketplace; browser back + tapping
"I agree" again must not create a second deal (same total shown, no error). Airplane mode disables
"I agree" with a calm reason. Check 360 px in English, Hindi and Marathi.
**Tests:** `supabase/tests/accept_bid.sql` (11/11 - money math, pickup date, winning bid accepted,
losing bid rejected, lot sold, idempotent repeat, another farmer/the bidder/a rejected bid/an
in_mega lot/a wrong-folder consent path all refused). `supabase/tests/rls_deals.sql` (6/6 - both
parties see the deal, a third party sees nothing, no client insert/update/delete). `bash
scripts/test-sql.sh` - full suite green, 15/15 files. `pnpm lint && pnpm typecheck && pnpm test`
(282 tests, 5 new) `&& pnpm build` all pass. `impeccable detect app/src` - 0 anti-patterns.
**Next / known gaps:**
- No escrow, no OTP, no Khata row yet - **4.1** reopens `accept_bid` for all three (its own
  migration header should say so).
- Mega-lot bids still cannot be accepted by anyone - still 3.4's dangling gap (needs a seeded FPO).
- The buyer isn't told they won yet; push is out of prototype scope. 4.3 gives them a pay screen.
- No buyer name on the farmer's "Sold" card - `business_name` sits behind `buyer_kyc`'s
  select-own RLS; 4.3/4.4 can add a `lot_deal()` security definer function the way 3.5 added
  `lot_bids()` once they need the buyer's identity anyway.
- The APK will need `RECORD_AUDIO` in `AndroidManifest.xml` once Capacitor generates `android/` at
  5.4 - nothing to do now, the folder doesn't exist.
- **Next item: 4.1** `escrows`, `escrow_transitions`, `escrow_events`, `payouts`, `khata_entries` +
  `escrow_transition()` + SQL tests.

### 4.1 Escrow tables + escrow_transition() — 2026-09-23

**What it does:** the money foundation the rest of M4 builds on (SPEC.md §5.3, §5.6, §5.7,
§9.2 Phase 4). Five new tables - `escrows` (one per deal, unique), `escrow_transitions` (the 13
allowed moves from SPEC §5.7's table, inserted as config, not demo data), `escrow_events`
(insert-only - no update/delete grant at all, not even for the service role, so the audit trail
can't be tampered with by anything), `payouts`, and `khata_entries` (the colour-coded passbook
table; nothing writes rows into it yet - 4.3/4.6/4.8 do that as FUNDED/IN_TRANSIT/RELEASED happen).
`escrow_transition()` is SPEC §5.7's function body verbatim: row lock, idempotent same-state
return, `ILLEGAL_TRANSITION % -> %`, DELIVERED sets `auto_release_at = now() + 24h`, one
`escrow_events` row per move. `accept_bid` (3.6) is reopened to also create the escrow in the same
transaction as the deal - SPEC §5.3 always described `accept_bid` as returning `deal_id,
escrow_id`, and 3.6's own migration header already said this reopen was coming.
**Decided with the user:** `escrows.total_paise = deals.total_paise + deals.fee_paise` - the
escrow holds everything the buyer pays (deal total + the 1% platform fee), so a release's payouts
(farmer shares + one `platform_fee` payout) sum to the escrow total exactly. The farmer's Khata
will still show the deal total, the smaller number - that's a display choice for 4.3/4.4, not a
schema one.
**Files:** `supabase/migrations/20260923170000_escrows.sql` (new - the 5 tables, `escrow_state`/
`khata_colour` enums, RLS: `escrows` reuses `deals`' own party rule with an `exists` subquery
instead of copying it, `khata_entries` is select-own, `escrow_transitions`/`escrow_events`/
`payouts` have no client access at all), `supabase/migrations/20260923180000_accept_bid_escrow.sql`
(new - drops and recreates `accept_bid` because its OUT columns change, which `create or replace`
can't do; same body as 3.6's version plus the escrow insert and its creation event), `supabase/tests/escrow_transition.sql` (new, 11 checks - every one of the 13 allowed moves
succeeds and writes one event, an illegal jump and a move out of an end state both throw, a repeat
is idempotent with no new event, DELIVERED's 24h timer, an unknown id throws `ESCROW_NOT_FOUND`,
and `authenticated` genuinely cannot call the function - both the ACL and an actual call are
checked), `supabase/tests/rls_escrows.sql` (new, 10 checks - both deal parties see the escrow, a
third party sees neither the escrow nor someone else's khata row, no client can insert/update any
of the four money tables, and `escrow_events` refuses an update even as the service role),
`supabase/tests/accept_bid.sql` (extended to 14 checks - the escrow lands in CREATED for deal total
+ fee, its creation event exists, and a repeat returns the same escrow id too, not just the same
deal id), `supabase/functions/_shared/domain/schemas/deal.ts` (`AcceptBidResult` gains `escrowId`),
`app/src/services/deals.ts` (maps `row.escrow_id`; no UI reads it yet), `app/src/lib/
database.types.ts` + `supabase/functions/_shared/database.types.ts` (regenerated).
**Bug caught by the tests, not by hand:** `accept_bid`'s idempotent-repeat branch had `where
deal_id = v_existing_deal_id` with no table alias - Postgres treats that as ambiguous once the
function's OUT parameters are named `deal_id`/`escrow_id`, since OUT parameters are also in scope
as plpgsql variables inside the function body. `accept_bid.sql`'s repeat-call test hit this
immediately. Fixed by aliasing the table (`from escrows es where es.deal_id = ...`).
**Mocked:** nothing - real tables, real RLS, real function, verified against `cropket-dev`.
**How to test by hand:** as farmer `9090910001`, accept a bid the way 3.6's test already does.
Supabase table editor: one `escrows` row in `CREATED` with `total_paise` = deal total + fee, and
one `escrow_events` row (`from_state` null → `CREATED`). Nothing in the UI shows this yet - 4.3
(mock pay) is the first screen that reads it.
**Tests:** `supabase/tests/escrow_transition.sql` (11/11), `supabase/tests/rls_escrows.sql`
(10/10), `supabase/tests/accept_bid.sql` (14/14, extended). `bash scripts/test-sql.sh` - full suite
green, 17/17 files (including `rls_buyer_kyc.sql` - didn't reproduce its known flakiness this run
either). `pnpm lint && pnpm typecheck && pnpm test` (282 tests, no new ones - no app-visible
behaviour changed) `&& pnpm build` all pass. No UI touched, so `impeccable detect` doesn't apply
this time.
**Next / known gaps:**
- No Khata row yet, no way to see the escrow from the app at all - **4.3** (mock Cashfree,
  `escrow-pay`, "Pay (demo)" button, `cashfree-webhook` → FUNDED) is the first thing that moves the
  escrow out of CREATED and writes the first 🟡 Khata row.
- `otp_hash`/`otp_tries` aren't columns yet - left for **4.5** on purpose, which also decides how
  the buyer is shown a code that's stored only as a hash.
- `cashfree_order_id` isn't a column yet either - **4.3** adds it when it exists to store.
- `escrow_transition()` and `accept_bid` both use the `v_fee_bps = 100` / mega-lot-target-kg style
  `ponytail:` constant instead of a row in SPEC §5.6's `app_config` table - still true, still
  waiting for a second reason to build that table (unchanged from 3.4/3.6's notes).
- Mega-lot bids still cannot be accepted by anyone - unchanged gap from 3.4/3.5 (needs a seeded
  FPO), so mega lots have no escrow either.
- **Next item: 4.2** `split.ts` + tests (100% branches, no paisa lost).

### 4.2 split.ts + tests — 2026-09-23

**What it does:** the pure function `escrow-release` (4.8) will call to turn a released escrow
into payout lines (SPEC.md §5.7, CLAUDE.md §6). `splitRelease({ escrowTotalPaise, feePaise,
farmers: { farmerId, quantityKg }[] })` returns `farmer_share` / `platform_fee` lines: each
farmer's share is proportional to their kg, any rounding leftover (a few paise) goes to the
farmer with the largest kg (ties keep input order, so a retry is deterministic), and the
platform fee is paid on top by the buyer so it never comes out of the farmer pool. A share that
floors to zero is dropped (matches the `payouts.amount_paise > 0` check constraint), and a fee of
zero produces no `platform_fee` line. Fails closed (throws `SPLIT_INVALID_INPUT ...`) on anything
that doesn't add up: non-integer/non-positive total, fee ≥ total, no farmers, or any farmer with a
zero/negative/fractional kg — a money formula never silently clamps or drops a paisa.
**Decided with the user:** SPEC §5.7 lists 5 steps (crate hold, driver freight, EMI, farmer
shares, platform fee); the prototype has no crate-hold/freight/EMI amount anywhere yet, so
`split.ts` only builds steps 4–5. Steps 1–3 get a `ponytail:` comment in the file and a line in
SPEC §5.7 saying where they slot in (extra deductions from the pool before the farmer-share loop)
for Phase 5 / P2. Also added `@vitest/coverage-v8@5.0.1` as a dev dependency (approved) so
`pnpm exec vitest run --coverage` can actually prove the 100%-branches requirement instead of
just asserting it in prose.
**Files:** `supabase/functions/_shared/domain/split.ts` (new), `app/tests/unit/domain/
split.test.ts` (new, 17 tests incl. a 50-case deterministic pseudo-random sweep asserting the sum
always equals the escrow total), `app/vite.config.ts` (`test.coverage`: v8 provider,
`allowExternal: true` + an explicit `include` for split.ts since it lives outside `app/`, and a
100%-branches threshold scoped to just that file), `app/package.json` + lockfile
(`+@vitest/coverage-v8@5.0.1`), `SPEC.md` §5.7 (marks steps 1–3 as not-yet-built).
**Mocked:** nothing — pure math, no DB/network/UI involved.
**How to test by hand:** there's nothing to click — it's a pure function with no caller yet.
`cd app && pnpm exec vitest run --coverage` shows `split.ts` at 100% statements/branches/
functions/lines; the coverage threshold makes `--coverage` fail the whole run if a future edit
drops a branch below 100%.
**Tests:** `app/tests/unit/domain/split.test.ts` (17/17 — single lot, mega lot with uneven kg,
tie-breaking, zero fee, "fee never reduces farmers" property, a dropped zero-share line, 8
fail-closed throw cases, and the 50-case sweep). `pnpm lint && pnpm typecheck && pnpm test`
(299 tests total, 17 new) `&& pnpm exec vitest run --coverage` (split.ts 100% branches) all
pass. No SQL/migration/Edge Function/UI touched this item, so `test-sql.sh`/pytest/`impeccable
detect` don't apply.
**Next / known gaps:**
- `splitRelease()` has no caller yet — it's **4.8** (`escrow-release`) that will actually call
  `split.ts`, map its lines to `payouts` rows, and decide whose `profiles.id` the `platform_fee`
  line's `to_user` is (the line itself carries no user id on purpose — that's a routing decision,
  not a math one).
- Crate-hold, driver-freight and EMI deductions (SPEC §5.7 steps 1–3) aren't implemented —
  unchanged gap, tracked in SPEC §5.7 now instead of only in this file.
- **Next item: 4.3** `integrations/cashfree` (mock) + `escrow-pay` + "Pay (demo)" button +
  `cashfree-webhook` → FUNDED + Khata 🟡.

### 4.3 integrations/cashfree (mock) + escrow-pay + Pay (demo) + cashfree-webhook → FUNDED + Khata 🟡 — 2026-09-23

**What it does:** the first money move (SPEC.md §2.2, §4.14, §5.4, §5.7, §9.2 Phase 4 "4.3"). Until
now `accept_bid` left every escrow sitting in `CREATED` with nothing to look at in the app.
`fund_escrow()` (new SQL function, service-role only, same "one function moves money" shape
`escrow_transition()` set) is the only way an escrow reaches `FUNDED`: it runs
`escrow_transition(..., 'FUNDED', ...)` and, in the same transaction, writes the farmer's first
`khata_entries` row (🟡 `khata.moneyLocked`, at the deal total — the escrow itself holds the
bigger deal-total-plus-fee number, decided in 4.1). It's idempotent on `cashfree_order_id`
(a new unique column on `escrows`, promised by 4.1's own header): a repeat call for an
already-`FUNDED` order returns the row unchanged, no second event or Khata row.
`escrow-pay` (buyer, Edge Function) is the only caller a browser can reach: in mock mode it calls
`fund_escrow()` itself right after creating the (fake) Cashfree order, so "Pay (demo)" funds the
escrow in one tap. `cashfree-webhook` verifies a Cashfree signature first and **refuses every
request in mock mode** (401, fail closed) — there is no secret to check a signature against and
no real Cashfree that will ever call it without a sandbox key, so it stays dead code until a real
`CASHFREE_SECRET_KEY` exists. `buyer_deals()` (new SQL function, security definer) is what lets
the buyer see their own deals at all — `deals_select_party` already reads `lots`, so a `lots`
policy reading `deals` back would be "infinite recursion in policy" (same reasoning 3.5's
`lot_bids()` gives). BuyerHome now shows a "My deals" list (state pill: "Pay now" / "Money
locked") linking to the new `/buyer/deals/:id` pay screen (SPEC §4.14's itemised layout - deal
total, 1% fee, escrow total - one CTA, wrapped in `RequireOnline` like `LiveBidBox`'s "Place
bid"). The farmer's own lot-detail "Sold" card (3.6) now reads `escrowState` too: it still says
"waiting for buyer payment" in pass-green while `CREATED`, and flips to a haldi "Money locked
safely" card once `FUNDED`.
**Decided with the user:** "Pay (demo)" makes **one** call to `escrow-pay`, not a second call to
`cashfree-webhook` from the browser — the webhook stays a single, real-signature-only door, so
there is never a second way in to fund an escrow. `real.ts` (both cashfree and the webhook's real
signature check) still throws/refuses — no real Cashfree checkout exists in the app for a
`paymentSessionId` to open yet.
**Files:** `supabase/migrations/20260923190000_escrow_pay.sql` (new — `cashfree_order_id`,
`fund_escrow()`, `buyer_deals()`), `supabase/tests/fund_escrow.sql` (new, 13 checks),
`supabase/functions/_shared/domain/schemas/escrow.ts` (new — `EscrowPayInput`/`EscrowPayResult`/
`CashfreeOrder`/`CashfreeWebhookEvent`), `supabase/functions/_shared/integrations/cashfree/`
(new — `index.ts`/`mock.ts`/`real.ts`/`types.ts`/`signature.ts`, the SPEC §2.2 adapter shape plus
a pure HMAC-SHA256 `cashfreeSignature()` Vitest can call directly), `supabase/functions/escrow-pay/
index.ts` (new), `supabase/functions/cashfree-webhook/index.ts` (new), `supabase/config.toml`
(both functions' blocks), `scripts/check-functions.sh` (the "own auth ran" live check now also
accepts `WEBHOOK_SIGNATURE_INVALID`, since cashfree-webhook has no JWT or cron secret, only a
signature), `app/tests/unit/integrations/cashfree.test.ts` (new, 7/7), `app/src/services/deals.ts`
(`DealView` gains `escrowState`; new `BuyerDealView` + `useBuyerDeals()`), `app/src/services/
escrow.ts` (new — `usePayEscrow()`), `app/src/routes/buyer/BuyerDealPage.tsx` (new, route
`/buyer/deals/:id`), `app/src/routes/buyer/BuyerHome.tsx` ("My deals" list), `app/src/routes/
farmer/LotDetailPage.tsx` (Sold card reads `escrowState`), `app/src/app/router.tsx` (1 new route),
`app/src/lib/errors.ts` (`ESCROW_NOT_FOUND`, `PAYMENTS_UNAVAILABLE`), `app/src/locales/
{en,hi,mr}.json` (`deal.*`, `khata.moneyLocked`, `lots.deal.moneyLocked`, 2 error keys),
`app/src/lib/database.types.ts` + `supabase/functions/_shared/database.types.ts` (regenerated).
**Mocked:** Cashfree order creation and payment — shown with `<DemoDataTag>` on the pay screen.
**How to test by hand:** as farmer `9090910001`, accept a bid the way 3.6's test already does (lot
must be `sold` with a `CREATED` escrow). As buyer `9090910002`, BuyerHome now shows "My deals"
with a red "Pay now" pill; open it, the pay screen shows the itemised total; tap "Pay and lock
money" — it flips to the haldi "Money locked safely" card, and BuyerHome's pill turns to "Money
locked". Table editor: the escrow is `FUNDED` with `cashfree_order_id` set, 2 `escrow_events` rows
(`CREATED`→ null-to-CREATED from accept_bid, plus `CREATED`→`FUNDED`), 1 yellow `khata_entries`
row for the farmer. Tapping the button again (or reloading the pay page) changes nothing. The
farmer's own lot detail now shows the haldi "Money locked safely" card. Checked at 360 px in
English, Hindi and Marathi.
**Tests:** `supabase/tests/fund_escrow.sql` (13/13 — CREATED→FUNDED, one event carrying the
payment ref, one yellow Khata row at the deal total (not the bigger escrow total), a repeat call
adds neither, a wrong amount and an unknown order are both refused, `authenticated` cannot call
it, `buyer_deals()` returns the buyer's own deal with escrow state and nothing for a different
buyer). `bash scripts/test-sql.sh` — full suite green, 18/18 files. `app/tests/unit/integrations/
cashfree.test.ts` (7/7 — mock output passes `CashfreeOrder`, `cashfreeSignature` matches a
known-answer vector computed independently with `openssl`, a changed body gives a different
signature, `CashfreeWebhookEvent` parses/rejects). `pnpm lint && pnpm typecheck && pnpm test`
(306 tests, 7 new) `&& pnpm build` all pass. `impeccable detect app/src` — 0 anti-patterns.
Deployed `escrow-pay` and `cashfree-webhook` to `cropket-dev`; `bash scripts/check-functions.sh`
passes both (the pre-existing `ALLOWED_ORIGINS` CORS-origin gap on every function is unrelated —
`curl` sends no `Origin` header, so it fails the same way for functions untouched by this change).
**Next / known gaps:**
- No delivery OTP or `mark_dispatched` yet — the buyer's "Money locked safely" card is the only
  state past `FUNDED` the app can reach. **4.5**/4.6 build the next moves.
- No Realtime on `escrow:{dealId}` (SPEC §5.6) — the farmer's lot detail and the buyer's deal page
  both update on refetch/refocus (TanStack Query's default), not live. Worth adding once 4.4's
  Khata screen gives Realtime a second reason to matter here.
- No push to the farmer when money locks — out of prototype scope (push is skipped everywhere).
- `CREATED` → `CANCELLED` after 2 h (SPEC §5.7's row) isn't built — nothing times out an unpaid
  deal yet. Needs a cron the same shape as **4.9**'s `cron-auto-settle`, or that function extended
  to also sweep `CREATED` escrows past 2 h once it exists.
- A mega-lot deal can't be funded — `fund_escrow()` raises `NOT_IMPLEMENTED mega_lot_deal` on
  purpose (`deals.lot_id` null), and no mega-lot deal can exist yet anyway (3.4/3.5's unchanged
  gap: no FPO, no `/fpo/megalots` accept screen).
- **Next item: 4.4** Khata screen (`KhataRow`, `KhataSummary`, voice, readable offline) — the
  first thing that actually renders the `khata_entries` rows 4.3 starts writing.

### 4.4 Khata screen — 2026-09-23

**What it does:** the farmer's Digital Khata (SPEC.md §4.15, §9.2 Phase 4 "4.4"). `/farmer/khata`
was still `PlaceholderPage` - it now shows the real passbook. `khata_entries` is append-only (a
deal gets a 🟡 row at FUNDED today, and will get 🔵 at IN_TRANSIT (4.6) and 🟢 at RELEASED (4.8)
later), so the screen doesn't just list every row - `summariseKhata()` (pure function) collapses
the ledger to one row per deal (its latest entry, newest first) and computes the summary numbers:
Locked = sum of deals still on their latest 🟡 row, On the way = count on 🔵, Received (this
month) = sum of 🟢 rows dated in the current calendar month **in Asia/Kolkata**, not phone-local
time (`Intl.DateTimeFormat` with `timeZone`, no date library). `KhataSummary` is the hero card
("Received in September / ₹X / 🔒 Locked / 🚚 On the way"), `KhataRow` is one passbook line.
**Decided with the user (plan step, not mid-build):** SPEC §6.4 / AGENTS.md §4 both say Khata rows
use a 6 px left colour bar; `DESIGN.md`'s own precedence note overrides both for anything visual
and its anti-pattern checklist explicitly forbids side-tab borders. Fixed the conflict in this
change: `SPEC.md` §6.4 + its `KhataRow` component-table row, and `AGENTS.md` §4, now point at
`DESIGN.md` instead of describing the bar. `KhataRow` uses a colour-tinted icon squircle (same
pattern `BigTile`/`LotCard` already use) + status word + 🔊 instead - colour is still never the
only signal.
**Files:** `app/src/services/khata.ts` (new - `useMyKhata()`, `summariseKhata()`),
`app/src/components/money/KhataSummary.tsx` (new), `app/src/components/money/KhataRow.tsx` (new),
`app/src/routes/farmer/KhataPage.tsx` (new), `app/src/app/router.tsx` (`/farmer/khata` → real
page), `app/src/routes/PlaceholderPage.tsx` (deleted - Khata was its last caller),
`app/src/routes/farmer/LotDetailPage.tsx` (comment update only, no behaviour change),
`app/src/locales/{en,hi,mr}.json` (`khata.*` keys), `app/tests/unit/services/khata.test.ts` (new),
`SPEC.md` §6.4 + component table, `AGENTS.md` §4 (the DESIGN.md-precedence fix above).
**Mocked:** nothing - reads real `khata_entries` rows through RLS `khata_select_own`, verified
against `cropket-dev` data 4.3's own test already created.
**How to test by hand:** as farmer `9090910001` with a deal already paid via 4.3's "Pay (demo)"
button, open "Khata" from the bottom nav - shows one 🟡 row ("₹X - money locked safely"), the
summary card reads "Locked ₹X" and "Received ₹0" (nothing released yet this month). A farmer with
no deals sees the empty state with a link back to My lots. `pnpm build && pnpm preview`, open
Khata once, then DevTools → Offline → reload → the same row still shows, with `DataAge` once the
cache is older than 6 h. Checked at 360 px in English, Hindi and Marathi.
**Tests:** `app/tests/unit/services/khata.test.ts` (4/4 - empty ledger, a deal's 🟡→🔵 rows
collapse to one 🔵 row not counted as Locked, Locked sums only latest-🟡 rows across several
deals, Received counts only this month's 🟢 rows with an IST month-boundary case). `pnpm lint &&
pnpm typecheck && pnpm test` (310 tests, 4 new) `&& pnpm build` all pass. `impeccable detect
app/src` - 0 anti-patterns. No SQL/migration/Edge Function touched, so `test-sql.sh`/pytest don't
apply.
**Next / known gaps:**
- No buyer name on a row ("Sharma") - same gap 4.3's "Sold" card has; `business_name` sits behind
  `buyer_kyc`'s select-own RLS. Upgrade path: reopen `fund_escrow()` to put the buyer's name into
  `title_values` (small migration, same shape `accept_bid`'s reopens have used all along).
- No `Countdown` ("Auto-release in…") on a row yet - only meaningful once DELIVERED sets
  `auto_release_at`, which **4.9** builds.
- No Realtime on `escrow:{dealId}` (SPEC §5.6) - the screen refetches on open/focus (TanStack
  Query defaults) rather than updating live while it's open. Same gap 4.3 left open; still no
  second screen forcing the decision.
- "📄 Get statement" (SPEC §4.15) isn't built - P1, out of prototype scope.
- Tapping a row does nothing - `khata_entries` carries a `deal_id`, not a `lot_id`, and there's no
  farmer-facing deal detail page to link to yet (buyers have `BuyerDealPage`; farmers don't need
  one until a screen has more to show than the Khata row itself already does).
- **Next item: 4.5** Delivery OTP (hash + 5-try lock) + buyer sees `OtpDigits`.

### 4.5 Delivery OTP (5-try lock) + buyer sees `OtpDigits` — 2026-09-23

**What it does:** the buyer's deal page (SPEC.md §4.14, §5.3, §5.4, §5.6, §9.2 Phase 4 "4.5") now
shows a 4-digit delivery code once the escrow is `FUNDED` or later. **Decided with the user (plan
step):** SPEC's own "store only a hash" line can't actually show the buyer their code back (a hash
can't be reversed), so the code is **derived instead of stored**: `deliveryOtp(OTP_PEPPER,
escrowId)` takes 4 digits from `HMAC-SHA256(OTP_PEPPER, escrowId)` (pure Web Crypto, same shape
`cashfreeSignature()` already used). `escrows` carries no code and no hash at all - only
`otp_tries`. The buyer's `delivery-code` function and 4.7's `trip` function (checking the driver's
entry) both hold `OTP_PEPPER` server-side and recompute the same code independently - no lookup,
and a database leak reveals nothing. `record_otp_attempt(escrow_id, correct)` (new SQL function,
service-role only, same shape `fund_escrow`/`escrow_transition` use) is the 5-try lock: it requires
`DELIVERED`, throws `OTP_LOCKED` at 5 wrong tries, and increments-and-returns in one statement (a
`raise` would roll back the increment). It has no caller yet - 4.7's `trip` (`POST /otp`) is what
will call it once a driver can enter a code at all, same as `split.ts` (4.2) had no caller until
4.8.
**Files:** `supabase/migrations/20260923200000_delivery_otp.sql` (new - `otp_tries` column,
`record_otp_attempt()`), `supabase/tests/delivery_otp.sql` (new, 12 checks),
`supabase/functions/_shared/domain/deliveryOtp.ts` (new, pure), `supabase/functions/_shared/domain/
schemas/escrow.ts` (`DeliveryCodeInput`/`DeliveryCodeResult`), `supabase/functions/delivery-code/
index.ts` (new - buyer, checks deal ownership + escrow state, returns the derived code),
`supabase/config.toml` (`delivery-code` block), `app/tests/unit/domain/deliveryOtp.test.ts` (new,
5/5), `app/src/services/escrow.ts` (`useDeliveryCode()`), `app/src/components/money/OtpDigits.tsx`
(new - 4-box display), `app/src/routes/buyer/BuyerDealPage.tsx` (delivery-code card, shown for
`FUNDED`/`DRIVER_ADVANCE_PAID`/`IN_TRANSIT`/`DELIVERED`), `app/src/lib/errors.ts`
(`ESCROW_WRONG_STATE`), `app/src/locales/{en,hi,mr}.json` (`deal.deliveryCode*`, 1 error key),
`app/src/lib/database.types.ts` + `supabase/functions/_shared/database.types.ts` (regenerated),
`SPEC.md` §5.3/§5.4/§5.6/§7.2 (drops `otp_hash`, documents the derived code and the new
`record_otp_attempt`/`delivery-code` rows), `AGENTS.md` §5 (OTP rule updated to match).
**Mocked:** nothing - real column, real function, real Edge Function, verified against
`cropket-dev`; `OTP_PEPPER` was already set.
**How to test by hand:** as buyer `9090910002`, open a `FUNDED` deal's pay page (from 4.3's flow) -
a "Delivery code" card shows 4 boxed digits with 🔊, and the hint "Give this code to the driver
only after you check the goods." Reload: same code (it's derived from the escrow id, so it's
always the same). DevTools → Offline → reload: the code still shows (cached like any other read).
A `CREATED` deal (not yet paid) shows no code card. Checked at 360 px in English, Hindi and
Marathi.
**Tests:** `supabase/tests/delivery_otp.sql` (12/12 - correct guess on a fresh escrow reports 5 left
and changes nothing, a wrong guess counts down and persists, the 5th wrong guess locks it, a 6th
attempt (even correct) throws `OTP_LOCKED`, a non-`DELIVERED` escrow and an unknown id are both
refused, only the service role may call it, no attempt writes an `escrow_events` row).
`bash scripts/test-sql.sh` - full suite green, 19/19 files. `app/tests/unit/domain/
deliveryOtp.test.ts` (5/5 - known-answer vector verified independently with `openssl`, always 4
digits including a zero-padded case, deterministic, changes with a different pepper or escrow id).
`pnpm lint && pnpm typecheck && pnpm test` (315 tests, 5 new) `&& pnpm build` all pass. `impeccable
detect app/src` - 0 anti-patterns. Deployed `delivery-code` to `cropket-dev`;
`bash scripts/check-functions.sh` passes it. Verified by hand with `curl` using real buyer/farmer
JWTs (via the test-OTP auth endpoint): bad input → `400 VALIDATION_FAILED`, unknown escrow →
`404 ESCROW_NOT_FOUND`, farmer JWT → `403 FORBIDDEN`.
**Next / known gaps:**
- No driver entry point yet - **4.7** (`trip`'s `POST /otp`) is what will call
  `record_otp_attempt()` and, on a correct guess, `escrow-release`.
- "Admin alerted" at 5 wrong tries (SPEC §5.2) is just `otp_tries = 5` being queryable - no
  push/email exists (`ponytail:` comment in the migration). Upgrade path: 4.7's `trip` logs
  `OTP_LOCKED` when `record_otp_attempt` throws it; wire a real alert there if it's ever needed.
- `mark_dispatched`/`FUNDED → IN_TRANSIT` (needed to actually reach `IN_TRANSIT`/`DELIVERED` by
  hand today) isn't built yet - **4.6** builds it, so today's manual test only reaches `FUNDED`.
- **Next item: 4.6** "Mark dispatched" → IN_TRANSIT + Khata 🔵.

### 4.6 "Mark dispatched" → IN_TRANSIT + Khata 🔵 — 2026-09-23

**What it does:** the farmer's own move for the "simple dispatch" flow (SPEC.md §4.15, §5.3, §5.7,
§9.2 Phase 4 "4.6"). `mark_dispatched(escrow_id)` (new SQL function, same "one function, one
transaction" shape `fund_escrow()` set) is the only way an escrow reaches `IN_TRANSIT` in the
prototype: it runs `escrow_transition(..., 'IN_TRANSIT', ...)` and, in the same transaction, writes
a blue `khata_entries` row (`khata.onTheWay`, at the deal total). Only the farmer who owns the lot
can call it (checked the same way `accept_bid`'s `LOT_NOT_FOUND` does - one error for "no such
escrow" and "not yours", so a probe can't tell them apart), it only works from `FUNDED`, and a
repeat call is idempotent (returns `IN_TRANSIT` unchanged, no second event or Khata row). The
farmer's lot-detail "Sold" card now shows a "Mark dispatched" button (Truck icon, wrapped in
`<RequireOnline>` like the pay button) while `FUNDED`, and flips to a neel "On the way to buyer"
card once `IN_TRANSIT` - no confirm dialog, the label says exactly what happens. The buyer's home
"My deals" pill also gets a third state, "On the way" (neel), for `IN_TRANSIT`.
**Decided with the user (plan step):** SPEC originally gated `mark_dispatched` on
`ALLOW_SIMPLE_DISPATCH`, an Edge Function secret - a SQL function can't read `Deno.env`, and the
flag stays `true` until Phase 5 logistics exists, which is out of prototype scope. So the function
has **no flag check at all** (a `ponytail:` comment in the migration explains why and gives the
upgrade path: move the flag into `app_config` if Phase 5 ever needs to turn it off). Removed the
dead `ALLOW_SIMPLE_DISPATCH=` line from `supabase/functions/.env.example` (nothing reads it; it was
never in `scripts/set-key.sh`'s `KEYS` list either). `lots.status` stays `sold` through dispatch -
the escrow state is the source of truth for the Sold card, and `lot_status.in_transit` remains
unused (documented below, not a new gap).
**Files:** `supabase/migrations/20260923210000_mark_dispatched.sql` (new), `supabase/tests/
mark_dispatched.sql` (new, 11 checks), `supabase/functions/_shared/domain/schemas/escrow.ts`
(`MarkDispatchedInput`), `app/src/services/deals.ts` (`DealView` gains `escrowId`, alongside
`escrowState`), `app/src/services/escrow.ts` (`useMarkDispatched()`), `app/src/services/khata.ts`
(`khata.onTheWay` added to `KHATA_TITLE_KEYS`), `app/src/routes/farmer/LotDetailPage.tsx` (Sold
card reads `IN_TRANSIT`, adds the "Mark dispatched" button), `app/src/routes/buyer/BuyerHome.tsx`
("On the way" pill), `app/src/locales/{en,hi,mr}.json` (`lots.deal.onTheWay`/`markDispatched`/
`dispatchOffline`, `khata.onTheWay`, `deal.statusOnTheWay`), `app/src/lib/database.types.ts` +
`supabase/functions/_shared/database.types.ts` (regenerated), `supabase/functions/.env.example`
(dead flag line removed), `SPEC.md` §5.3 + §7.2 (document the no-flag decision).
**Mocked:** nothing - real column state, real function, real Khata row, verified against
`cropket-dev`.
**How to test by hand:** as farmer `9090910001` with a `FUNDED` deal (pay it first with 4.3's
"Pay (demo)" button), open the lot's detail page - a green "Mark dispatched" button shows under the
haldi "Money locked" card; tap it, the card turns blue "On the way to buyer". Khata
(`/farmer/khata`) now shows one 🔵 row and the summary's "On the way: 1" count goes up while
"Locked" drops by the deal total. As buyer `9090910002`, BuyerHome's "My deals" pill for that deal
now reads "On the way" (neel). Airplane mode disables the button with a reason line. Reloading or
tapping again changes nothing. Checked at 360 px in English, Hindi and Marathi.
**Tests:** `supabase/tests/mark_dispatched.sql` (11/11 - farmer-only, `FUNDED → IN_TRANSIT`, one
event with the farmer as actor, one blue Khata row at the deal total, idempotent repeat, the buyer
and another farmer both refused with the same `ESCROW_NOT_FOUND`, a `CREATED` escrow refused with
`ESCROW_WRONG_STATE`, an unknown id refused, `anon` has no privilege at all). `bash
scripts/test-sql.sh` - full suite green, 20/20 files. `pnpm lint && pnpm typecheck && pnpm test`
(315 tests, no new ones - the logic is proven in SQL, the app service is a thin rpc wrapper) `&&
pnpm build` all pass. `impeccable detect app/src` - 0 anti-patterns.
**Next / known gaps:**
- `lot_status.in_transit`/`delivered` stay unused - the Sold card and Khata both read the escrow's
  own state, not `lots.status`, so the lot enum value exists but nothing writes it. Not a bug: SPEC
  §5.6 defines the enum for the whole lifecycle, and the prototype's UI never needed a second
  source of truth. Leave as-is unless a future screen reads `lots.status` directly for logistics.
- No driver page yet, no way to reach `DELIVERED` by hand - **4.7** (`shipments-create` mock SMS +
  `trip` function + driver page `/t/:token`) is what takes an `IN_TRANSIT` escrow further.
- No Realtime on `escrow:{dealId}` - unchanged gap from 4.3/4.4/4.5; the buyer's deal page and the
  farmer's Khata/lot-detail both update on refetch/refocus, not live.
- **Next item: 4.7** `shipments` + `shipments-create` (SMS mock, link shown on screen) + `trip`
  function + driver page `/t/:token` (delivery photo + OTP).

### 4.7 `shipments` + `shipments-create` + `trip` + driver page `/t/:token` — 2026-09-23

**What it does:** the P0 "simple driver page" (SPEC.md §4.16, §5.3, §5.4, §5.6, §5.7, §9.2 Phase 4
"4.7") - the farmer's own way to get an `IN_TRANSIT` escrow moving, until Phase 5's full logistics
exists. **Two steps, decided with the user (plan step):** 4.6's "Mark dispatched" button is
unchanged; the blue "On the way" card on `LotDetailPage` now also shows `DriverLinkCard` - a small
form (vehicle number + driver phone) → "Send link to driver". `shipments-create` (new Edge
Function) makes a random 32-byte token, stores only its SHA-256 hash (`shipments.trip_token_hash`,
`_shared/domain/tripToken.ts` - same "never store the secret itself" shape `deliveryOtp.ts` set for
the delivery code), and returns the link. **Decided with the user: "show once + new link."** The
link is shown exactly once, right in that response - `DriverLinkCard` never reads it back from
anywhere, because there's nothing to read (only the hash exists). A reload shows "Driver link made
for MH15AB1234" instead; "Make a new link" calls `shipments-create` again, which rotates the same
row's token (old link stops working) via `upsert` on `deal_id`.

The link opens `/t/:token` - `TripPage`, outside `RequireAuth`/`AppShell` (no login, no bottom
nav), the driver's whole page. It calls only the new `trip` Edge Function, a small router keyed on
the path after the function name (`trip/<token>` / `trip/<token>/pod` / `trip/<token>/otp`) -
`supabase-js`'s `functions.invoke()` builds the URL as `${functionsUrl}/${name}` with no extra
parsing, so `callFunction()` (`lib/callFunction.ts`) just needed an optional `method` added (for
`trip`'s `GET`) and already passed a `FormData` body through untouched. Two steps in the prototype
(SPEC §5.4 lists five - weigh/start/locations are Phase 5's full driver checklist, **P1**, out of
scope, AGENTS.md "prototype scope"):
1. `IN_TRANSIT` → reuses `SmartFrameCamera` (`shots={1}`) for a delivery photo. `trip`'s `POST
   /pod` uploads it to the new private `pod` bucket, then calls `record_pod()` (new SQL function,
   same "one function, one transaction" shape `fund_escrow()`/`mark_dispatched()` use):
   `IN_TRANSIT → DELIVERED`, sets `auto_release_at` (via `escrow_transition()`), writes one `pods`
   row and one 🟡 `khata.deliveredLocked` Khata row (still yellow - the money is still locked,
   just waiting on the code/timer instead of the truck. `khata_colour` has no fourth shade for
   "delivered", so yellow is reused on purpose, not a new enum value for one row shape).
2. `DELIVERED` → a 4-digit code entry. `trip`'s `POST /otp` recomputes `deliveryOtp(OTP_PEPPER,
   escrowId)` (4.5) and compares it server-side, then calls `record_otp_attempt()` (4.5, had no
   caller until now) for the 5-try lock. A locked escrow (`OTP_LOCKED`) is 4.5's own deferred
   "admin alerted" event, now real: `handle()`'s own log line fires it, no extra code needed.
   **A correct guess only reports `{correct: true}` in the prototype - it does not call
   `escrow-release` yet** (`ponytail:` comment in `trip/index.ts`'s own `handleOtp` - that wiring
   is **4.8**, same as 4.9's 24 h timer will also reach `RELEASED` independently).

**Also fixed (cross-cutting, found while building `trip`):** `_shared/http.ts`'s error-log line
picked the function name from the URL's last path segment - fine for every function so far, but
`trip` has extra path segments after its own name, and the last one is either the token itself (a
`GET`) or `pod`/`otp` (any other call). Logging the token would have broken CLAUDE.md §5 "never
log trip tokens". Fixed by anchoring on the `v1` segment instead (`fnNameFromUrl()`) - the real
function name regardless of what follows it. Redeployed every function so the fix is live
everywhere, not just `trip`.

**Decided with the user (plan step): no `ALLOW_SIMPLE_DISPATCH`-style flag, no offline queue.**
Both driver actions need internet in the prototype - there's no `tripQueue` (SPEC §5.8) yet, so a
driver without signal sees a calm "needs internet" screen instead of a queued upload that would
never send. `ponytail:` comments in `trip/index.ts` and the migration name the upgrade path
(Dexie's `tripQueue` + a background sync runner, same shape `offline/outbox.ts` already has).

**Files:** `supabase/migrations/20260923220000_shipments.sql` (new - `shipments`, `pods`, `pod`
bucket, `record_pod()`), `supabase/tests/shipments.sql` (new, 18 checks), `supabase/functions/
_shared/domain/tripToken.ts` (new, pure), `supabase/functions/_shared/domain/schemas/shipment.ts`
(new - `ShipmentCreateInput/Result`, `TripStateResult`, `PodInput/Result`,
`OtpSubmitInput/Result`), `supabase/functions/shipments-create/index.ts` (new),
`supabase/functions/trip/index.ts` (new - the router, `record_pod`/`record_otp_attempt` callers),
`supabase/functions/_shared/http.ts` (`fnNameFromUrl()` fix), `supabase/config.toml`
(`shipments-create`/`trip` blocks), `scripts/check-functions.sh` (`TRIP_NOT_FOUND` accepted as
`trip`'s own-auth-ran code), `scripts/set-key.sh` (`APP_URL` added to `KEYS`), `app/src/lib/
callFunction.ts` (optional `method`, `FormData` body type), `app/src/lib/errors.ts`
(`DEAL_NOT_FOUND`/`TRIP_NOT_FOUND`/`OTP_LOCKED`), `app/src/services/shipments.ts` (new -
`useShipmentForDeal()`, `useCreateShipment()`), `app/src/services/trip.ts` (new - `useTrip()`,
`useUploadPod()`, `useSubmitOtp()`), `app/src/components/logistics/DriverLinkCard.tsx` (new),
`app/src/routes/trip/TripPage.tsx` (new), `app/src/routes/farmer/LotDetailPage.tsx`
(`DriverLinkCard` under the blue card), `app/src/services/khata.ts` (`khata.deliveredLocked` added
to `KHATA_TITLE_KEYS`), `app/src/app/router.tsx` (`/t/:token`, outside `RequireAuth`),
`app/src/locales/{en,hi,mr}.json` (`lots.deal.driverLink*`, `khata.deliveredLocked`, `trip.*`, 3
error keys), `app/src/lib/database.types.ts` + `supabase/functions/_shared/database.types.ts`
(regenerated), `SPEC.md` §3.1/§5.4/§5.6/§5.8/§9.5 (document what's actually built vs. Phase 5's
full checklist, the derived-not-stored token, "show once + rotate", no offline queue yet).
**Mocked:** SMS - never sent; the link is shown once, on the farmer's own screen, with a
`DemoDataTag` and a line saying to share it themselves (call/WhatsApp/read it out).
**Real:** everything else - the token, its hash, the delivery photo upload, the OTP check against
the real derived code, the 5-try lock, verified against `cropket-dev` end-to-end by hand with
`curl` (see below) since the driver page has no login to script through with a test-OTP JWT.
**How to test by hand:** as farmer `9090910001` with an `IN_TRANSIT` deal (dispatch one with 4.6's
button first), open the lot - a neel "Send a link to the driver" card shows under the blue "On the
way" card; enter a vehicle number and phone, tap "Send link to driver" - the real link shows once
with Copy/Share and a "Demo data" tag. Open that link in a private window (no login) - a full-
screen camera (like Scan crop) with the vehicle number and crop/kg in the header; take a photo -
the page moves to "Enter the buyer's code". As buyer `9090910002`, read the code from the deal
page's `OtpDigits` card; type a wrong code on the driver page - "Wrong code, 4 tries left"; the
right code - "Code correct ✅". Back on the farmer's Khata, the deal's row now reads "Delivered,
money still locked" (still 🟡). "Make a new link" on the farmer's card replaces the link; the old
one now shows "This link has expired or is not valid." Checked at 360 px in English, Hindi and
Marathi (the driver page has its own `LanguageSwitch`, no login needed to change it).
**Tests:** `supabase/tests/shipments.sql` (18/18 - seller-only read, `trip_token_hash` not
selectable even to the seller, no client insert, `record_pod` moves `IN_TRANSIT → DELIVERED`, sets
`auto_release_at` to ~24 h out, one `pods` row, one event, one yellow Khata row, idempotent repeat,
a `FUNDED` escrow refused, an unknown shipment id refused, only `service_role` may call it). `bash
scripts/test-sql.sh` - full suite green, 21/21 files. `app/tests/unit/domain/tripToken.test.ts`
(5/5 - 43-char base64url shape, never repeats, a known sha256 vector, always 64 hex chars,
deterministic). `app/tests/unit/domain/schemas/shipment.test.ts` (10/10 - vehicle number
normalises spaced/hyphenated input and rejects a bad shape, phone rejects a bad first digit and
wrong length, OTP input accepts only 4 digits). `pnpm lint && pnpm typecheck && pnpm test` (330
tests, 15 new) `&& pnpm build` all pass. `impeccable detect app/src` - 0 anti-patterns. Deployed
`shipments-create` and `trip` to `cropket-dev` (redeployed every function for the `http.ts` log
fix); `bash scripts/check-functions.sh` passes both, live. Verified by hand with `curl` end-to-end
through the real flow (`place_bid` → `accept_bid` → `escrow-pay` → `mark_dispatched` →
`shipments-create` → `trip` GET/pod/otp, using real farmer/buyer JWTs from the test-OTP endpoints):
`shipments-create` bad input → 400, buyer JWT → 403, unknown deal → `DEAL_NOT_FOUND`, a `FUNDED`
(not yet dispatched) escrow → `ESCROW_WRONG_STATE`, a repeat call rotates the token; `trip`'s GET
reflects the true escrow state, `POST /pod` with a real JPEG moves it to `DELIVERED`, `POST /otp`
counts down `triesLeft` on 5 wrong tries then returns `OTP_LOCKED` and stays locked, an unknown
token → `TRIP_NOT_FOUND`.
**Next / known gaps:**
- **A correct code doesn't release money yet** - `trip`'s `POST /otp` only reports `correct: true`
  today. **4.8** (`escrow-release`) is what a correct guess (and 4.9's 24 h timer) will actually
  call next.
- No transporter picker (`transporters` table, seeded in 2.1, still unused) - the farmer types the
  driver's phone and vehicle number by hand. Phase 5 (P1) adds truck booking from it.
- No admin view of the driver link - decided with the user (plan step); SPEC §9.5 updated to match.
  If it's ever needed, `shipments`' own `shipments_select_seller` RLS policy would need an admin
  policy alongside it, same shape `buyer_kyc`'s admin approve flow already has.
- No offline `tripQueue` - both driver actions need internet in the prototype (see "Decided with
  the user" above). A driver with no signal sees a calm message, not a queued upload.
- `SmartFrameCamera` is reused as-is for the delivery photo - its own copy ("Scan onion", the ₹10
  coin hint) is farmer-scan wording that doesn't quite fit a delivery photo. A driver-specific
  camera variant is a nice-to-have, not P0 - the dark-photo guard and ≤ 300 KB compression it gives
  for free were worth the mismatched copy for a prototype.
- No Realtime on the trip/escrow state - unchanged gap from 4.3-4.6; the driver page refetches
  after each upload rather than updating live, and the farmer's own screens still need a manual
  refresh to see "Delivered" appear.
- Vehicle number validation is a generic Indian-plate shape (2 letters + 1-2 digits + 1-3 letters +
  4 digits), not a real RTO registry check - it only needs to catch a typo before the link goes to
  a stranger's phone.
- **Next item: 4.8** `escrow-release` (split, payouts, Khata 🟢).

### 4.8 escrow-release (split, payouts, Khata 🟢) — 2026-09-23

**What it does:** the last P0 money step (SPEC.md §5.3, §5.4, §5.6, §5.7, §9.2 Phase 4 "4.8"). Until
now a correct delivery code (4.7's `trip` `POST /otp`) only reported `{correct: true}` - the escrow
stayed `DELIVERED` and no money moved. `release_escrow()` (new SQL function, same "one function,
one transaction" shape `fund_escrow()`/`mark_dispatched()`/`record_pod()` all use) is the only way an
escrow reaches `RELEASED`: `DELIVERED → RELEASED` via `escrow_transition()`, then `payouts` rows and
one green `khata_entries` row per farmer, all in one transaction. It's handed the payout lines
(already computed) as jsonb and just checks they sum to the escrow total exactly (`SPLIT_MISMATCH`
if not) - it doesn't call `split.ts` itself, since a SQL function can't import TypeScript. It also
refuses anything that isn't `DELIVERED` (`ESCROW_WRONG_STATE`) - this is what stops 4.9's future
24h timer from ever releasing a `DISPUTED` escrow, and is idempotent on an already-`RELEASED` escrow
(the row lock plus this branch is what makes "two parallel releases give one release" true).
**Decided with the user (plan step): `escrow-release` is a shared module, not a deployed Edge
Function.** SPEC's own row for it has no HTTP caller of its own - only other server-side code
(`trip`'s `POST /otp` today, 4.9's `cron-auto-settle` next) - so `_shared/release.ts`'s
`releaseEscrow(escrowId, reason)` is a plain function `trip/index.ts` imports directly. No network
hop, no internal secret, no `config.toml` block, one fewer thing to deploy. It loads the escrow/
deal/lot, calls `splitRelease()` (4.2, already 100%-branch-tested, unchanged), sends the lines to a
new `cashfree.releaseSplit()` adapter call (mock: an instant `mock_<order>` provider ref; real: not
built, 502s - same honesty rule `createOrder`'s real.ts already follows), then `release_escrow()`.
Split first, DB second, so a failed real-mode call throws before any row changes (CLAUDE.md §5
"Money (fail closed)") - the escrow stays `DELIVERED` instead of moving to `RELEASED` with no real
payout behind it.
**A real bug caught by hand-testing, not by the SQL tests:** after wiring `trip`'s `handleOtp` to
call `releaseEscrow()`, a retried OTP submission (the correct code already released the money, but
the driver's page never saw the reply - a lost response, not a wrong guess) hit
`record_otp_attempt()`'s own `state <> DELIVERED` guard and threw `ESCROW_WRONG_STATE`, since the
escrow was no longer `DELIVERED` by the time the retry landed. The pgTAP tests for `release_escrow()`
itself couldn't catch this - it's a `trip`/`record_otp_attempt` interaction, one level up from what
that function tests. Fixed with one guard at the top of `handleOtp`: if the escrow is already
`RELEASED`, report `{correct: true}` straight from that fact, without calling `record_otp_attempt()`
again at all. Found and fixed by driving the real deployed `trip` function end to end with `curl`
(see below), not guessed.
**Files:** `supabase/migrations/20260923230000_release_escrow.sql` (new - drops the `not null` on
`payouts.to_user` + a check constraint requiring it for every type except `platform_fee`,
`release_escrow()`), `supabase/tests/release_escrow.sql` (new, 15 checks), `supabase/functions/
_shared/release.ts` (new - `releaseEscrow()`), `supabase/functions/_shared/http.ts` (`rpcAppError()`
moved here from `trip/index.ts` so both `trip` and `release.ts` share one "Postgres error text →
coded AppError" mapping instead of two copies), `supabase/functions/_shared/domain/schemas/
escrow.ts` (`CashfreeSplit`), `supabase/functions/_shared/integrations/cashfree/{index,mock,real,
types}.ts` (`releaseSplit()` added alongside `createOrder()`, same mock/real split), `supabase/
functions/trip/index.ts` (`handleOtp` calls `releaseEscrow()` on a correct guess; the already-
RELEASED retry guard above), `app/src/services/trip.ts` (`useSubmitOtp` now invalidates the trip
state on every settle, so a correct guess's own refetch picks up `RELEASED` and the page's existing
"state past DELIVERED" fallback shows "Delivery done" - no new UI needed there), `app/src/services/
khata.ts` (`khata.received` added to `KHATA_TITLE_KEYS`), `app/src/routes/farmer/LotDetailPage.tsx`
(Sold card gets a `RELEASED` branch, pass-green, "Money received ✅"), `app/src/routes/buyer/
BuyerHome.tsx` ("My deals" pill gets a `RELEASED` state, "Paid to farmer"), `app/src/routes/buyer/
BuyerDealPage.tsx` (the locked card turns pass-green with "Paid to the farmer" once `RELEASED` - the
delivery-code card is already hidden by then, `CODE_VISIBLE_STATES` never included `RELEASED`),
`app/src/locales/{en,hi,mr}.json` (`lots.deal.received`, `khata.received`, `deal.paidTitle`/
`paidBody`/`statusPaid`), `app/tests/unit/integrations/cashfree.test.ts` (+2 - `releaseSplit`'s mock
output passes `CashfreeSplit`), `app/src/lib/database.types.ts` + `supabase/functions/_shared/
database.types.ts` (regenerated), `SPEC.md` §3/§5.3/§5.4/§5.6/§7.2 (the shared-module decision, the
new `release_escrow` row, the nullable `to_user` column).
**Mocked:** Cashfree Easy Split's actual transfer (`mock_<order-id>` provider ref, same as
`escrow-pay`'s mock order). Mega-lot release isn't built - `release.ts` throws
`NOT_IMPLEMENTED mega_lot_deal` for a `lot_id`-less deal, same unchanged gap `fund_escrow()`/
`mark_dispatched()`/`record_pod()` all still carry (no mega-lot deal has ever reached `DELIVERED`).
Push to the farmer is skipped (out of prototype scope everywhere).
**How to test by hand:** drive the whole P0 chain for one deal - accept a bid, "Pay (demo)", "Mark
dispatched", make a driver link, open it in a private window, take the delivery photo, then enter
the buyer's code from their deal page. On the correct code the driver page moves straight to
"Delivery done ✅" (it skips the transient "Code correct" line, since the state refetch that follows
already shows past-`DELIVERED`). The farmer's Khata now shows a 🟢 row ("money received") and
"Received this month" goes up; the lot's Sold card turns pass-green ("Money received ✅"); the
buyer's deal page turns pass-green ("Paid to the farmer") and BuyerHome's pill reads "Paid to
farmer". Re-opening the driver link and submitting any code again still says "Code correct" (the
retry guard) and changes nothing further. Checked at 360 px in English, Hindi and Marathi.
**Verified live against `cropket-dev`, not just pgTAP** (curl, farmer `9090910001`/`910001`, buyer
`9090910002`/`910002`): built a fresh lot → bid → deal → escrow through the real deployed functions
(`place_bid`, `accept_bid`, `escrow-pay`, `mark_dispatched`), then drove the real deployed `trip`
function through pod upload and OTP entry end to end. Confirmed in the table editor afterward: the
escrow reached `RELEASED`; exactly 2 `payouts` rows summing to the escrow total (`farmer_share` to
the farmer, `platform_fee` with `to_user` null); one green `khata_entries` row at the farmer's
share; the full `escrow_events` trail (`CREATED → FUNDED → IN_TRANSIT → DELIVERED → RELEASED`, one
row each, the last one's reason `"otp"`). A wrong code before the right one counted down
`triesLeft`. Resubmitting the correct (and even a wrong) code afterward both correctly reported
`{correct: true}` with no further DB change (the retry-guard fix above, confirmed live after
redeploying `trip`). All test rows deleted afterward so `cropket-dev` stays clean, same as 2.1's ORS
hand-test.
**Gap hit hand-testing this, not caused by it:** `shipments-create` failed with
`SETUP_MISSING_KEY APP_URL` - 4.7 added `APP_URL` to `scripts/set-key.sh`'s `KEYS` list but it was
never actually set. Worked around for this test by inserting the `shipments` row directly (same
token-hashing `tripToken.ts` uses) instead of through the function, so the real `trip` function
itself could still be driven end to end. Added to the 🔑 Keys block below - this blocks a farmer
from actually making a driver link today, unchanged by 4.8, but worth fixing before the next demo.
**Tests:** `supabase/tests/release_escrow.sql` (15/15 - the happy path, both payout rows exactly at
the split amounts with `platform_fee`'s `to_user` null, one green Khata row, an idempotent repeat,
`IN_TRANSIT` and `DISPUTED` both refused, a mismatched payout total refused and leaves the escrow
untouched, an unknown id refused, only the service role may call it, a direct insert violating the
new check constraint). `bash scripts/test-sql.sh` - 20/22 files green; the 2 failures
(`escrow_transition.sql`, `rls_crop_photos.sql`) are pre-existing and unrelated to this change (see
below), confirmed by running them in isolation. `pnpm lint && pnpm typecheck && pnpm test` (332
tests, 2 new) `&& pnpm build` all pass. The `impeccable` CLI isn't installed in this environment
(unlike earlier milestones' sessions) - each edited file was still checked by the editor's own
impeccable hook as it was written, with no issues found; a full `impeccable detect app/src` pass is
still worth running once the CLI is available again.
**Pre-existing SQL test failures, not caused by this change:**
- `escrow_transition.sql`'s test 5 counts `select count(*) from escrow_events` with no `where`
  clause, assuming the table starts empty in this shared dev database. Earlier milestones' own
  hand-testing (curl, real `escrow_transition`/`fund_escrow`/`mark_dispatched`/`record_pod` calls
  against `cropket-dev`) left 8 real committed rows behind, so the test now sees `21` instead of the
  `13` it expects. Confirmed pre-existing: the 8 rows' timestamps predate this session. Fix is a test
  change (scope the count to the escrow ids this file itself creates), not a schema/function change
  - flagged here rather than touched, per AGENTS.md §6 "never weaken a test without asking".
- `rls_crop_photos.sql`'s test 5 (`lives_ok` on an upsert) fails with `42P10: there is no unique or
  exclusion constraint matching the ON CONFLICT specification` against `storage.objects` -
  unrelated to escrow/storage entirely; looks like a Supabase-platform-side change to that table's
  constraints since the test was written. Also pre-existing, also not touched.
**Next / known gaps:**
- Mega-lot release isn't built - unchanged gap, see "Mocked" above.
- No push notification when money is released - out of prototype scope (push is skipped everywhere).
- No admin view of a release event - Phase 5/P1, same as 4.7's own "no admin view of the driver
  link" note.
- The two pre-existing SQL test failures above need their own fix (or at least a triage) before
  they're mistaken for a regression by someone who didn't read this note.
- **Next item: 4.9** `cron-auto-settle` + pg_cron schedule + admin skip-timer (`escrow-skip-timer`)
  + `Countdown` - the 24h timer path to the same `releaseEscrow()` this item built.

