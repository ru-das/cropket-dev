# Cropket prototype — progress

Claude Code ticks items here and fills a handoff note after each feature.
Scope: `SPEC.md` §9.5. Rules: `CLAUDE.md`.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `(mock)` = uses a mock for now

---

## M0 — Foundation
- [ ] 0.1 Repo skeleton: `app/` (Vite + React + TS + Tailwind v4 + shadcn/ui), `supabase init`, `ai-service/` with `GET /health`, `.env.example` files, `.gitignore`, ESLint (no hard-coded text rule), Prettier, Vitest, `ci.yml` (lint, typecheck, Vitest, pytest)
- [ ] 0.2 Design tokens (`tokens.css`), bundled fonts, `config.ts` with "Setup needed" screen
- [ ] 0.3 i18n (`en`, `hi`, `mr`) + `LanguageSwitch` + locales test
- [ ] 0.4 App shell: `AppHeader`, `BottomNav`, `NetworkBanner`, `SyncStatus`, Welcome screen
- [ ] 0.5 `profiles` table + roles + RLS + RLS test; phone OTP login (test numbers); role pick; `RequireAuth` / `RequireRole`; three different homes (farmer, buyer, FPO) + admin
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

_(none yet)_

## 🔑 Keys and 🧰 tools still needed

<!-- Claude Code keeps this list current. Remove a line when it's done. -->

_(none yet)_
