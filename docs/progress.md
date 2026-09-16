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
- [ ] 0.6 Offline base: TanStack Query persistence, Dexie schema, outbox runner, `DataAge`
- [ ] 0.7 `VoiceButton` (browser voice + a few clips in `public/audio/`)
- [ ] 0.8 PWA install (vite-plugin-pwa), opens offline in `pnpm preview`

## M1 — Farmer core
- [ ] 1.1 Chat-style onboarding (taps + GPS location)
- [ ] 1.2 `SmartFrameCamera` (blocks dark photos, 3 shots, compress ≤ 300 KB) + upload to `crop-photos`
- [ ] 1.3 `grade_results` table + `grade` Edge Function + `integrations/ai` adapter (mock first)
- [ ] 1.4 AI service: onion grading v1 (OpenCV) + pytest with sample photos
- [ ] 1.5 Grade result screen (`GradeBadge`, `GradeBreakdown`) + spoken grade + low-confidence message
- [ ] 1.6 `lots` table + create lot (`NumberPad`, GPS) + QR (`QRLabel`) + My Lots + lot detail
- [ ] 1.7 Offline scan: photos + lot saved on phone, grade requested when back online

## M2 — Market intelligence
- [ ] 2.1 Tables `mandis`, `mandi_prices`, `mandi_heat`, `crop_rules`, `weather_daily`, `transporters` + seed (5 Nashik mandis, 60 days of prices, weather, 6 transporters)
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

## 🔑 Keys and 🧰 tools still needed

<!-- Claude Code keeps this list current. Remove a line when it's done. -->

_(none yet)_
