# Cropket — SPEC.md

Cropket is an offline-first mobile app (Android APK + installable web app) for small farmers and FPOs in India. A farmer scans their crop with the phone camera and gets an AI quality grade spoken in their language. They see fair local mandi prices and sell/hold advice, and sell to verified buyers through live bidding. Payment is locked by a regulated payment partner and released after proven delivery, and the farmer sees it all in a simple colour-coded passbook ("Digital Khata"). Later layers add logistics proof, dispute rescue, and consent-based micro-credit.

- **Pilot area:** Nashik district, Maharashtra.
- **First crop:** onion. Tomato and potato come next.
- **Languages:** English, Hindi, Marathi.

This file is the single source of truth. If code and this file disagree, fix one of them in the same change.

> **Current scope: prototype.** We are building a demo version of **Phases 0–4 (P0 items only)**, with mocks where noted. See **§9.5 Prototype scope**. Everything else in this file is the full plan for later.

---

## 1. Tech stack selection (with reasoning)

### 1.1 Guiding needs
1. **Offline-first.** Farmers often have weak or no internet. The app must open, scan, save lots, and show the last known prices and Khata with zero signal.
2. **Low-literacy friendly.** Voice, icons, big buttons, three languages.
3. **Money must be safe.** Money rules are atomic, audited, and never run on the phone.
4. **Small team, free tiers.** One codebase for web + Android. Hosted services with free plans.

### 1.2 Architecture in one picture
```
┌──────────────── Phone (APK or browser) ─────────────────┐
│ React app — all app files live on the phone             │
│  ├─ TanStack Query cache  (saved to IndexedDB)          │
│  └─ Dexie (IndexedDB): drafts, photos, outbox queue     │
└──────────┬───────────────────────────────┬──────────────┘
           │ supabase-js (when online)     │ outbox sync
           ▼                               ▼
┌────────────────────────── Supabase ─────────────────────┐
│ Postgres + PostGIS + Row Level Security + SQL functions │
│ Auth (phone OTP) · Storage · Realtime · pg_cron/pg_net  │
│ Edge Functions: secrets, payments, webhooks, driver     │
│ link, cron jobs, all outside APIs                       │
└──────────┬───────────────────────────────┬──────────────┘
           ▼                               ▼
   FastAPI AI service              Outside services (real or mock):
   (grading, OCR)                  Cashfree, data.gov.in, OpenRouteService,
                                   Bhashini, FCM, Open-Meteo, gov APIs
```

### 1.3 The stack

| Layer | Choice | Reasoning |
|---|---|---|
| Language | TypeScript (app + Edge Functions), Python 3.12 (AI) | Types protect money code. Python has the best image libraries. |
| Build tool | **Vite** | Builds plain static files that Capacitor can bundle inside the APK, so the app opens with no internet. |
| UI library | **React 19** | Large ecosystem, works well with shadcn/ui. |
| Routing | **React Router** (browser router) | Standard for single-page apps. Works inside Capacitor and on static hosting. |
| Styling | **Tailwind CSS v4 + shadcn/ui** | Fast to build, easy theming, components live in our code. |
| Icons | lucide-react + emoji for crops (🧅🍅🥔) | Light and instantly understood. |
| Fonts | **Mukta** (body) + **Baloo 2** (numbers, headings), bundled with `@fontsource` | Both cover Devanagari and Latin. Bundled so they work offline (no font CDN). |
| Server data + offline reads | **TanStack Query** with IndexedDB persistence | Caches every screen's data on the phone and shows it when offline, with the data's age. |
| Offline writes | **Dexie** (IndexedDB) | Stores drafts, photo blobs and the outbox queue. Easy API, survives app restarts. |
| Small UI state | **Zustand** | Language, camera state, sync status. Server data never goes here. |
| Forms / validation | react-hook-form + **zod** | The same zod schemas validate forms, Edge Function inputs and synced data. |
| i18n | **react-i18next** (en, hi, mr) | Translations are bundled, so they work offline. Numbers use `Intl.NumberFormat('en-IN')` (₹1,50,000). |
| PWA | **vite-plugin-pwa** (Workbox) | Makes the web version installable and cached offline. |
| Mobile app | **Capacitor (Android)**, with the Vite build bundled inside | Real APK, instant start offline. Native camera, GPS, push, secure storage. |
| Database | **Supabase Postgres** + PostGIS + pg_cron + pg_net | Auth, storage, realtime and DB in one free service. PostGIS gives distance queries ("within 50 km"). |
| Auth | Supabase phone OTP; session stored with Capacitor Preferences in the APK | Farmers have phones, not emails. Session survives offline restarts. |
| Files | Supabase Storage (private buckets, signed URLs) | Crop photos, weigh slips, delivery photos, consent audio. |
| Realtime | Supabase Realtime | Live bids, flash sales, escrow status, truck tracking. |
| Server logic | **Supabase Edge Functions** (Deno, TypeScript) | Keeps secrets off the phone. Handles payments, webhooks, cron jobs and the driver link. |
| Atomic DB logic | **Postgres functions (RPC)** | Placing a bid, accepting a bid, moving escrow — all-or-nothing, with row locks. |
| AI service | **FastAPI** + OpenCV + PaddleOCR | Stateless: gets images, returns JSON, never writes to the DB. |
| Payments | Cashfree Payment Gateway + Easy Split (sandbox), behind an adapter with a mock mode | An RBI-regulated partner holds the money. Easy Split can split a captured payment and delay settlement. |
| Maps | MapLibre GL JS + MapTiler tiles; OpenRouteService for routes and distance | Free keys, no card needed. |
| Weather | Open-Meteo | Free, no key. |
| Voice output | Bundled audio clips → Bhashini TTS (via Edge Function) → browser `speechSynthesis` | Many phones have no Marathi voice installed. Fixed phrases are bundled so they work offline. |
| Voice input | Web Speech API (`hi-IN`, `mr-IN`), Bhashini ASR adapter | Free in Chrome on Android. Needs internet. A typed or number-pad fallback is always shown. |
| QR | `qrcode.react` (make); `@capacitor-mlkit/barcode-scanning` (APK), `@zxing/browser` (web) (scan) | Fast native scanning in the APK, with a web fallback. |
| Charts | Recharts | Simple 30-day price line. |
| Push | Firebase Cloud Messaging | Bid, flash-sale and payment alerts. |
| Testing | Vitest, Playwright, SQL tests (pgTAP) run with `psql` on the dev project, pytest | Escrow is tested most. No Docker needed. |
| Hosting | Vercel (static web build), Supabase Cloud (Mumbai), Hugging Face Spaces or Railway (AI) | Free tiers, close to users. |
| CI | GitHub Actions | Lint, type-check, tests, migrations, function deploy. |

### 1.4 Do not add
- **Next.js or any server-rendering framework.** The app must run entirely from files on the phone.
- **A separate Node/Express backend.** Use SQL functions and Edge Functions.
- **Redux.** Use TanStack Query for server data and Zustand for small UI state.
- **Blockchain / smart contracts.** The append-only `escrow_events` table is the audit trail.
- **An in-house wallet or money holding.** Money stays with the regulated payment partner.
- **Heavy ML frameworks in the first version.** Grading starts rule-based with OpenCV.
- **Any secret key in the app.** Everything in the app bundle is public.

### 1.5 Versions
Use the latest stable versions at setup, then **pin exact versions** in `package.json`, `deno.json` and `requirements.txt`. Do not upgrade packages unless asked.

---

## 2. Data sources and APIs

### 2.1 Sources

| Source | Used for | Mode | Notes |
|---|---|---|---|
| data.gov.in — "Current Daily Price of Various Commodities from Various Markets (Mandi)" (Agmarknet) | Today's mandi prices | **Real** | Free API key. Returns today's min / max / modal price per market. The public sample key returns only 10 rows, so use our own key. |
| data.gov.in variety-wise daily price data + Agmarknet CSV downloads | Price history | **Real, imported once** | Import Nashik onion / tomato / potato history with `scripts/import-agmarknet-csv.ts`. |
| Our daily price collector (`fetch-prices` function) | Growing price history | **Real** | Runs every day from the first day of development. |
| Mandi arrival volumes | Heatmap | **Seeded + estimated** | Seeded values plus live counts of our own new lots within 50 km. |
| Open-Meteo | Rain forecast for sell/hold advice | **Real** | Fetched daily per district and stored in `weather_daily`. |
| OpenRouteService | Road distance, time, alternative routes | **Real** | Results cached for 24 h in `route_cache`. |
| MapTiler | Map tiles | **Real** | Public key restricted by domain. Maps are online-only. |
| Bhashini (ULCA) | Hindi / Marathi TTS and ASR | **Real if key available, else fallback** | Pipeline API: search pipeline → config → compute. Called only from the `tts` Edge Function. |
| Cashfree PG + Easy Split | Collect, hold, split, release money | **Sandbox if Easy Split is enabled, else mock** | Easy Split must be activated by Cashfree support. |
| Supabase Auth SMS | Login OTP | **Test phone numbers** | Real SMS in India needs a provider and DLT registration. |
| SMS provider | Driver trip links | **Mock** | The mock logs the link and shows it on the admin page. |
| Firebase Cloud Messaging | Push notifications | **Real** | |
| PaddleOCR (in AI service) | Weighbridge and mandi-meter reading | **Real** | Manual entry with the photo kept as proof when confidence is low. |
| AgriStack | Land records | **Mock** | |
| DigiLocker / API Setu | Farmer ID, buyer GST / PAN | **Mock** | |
| ULI (Unified Lending Interface) | Consent-based data fetch for loans | **Mock** | |
| CERSAI / credit bureau | Existing loan / lien check | **Mock** | One seeded farmer always returns "lien found". |
| WDRA e-NWR | Warehouse receipts | **Mock** | |
| Krishi-DSS | Regional crop area (Glut Radar) | **Mock dataset** | |
| 3PL transport | Truck booking | **Mock** | Seeded transporters. |
| Meta WhatsApp Cloud API | Bot + WhatsApp Flows | **Test number** | |

### 2.2 Adapter pattern (rule for every outside service)

Every outside service has its own folder under `supabase/functions/_shared/integrations/`. It has three files:

```
_shared/integrations/cersai/
├── index.ts     ← the only file other code imports; picks mock or real
├── mock.ts      ← fake data, same shape as the real API
└── real.ts      ← real API call (may throw "NOT_IMPLEMENTED" for now)
```

```ts
// supabase/functions/_shared/integrations/cersai/index.ts
import { z } from "zod";
import * as mock from "./mock.ts";
import * as real from "./real.ts";
import { isMock } from "../mode.ts";

export const LienCheckResult = z.object({
  parcelId: z.string(),
  lienFound: z.boolean(),
  lenders: z.array(z.string()),
  checkedAt: z.string().datetime(),
  source: z.enum(["mock", "cersai"]),
});
export type LienCheckResult = z.infer<typeof LienCheckResult>;

export async function checkLien(parcelId: string): Promise<LienCheckResult> {
  const impl = isMock("cersai") ? mock : real;
  return LienCheckResult.parse(await impl.checkLien(parcelId)); // validate both modes
}
```

- `isMock(name)` is true when the name is in the `INTEGRATIONS_MOCK` secret (a comma-separated list) **or** when any key that adapter needs is empty. So a missing key never stops work; the feature runs in mock mode.
- Every result carries `source`. When the source is a mock, the UI shows a small grey **"Demo data"** tag next to it.
- The app never calls an outside service directly, except map tiles (public key) and the browser's own speech APIs.

### 2.3 Crop rules (seed data, one row per crop)

| crop | perishability (1–10) | max_hold_days | transit_loss_allowed % | has_msp | floor_method |
|---|---|---|---|---|---|
| onion | 3 | 30 | 2.0 | no | `p20_modal_30d` |
| potato | 3 | 45 | 1.5 | no | `p20_modal_30d` |
| tomato | 9 | 2 | 1.0 | no | `p20_modal_30d` |
| wheat (later) | 1 | 120 | 0.5 | yes | `msp` |

**Reference Floor Price** = if `has_msp` → MSP; else → the 20th-percentile modal price of the last 30 days in the district (plus a state MIS price if one is announced). It is **advisory**: it warns, it never blocks (APMC safe).

### 2.4 Formulas (v1, simple and explainable)

**Net-₹ (money you keep)**
```
gross      = price_per_quintal × quantity_kg / 100
transport  = route_km × rate_per_km(vehicle)            (ORS distance)
fees       = mandi commission % × gross  (0 for Cropket, farmer pays ₹0)
loss       = transit_loss % (crop_rules) × gross
damage     = route_risk_score × damage_factor × gross    (P2, smart routing)
you_keep   = gross − transport − fees − loss − damage
```

**Heatmap colour (per mandi, per crop)**
```
expected_today = govt_or_seeded_arrivals + (our Digital Lots within 50 km in last 24 h × weight)
ratio          = expected_today / avg_arrivals_30d
ratio > 1.3 → 🔴 Red (too much supply) · 0.8–1.3 → 🟡 Yellow · < 0.8 → 🟢 Green
```

**Sell / Hold advice v1 (rules, not magic)**
```
up_signals   = (7-day avg > 30-day avg) + (rain in next 3 days) + (arrivals falling)
down_signals = opposite of each
if up_signals ≥ 2 and crop can be held → "Hold N days" where N = min(5, max_hold_days)
else → "Sell now"
ALWAYS: N ≤ crop_rules.max_hold_days   (tomato never > 2)
Show the "Why?" line from the signals that fired.
```
v2 (P2): a Prophet / simple regression model in FastAPI, used only after enough price history is collected.

All formulas in this section are pure TypeScript in `supabase/functions/_shared/domain/`. The app imports the same files, so advice, Net-₹ and floor warnings also work offline from saved data. The screen shows how old that data is.

---

## 3. Project folder structure

One Git repo with three parts.

```
cropket/
├── CLAUDE.md                      ← short working rules for Claude Code
├── SPEC.md                        ← this file
├── README.md
├── .claude/settings.json          ← stops Claude Code reading .env files
├── docs/
│   ├── BUILD_GUIDE.md             ← step-by-step guide for the team
│   └── progress.md                ← milestone checklist + handoff notes
├── .github/workflows/
│   ├── ci.yml                     ← lint, typecheck, unit, SQL, pytest
│   └── deploy.yml                 ← migrations, Edge Functions, AI image
│
├── app/                           ← Vite + React (web build + Capacitor APK)
│   ├── index.html
│   ├── vite.config.ts             ← PWA plugin, alias @shared → ../supabase/functions/_shared/domain
│   ├── capacitor.config.ts        ← webDir: "dist"
│   ├── android/                   ← generated by Capacitor
│   ├── public/
│   │   ├── icons/
│   │   └── audio/{en,hi,mr}/      ← bundled voice clips (grade_a.mp3 …)
│   └── src/
│       ├── main.tsx
│       ├── app/
│       │   ├── router.tsx         ← all routes (see list below)
│       │   ├── providers.tsx      ← QueryClient + persistence, i18n, theme
│       │   └── guards.tsx         ← RequireAuth, RequireRole, RequireOnline
│       ├── routes/                ← one folder per role; pages only compose components
│       │   ├── welcome/  login/  onboarding/
│       │   ├── farmer/   buyer/  fpo/  admin/  salvage/  kiosk/
│       │   └── trip/              ← driver page (no login)
│       ├── components/
│       │   ├── ui/                ← shadcn
│       │   ├── shell/             ← AppHeader, BottomNav, LanguageSwitch, NetworkBanner, SyncStatus
│       │   ├── voice/             ← VoiceButton, MicInput, VoiceConsent
│       │   ├── camera/            ← SmartFrameCamera, DualFrameCamera
│       │   ├── lot/               ← GradeBadge, GradeBreakdown, LotCard, QRLabel
│       │   ├── market/            ← PriceHero, MandiHeatmap, MandiList, AdviceCard, NetRupeeTable, FloorWarning
│       │   ├── trade/             ← LiveBidBox, BidRow, VerifiedBadge, TrustStars
│       │   ├── money/             ← KhataRow, KhataSummary, Countdown, OtpDigits
│       │   ├── logistics/         ← TripChecklist, TrackingMap, WeightCompare
│       │   ├── rescue/            ← RescueTimeline, FlashSaleCard
│       │   └── common/            ← NumberPad, EmptyState, DemoDataTag, DataAge
│       ├── services/              ← ALL data access (supabase-js, RPC, functions, outbox)
│       │   ├── lots.ts  grading.ts  prices.ts  bids.ts  deals.ts  escrow.ts
│       │   ├── khata.ts  shipments.ts  disputes.ts  loans.ts  consents.ts
│       │   └── trip.ts
│       ├── offline/
│       │   ├── db.ts              ← Dexie schema
│       │   ├── outbox.ts          ← enqueue, process, retry
│       │   ├── sync.ts            ← runs on app start, on reconnect, every 60 s
│       │   ├── persist.ts         ← TanStack Query → IndexedDB
│       │   └── network.ts         ← online/offline state (Capacitor Network + browser)
│       ├── lib/
│       │   ├── supabase.ts        ← client with Capacitor Preferences storage in APK
│       │   ├── i18n.ts
│       │   ├── native.ts          ← isNative(), camera, geolocation, share wrappers
│       │   ├── voice/  speak.ts  listen.ts
│       │   └── errors.ts
│       ├── stores/                ← zustand: ui.ts, sync.ts
│       ├── locales/  en.json  hi.json  mr.json
│       └── styles/  tokens.css  globals.css
│   └── tests/  unit/  e2e/
│
├── supabase/
│   ├── config.toml                ← includes verify_jwt=false for webhook/cron/trip functions
│   ├── migrations/                ← numbered SQL files, one feature each
│   ├── seed.sql                   ← demo users, mandis, cold storages, transporters, prices
│   ├── tests/                     ← SQL tests: escrow transitions, RLS on every table
│   └── functions/
│       ├── deno.json              ← import map (so `import { z } from "zod"` works everywhere)
│       ├── _shared/
│       │   ├── domain/            ← PURE TypeScript, shared with the app (no Deno/browser APIs)
│       │   │   ├── money.ts  split.ts  netRupee.ts  advice.ts  heat.ts  floor.ts
│       │   │   └── schemas/       ← zod schemas for lots, bids, deals, sync items …
│       │   ├── integrations/      ← mode.ts + one folder per outside service
│       │   │   └── cashfree/ agmarknet/ ors/ bhashini/ fcm/ sms/ weather/
│       │   │       agristack/ digilocker/ uli/ cersai/ enwr/ transport/ whatsapp/ krishi_dss/
│       │   ├── http.ts            ← json(), error(), CORS, idempotency helper
│       │   ├── auth.ts            ← getUser(), requireRole()
│       │   └── db.ts              ← service-role client (server only)
│       ├── grade/  route-distance/  kyc-verify/  tts/
│       ├── escrow-pay/  cashfree-webhook/  escrow-release/  escrow-skip-timer/
│       ├── shipments-create/  trip/
│       ├── disputes-create/  dispute-resolve/  storage-booking/
│       ├── loans-lead/  push-send/
│       ├── cron-auto-settle/  cron-fetch-prices/  cron-fetch-weather/
│       └── whatsapp-webhook/
│
├── ai-service/                    ← FastAPI (stateless)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                ← routes + X-Service-Key check
│   │   ├── grading/  onion.py  tomato.py  common.py
│   │   ├── ocr/  weighbridge.py  mandi_meter.py  plate.py
│   │   ├── video_audit/  frames.py
│   │   └── pricing/  forecast.py
│   ├── samples/                   ← test images: good, dark, damaged, LED displays
│   └── tests/
│
└── scripts/
    ├── set-key.sh                 ← asks for API keys and saves them (list of all keys)
    ├── check-tools.sh             ← shows missing tools + install commands
    ├── test-sql.sh                ← runs supabase/tests/*.sql on the dev project
    ├── import-agmarknet-csv.ts
    ├── make-voice-clips.ts        ← generates app/public/audio/* once
    └── demo-reset.ts              ← restores the demo database state
```

### 3.1 Routes

| Path | Role | Works offline? |
|---|---|---|
| `/` | anyone (language pick) | yes |
| `/login`, `/onboarding` | anyone | no (first login needs internet) |
| `/farmer` | farmer | yes |
| `/farmer/scan`, `/farmer/scan/result` | farmer | yes (grade may be pending) |
| `/farmer/lots`, `/farmer/lots/:id` | farmer | yes |
| `/farmer/lots/:id/bids` | farmer | read-only saved copy; accepting needs internet |
| `/farmer/lots/:id/compare` | farmer | yes (from saved prices and distances) |
| `/farmer/prices` | farmer | yes (saved copy; map shows as a list) |
| `/farmer/deals/:id` | farmer | saved copy; consent needs internet |
| `/farmer/khata`, `/farmer/khata/statement` | farmer | yes (saved copy) |
| `/farmer/disputes`, `/farmer/loans`, `/farmer/consent-vault` | farmer | saved copy; actions need internet |
| `/buyer`, `/buyer/kyc`, `/buyer/lots/:id`, `/buyer/deals`, `/buyer/deals/:id`, `/buyer/flash-sales` | buyer | mostly online |
| `/fpo`, `/fpo/megalots`, `/fpo/members`, `/fpo/wallet` | fpo | saved copy |
| `/salvage` | buyer | online |
| `/admin`, `/admin/disputes`, `/admin/users`, `/admin/kyc`, `/admin/loan-leads` | admin, nbfc | online |
| `/kiosk` | kiosk operator | online |
| `/t/:token` | driver (no login) | photos and GPS queue offline; OTP needs internet |

### 3.2 Where logic lives (rules)
1. **Pure calculations** (money, splits, Net-₹, advice, heat colour, floor) → `_shared/domain/`, imported by both the app and the functions.
2. **All-or-nothing database changes** (place bid, accept bid, flash-sale buy, escrow moves) → Postgres functions called with `supabase.rpc()`.
3. **Anything with a secret or an outside call** → an Edge Function.
4. **Pages never call Supabase directly.** They use `app/src/services/*`, which decide between network, cache and outbox.

---

## 4. Page / screen designs (ASCII wireframes)

Mobile screens are drawn ~36 characters wide (a cheap Android phone). Buyer and admin screens are desktop-first but must still work on a phone.

Every farmer screen has: language switch + 🔊 at the top, one main action, big buttons (min 56 px tall).

### 4.1 Welcome (language first)
```
┌──────────────────────────────────┐
│                                  │
│            🌾 Cropket             │
│   Sahi daam. Surakshit paisa.    │
│                                  │
│  ┌────────────────────────────┐  │
│  │          English           │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │           हिंदी             │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │           मराठी             │  │
│  └────────────────────────────┘  │
│                              🔊  │
└──────────────────────────────────┘
```

### 4.2 Login
```
┌──────────────────────────────────┐
│ ←                   EN|हि|मरा  🔊 │
│                                  │
│  Your mobile number              │
│  ┌──────┬─────────────────────┐  │
│  │ +91  │ 98xxx xxxxx         │  │
│  └──────┴─────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │        Send OTP            │  │
│  └────────────────────────────┘  │
│                                  │
│  Enter the 6-digit code          │
│  [ _ ][ _ ][ _ ][ _ ][ _ ][ _ ]  │
│  Resend in 0:28                  │
└──────────────────────────────────┘
```

### 4.3 Onboarding (chat style, one question at a time)
```
┌──────────────────────────────────┐
│ Getting started          2 of 4  │
├──────────────────────────────────┤
│ 🌾 Who are you?               🔊  │
│                                  │
│ ┌──────────┐ ┌──────────┐        │
│ │   🧑‍🌾    │ │   🏢     │        │
│ │  Farmer  │ │  Buyer   │        │
│ └──────────┘ └──────────┘        │
│ ┌──────────┐                     │
│ │   👥     │                     │
│ │   FPO    │                     │
│ └──────────┘                     │
│                                  │
│ 🌾 Which crops do you grow?   🔊  │
│  [🧅 Onion] [🍅 Tomato] [🥔 Potato]│
│                                  │
│ ┌────────────────────────┬─────┐ │
│ │ Type or speak…         │ 🎤  │ │
│ └────────────────────────┴─────┘ │
└──────────────────────────────────┘
```
Only Farmer, Buyer and FPO can be picked here. Admin, NBFC and kiosk-operator accounts are created by the team in the database. Drivers have no account.

### 4.4 Farmer home
```
┌──────────────────────────────────┐
│ 🌾 Cropket         EN|हि|मरा   🔊 │
├──────────────────────────────────┤
│ Namaste, Ramesh              🔊  │
│ ▌🟡 ₹9,600 locked safely         │
├────────────────┬─────────────────┤
│      📷        │       📦        │
│   Scan crop    │    My lots      │
│            🔊  │             🔊  │
├────────────────┼─────────────────┤
│      📈        │       📒        │
│ Today's price  │    My khata     │
│            🔊  │             🔊  │
├────────────────┴─────────────────┤
│  🏦 Loans            🛡 My data   │
├──────────────────────────────────┤
│  🏠 Home   📦 Lots  📒 Khata  👤 Me │
└──────────────────────────────────┘
```
The strip under the name shows the single most important money status (colour + text). When offline, a second strip shows the sync state, for example: `🟧 No internet. 2 lots saved on phone.`

### 4.5 Scan crop (Smart Frame camera)
```
┌──────────────────────────────────┐
│ ←  Scan onion                 🔊 │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │  ┏━━━━━━━━━━━━━━━━━━━━━━┓    │ │
│ │  ┃                      ┃    │ │  frame GREEN = light OK
│ │  ┃   live camera        ┃    │ │  frame RED   = too dark
│ │  ┃   put ₹10 coin here ◯┃    │ │
│ │  ┗━━━━━━━━━━━━━━━━━━━━━━┛    │ │
│ └──────────────────────────────┘ │
│  Photo 1 of 3      ● ○ ○         │
│  ✅ Light is good                 │
│                                  │
│          ┌──────────┐            │
│          │    ⭕     │   ⚡ Flash  │
│          └──────────┘            │
└──────────────────────────────────┘
Too dark → button greyed: "Too dark. Turn on flash."
```

### 4.6 Grade result
```
┌──────────────────────────────────┐
│ ←  Your crop grade            🔊 │
│      ┌────────────────────┐      │
│      │                    │      │
│      │      Grade B       │ 🟨   │
│      │  Indicative grade  │      │
│      └────────────────────┘      │
│  Size    ████████░░  Medium      │
│  Colour  █████████░  Good        │
│  Damage  █░░░░░░░░░  5%          │
│  AI is 82% sure                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │   🔊  Hear the result      │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │   ✅  Create lot           │  │  ← primary
│  └────────────────────────────┘  │
│       🔁 Scan again               │
└──────────────────────────────────┘
If confidence < 70%: yellow box "Photo not clear. Scan again in daylight."
and lot is marked "Needs human check".
Offline: the photos are saved and the badge area shows "⏳ Grade will come when internet returns".
The farmer can still create the lot; it is saved on the phone as a draft.
```

### 4.7 Create lot (weight) → Lot detail with QR
```
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│ ←  How many kg?               🔊 │   │ ←  Lot L-2041                 🔊 │
│                                  │   │ ┌──────┐  Onion   Grade B       │
│          ┌──────────┐            │   │ │photo │  500 kg                │
│          │   500    │ kg         │   │ └──────┘  Status: For sale      │
│          └──────────┘            │   │                                  │
│   ┌────┬────┬────┐               │   │   ┌────────────┐                 │
│   │ 1  │ 2  │ 3  │               │   │   │  ▓▓▓▓▓▓▓▓  │                 │
│   ├────┼────┼────┤               │   │   │  ▓▓ QR ▓▓  │  L-2041         │
│   │ 4  │ 5  │ 6  │               │   │   │  ▓▓▓▓▓▓▓▓  │                 │
│   ├────┼────┼────┤               │   │   └────────────┘                 │
│   │ 7  │ 8  │ 9  │               │   │  ┌────────────────────────────┐  │
│   ├────┼────┼────┤               │   │  │ 📈 Check price first       │  │
│   │ ⌫  │ 0  │ 🎤 │               │   │  └────────────────────────────┘  │
│   └────┴────┴────┘               │   │  ┌────────────────────────────┐  │
│ 📍 Location: Niphad (from GPS)   │   │  │ 🛒 Sell on Cropket         │  │
│ ┌────────────────────────────┐   │   │  └────────────────────────────┘  │
│ │        Save lot            │   │   │     🖨 Print crate QR codes       │
│ └────────────────────────────┘   │   └──────────────────────────────────┘
└──────────────────────────────────┘
```

### 4.8 Prices + heatmap + advice
```
┌──────────────────────────────────┐
│ ←  Onion price today          🔊 │
│                                  │
│  ₹1,850 per quintal    ⬆ ₹60     │
│  Lasalgaon mandi, updated 11 AM  │
│ ┌──────────────────────────────┐ │
│ │   🔴 Lasalgaon                │ │
│ │            🟡 Pimpalgaon      │ │
│ │   📍 You                      │ │
│ │        🟢 Niphad              │ │
│ └──────────────────────────────┘ │
│  🔴 Too much crop   🟡 Normal     │
│  🟢 Crop needed                   │
│ ┌──────────────────────────────┐ │
│ │ ⏳ Hold for 5 days            │ │
│ │ Price may rise about 10%.     │ │
│ │ Why: rain expected, fewer     │ │
│ │ trucks arriving.          🔊  │ │
│ └──────────────────────────────┘ │
│  Last 30 days   ▁▂▂▃▄▄▅▆          │
│ ┌────────────────────────────┐   │
│ │  ⚖ Compare where to sell   │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
Tomato → never "Hold" > 2 days. Shows "Sell now, or store in cold storage".
Offline → the map is replaced by a coloured list of mandis (🔴 Lasalgaon ₹1,850 …) and the top shows "Prices from 2 days ago".
```

### 4.9 Net-₹ Comparator
```
┌──────────────────────────────────┐
│ ←  Where do you keep the most? 🔊│
│  500 kg onion, Grade B           │
│ ┌──────────────┬───────┬───────┐ │
│ │ Place        │ Price │ You   │ │
│ │              │       │ keep  │ │
│ ├──────────────┼───────┼───────┤ │
│ │🏆 Cropket     │ 9,600 │ 8,940 │ │ ← green row
│ │   buyer      │       │       │ │
│ ├──────────────┼───────┼───────┤ │
│ │ Lasalgaon    │ 9,250 │ 8,310 │ │
│ ├──────────────┼───────┼───────┤ │
│ │ Pimpalgaon   │ 9,400 │ 8,120 │ │
│ └──────────────┴───────┴───────┘ │
│  Tap a row to see:               │
│  transport · fees · weight loss  │
│ ┌────────────────────────────┐   │
│ │   🛒 Sell on Cropket        │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```
Only 3 columns on phone. Details open in a bottom sheet. Offline, the table is built from saved prices and distances, and a small line shows their age ("Prices from 2 days ago").

### 4.10 Buyer marketplace (desktop)
```
┌──────────────────────────────────────────────────────────────────────┐
│ 🌾 Cropket for buyers   Sharma Traders ✔ Verified      EN|हि   👤    │
├────────────────┬─────────────────────────────────────────────────────┤
│ Filters        │  124 lots near Nashik              Sort: Nearest ▾  │
│                │ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │
│ Crop           │ │ [photo]       │ │ [photo]       │ │ [photo]     │ │
│ [ Onion     ▾] │ │ Onion    🟩 A │ │ Onion    🟨 B │ │ Tomato  🟩 A│ │
│ Grade          │ │ 500 kg        │ │ 2,000 kg      │ │ 300 kg      │ │
│ ☑ A ☑ B ☐ C    │ │ 32 km  ⭐ 4.6  │ │ 12 km  ⭐ 4.2  │ │ 8 km  ⭐ 4.8 │ │
│ Distance       │ │ Mega lot (10) │ │ Top ₹1,920    │ │ ⚡ 12:40 left│ │
│ [ 50 km    ▾]  │ └───────────────┘ └───────────────┘ └─────────────┘ │
│ Min quantity   │ ┌───────────────┐ ┌───────────────┐                 │
│ [ 500 kg   ]   │ │ …             │ │ …             │                 │
│ ☑ Mega lots    │ └───────────────┘ └───────────────┘                 │
│ ☐ Salvage      │                                                     │
└────────────────┴─────────────────────────────────────────────────────┘
Not verified → yellow banner on top: "Finish KYC to place bids." (bid buttons disabled + blocked by RLS)
```

### 4.11 Buyer lot detail (live bid)
```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Mega Lot M-88   Onion, Grade A, 500 kg, 10 farmers, Niphad         │
├──────────────────────────────────┬───────────────────────────────────┤
│ [photo][photo][photo][video]     │  Highest bid        ● Live        │
│                                  │  ₹1,920 / quintal                 │
│ Size    ████████░░  Large        │  Reference floor   ₹1,700         │
│ Colour  █████████░  Good         │  ───────────────────────────      │
│ Damage  █░░░░░░░░░  3%           │  Your bid  [ ₹ 1,950   ]          │
│ AI 86% sure  (Indicative)        │  Total     ₹9,750 + 1% fee        │
│                                  │  [   Place bid   ]                │
│ Farmers' trust ⭐ 4.5 avg         │                                   │
│ Pickup ready: Thu 18 Sep         │  Recent bids                      │
│                                  │  ₹1,920  Patil Agro ✔  2 min ago  │
│                                  │  ₹1,900  Sharma ✔      5 min ago  │
└──────────────────────────────────┴───────────────────────────────────┘
```

### 4.12 Farmer: bids on my lot
```
┌──────────────────────────────────┐
│ ←  Offers for L-2041          🔊 │
│ ┌──────────────────────────────┐ │
│ │ Sharma Traders ✔    ⭐ 4.6    │ │
│ │ ₹1,920 / quintal             │ │
│ │ You get ₹9,600          🔊   │ │
│ │ ┌───────────┐ ┌───────────┐  │ │
│ │ │ ✅ Accept  │ │ ❌ Say no  │  │ │
│ │ └───────────┘ └───────────┘  │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Patil Agro ✔        ⭐ 4.1    │ │
│ │ ₹1,650 / quintal             │ │
│ │ ⚠ Below fair price (₹1,700)  │ │ ← red text
│ │ [ ✅ Accept ] [ ❌ Say no ]    │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

### 4.13 Deal consent (5 points + voice)
```
┌──────────────────────────────────┐
│ ←  Please check before you agree │
│                               🔊 │
│  💰 Price      ₹1,920 / quintal  │
│  ⚖ Quantity   500 kg            │
│  🏷 Grade      B                 │
│  🚚 Pickup     Thu, 18 Sep       │
│  🕐 Payment    within 24 hours   │
│                after delivery    │
│  ┌────────────────────────────┐  │
│  │  🎤  Hold and say:          │  │
│  │  "Haan, main sehmat hoon"  │  │
│  │        ● 0:03              │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  ✅ I agree                 │  │ ← enabled after recording
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### 4.14 Buyer: pay and lock
```
┌──────────────────────────────────────────────┐
│ ← Pay for deal D-3321                        │
│                                              │
│  Onion, Grade B, 500 kg @ ₹1,920    ₹9,600   │
│  Platform & safety fee (1%)            ₹96   │
│  ────────────────────────────────────────    │
│  Total                              ₹9,696   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │      🔒 Pay and lock money             │  │
│  └────────────────────────────────────────┘  │
│  Your money is held by a regulated payment   │
│  partner, not by Cropket. It is released     │
│  only after delivery.                        │
└──────────────────────────────────────────────┘
After payment, the buyer's deal page shows the delivery code:
   Delivery code   [ 4 ][ 8 ][ 1 ][ 7 ]
   Give this code to the driver only after you check the goods.
```

### 4.15 Digital Khata (farmer)
```
┌──────────────────────────────────┐
│ ←  My Khata                   🔊 │
│  Received in September           │
│  ₹24,300                         │
│  🟡 Locked ₹9,600   🔵 On way: 1  │
├──────────────────────────────────┤
│ ▌🟡 ₹9,600 locked safely          │
│ ▌   Onion 500 kg, Sharma   🔊    │
│ ▌   Auto-release in 23:14:05     │
├──────────────────────────────────┤
│ ▌🔵 On the way to buyer           │
│ ▌   Onion 300 kg, Patil    🔊    │
├──────────────────────────────────┤
│ ▌🟢 ₹6,200 received ✅   12 Sep   │
│ ▌   Tomato 300 kg          🔊    │
├──────────────────────────────────┤
│ ▌🟢 ₹1,200 loan EMI paid  12 Sep │
├──────────────────────────────────┤
│ ▌🔴 ₹480 on hold (2 crates)       │
├──────────────────────────────────┤
│  📄 Get statement                 │
└──────────────────────────────────┘
The ▌ bar on the left is the colour. Colour is never the only signal: text + icon too.
```

### 4.16 Driver page `/t/:token` (no login)
```
┌──────────────────────────────────┐
│ 🚚 Trip T-551    MH15 AB 1234     │
│ ● Sharing location. Keep open.   │
├──────────────────────────────────┤
│ ✅ 1  Weighbridge photo (start)   │
│      8,020 kg                    │
│ ▶  2  Start trip                  │
│     ┌────────────────────────┐   │
│     │      ▶ START TRIP      │   │
│     └────────────────────────┘   │
│ ○  3  Weighbridge photo (end)    │
│ ○  4  Photo of unloaded goods    │
│ ○  5  Enter buyer's code         │
├──────────────────────────────────┤
│  📞 Call FPO     🆘 Problem       │
└──────────────────────────────────┘
Only the current step is active. The page uses the Screen Wake Lock API so GPS keeps running. Photos and GPS points taken without signal are queued and show "Saved, will upload". Step 5 (the code) needs internet.
```

### 4.17 Dual-frame weighbridge camera
```
┌──────────────────────────────────┐
│ ←  Weighbridge photo             │
│ ┌──────────────────────────────┐ │
│ │ ┌───────────┐                │ │
│ │ │ Number    │   ┌──────────┐ │ │
│ │ │ plate     │   │ Weight   │ │ │
│ │ │ here      │   │ display  │ │ │
│ │ └───────────┘   │ here     │ │ │
│ │                 └──────────┘ │ │
│ └──────────────────────────────┘ │
│  Get the plate AND the red       │
│  numbers in one photo.           │
│          ┌──────────┐            │
│          │    ⭕     │            │
│          └──────────┘            │
└──────────────────────────────────┘
After capture → "Plate MH15 AB 1234 ✅  Weight 8,020 kg ✅ (91% sure)"
Low confidence → "Type the weight" box; photo is saved as proof; slip marked "manual".
```
The guide boxes are only a visual hint. Plate and weight are read on the server after capture.

### 4.18 Tracking (farmer / buyer)
```
┌──────────────────────────────────┐
│ ←  Truck to Sharma Traders       │
│ ┌──────────────────────────────┐ │
│ │ 🏠 ━━━━━━━━━━ 🚚 ┅┅┅┅┅┅ 📍    │ │
│ │          map                 │ │
│ └──────────────────────────────┘ │
│  Arrives in about 1 h 20 min     │
│  Start weight    8,020 kg        │
│  End weight      7,940 kg        │
│  Weight loss     1.0%            │
│  ✅ Normal (up to 2% is allowed)  │
└──────────────────────────────────┘
```

### 4.19 Rescue (after rejection)
```
┌──────────────────────────────────┐
│ 🔴 Buyer rejected 2 crates    🔊 │
│ ✅ 18 crates paid normally        │
├──────────────────────────────────┤
│ ⚡ Flash sale                     │
│    6 buyers nearby told          │
│    14:59 left, floor ₹1,700      │
│ │                                │
│ ♻ Salvage board     waiting      │
│ │                                │
│ ❄ Cold storage      waiting      │
│    (Sai Cold Storage, 12 km)     │
├──────────────────────────────────┤
│  Who pays? Decided after review. │
│  📞 Talk to support               │
└──────────────────────────────────┘
```

### 4.20 Admin disputes (desktop)
```
┌──────────────────────────────────────────────────────────────────────┐
│ Disputes     [ Open ▾ ]  [ All crops ▾ ]  [ Search deal… ]           │
├──────┬────────┬──────────┬───────────────┬──────────────┬────────────┤
│ ID   │ Deal   │ Crates   │ Raised by     │ System says  │ Status     │
│ D-19 │ D-3321 │ 2 of 20  │ Sharma (buyer)│ Likely false │ Open       │
│ D-18 │ D-3290 │ all      │ Patil (buyer) │ Needs review │ Open       │
├──────┴────────┴──────────┴───────────────┴──────────────┴────────────┤
│ D-19                                                                 │
│ Weight: 8,020 → 7,940 kg (1.0%, allowed 2%) ✅                        │
│ Video frames: [B][B][B][A][B]  match lot grade ✅                     │
│ Delivery photo: [img] 18 Sep 12:40, near buyer gate ✅                │
│ Money history: CREATED → FUNDED → … → DISPUTED   (6 events)          │
│ Buyer strikes: 1                                                     │
│ [ Release to farmers ] [ Refund buyer ] [ Partial… ] [ Give strike ] │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.21 Loans + consent + Consent Vault
```
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│ ←  Loans                      🔊 │   │  Share your data?             🔊 │
│ ┌──────────────────────────────┐ │   │  With: Demo NBFC Ltd             │
│ │ 🏦 Kisan Credit Card          │ │   │                                  │
│ │ Low interest. For next season│ │   │  🪪 Your identity                 │
│ │ Takes a few days.            │ │   │  🗺 Your land record              │
│ └──────────────────────────────┘ │   │  🌾 Your crop grades & sales      │
│ ┌──────────────────────────────┐ │   │  For: loan check, 30 days        │
│ │ ⚡ Emergency loan              │ │   │  Charges: shown by the lender    │
│ │ Small amount. Fast.          │ │   │  before you sign.                │
│ └──────────────────────────────┘ │   │ ┌─────────────┐ ┌─────────────┐  │
│ Your data is shared only if you  │   │ │ ✅ Yes,share │ │   ❌ No      │  │
│ say yes.                         │   │ └─────────────┘ └─────────────┘  │
└──────────────────────────────────┘   └──────────────────────────────────┘

┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│  Checking…                       │   │ ←  My data (Consent Vault)       │
│  ✅ Identity                      │   │ ┌──────────────────────────────┐ │
│  ✅ Land: 2 bigha, Survey 45      │   │ │ Demo NBFC saw your land      │ │
│  ✅ No loan on this land          │   │ │ record, 12 Sep   [ Revoke ]  │ │
│  Sent to lender.                 │   │ ├──────────────────────────────┤ │
│  Demo data                       │   │ │ Sharma Traders saw your      │ │
└──────────────────────────────────┘   │ │ grades, 10 Sep   [ Revoke ]  │ │
Lien found → "This land already has   │ └──────────────────────────────┘ │
a loan. We can't send this request."   └──────────────────────────────────┘
```

### 4.22 Shared states (every screen)
```
Loading:     grey blocks in the shape of the content (skeleton); never a spinner over 1 s without text
Empty:       icon + one line + one button     "No lots yet."  [📷 Scan your first crop]
Error:       what happened + what to do       "Photo did not upload. Check internet and try again." [Try again]
Offline:     🟧 strip on top                   "No internet. You can still scan and save lots."
Sync:        small status in header           "⟳ Uploading 2 of 3"  /  "✓ All saved"
Old data:    grey line under the hero          "Prices from 2 days ago"
Needs net:   button disabled + reason          "Needs internet to pay"
Mock data:   grey tag next to the result       "Demo data"
Draft item:  dashed border + tag               "On phone only"
```

---

## 5. Key component and API specs

### 5.1 Key React components

| Component | Props (short) | What it does |
|---|---|---|
| `VoiceButton` | `textKey`, `values?`, `clipId?`, `size?` | Speaks a translated string. Tries `clipId` audio → Bhashini → browser voice. Shows a pulsing ring while speaking. Only one plays at a time. |
| `MicInput` | `lang`, `onResult(text)`, `mode: "text" \| "number"` | Web Speech API. In number mode, turns "paanch sau" → 500. Hidden when offline. Always shows a typed fallback. |
| `VoiceConsent` | `phrase`, `onRecorded(blob)` | Hold-to-record (max 10 s), uploads to the `consent-audio` bucket, returns the storage path. |
| `BigTile` | `icon`, `labelKey`, `href`, `clipId` | Home screen tile with speaker. |
| `LanguageSwitch` | — | EN / हि / मरा, keeps the current page. |
| `SmartFrameCamera` | `crop`, `shots=3`, `minBrightness=70`, `onDone(blobs[])` | `getUserMedia` (camera permission via Capacitor in the APK). Reads average brightness from a small canvas every 300 ms, blocks capture when dark, compresses each photo to ≤ 300 KB. Works offline. |
| `DualFrameCamera` | `expectedPlate`, `onDone(file)` | Camera with two guide boxes. |
| `GradeBadge` | `grade: "A"\|"B"\|"C"`, `kind: "indicative"\|"assured"`, `size` | Big coloured badge. "Assured" only for meter / human checked. |
| `GradeBreakdown` | `size`, `colour`, `damagePct`, `confidence` | 3 bars + confidence line. |
| `LotCard` | `lot`, `view: "farmer"\|"buyer"` | Photo, grade, kg, distance, trust stars, tags (Mega, Flash, Salvage). |
| `QRLabel` | `code`, `title`, `printable?` | QR + short code. Print CSS for crate stickers (A4, 12 per page). |
| `PriceHero` | `crop`, `price`, `change`, `mandi`, `updatedAt` | The big number at the top of prices. |
| `MandiHeatmap` | `mandis[]` (lat, lng, colour, price) | MapLibre map with coloured circles + legend in words. Online only. |
| `MandiList` | `mandis[]` | Offline replacement for the map: coloured rows sorted by distance. |
| `AdviceCard` | `advice: {action, days?, pctChange?, reasons[]}` | Sell / Hold card, "Why?" list, 🔊. |
| `NetRupeeTable` | `rows[]`, `onRowTap` | 3 columns on mobile, 5 on desktop, best row 🏆 green. |
| `FloorWarning` | `price`, `floor` | Red line of text if price < floor. Advisory only. |
| `LiveBidBox` | `targetType`, `targetId`, `floor`, `canBid` | Subscribes to realtime bids; place-bid form. |
| `BidRow` | `bid`, `onAccept`, `onReject` | Farmer side row with big buttons. |
| `VerifiedBadge`, `TrustStars` | `verified`, `score` | Shown next to names everywhere. |
| `KhataRow` | `entry: {colour, title, amount, dealId, createdAt}` | Left colour bar + icon + text + 🔊. |
| `KhataSummary` | `month`, `received`, `locked`, `inTransit` | Top summary. |
| `Countdown` | `until: Date`, `label` | "Auto-release in 23:14:05". |
| `OtpDigits` | `digits` | Big 4-box code (buyer). |
| `TripChecklist` | `trip`, `steps[]` | Driver's one-step-at-a-time list. |
| `TrackingMap` | `points[]`, `origin`, `destination` | Live truck position via realtime. |
| `WeightCompare` | `originKg`, `destKg`, `allowedPct` | Loss % + ✅/⚠. |
| `RescueTimeline` | `dispute`, `flashSale?`, `storageBooking?` | Live rescue steps. |
| `FlashSaleCard` | `sale` | ⚡ countdown, price ≥ floor, Buy now. |
| `NumberPad` | `value`, `onChange`, `allowVoice` | Big keys for kg / ₹. |
| `NetworkBanner`, `SyncStatus`, `DataAge`, `DemoDataTag`, `EmptyState` | — | Shared states (4.22). `DataAge` takes `updatedAt` and shows "from 2 days ago" when older than 6 h. |
| `RequireOnline` | `reasonKey`, `children` | Wraps money and trading actions. Offline → disables the child and shows the reason. |

### 5.2 API rules (for SQL functions and Edge Functions)

- Every input is validated with **zod** (shared schemas in `_shared/domain/schemas`).
- Every Edge Function returns one shape:
  ```json
  { "ok": true,  "data": { } }
  { "ok": false, "error": { "code": "BID_BELOW_FLOOR", "messageKey": "errors.bidBelowFloor" } }
  ```
  `messageKey` is translated in the app, so errors appear in Hindi and Marathi too. SQL functions raise exceptions with the same `code` text, and `services/*` maps them to message keys.
- The caller's role is always read from `profiles` on the server, never from the request body.
- Money-related calls take an `Idempotency-Key` header. A repeated call returns the first result.
- Rate limits live in Postgres (`rate_limits`): OTP 5 tries per escrow, bids 10 per minute per buyer, grading 20 per hour per farmer.
- Functions for webhooks, cron and the driver link set `verify_jwt = false` in `config.toml` and check their own secret (signature, `CRON_SECRET`, or trip token).
- **Money and trading calls are online-only.** The app never queues them.

### 5.3 Postgres functions (called with `supabase.rpc`)

| Function | Caller | Input | Returns | Rules |
|---|---|---|---|---|
| `place_bid` | verified buyer | `target_type, target_id, price_per_quintal` | `bid_id, is_highest, below_floor` | Buyer must be `kyc_status='verified'` and not banned. Target must be listed. |
| `accept_bid` | farmer (lot) / FPO (mega lot) | `bid_id, consent_audio_path` | `deal_id, escrow_id` | One transaction: creates deal, rejects other bids, creates escrow in `CREATED`, marks lot `sold`, sets the delivery OTP hash. |
| `buy_flash_sale` | verified buyer | `flash_sale_id, price` | `deal_id` | Row lock. First valid buyer wins. `price ≥ floor`. |
| `mark_dispatched` | seller | `escrow_id` | `state` | Only when `ALLOW_SIMPLE_DISPATCH` is on. |
| `revoke_consent` | farmer | `consent_id` | `revoked_at` | Also writes to `data_access_logs`. |
| `group_mega_lots` | trigger on lot listed | — | — | Finds same crop + same grade + unsold lots within 10 km (`ST_DWithin`). Creates a mega lot when the total reaches the target (default 500 kg). |
| `escrow_transition` | service role only | see 5.7 | `escrows` row | The only way escrow state changes. |
| `nearest_cold_storages` | service role | `lat, lng, limit` | rows with `distance_km` | PostGIS ordered by distance. |
| `buyers_within` | service role | `lat, lng, km` | buyer ids | Used for flash-sale alerts. |

Tables that the app reads directly (with RLS): `profiles` (own), `lots`, `mega_lots`, `bids`, `deals`, `khata_entries`, `mandis`, `mandi_prices`, `mandi_heat`, `crop_rules`, `weather_daily`, `cold_storages`, `consents`, `loan_leads` (own), `shipments` + `tracking_points` (own deals).

### 5.4 Edge Functions

The app calls them with `supabase.functions.invoke(name, { body })`. File uploads go to Storage first; functions receive storage paths.

| Function | Caller | Input | Output | What it does |
|---|---|---|---|---|
| `grade` | farmer | `grade_result_id, crop, photo_paths[]` | `{grade, confidence, size, colour, damagePct, needsHumanCheck}` | Signs photo URLs, calls AI `/grade`, updates `grade_results` to `done` / `failed`, updates the lot's grade. Called by the outbox when online. |
| `route-distance` | farmer | `from {lat,lng}, to[]` | `{km, minutes, alternatives[]}` per destination | OpenRouteService with 24 h cache. |
| `kyc-verify` | buyer | `business_name, gst_number, pan` | `{status, source}` | DigiLocker / GST adapter (mock). Sets `buyer_kyc` and `profiles.kyc_status`. |
| `tts` | any user | `text, lang` | `{url}` | Bhashini adapter, cached in `tts_cache`. |
| `escrow-pay` | buyer | `escrow_id` | `{paymentSessionId}` or mock `{mockPayUrl}` | Creates the Cashfree order for deal total + 1% platform fee. |
| `cashfree-webhook` | Cashfree | raw body | `200` | Verifies signature → `FUNDED` → Khata 🟡 row → push to farmer. Idempotent on payment id. |
| `escrow-release` | internal (other functions) | `escrow_id, reason` | `{state, payouts[]}` | Runs `split.ts`, sends split instructions, writes `payouts`, Khata 🟢 rows, push. |
| `escrow-skip-timer` | admin, only when `DEMO_MODE=true` | `escrow_id` | `{autoReleaseAt}` | Sets the timer to now. |
| `shipments-create` | seller | `deal_id, transporter_id, driver_phone, vehicle_number` | `{shipment_id, tripUrl}` | Makes a random 32-byte token, stores only its hash, expiry 72 h, sends SMS (mock). |
| `trip` | driver (token in path) | sub-routes below | — | One function with a small router. Token check on every call. Returns no prices or phone numbers. |
| ↳ `GET /trip/:token` | | — | `{trip, steps, lang}` | |
| ↳ `POST /trip/:token/weigh` | | `type (origin/destination), photo_path` or `manual_kg` | `{plate, weightKg, confidence, plateMatches}` | Calls AI OCR. Wrong plate → error `PLATE_MISMATCH`. |
| ↳ `POST /trip/:token/start` | | — | `{state}` | Needs an origin slip. → `IN_TRANSIT`. |
| ↳ `POST /trip/:token/locations` | | `points[] {id, lat, lng, accuracy, at}` | `204` | Batch upload (works with the offline queue). Geofence check. |
| ↳ `POST /trip/:token/pod` | | `photo_path, lat, lng, taken_at` | `{state, autoReleaseAt}` | → `DELIVERED`; timer = server time + 24 h. |
| ↳ `POST /trip/:token/otp` | | `otp` | `{state}` or `{code, triesLeft}` | Correct → `escrow-release`. 5 wrong → locked, admin alerted. |
| `disputes-create` | buyer / farmer | `deal_id, reason, crate_qrs[], photo_paths[]` | `{dispute_id, heldAmount}` | → `DISPUTED`, holds only the rejected crates' value, runs auto-checks (weight buffer, video frames, delivery photo), starts rescue. |
| `storage-booking` | internal | `shipment_id` | `{booking}` | Nearest cold storage; pays from FPO wallet, then overdraft (mock). |
| `dispute-resolve` | admin | `dispute_id, outcome, amounts?, strike_user_id?` | `{state}` | `release` / `refund` / `partial` + liability rules + strikes. |
| `loans-lead` | farmer | `type (kcc/nbfc), amount, consent_id` | `{lead_id, status}` | ULI mock → CERSAI mock → lead, or `LIEN_FOUND`. |
| `push-send` | internal | `user_ids[], titleKey, values, link` | — | FCM. |
| `cron-auto-settle` | pg_cron every 15 min | `Authorization: Bearer CRON_SECRET` | `{released}` | Releases `DELIVERED` escrows past `auto_release_at` with no open dispute. |
| `cron-fetch-prices` | pg_cron daily | same | `{rows}` | data.gov.in → `mandi_prices`, then recomputes `mandi_heat`. |
| `cron-fetch-weather` | pg_cron daily | same | `{districts}` | Open-Meteo → `weather_daily`. |
| `whatsapp-webhook` | Meta | — | `200` | Bot and WhatsApp Flows. |

### 5.5 AI service (FastAPI)

Only Edge Functions call this service, with the header `X-Service-Key`. The service is **stateless**: it gets files or signed URLs, returns JSON, and never touches the database.

| Endpoint | Input | Output |
|---|---|---|
| `GET /health` | — | `{ok, version}` (used for warm-up ping) |
| `POST /grade` | `crop`, `images[]` | `{grade, confidence, size:{label, mmAvg}, colour:{label, healthyPct}, damagePct, perImage[], reasons[]}` |
| `POST /ocr/weighbridge` | `image`, `expected_plate?` | `{plate, plateConfidence, weightKg, weightConfidence, plateMatches}` |
| `POST /ocr/mandi-meter` (P3) | `image`, `meter_type` | `{moisturePct, readingConfidence}` |
| `POST /video-audit` (P2) | `video`, `crop`, `expected_grade` | `{frames:[{t, grade}], mismatch, adjustedGrade}` |
| `GET /price-forecast` (P2) | `crop`, `district`, `history[]` in body | `{forecast[], pctChange7d}` |

**Grading v1 (onion only first):**
1. Resize to 1024 px. Check blur (Laplacian variance) → low = lower confidence.
2. Find the ₹10 coin (Hough circle, known 27 mm) → mm per pixel. No coin → size label only "small / medium / large" by relative area, confidence −15.
3. Segment onions (HSV threshold + contours). Size = average diameter.
4. Colour = % of pixels in the healthy HSV range for that crop.
5. Damage = % of dark / black patches inside each onion contour.
6. Rules → A / B / C. Confidence = photo quality × agreement between the 3 photos.
7. Keep a labelled test set (200+ photos) in `ai-service/samples/` and report measured accuracy in the README.

### 5.6 Database (Supabase Postgres)

All primary keys are UUIDs. Rows that can be created offline (lots, crates, grade requests, tracking points, weigh slips, delivery photos, tickets, ratings) use a UUID made on the phone (`crypto.randomUUID()`), so re-sending never makes a duplicate. These tables also store `client_created_at`.

Enums: `user_role (farmer, buyer, fpo, admin, nbfc)`, `lot_status (draft, listed, in_mega, sold, in_transit, delivered, rescued, salvage)`, `escrow_state` (see 5.7), `khata_colour (yellow, blue, green, red)`.

| Table | Key columns |
|---|---|
| `profiles` | id (= auth user), phone, name, role, language, village, district, state, `location geography(Point)`, kyc_status, trust_score, strikes, banned, created_at |
| `crop_rules` | crop (pk), perishability, max_hold_days, transit_loss_pct, has_msp, msp_per_quintal, floor_method |
| `grade_results` | id, farmer_id, crop, status (pending/done/failed), grade, confidence, size_label, colour_pct, damage_pct, photo_paths[], kind (indicative/assured), needs_human_check |
| `lots` | id, farmer_id, crop, quantity_kg, grade_result_id, grade, `location`, status, qr_code, client_created_at, created_at |
| `crates` | id, lot_id, qr_code, weight_kg, status |
| `mega_lots` / `mega_lot_items` | id, crop, grade, total_kg, fpo_id, `location`, status / mega_lot_id, lot_id, farmer_id, quantity_kg |
| `mandis` | id, name, district, state, `location`, agmarknet_name |
| `mandi_prices` | mandi_id, crop, date, min_price, max_price, modal_price, arrivals_tonnes, source · unique(mandi_id, crop, date) |
| `mandi_heat` | mandi_id, crop, date, ratio, colour |
| `buyer_kyc` | buyer_id, business_name, gst_number, pan_last4, status, verified_at, source |
| `bids` | id, lot_id / mega_lot_id, buyer_id, price_per_quintal, status, created_at |
| `deals` | id, lot_id / mega_lot_id, buyer_id, price_per_quintal, quantity_kg, total_paise, fee_paise, pickup_date, consent_audio_path, status |
| `escrows` | id, deal_id, total_paise, state, otp_hash, otp_tries, delivered_at, auto_release_at, cashfree_order_id |
| `escrow_transitions` | from_state, to_state (the allowed list) |
| `escrow_events` | id, escrow_id, from_state, to_state, reason, actor, created_at · **insert-only** |
| `payouts` | id, escrow_id, to_user, amount_paise, type (farmer_share, driver_advance, driver_freight, emi, platform_fee, refund), status, provider_ref |
| `khata_entries` | id, user_id, deal_id, amount_paise, colour, title_key, title_values (jsonb), created_at |
| `transporters` | id, name, phone, rate_per_km_paise (seeded mock 3PL) |
| `shipments` | id, deal_id, transporter_id, driver_phone, vehicle_number, trip_token_hash, token_expires_at, language, status, route_risk_score |
| `tracking_points` | shipment_id, `location`, accuracy, recorded_at |
| `weigh_slips` | shipment_id, type, photo_path, plate_read, weight_kg, confidence, manual |
| `pods` | shipment_id, photo_path, `location`, taken_at |
| `disputes` | id, deal_id, raised_by, reason, crate_qrs[], photo_paths[], auto_verdict, status, resolution, held_paise |
| `flash_sales` | id, lot_id, floor_paise, start_paise, ends_at, status, winner_id |
| `cold_storages` | id, name, wdra_certified, `location`, price_per_pallet_paise, labour_included |
| `storage_bookings` | id, shipment_id, cold_storage_id, amount_paise, paid_from |
| `wallets` | user_id, balance_paise |
| `strikes` | user_id, dispute_id, reason, created_at (trigger: 3 → banned) |
| `ratings` | from_user, to_user, deal_id, stars, comment, photo_path |
| `tickets` | id, user_id, type, message, status |
| `consents` / `data_access_logs` | farmer_id, data_types[], shared_with, purpose, granted_at, expires_at, revoked_at / consent_id, accessed_by, accessed_at |
| `loan_leads` | id, farmer_id, type (kcc/nbfc), amount_paise, consent_id, land_verified, lien_found, lender_id, status, commission_paise, source |
| `emi_mandates` | id, loan_lead_id, farmer_id, emi_paise, remaining_paise, lender_id |
| `overdrafts` | id, fpo_id, escrow_id, amount_paise, interest_paise, status |
| `weather_daily` | district, date, rain_mm, temp_max, fetched_at |
| `route_cache` | from_hash, to_hash, km, minutes, alternatives (jsonb), fetched_at |
| `tts_cache` | text_hash, lang, storage_path |
| `app_config` | key, value (e.g. `min_app_version`, `mega_lot_target_kg`, `platform_fee_bps`) |
| `rate_limits` | key, window_start, count |

**Security rules (RLS) — must have**
- RLS **on for every table**. No exceptions. A CI SQL test fails if any table has RLS off.
- Farmer reads own lots, own khata, own deals. Buyer reads listed lots (no farmer phone number), own bids, own deals.
- `bids` insert allowed only if `profiles.role = 'buyer' and kyc_status = 'verified' and banned = false`.
- `escrows`, `escrow_events`, `payouts` → **no direct insert/update from clients at all**. Only the service role via `escrow_transition()`.
- The driver never uses Supabase directly; only the `trip` Edge Function (token check, service role).
- Storage buckets are private. Photos are shown with short-lived signed URLs.

**Realtime channels**
- `bids:lot:{id}` / `bids:mega:{id}` — new bids.
- `escrow:{dealId}` — state changes (Khata and deal pages update live).
- `trip:{shipmentId}` — tracking points.
- `flash:{district}` — new flash sales.

### 5.7 Escrow state machine

```
                      ┌──────────► CANCELLED
CREATED ──(webhook)──► FUNDED ─────────────► REFUNDED
                        │
                        ▼
              DRIVER_ADVANCE_PAID ──► IN_TRANSIT ──► DELIVERED ──(OTP or 24 h)──► RELEASED
              (skipped when simple dispatch is on)             │              │
                                          └──► DISPUTED ◄┘
                                                  │
                                ┌─────────────────┼──────────────┐
                                ▼                 ▼              ▼
                            RELEASED      PARTIAL_RELEASED    REFUNDED
```

Allowed transitions (rows in `escrow_transitions`):

| From | To | Trigger |
|---|---|---|
| CREATED | FUNDED | Cashfree webhook (verified) |
| CREATED | CANCELLED | buyer did not pay in 2 h |
| FUNDED | DRIVER_ADVANCE_PAID | shipment booked, advance paid |
| FUNDED | IN_TRANSIT | "Mark dispatched" by the seller, used until full logistics exists (flag `ALLOW_SIMPLE_DISPATCH`) |
| FUNDED | REFUNDED | deal cancelled before pickup |
| DRIVER_ADVANCE_PAID | IN_TRANSIT | driver taps Start (origin slip exists) |
| IN_TRANSIT | DELIVERED | PoD photo uploaded |
| IN_TRANSIT | DISPUTED | rejection mid-way |
| DELIVERED | RELEASED | correct OTP entered by the driver, or 24 h passed with no dispute |
| DELIVERED | DISPUTED | buyer raises dispute within 24 h |
| DISPUTED | RELEASED / PARTIAL_RELEASED / REFUNDED | admin resolution |

End states: RELEASED, PARTIAL_RELEASED, REFUNDED, CANCELLED.

```sql
create or replace function escrow_transition(
  p_escrow uuid, p_to escrow_state, p_reason text, p_actor uuid default null
) returns escrows
language plpgsql security definer set search_path = public as $$
declare
  e         escrows;
  old_state escrow_state;
begin
  select * into e from escrows where id = p_escrow for update;   -- row lock
  if not found then raise exception 'ESCROW_NOT_FOUND'; end if;
  old_state := e.state;
  if old_state = p_to then return e; end if;                       -- idempotent repeat
  if not exists (select 1 from escrow_transitions
                 where from_state = old_state and to_state = p_to) then
    raise exception 'ILLEGAL_TRANSITION % -> %', old_state, p_to;
  end if;

  update escrows
     set state           = p_to,
         updated_at      = now(),
         delivered_at    = case when p_to = 'DELIVERED' then now() else delivered_at end,
         auto_release_at = case when p_to = 'DELIVERED' then now() + interval '24 hours'
                                else auto_release_at end
   where id = p_escrow
  returning * into e;

  insert into escrow_events (escrow_id, from_state, to_state, reason, actor)
  values (p_escrow, old_state, p_to, p_reason, p_actor);

  return e;
end $$;

revoke all on function escrow_transition(uuid, escrow_state, text, uuid)
  from public, anon, authenticated;   -- only the service role may move money
```

Users never call `escrow_transition()` directly. Small wrapper functions (e.g. `mark_dispatched(escrow_id)`) check who is calling, then call it. Edge Functions call it with the service role.

**Release split order** (`_shared/domain/split.ts`, pure function, fully unit-tested):
1. Hold the value of rejected crates (if any).
2. Driver freight (minus advance already paid).
3. EMI due for each farmer (P2) → to lender.
4. Each farmer's share = remaining × (their kg ÷ total kg). Rounding leftovers (a few paise) go to the farmer with the largest share, so the sum always matches exactly.
5. Platform fee was paid on top by the buyer, so it never reduces the farmer's money.

**Test must prove:** sum of payouts = escrow total (to the paisa); illegal jumps throw; two parallel releases give one release; timer does not release when a dispute is open; OTP locks after 5 tries.

### 5.8 Offline-first sync

**What works offline and what doesn't**

| Works offline | Needs internet |
|---|---|
| Open the app, switch language, hear bundled voice clips | First login, OTP |
| Scan crop, save photos | Getting the AI grade (queued until online) |
| Create lot drafts, print QR codes | Listing a lot for buyers |
| Last saved prices, heat colours (as a list), advice, Net-₹ | Map tiles, fresh prices |
| Last saved Khata, deals, lots | Live bids, accept bid, voice consent upload |
| Driver: weighbridge photos, delivery photo, GPS points | Driver: OTP entry, trip start confirmation |
| — | Payment, KYC, disputes, loans, consent changes |

**Reads**
- TanStack Query with `persistQueryClient` saves query results to IndexedDB. The cache is kept for 7 days.
- Every farmer-facing query stores `updatedAt`. `DataAge` shows it when older than 6 hours.
- On app start the app shows cached data first, then refreshes in the background when online.

**Writes (the outbox)**

Dexie tables:
```ts
drafts:   id, kind ("lot" | "grade"), payload, createdAt
blobs:    id, draftId, kind ("photo" | "audio"), data (Blob), uploadedPath?
outbox:   id, kind, payload, status ("pending" | "sending" | "done" | "failed"),
          tries, nextTryAt, lastError, createdAt
tripQueue: id, token, kind ("location" | "weigh" | "pod"), payload, blobId?, status, tries
```

Allowed outbox kinds: `upload_blob`, `create_lot`, `request_grade`, `create_crates`, `rate_deal`, `create_ticket`. Money and trading actions are never queued.

Sync rules:
1. IDs are made on the phone. The server uses `insert … on conflict (id) do nothing`, so re-sending is safe.
2. Items are sent in order. A photo upload must finish before the lot or grade request that uses it.
3. Sync runs on app start, when the network comes back, and every 60 s while items are pending.
4. Retries use backoff (5 s, 30 s, 2 min, 10 min, then every 30 min). After 10 failures an item is marked `failed` and shown to the user with a "Try again" button.
5. The app calls `navigator.storage.persist()` so Android does not clear saved data.
6. Photos are compressed before saving (≤ 300 KB each). Uploaded blobs are deleted from the phone after 7 days.
7. The server is the owner of data. A saved copy is replaced by fresh server data on refresh, except items still in the outbox, which stay marked "On phone only".
8. The login session is stored so the app opens offline. If the session expired while offline, drafts are kept and the user logs in again when online.

**App shell**
- APK: all files are inside the app. The service worker is not registered in the native app.
- Web: vite-plugin-pwa precaches the app shell, fonts, translations and voice clips.

### 5.9 Voice helper (3 layers)

```ts
// app/src/lib/voice/speak.ts
export async function speak({ key, values, clipId, lang }: SpeakInput) {
  if (clipId && await playClip(`/audio/${lang}/${clipId}.mp3`)) return; // 1. bundled clip (offline)
  const text = i18n.t(key, { lng: lang, ...values });
  if (navigator.onLine && await playTts(text, lang)) return;            // 2. `tts` Edge Function (Bhashini, cached)
  browserSpeak(text, lang);                                              // 3. speechSynthesis
}
```
- Only one sound plays at a time.
- `scripts/make-voice-clips.ts` generates bundled clips for: all tile labels, grades A/B/C, advice templates ("Sell now", "Hold for N days" for N = 1–5), Khata statuses, offline and error messages, and numbers 0–100 plus hundred/thousand/lakh for reading amounts.

---

## 6. UI / UX design system

### 6.1 Design idea
**"Mandi-slip clear."** The app should feel as plain and trustworthy as a printed mandi receipt, with the colours of a farm field: deep leaf green, turmeric yellow, indigo and soil. One bold thing per screen (the big grade, the big price, the big rupee amount). Everything around it is quiet.

Rules:
- One main action per screen, at the bottom where the thumb is.
- Icon + word + 🔊 together. Never an icon alone. Never colour alone.
- Numbers are the heroes: big, in Baloo 2, Indian digit grouping (₹1,50,000).
- Sentence case everywhere. No ALL CAPS labels.
- Very little motion. Motion only when something changes state (money locked → a short fill animation on the yellow bar). Respect "reduce motion".

### 6.2 Colours (tokens)

Base palette:

| Token | Hex | Use |
|---|---|---|
| `--leaf` | `#1F6B3A` | Brand, primary buttons, links |
| `--leaf-dark` | `#154D2A` | Pressed state, header text |
| `--field` | `#F3F6F0` | App background (light, slightly green, not cream) |
| `--surface` | `#FFFFFF` | Cards, sheets |
| `--soil` | `#5A4632` | Secondary text accents, salvage board theme |
| `--ink` | `#1B2420` | Main text |
| `--ink-muted` | `#5B6660` | Secondary text (still 4.5:1 on `--field`) |
| `--line` | `#D9E0D6` | Borders, dividers |

Meaning colours (the same everywhere — Khata, badges, banners, map):

| Meaning | Token | Fill | Text on light | Icon |
|---|---|---|---|---|
| Money locked safely | `--haldi` | `#F2B705` | `#7A5A00` | 🔒 🟡 |
| Goods on the way | `--neel` | `#2F5DA8` | `#1E3F75` | 🚚 🔵 |
| Paid / done / good | `--pass` | `#2E9E4F` | `#1D6B34` | ✅ 🟢 |
| Problem / below floor / too much supply | `--mirchi` | `#C8302B` | `#9A231F` | ⚠ 🔴 |
| Offline / needs attention | `--kesar` | `#E07B1F` | `#8A4A0F` | 🟧 |

Grade colours: A = `--pass`, B = `--haldi`, C = `--kesar`. Heatmap: Red = `--mirchi`, Yellow = `--haldi`, Green = `--pass` (with the words "Too much crop / Normal / Needed" always in the legend).

Dark mode: **not in scope.** Farmers use phones outdoors in sunlight; a high-contrast light theme is better. (Admin panel can add dark mode later.)

### 6.3 Typography

| Role | Font | Size / line-height | Weight |
|---|---|---|---|
| Hero number (price, grade, ₹) | Baloo 2 | 40 / 44 | 700 |
| Screen title | Baloo 2 | 24 / 30 | 600 |
| Card title | Mukta | 20 / 28 | 600 |
| Body | Mukta | 18 / 28 | 400 |
| Small / meta | Mukta | 15 / 22 | 500 |

- Base body size is **18 px** (not 16). Devanagari needs extra height; line-height ≥ 1.5.
- Numbers use tabular figures in tables (`font-variant-numeric: tabular-nums`).
- Fonts are bundled with `@fontsource/mukta` and `@fontsource/baloo-2` (Latin + Devanagari subsets only). No font CDN.
- Fallback stack: `Mukta, "Noto Sans Devanagari", system-ui, sans-serif`.
- Keep text lines under ~40 characters on phone screens. Short words beat long sentences.

### 6.4 Spacing, shape, elevation
- 4 px grid. Screen padding 16 px. Gap between cards 12 px.
- Tap targets: **min 56 × 56 px** for primary, 48 × 48 for secondary. 8 px space between targets.
- Radius by hierarchy (not one radius everywhere): buttons 12 px, cards 16 px, bottom sheets 24 px (top corners), badges full-round.
- Elevation: cards use a 1 px `--line` border, **no shadow**. Only bottom sheets and the sticky action bar get a shadow (they float above content).
- Khata rows and status strips use a **6 px left colour bar** — the passbook signature of the app.

### 6.5 Components style (shadcn overrides)
- **Button**: primary = `--leaf` fill, white text, 56 px, full width on mobile. Secondary = white with `--leaf` border. Danger = `--mirchi` text button (not filled) except in admin.
- **Card**: white, border, 16 px padding, optional left colour bar.
- **Badge**: grade badge is big (min 120 px wide) with the word "Grade" + letter + kind.
- **Input**: 56 px, 18 px text, label always above (never placeholder-only), numeric fields open the number pad (`inputMode="numeric"`).
- **Bottom sheet** (shadcn Drawer) for details instead of new pages.
- **Toast**: short, same verb as the button ("Lot saved", after "Save lot"). Offline saves say "Lot saved on phone".
- **Map**: soft, low-saturation base tiles so the coloured circles stand out.

### 6.6 Accessibility and low-literacy rules
- WCAG AA contrast minimum; body text AA on every background.
- Every screen's main content can be read aloud with one 🔊 tap.
- Every input accepts voice or big number pad.
- Crops are shown as picture + word. Money always with ₹ symbol and in words on confirm screens ("Nau hazaar chhe sau rupaye").
- Visible focus ring (3 px `--neel`) for kiosk keyboard use.
- Works at 320 px width. Images lazy-load, max 300 KB. Farmer screens are code-split; the first screen's JS stays under 200 KB.
- Test on a low-cost Android phone with "Slow 3G" throttling and in airplane mode.

### 6.7 Copy rules
- Say what the user understands: "Money locked safely", not "Escrow funded".
- Buttons say what happens: "Pay and lock money", "Save lot", "Start trip".
- Errors say what happened and what to do. No "Oops".
- Legal words (escrow, consent, lien) appear only in small "Learn more" text.
- All strings live in `app/src/locales/*.json`. **No hard-coded text in components** (lint rule).
- Offline wording is calm and practical: "No internet. You can still scan and save lots."

---

## 7. Environment variables needed

Rules:
- **Everything in the app bundle is public**, including every `VITE_` variable and anything inside the APK. Never put a secret in `app/.env`.
- Secrets live only in Supabase Edge Function secrets (`supabase secrets set`), the AI service host's secret settings, Supabase Vault and GitHub Actions secrets.
- Commit `.env.example` files with empty values. Never commit real `.env` files.
- Keys are entered with `bash scripts/set-key.sh` (hidden typing). The list of every key, its file and where to get it lives in that script. Laptop-only values (DB URL, DB password, service role key for scripts) go in `scripts/.env`.

### 7.1 App — `app/.env` (public values only)

| Variable | Example / note |
|---|---|
| `VITE_SUPABASE_URL` | project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable (anon) key — safe because RLS protects data |
| `VITE_APP_URL` | public web URL, used in share links |
| `VITE_DEFAULT_LANG` | `mr` |
| `VITE_MAPTILER_KEY` | restrict to our domains in the MapTiler dashboard |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_VAPID_KEY` | Firebase web config (public by design) |
| `VITE_DEMO_MODE` | `true` shows demo-only buttons (the server also checks) |
| `VITE_SENTRY_DSN` | optional |

### 7.2 Edge Function secrets (Supabase)

| Secret | Used by |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | provided automatically in Edge Functions |
| `APP_URL` | trip links in SMS |
| `DEMO_MODE` | `escrow-skip-timer`, demo reset |
| `AI_SERVICE_URL`, `AI_SERVICE_KEY` | `grade`, `trip` |
| `DATA_GOV_API_KEY`, `AGMARKNET_RESOURCE_ID` | `cron-fetch-prices` |
| `CASHFREE_ENV` (`sandbox`), `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_API_VERSION` | `escrow-pay`, `cashfree-webhook`, `escrow-release` |
| `ORS_API_KEY` | `route-distance` |
| `MAPPLS_CLIENT_ID`, `MAPPLS_CLIENT_SECRET` | optional maps adapter |
| `BHASHINI_USER_ID`, `BHASHINI_API_KEY`, `BHASHINI_PIPELINE_ID` | `tts` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` (base64) | `push-send` |
| `SMS_PROVIDER` (`mock`), `SMS_API_KEY` | `shipments-create` |
| `CRON_SECRET` | all `cron-*` functions |
| `OTP_PEPPER` | delivery OTP hashing |
| `INTEGRATIONS_MOCK` | e.g. `agristack,digilocker,uli,cersai,enwr,transport,sms,whatsapp,krishi_dss` (add `cashfree` if sandbox split is not enabled) |
| `ALLOW_SIMPLE_DISPATCH` | `true` until full logistics is built |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | `whatsapp-webhook` |

### 7.3 AI service — `ai-service/.env`

| Variable | Note |
|---|---|
| `SERVICE_KEY` | same value as `AI_SERVICE_KEY` |
| `OCR_ENGINE` | `paddle` (default) or `vision` |
| `GOOGLE_APPLICATION_CREDENTIALS` | only when `OCR_ENGINE=vision` |
| `MAX_IMAGE_MB` | `5` |
| `LOG_LEVEL` | `info` |

### 7.4 Supabase dashboard settings (not files)
- Auth: phone provider on; **test phone numbers with fixed OTPs** for development and demo.
- Extensions: `postgis`, `pg_cron`, `pg_net`.
- Vault secrets: `functions_url` (`https://<project>.supabase.co/functions/v1`), `cron_secret`.
- Storage buckets (all private): `crop-photos`, `weigh-slips`, `pod`, `consent-audio`, `dispute-photos`, `kyc-docs`, `tts-audio`.
- Region: Mumbai.

### 7.5 GitHub Actions secrets
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF_DEV`, `SUPABASE_PROJECT_REF_DEMO`, `SUPABASE_DB_PASSWORD`, `VERCEL_TOKEN`, `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`.

---

## 8. Deployment plan

### 8.1 Where things run

| Part | Host | Notes |
|---|---|---|
| Web build (PWA + driver page) | **Vercel** (static) | `vercel.json` rewrites every path to `/index.html`. Long cache for hashed assets, no cache for `index.html` and the service worker. |
| Android app | **Capacitor APK** | Vite build bundled inside (`webDir: "dist"`). Sideloaded for testing; Play Store optional. |
| Database, auth, storage, realtime, cron, Edge Functions | **Supabase Cloud** (Mumbai) | Prototype: **one project, `cropket-dev`**, used for development and the demo. Later: add `cropket-demo`. Free projects pause after about a week without activity. |
| AI service | **Hugging Face Spaces (Docker)** or Railway | Check memory with OpenCV + PaddleOCR loaded. Free hosts sleep when idle; call `/health` before use. |
| Code | GitHub | `main` is always demo-ready. One feature per PR. |

### 8.2 Scheduled jobs (pg_cron → Edge Functions)
```sql
-- every 15 minutes
select cron.schedule('auto-settle', '*/15 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_url')
               || '/cron-auto-settle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := '{}'::jsonb);
$$);
-- daily at 12:30 UTC (18:00 IST): cron-fetch-prices
-- daily at 00:30 UTC (06:00 IST): cron-fetch-weather
-- every 5 minutes: close expired flash sales, cancel unpaid escrows older than 2 h (pure SQL)
```

### 8.3 Environments

| Env | App | Supabase | Payments | Purpose |
|---|---|---|---|---|
| Laptop | `pnpm dev` (web), real phone via USB | cloud `cropket-dev` (no Docker, no local Deno) | mock | Daily development |
| Demo (prototype) | Vercel production, debug APK | `cropket-dev` + `demo-reset` | mock | Presentation. `DEMO_MODE=true`. |
| Demo (later) | Vercel production, signed APK | `cropket-demo` | sandbox or mock | After the prototype. |

### 8.4 CI/CD (GitHub Actions)
- **Prototype:** only lint, type-check, Vitest and pytest on every push. SQL tests run by hand with `scripts/test-sql.sh`. Deploys are done by hand. The steps below are for later.
- **Every PR:** lint (including the "no hard-coded strings" rule) → type-check app and functions → Vitest → start local Supabase → SQL tests (escrow transitions, RLS enabled on every table) → pytest → Vercel preview.
- **Merge to `main`:** `supabase db push` and `supabase functions deploy` to `cropket-dev`; build and push the AI Docker image; build a debug APK as an artifact.
- **Manual "Promote to demo":** same steps against `cropket-demo`, then `scripts/demo-reset.ts`, then a signed release APK.

### 8.5 Android (Capacitor)
1. Add Capacitor to `app/` with `webDir: "dist"`. Build flow: `pnpm build && npx cap sync android`.
2. Plugins: Camera, Geolocation, a background-geolocation plugin (driver, later phase), Network, Preferences, Push Notifications, ML Kit barcode scanning, Splash Screen.
3. `lib/native.ts` checks `Capacitor.isNativePlatform()` and uses native plugins in the APK, web APIs in the browser.
4. Android permissions: camera, fine location, notifications (and background location only when the driver feature needs it).
5. Deep links: `https://<web-domain>/t/*` opens the web driver page. The main app does not need to handle it.
6. App updates: a new APK is needed for app code changes. The app shows "Update available" when the server's `min_app_version` (in a `app_config` table) is higher than its own.

### 8.6 Demo readiness checklist
- [ ] `demo-reset` done. Seed has: 12 farmers (one with "lien found"), 3 verified buyers + 1 unverified, 1 FPO, 5 mandis, 12 cold storages, 6 transporters, 60+ days of prices.
- [ ] Test phone numbers log in on both demo phones.
- [ ] AI service `/health` called 5 minutes before.
- [ ] Airplane-mode test done: scan + save lot offline, then sync.
- [ ] Skip-timer button visible for admin.
- [ ] Phones: full brightness, sound on, auto-lock off.
- [ ] Backup screen recording of the full flow and a mobile hotspot.

---

## 9. Development phases with priorities

### 9.1 Priority levels
- **P0 — Core.** The main flow breaks without it. It must work end-to-end on a real phone, including offline scanning.
- **P1 — Strong add-on.** Build only after every P0 item is done and tested.
- **P2 — Good add-on.** Mocks are fine. Build if time allows.
- **P3 — Placeholder.** A clickable screen with seeded data only. No real logic.

Build the phases in order. Inside a phase, finish P0 items before P1 items. Never start P1 work in any phase until **all P0 items in all phases** are done. **During the prototype, only §9.5 applies.**

**The P0 core flow:** farmer scans crop (even offline) → sees fair price and advice → verified buyer bids live → farmer accepts with voice consent → buyer pays and money is locked → goods are dispatched → driver uploads delivery photo and enters buyer's code → farmers are paid and the Khata turns green.

### 9.2 Phases

#### Phase 0 — Foundation
**Goal:** a working, installable, offline-capable skeleton with login, roles and languages.

| Feature | Priority |
|---|---|
| Repo setup: Vite app, Supabase local, Edge Functions skeleton, FastAPI skeleton, CI | P0 |
| Phone OTP login (test numbers), session saved for offline start | P0 |
| Role pick (Farmer, Buyer, FPO); role guard; RLS on every table | P0 |
| Languages en / hi / mr with instant switch | P0 |
| App shell: header, bottom nav, `NetworkBanner`, `SyncStatus` | P0 |
| Offline base: TanStack Query persistence, Dexie schema, outbox runner | P0 |
| `VoiceButton` with bundled clips + browser voice | P0 |
| PWA install + debug APK that opens offline | P0 |
| `tts` function with Bhashini | P1 |

**Done when:** login works; three roles see three different homes; language switch changes all text; the APK opens in airplane mode and shows the home screen.

#### Phase 1 — Farmer core
**Goal:** a farmer can join, scan a crop, hear the grade, and save a Digital Lot with a QR code — with or without internet.

| Feature | Priority |
|---|---|
| Chat-style onboarding with taps (name, village, crops, GPS location) | P0 |
| Smart Frame camera (blocks dark photos, 3 shots) | P0 |
| Onion grading (size, colour, damage → A/B/C + confidence) via `grade` | P0 |
| Grade spoken aloud; low confidence → "scan again" or "needs human check" | P0 |
| Offline scan: photos + lot saved on phone, grade requested on reconnect | P0 |
| Create lot (number pad weight, GPS), QR code, My Lots list | P0 |
| Voice answers in onboarding (`MicInput`) | P1 |
| Crate QR stickers (print page, 12 per A4) | P1 |
| "Check price only" mode: scan and see value without listing | P1 |
| Tomato and potato grading | P2 |
| On-device grading model for offline grades | P2 |

**Done when:** a dark photo is blocked; a sample onion photo returns a grade and confidence; the grade is spoken in Hindi and Marathi; a lot made in airplane mode syncs and gets its grade when the network returns.

#### Phase 2 — Market intelligence (price discovery)
**Goal:** before selling, the farmer knows the price, which mandi is crowded, how much money they will keep, and whether to sell or hold.

| Feature | Priority |
|---|---|
| Daily price collector + history import | P0 |
| Prices screen with today's price and change | P0 |
| Mandi heatmap (map online, coloured list offline) | P0 |
| Sell / hold advice v1 with `max_hold_days` cap | P0 |
| Reference floor price warning | P0 |
| Net-₹ comparator (distance-based transport, fees, transit loss) | P0 |
| All of the above readable offline with `DataAge` | P0 |
| 30-day price chart, "Why?" reasons, weather signal | P1 |
| Forecast model v2 | P2 |
| Risk-aware route scoring in Net-₹ | P2 |
| Glut Radar (pre-sowing crop warning, mock data) | P3 |
| Staggered selling slots (calendar of best selling day) | P3 |

**Done when:** prices update daily; heat colours show correctly; the Net-₹ table picks the best row; tomato never gets "hold more than 2 days" (unit test); offers below the floor show a warning.

#### Phase 3 — Buyer marketplace
**Goal:** verified buyers find graded lots, bid live, and buy combined Mega Lots from many small farmers.

| Feature | Priority |
|---|---|
| Buyer KYC (mock) and Verified Buyer badge; unverified buyers cannot bid (RLS) | P0 |
| Marketplace with filters (crop, grade, distance, quantity) | P0 |
| Live bidding (`place_bid` + Realtime) | P0 |
| Mega lot grouping (same crop and grade within 10 km) | P0 |
| Farmer / FPO accepts or rejects bids; floor warning on low bids | P0 |
| 5-point deal summary + voice consent → `accept_bid` | P0 |
| Ratings, trust score, ranking by trust | P1 |
| FPO dashboard for mega lots and members | P1 |

**Done when:** an unverified buyer is blocked; two browser windows show the same bid instantly; ten small lots combine into one mega lot; accepting a bid creates a deal and an escrow.

#### Phase 4 — Escrow and Digital Khata
**Goal:** the buyer's money is locked before delivery and released automatically; the farmer sees every step in a colour-coded passbook.

| Feature | Priority |
|---|---|
| Escrow tables, transitions, `escrow_transition()` + SQL tests | P0 |
| Cashfree adapter (mock + sandbox pay), `escrow-pay`, `cashfree-webhook` | P0 |
| Digital Khata with colours and voice; readable offline | P0 |
| Delivery OTP shown to buyer; hash + 5-try lock | P0 |
| "Mark dispatched" (simple dispatch) | P0 |
| Simple driver page: delivery photo + OTP entry (via `shipments-create` and `trip`) | P0 |
| 24 h auto-release (`cron-auto-settle`) + admin skip-timer | P0 |
| Split release to every farmer in a mega lot (`split.ts`) | P0 |
| Khata statement print page ("Save as PDF") | P1 |
| Push notifications for money events | P1 |
| EMI deduction during release | P2 |

**Done when:** a test payment moves escrow to FUNDED and the Khata shows yellow; the correct OTP releases money; the timer releases money when no OTP is entered; a mega-lot payment splits correctly to 10 farmers with no paisa lost; every step is in `escrow_events`.

#### Phase 5 — Logistics and proof
**Goal:** track the truck, prove the weight honestly, and prove delivery without the buyer's approval.

| Feature | Priority |
|---|---|
| Truck booking from seeded transporters | P1 |
| Full driver checklist (origin weigh → start → destination weigh → delivery photo → code) | P1 |
| Dual-frame weighbridge OCR with plate match and manual fallback | P1 |
| Live GPS tracking map; driver GPS and photos queued offline | P1 |
| Transit buffer check (allowed loss per crop) and partial hold | P1 |
| Geofence alert (truck leaves without unloading) | P1 |
| Background GPS in the APK for drivers | P1 |
| Driver fuel advance as a split payout | P2 |

**Done when:** a driver completes a trip using only the link; the truck moves on the map; a wrong plate is rejected; 1% loss is accepted and 5% loss holds only the extra part.

#### Phase 6 — Disputes and crop rescue
**Goal:** when something goes wrong, farmers don't lose everything, and cheaters are caught.

| Feature | Priority |
|---|---|
| Dispute by scanning rejected crates (QR partitioning), photos, reason | P1 |
| Hold only the rejected crates' money; auto-checks | P1 |
| Flash sale to verified buyers within 50 km (floor-protected, 15 min) | P1 |
| Nearest cold storage booking (labour included) | P1 |
| Trust score + 3-strike permanent ban | P1 |
| Admin dispute panel | P1 |
| Salvage board (Grade C and failed flash sales) | P2 |
| FPO emergency transit wallet and liability rules | P2 |
| Support tickets | P2 |

**Done when:** rejecting 2 of 20 crates holds only their money; a flash sale never goes below the floor; a failed flash sale moves the lot to salvage or cold storage; the third strike bans the user.

#### Phase 7 — Micro-credit and Consent Vault
**Goal:** farmers get fair loans using verified data and stay in control of who sees it.

| Feature | Priority |
|---|---|
| Consent popup, Consent Vault list, revoke | P2 |
| Loan request: KCC or emergency loan | P2 |
| ULI + CERSAI mock checks; "lien found" block | P2 |
| NBFC lead panel with commission tracking | P2 |
| Overdraft for transit emergencies (mock) | P2 |
| Real KCC / lender integration | P3 |

**Done when:** nothing is shared without "Yes"; revoke works and is logged; the lien-found farmer is blocked; EMI is deducted during release.

#### Phase 8 — Reach and advanced features
**Goal:** reach farmers without smartphones and add smarter checks.

| Feature | Priority |
|---|---|
| Continuous video audit (15 s video → 5 random frames graded) | P2 |
| WhatsApp bot + WhatsApp Flows (price check, create lot, payment status) | P3 |
| CSC / PACS kiosk mode with farmer OTP approval and reporting number | P3 |
| Mandi meter OCR → "Assured Grade" | P3 |
| e-NWR warehouse trading (mock receipts) | P3 |

**Done when:** a "good on top, bad below" test video is flagged; P3 screens open with seeded data.

#### Phase 9 — Release, testing and demo
**Goal:** a stable APK and web app, deployed, tested and demo-ready.

| Feature | Priority |
|---|---|
| Deploy web, functions, DB and AI service; seed + `demo-reset` | P0 |
| Escrow SQL tests + `split.ts` unit tests (100% of branches) | P0 |
| One Playwright test for the full P0 core flow | P0 |
| Offline test on a real low-cost phone (airplane mode, slow network) | P0 |
| Signed release APK | P0 |
| Sentry error tracking | P2 |
| Play Store listing | P3 |

**Done when:** the APK installs and works on a real phone; the live web URL works; the full core flow runs three times in a row without errors.

### 9.3 Build order
1. Phase 0 (all P0)
2. Phase 1 (P0)
3. Phase 2 (P0)
4. Phase 3 (P0)
5. Phase 4 (P0)
6. Phase 9 (P0) → **core freeze**: deploy, test, practise
7. Phase 5 and Phase 6 (P1), then P1 items from Phases 0–4
8. P2 items in this order: Consent Vault + loans → video audit → salvage + wallet → forecast v2 → tomato/potato grading
9. P3 placeholder screens

If time runs short, cut from the bottom of this list. Never cut P0.

### 9.4 How to build each feature
1. Read the relevant sections of this file. Write a short plan. Wait for approval.
2. Build in this order: migration + RLS → zod schema → SQL/Edge Function → service in `app/src/services` → UI → tests.
3. Check the screen at 360 px width, in all three languages, and in airplane mode if the feature is meant to work offline.
4. One feature per commit / PR. Update this file in the same PR if the design changed.

### 9.5 Prototype scope (current)

**Goal:** a working demo of the P0 core flow (Phases 0–4) on one phone and one laptop. The team builds the rest by hand afterwards, so the code must be simple and well explained.

**In scope:** only the P0 rows of Phases 0–4, plus these Phase 9 P0 items: seed + `demo-reset`, escrow SQL tests, `split.ts` tests, one Playwright happy-path test, web deploy, AI service deploy, debug APK, airplane-mode test.

**Out of scope:** Phases 5–8, every P1 / P2 / P3 item, signed release APK, Play Store, Sentry, the deploy workflow, the second Supabase project.

**Real, mock or skip:**

| Part | Prototype | Notes |
|---|---|---|
| Phone OTP login | Real (Supabase test numbers) | No real SMS |
| Onion grading | **Real** (simple OpenCV v1) | Mock grade when `AI_SERVICE_URL` is empty |
| Mandi prices | Seeded 60 days + real data.gov.in if key is set | `cron-fetch-prices` can be run by hand |
| Weather signal in advice | Seeded `weather_daily` | No weather cron yet |
| Road distance (Net-₹) | ORS if key is set, else straight line × 1.3 (mock) | |
| Map | MapTiler if key is set, else `MandiList` | |
| Buyer KYC | Mock (+ admin approve button) | |
| Payments | **Mock Cashfree** | A "Pay (demo)" button simulates the paid webhook |
| Driver link SMS | Mock | The link is shown on the seller's deal page and in admin |
| Voice | Browser voice + a few hand-made clips (grades, sell/hold, Khata states) in `hi` and `mr` | `tts` function and `make-voice-clips.ts` later |
| Push notifications | Skip | Screens update with Realtime |
| Auto-release | `cron-auto-settle` + admin skip-timer | |
| Android | Debug APK at the end | Web (PWA) first |

**Milestones** (the live checklist is `docs/progress.md`):
1. **M0 Foundation** — repo skeleton, design tokens, app shell, languages, login + roles + RLS, offline base, `VoiceButton`, PWA.
2. **M1 Farmer core** — onboarding, Smart Frame camera, `grade` function + AI service (onion), grade result + voice, create lot + QR + My Lots, offline save and sync.
3. **M2 Market intelligence** — price tables + seed, domain formulas + tests, prices screen (price, advice, floor, heatmap / list, data age), Net-₹ comparator.
4. **M3 Buyer marketplace** — mock KYC + badge, marketplace + filters, live bidding, mega lot grouping, farmer / FPO bids screen, deal consent + `accept_bid`.
5. **M4 Escrow and Khata** — escrow tables + `escrow_transition` + SQL tests, `split.ts` + tests, mock pay + webhook, Khata, mark dispatched, simple driver page (delivery photo + OTP), `escrow-release`, auto-release + skip-timer.
6. **M5 Demo ready** — full seed + `demo-reset`, one Playwright happy path, deploy (Vercel, Hugging Face, functions), debug APK, airplane-mode test, practise the demo.

**Prototype done when:** the P0 core flow (§9.1) runs three times in a row on a real phone + laptop without errors, including an offline scan that syncs later, and every mock shows the "Demo data" tag.

**Handoff rules (because the team continues by hand):**
- Simple code over clever code. No extra layers "for later".
- Every important file starts with a short comment: what it does and who uses it.
- Comments explain *why*, in simple English.
- After each feature, `docs/progress.md` is updated: what was built, files touched, what is mocked, how to test it, what is next.

---

## 10. Constraints and known limitations

### 10.1 Legal and policy
- **Cropket never holds money.** Funds are collected and held by an RBI-regulated payment partner. Cropket only sends release and split instructions. No in-house wallet for buyer money.
- **Cropket is only a Loan Service Provider.** Banks and NBFCs lend and collect. The lead fee and all loan charges must be shown to the farmer before consent (RBI digital lending rules).
- **DPDP Act 2023:** consent first, purpose-limited, revocable. Store verified results and consent logs, not raw government documents.
- **APMC:** the floor price is advisory. The app warns; it never blocks a trade.
- **"Assured Grade", not "Certified Grade":** Cropket is not a certifying body.
- **Onion, tomato and potato have no MSP.** Their floor is a data-based reference price. MSP is used only for MSP crops.

### 10.2 Data and integrations
- AgriStack, DigiLocker, ULI, CERSAI, e-NWR, Krishi-DSS and 3PL booking are **mock adapters**. Real access needs government or partner approval.
- The live data.gov.in API gives today's prices only. History comes from CSV imports and our own daily collector. Some mandis have missing days; the UI shows the data date and falls back to the nearest mandi.
- Arrival volumes are estimated (seeded + our own lot counts). Their accuracy depends on how many farmers use the app in that area.
- Cashfree Easy Split needs activation. Until then, payments run in mock mode and show "Demo data".
- Real SMS in India needs DLT registration. Development uses Supabase test numbers and a mock SMS for driver links.
- WhatsApp Cloud API needs a verified business for real users; development uses the Meta test number.

### 10.3 Offline
- First login needs internet. After that the app opens offline until the session can no longer be refreshed.
- The AI grade needs internet (until an on-device model exists). Offline lots show "Grade pending".
- Maps need internet. Offline shows lists instead.
- Prices, advice and Khata offline are only as fresh as the last sync. The age is always shown.
- Money, bidding, consent, KYC, disputes and OTP never work offline, by design.
- Android may still clear app storage in rare cases (e.g., the user clears data). Unsynced drafts would be lost; the app warns when items have been waiting for more than 24 h.
- App code changes need a new APK. Old versions are blocked when below `min_app_version`.

### 10.4 AI and OCR
- Grading is indicative. Light, dust, angle and camera quality change results. Confidence is always shown, and low-confidence lots go to human check.
- Real size needs the ₹10 reference coin in the photo; without it, size is only relative.
- OCR on LED 7-segment displays is unreliable. Manual entry with the stored photo is always allowed and marked "manual".
- Video audit only catches obvious "good on top, bad below" cases.
- Advice v1 is rule-based. The wording says "may", never "will".

### 10.5 Platform and device
- Browsers stop GPS when the screen is off. The web driver page uses Wake Lock and asks the driver to keep it open. Background GPS needs the APK plugin.
- Hindi and Marathi system voices are missing on many phones → bundled clips and Bhashini. Browser speech recognition needs internet and works best in Chrome.
- Target platform is Android. iPhone push works only for installed web apps, and camera and install behaviour differs.
- Low-end phones: keep bundles small, compress photos, avoid heavy animations.

### 10.6 Free-tier limits
- Supabase free: projects pause after about a week of no activity; limited database, storage and function calls. Compress photos and clean old demo data.
- AI service free hosts sleep when idle and have limited memory. Warm up before use; keep models small.
- data.gov.in: use our own key (the sample key returns 10 rows).
- OpenRouteService and MapTiler have daily limits. Cache distances for 24 h.

### 10.7 Honesty rule
Anything backed by a mock adapter shows the "Demo data" tag. Never show mock results as real. Mock mode because a key is **missing** is fine. If the key **is set** and the real call fails, show an error; never switch to mock data quietly.
