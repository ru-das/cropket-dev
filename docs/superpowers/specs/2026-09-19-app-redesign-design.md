# Design Document: Cropket App Redesign (Refined Agro-Craft)

**Date**: 2026-09-19  
**Status**: Approved by User  
**Scope**: Complete visual and UX modernization of Cropket (Phases 0–2 screens and foundation) while strictly preserving rural simplicity, sunlight readability, and `SPEC.md` rules.

---

## 1. Executive Summary & Goals

Cropket's user interface is being redesigned to be **modern, eye-catching, and visually aesthetic** without sacrificing its core **mandi-slip clarity** and tactile simplicity for rural farmers, FPOs, and buyers.

### Primary Objectives
1. **Aesthetic Direction**: *Refined Agro-Craft* — deep emerald greens (`#1F6B3A`, `#154D2A`), warm organic field tones (`#F4F7F2`), subtle cream undertones, and tactile micro-borders with high outdoor daylight contrast.
2. **Tactile Elevation & Depth**: Replace flat wireframe boxes with sunlight-optimized micro-shadows (`shadow-card`, `shadow-dock`, `shadow-float`), organic corner radii (16px cards, 12px buttons), and responsive active touch states (`active:scale-[0.97]`).
3. **App Shell Ergonomics**: Modern pinned dock navigation with soft leaf-tinted active pill highlights (`bg-leaf-light`), integrated sync status pills, and segmented language switcher.
4. **Distinctive Agro-Tonal Hero Displays**:
   - `FarmerHome`: Action tiles with category-specific tint containers (Green for Scan, Blue for Lots, Gold for Prices, Soil for Khata).
   - `PriceHero`: Dignified hero card with rich typography, price movement pills, and integrated audio read-out.
   - `AdviceCard`: Clear signature accent strips (6px Haldi bar for Hold, 6px Pass bar for Sell Now).
   - `ComparePage` (Net-₹): Prominent winner card with trophy badge and itemized accordion breakdown.
5. **Audio Companion Polish**: `VoiceButton` upgraded from a plain square box to a polished audio chip/pill with active soundwave indicators.
6. **Zero Dependency Bloat**: 100% built on existing dependencies (`tailwindcss` v4, `@fontsource-variable/baloo-2`, `@fontsource/mukta`, `lucide-react`). No extra packages.

---

## 2. Constraints & SPEC Alignment

| Requirement | Rule & Implementation |
|---|---|
| **No Dark Mode** | `SPEC.md` §6.2: Farmers use phones outdoors in bright sunlight. High-contrast light theme with rich emerald, haldi, and field background. |
| **Typography** | `SPEC.md` §6.3: Base body size is **18px** (`line-height: 1.56`) for Devanagari script clarity. Numbers in `Baloo 2 Variable` (`tabular-nums`), screen titles in `Baloo 2`, body in `Mukta`. |
| **Touch Targets** | `SPEC.md` §6.4: Minimum **56px** height for primary interactive elements with ≥ 8px tap clearance. |
| **Multi-modal Clarity** | `SPEC.md` §6.1: Icon + word + 🔊 together. Never color alone. Numbers formatted with Indian digit grouping (`₹1,850`). |
| **Strict i18n** | `CLAUDE.md` §4: All user-visible copy lives in `app/src/locales/*.json`. No hard-coded text in components/routes (ESLint enforced). |
| **Lightweight & Fast** | Initial JS stays under 200 KB; full offline resilience preserved. |

---

## 3. Architecture & Visual System

### 3.1 Color Tokens (`app/src/styles/tokens.css`)

```css
@theme {
  /* Base Palette */
  --color-leaf: #1f6b3a;        /* Brand, primary buttons, actionable links */
  --color-leaf-dark: #154d2a;   /* Pressed states, header text */
  --color-leaf-light: #e8f5ec;  /* Soft green pill highlights & active states */
  --color-leaf-hover: #19562e;
  --color-field: #f4f7f2;       /* Fresh, sunlit agricultural backdrop */
  --color-surface: #ffffff;     /* Card surfaces */
  --color-surface-subtle: #f9faf7; /* Soft secondary card background */
  --color-soil: #5a4632;        /* Earthy secondary text & accents */
  --color-soil-light: #f7f3ed;
  --color-ink: #1b2420;         /* High-contrast primary text */
  --color-ink-muted: #526058;   /* Secondary text, WCAG AA compliant on field/surface */
  --color-line: #dfe5dc;        /* Clean micro-borders */
  --color-line-subtle: #edf2ea; /* Inner card divider lines */

  /* Meaning Colours & Tints */
  --color-haldi: #f2b705;       /* Money locked safely */
  --color-haldi-text: #7a5a00;
  --color-haldi-light: #fef8e7;
  --color-neel: #2f5da8;        /* Goods in transit */
  --color-neel-text: #1e3f75;
  --color-neel-light: #eff4fc;
  --color-pass: #2e9e4f;        /* Paid / Grade A / Good return */
  --color-pass-text: #1d6b34;
  --color-pass-light: #eaf7ee;
  --color-mirchi: #c8302b;      /* Problem / Below floor / Alert */
  --color-mirchi-text: #9a231f;
  --color-mirchi-light: #fdf2f2;
  --color-kesar: #e07b1f;       /* Offline / Needs attention */
  --color-kesar-text: #8a4a0f;
  --color-kesar-light: #fdf5ec;

  /* Fonts */
  --font-body: Mukta, "Noto Sans Devanagari", system-ui, sans-serif;
  --font-display: "Baloo 2 Variable", Mukta, "Noto Sans Devanagari", system-ui, sans-serif;

  /* Type Scale */
  --text-hero: 40px;
  --text-hero--line-height: 44px;
  --text-title: 24px;
  --text-title--line-height: 30px;
  --text-card: 20px;
  --text-card--line-height: 28px;
  --text-body: 18px;
  --text-body--line-height: 28px;
  --text-meta: 15px;
  --text-meta--line-height: 22px;

  /* Corner Radii */
  --radius-button: 12px;
  --radius-card: 16px;
  --radius-sheet: 24px;
}
```

### 3.2 Elevation, Shadows & Animation (`app/src/styles/globals.css`)

```css
@layer utilities {
  .shadow-card {
    box-shadow: 0 1px 3px 0 rgba(27, 36, 32, 0.05), 0 1px 2px -1px rgba(27, 36, 32, 0.03);
  }
  .shadow-dock {
    box-shadow: 0 -2px 12px 0 rgba(27, 36, 32, 0.05);
  }
  .shadow-float {
    box-shadow: 0 4px 14px 0 rgba(27, 36, 32, 0.08);
  }
}
```

---

## 4. Detailed Component & Screen Redesigns

### 4.1 Shell & Global Chrome
1. **`AppShell.tsx`**: Ergonomic column (`max-w-md mx-auto min-h-screen bg-field flex flex-col sm:border-x sm:border-line shadow-sm`) with pinned header and bottom dock.
2. **`AppHeader.tsx`**:
   - Brand signature `🌾 Cropket` in `Baloo 2` bold leaf-dark.
   - `SyncStatus`: Modern rounded status pill with colored pulse dot.
   - `LanguageSwitch`: Segmented pill selector with active language highlighted in an elevated white pill.
3. **`BottomNav.tsx`**:
   - Pinned dock with `shadow-dock bg-surface/95 backdrop-blur-md border-t border-line`.
   - Active tab highlighted with a soft leaf-tinted rounded pill (`bg-leaf-light text-leaf-dark rounded-xl px-3 py-1`).
   - Inactive tabs in clear muted slate with smooth tap feedback.
4. **`NetworkBanner.tsx` / `SyncTrouble.tsx`**: Smooth slide-in alert banners with clear retry actions.

### 4.2 Entry, Auth & Onboarding
1. **`WelcomePage.tsx`**:
   - Circular agro emblem (`🌾` on `bg-leaf-light`).
   - Large hero typography in `Baloo 2` with tagline.
   - Tactile language selection cards with native script names, border hover, and chevron indicator.
   - Centered `VoiceButton` audio chip.
2. **`LoginPage.tsx`**:
   - Header with back arrow and language selector.
   - Security signal badge (*"Surakshit Login"*).
   - Unified phone input with display-only `+91` container.
   - Single 6-digit OTP field with extra height (`h-16`), wide letter spacing (`tracking-[0.6em]`), and focus ring.
   - Resend timer chip with clock icon.
3. **`OnboardingPage.tsx`**:
   - Visual step progress meter (*"Step 2 of 4"*).
   - Modern assistant speech bubble with inline `VoiceButton`.
   - Visual role selection cards (Farmer 🧑‍🌾, Buyer 🏢, FPO 👥) with selection ring.
   - Interactive crop pills (`[🧅 Onion] [🍅 Tomato] [🥔 Potato]`).
   - GPS capture card with pulsating radar indicator.

### 4.3 Farmer Core & Media
1. **`FarmerHome.tsx` & `BigTile.tsx`**:
   - Personal greeting banner in `Baloo 2` (*"Namaste, Ramesh"*) with audio play chip.
   - Passbook/Khata status strip with 6px left bar.
   - Category-tinted action tiles:
     - Scan crop (Leaf green container)
     - My lots (Neel blue container)
     - Today's price (Haldi gold container)
     - My khata (Soil earth container)
2. **`SmartFrameCamera.tsx` & `ScanPage.tsx`**:
   - Precision HUD viewfinder corner brackets with real-time green/red lighting indicator.
   - Dashed circular ₹10 coin placement guide.
   - Ambient lighting pill banner.
   - 76px shutter button with white ring and emerald center. Flash toggle chip.
3. **`ScanResultPage.tsx`**:
   - `GradeBadge`: Organic shield badge with soft colored tint backdrop and large Baloo 2 grade letter.
   - Metric progress bars with rounded pill tracks for Size, Color, and Damage.
   - AI confidence pill (*"AI is 82% sure"*).
   - Sticky bottom action bar with primary "Create lot" button and secondary "Scan again".
4. **`NewLotPage.tsx` & `NumberPad.tsx`**:
   - Large weight display in `Baloo 2` with `kg` unit pill.
   - Tactile 3x4 NumberPad with 56px keys and active press scale.
   - GPS location chip.
5. **`LotsPage.tsx` & `LotDetailPage.tsx`**:
   - `LotCard`: Crop icon, weight, QR tag, status pill, indicative grade badge, and offline sync pill.
   - `LotDetailPage`: Scannable QR framed card with action shortcuts.

### 4.4 Market Intelligence & Net-₹
1. **`PricesPage.tsx` & `PriceHero.tsx`**:
   - Rich hero surface with warm field/leaf gradient.
   - Hero modal price in `Baloo 2` with `/ quintal` badge.
   - Price trend pill (gain in green, drop in red).
   - Mandi location tag and integrated audio read-out.
2. **`AdviceCard.tsx`**:
   - Action signature card: 6px Haldi bar for Hold (*"⏳ Hold for 5 days"*), 6px Pass bar for Sell Now (*"🛒 Sell now"*).
   - Rationale tag bubbles for weather and market arrival signals.
3. **`FloorWarning.tsx`**:
   - High-contrast Mirchi alert card explaining minimum fair price.
4. **`ComparePage.tsx` (Net-₹ Comparator)**:
   - Crowned winner card with trophy badge (`🏆 Best return`) and bold "You keep" amount.
   - Expandable accordion cards with receipt-style breakdown (Gross, Transport, Mandi fees, Transit loss).
   - Sticky bottom action bar with "Sell on Cropket" CTA.

### 4.5 Partner Stubs & Account
1. **`BuyerHome.tsx`**: Verified status badge, marketplace preview placeholder, clean role switch / logout.
2. **`FpoHome.tsx`**: Aggregate tonnage card, farmer lot summary, clean actions.
3. **`AdminHome.tsx`**: Clean dashboard grid with system health status.
4. **`MePage.tsx`**: Farmer profile card with name, phone, village pin, crop badges, language switch, and logout button.

---

## 5. Rollout Plan (Approach 1: Layer-by-Layer)

* **Step 1: Design Tokens & Core Primitives**
  * `tokens.css`, `globals.css`
  * `GradeBadge.tsx`, `VoiceButton.tsx`, `BigTile.tsx`, `DemoDataTag.tsx`
  * Run tests & lints
* **Step 2: App Shell & Global Navigation**
  * `AppShell.tsx`, `AppHeader.tsx`, `BottomNav.tsx`, `LanguageSwitch.tsx`, `SyncStatus.tsx`, `NetworkBanner.tsx`, `SyncTrouble.tsx`
  * Run tests & lints
* **Step 3: Entry, Auth & Onboarding Flows**
  * `WelcomePage.tsx`, `LoginPage.tsx`, `OnboardingPage.tsx`, `StepInputs.tsx`
  * Run tests & lints
* **Step 4: Farmer Core & Scan/Lots Flows**
  * `FarmerHome.tsx`, `SmartFrameCamera.tsx`, `ScanPage.tsx`, `ScanResultPage.tsx`, `GradeBreakdown.tsx`, `NewLotPage.tsx`, `NumberPad.tsx`, `LotsPage.tsx`, `LotCard.tsx`, `LotDetailPage.tsx`
  * Run tests & lints
* **Step 5: Market Intelligence & Net-₹ Comparison**
  * `PricesPage.tsx`, `PriceHero.tsx`, `AdviceCard.tsx`, `FloorWarning.tsx`, `MandiList.tsx`, `ComparePage.tsx`
  * Run tests & lints
* **Step 6: Partner Stubs, Profile & Final Polish**
  * `BuyerHome.tsx`, `FpoHome.tsx`, `AdminHome.tsx`, `MePage.tsx`, `locales/*.json`
  * Full test suite run, build verification, and e2e checks

---

## 6. Verification & Quality Gates

1. **ESLint**: `pnpm lint` must pass with zero warnings (strict check on hardcoded text).
2. **TypeScript**: `pnpm typecheck` must pass cleanly without type errors.
3. **Unit Tests**: `pnpm test` (all 32 tests must pass across domain formulas, offline outbox, schemas, and UI helpers).
4. **Production Build**: `pnpm build` must succeed; bundle size must stay within budget.
5. **Ergonomic Verification**: 320px & 360px viewport test, 3-language verification (EN, HI, MR), offline simulated behavior.
