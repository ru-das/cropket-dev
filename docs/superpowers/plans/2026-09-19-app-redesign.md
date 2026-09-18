# Cropket App Redesign (Refined Agro-Craft) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire Cropket application to a modern, eye-catching, visually aesthetic "Refined Agro-Craft" style while maintaining rural usability, sunlight contrast, and mandi-slip clarity.

**Architecture:** We use an incremental, layer-by-layer rollout (Approach 1). We first establish refined design tokens and elevation primitives, then revamp the shell and navigation dock, followed by auth/onboarding flows, the farmer core and scanning/lots experience, market intelligence/Net-₹ comparator screens, and finally partner role stubs and account profiles.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, `@fontsource-variable/baloo-2`, `@fontsource/mukta`, `lucide-react`, `clsx`, `tailwind-merge`. Zero new dependencies.

**Spec:** [`docs/superpowers/specs/2026-09-19-app-redesign-design.md`](file:///home/rupam/cropket/docs/superpowers/specs/2026-09-19-app-redesign-design.md)

## Global Constraints
- **No Dark Mode**: Outdoor sunlight readability is paramount (`SPEC.md` §6.2).
- **Typography Scale**: Base body text is strictly 18px (`line-height: 1.56`) for Devanagari rendering (`SPEC.md` §6.3). Hero numbers in `Baloo 2 Variable` with `tabular-nums`.
- **Minimum Tap Targets**: 56px height for all primary action buttons and inputs (`SPEC.md` §6.4).
- **Multi-modal Signals**: Icon + word + 🔊 together; never color alone (`SPEC.md` §6.1). Indian digit grouping (`₹1,850`).
- **Strict i18n**: No hardcoded text in components/routes; all strings in `app/src/locales/*.json` (`CLAUDE.md` §4).
- **Performance**: Zero new packages; bundle size must remain under budget (< 200 KB initial JS).

---

### Task 1: Design Tokens & Core Primitives

**Files:**
- Modify: `app/src/styles/tokens.css`
- Modify: `app/src/styles/globals.css`
- Modify: `app/src/components/lot/GradeBadge.tsx`
- Modify: `app/src/components/voice/VoiceButton.tsx`
- Modify: `app/src/components/common/BigTile.tsx`
- Modify: `app/src/components/common/DemoDataTag.tsx`
- Test: `app/tests/unit/lot/gradeDisplay.test.ts`, `app/tests/unit/voice/speak.test.ts`

**Interfaces:**
- Consumes: Tailwind v4 `@theme`, existing token names
- Produces: `--color-leaf-light`, `--color-haldi-light`, `--color-neel-light`, `--color-pass-light`, `--color-mirchi-light`, `--color-kesar-light`, `--color-surface-subtle`, `--color-line-subtle`, `.shadow-card`, `.shadow-dock`, `.shadow-float`. Upgraded `GradeBadge`, `VoiceButton`, and `BigTile`.

- [ ] **Step 1: Update design tokens in `tokens.css`**
Add semantic tint scales and subtle surface tokens to `app/src/styles/tokens.css`:
```css
  --color-leaf-light: #e8f5ec;
  --color-leaf-hover: #19562e;
  --color-surface-subtle: #f9faf7;
  --color-soil-light: #f7f3ed;
  --color-line-subtle: #edf2ea;

  --color-haldi-light: #fef8e7;
  --color-neel-light: #eff4fc;
  --color-pass-light: #eaf7ee;
  --color-mirchi-light: #fdf2f2;
  --color-kesar-light: #fdf5ec;
```

- [ ] **Step 2: Add sunlight micro-shadows and tactile transitions in `globals.css`**
Add utility shadow classes (`shadow-card`, `shadow-dock`, `shadow-float`) and refine active button transitions.

- [ ] **Step 3: Redesign `GradeBadge.tsx`**
Upgrade `GradeBadge` to render an organic shield/pill badge with soft background tints (`bg-pass-light border-pass/30 text-pass-text`), large Baloo 2 grade letter, and descriptive category label.

- [ ] **Step 4: Redesign `VoiceButton.tsx`**
Upgrade `VoiceButton` to a rounded audio pill/chip (`rounded-full bg-surface border border-line shadow-xs px-2.5 py-1 text-meta text-ink flex items-center gap-1.5 hover:border-leaf active:scale-95 transition-all`) with an audio wave icon and active pulse.

- [ ] **Step 5: Redesign `BigTile.tsx` & `DemoDataTag.tsx`**
Upgrade `BigTile` to support category-specific tint containers (`bg-leaf-light`, `bg-neel-light`, etc.) and `DemoDataTag` to a modern warning pill.

- [ ] **Step 6: Run tests and verify**
Run: `cd /home/rupam/cropket/app && pnpm test && pnpm lint && pnpm typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit**
```bash
git add app/src/styles/ app/src/components/lot/ app/src/components/voice/ app/src/components/common/
git commit -m "feat(ui): design tokens, elevation shadows, and core primitives"
```

---

### Task 2: App Shell & Global Chrome

**Files:**
- Modify: `app/src/components/shell/AppShell.tsx`
- Modify: `app/src/components/shell/AppHeader.tsx`
- Modify: `app/src/components/shell/BottomNav.tsx`
- Modify: `app/src/components/shell/LanguageSwitch.tsx`
- Modify: `app/src/components/shell/SyncStatus.tsx`
- Modify: `app/src/components/shell/NetworkBanner.tsx`
- Modify: `app/src/components/shell/SyncTrouble.tsx`
- Test: `app/tests/unit/shell/syncTrouble.test.ts`

**Interfaces:**
- Consumes: Task 1 tokens & shadows
- Produces: Refined responsive `AppShell`, sticky `AppHeader` with pill badges, `BottomNav` dock with active pills.

- [ ] **Step 1: Redesign `AppShell.tsx`**
Wrap content in an ergonomic container:
`max-w-md mx-auto min-h-screen bg-field flex flex-col sm:border-x sm:border-line shadow-sm relative`.

- [ ] **Step 2: Redesign `AppHeader.tsx`**
Render `🌾 Cropket` in bold Baloo 2 (`text-card font-bold text-leaf-dark tracking-tight`) and align sync and language switches.

- [ ] **Step 3: Redesign `LanguageSwitch.tsx`**
Implement an interactive segmented pill selector (`bg-surface-subtle border border-line p-0.5 rounded-full`) with the active language in an elevated white pill with micro-shadow.

- [ ] **Step 4: Redesign `SyncStatus.tsx`**
Render a rounded pill chip with active pulsing sync dot and pending badge.

- [ ] **Step 5: Redesign `BottomNav.tsx`**
Anchor bottom dock with `shadow-dock bg-surface/95 backdrop-blur-md border-t border-line`, active tab with `bg-leaf-light text-leaf-dark rounded-xl px-3 py-1`, and min 56px touch target.

- [ ] **Step 6: Redesign `NetworkBanner.tsx` & `SyncTrouble.tsx`**
Update offline and trouble alert banners with soft tint styling and retry action buttons.

- [ ] **Step 7: Run tests and verify**
Run: `cd /home/rupam/cropket/app && pnpm test && pnpm lint && pnpm typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 8: Commit**
```bash
git add app/src/components/shell/
git commit -m "feat(ui): app shell, header, dock bottom navigation, and banners"
```

---

### Task 3: Entry, Auth & Onboarding Flows

**Files:**
- Modify: `app/src/routes/welcome/WelcomePage.tsx`
- Modify: `app/src/routes/login/LoginPage.tsx`
- Modify: `app/src/routes/onboarding/OnboardingPage.tsx`
- Modify: `app/src/routes/onboarding/StepInputs.tsx`
- Test: `app/tests/unit/onboarding/steps.test.ts`

**Interfaces:**
- Consumes: Tasks 1 & 2 tokens, primitives, and shell
- Produces: Polished `WelcomePage`, `LoginPage` with large OTP inputs, `OnboardingPage` with chat assistant styling.

- [ ] **Step 1: Redesign `WelcomePage.tsx`**
Add circular agro emblem (`🌾` in `bg-leaf-light`), Baloo 2 hero title, tagline, tactile language cards with native script names and arrow indicators, and centered `VoiceButton`.

- [ ] **Step 2: Redesign `LoginPage.tsx`**
Add security badge (*"Surakshit Login"*), unified phone container with `+91` container, 6-digit OTP field with generous letter spacing (`tracking-[0.6em] h-16 text-title`), clock countdown pill, and full-width 56px primary button.

- [ ] **Step 3: Redesign `OnboardingPage.tsx` & `StepInputs.tsx`**
Add step progress indicator (`Step 2 of 4`), assistant speech bubble with inline audio chip, visual role cards (Farmer 🧑‍🌾, Buyer 🏢, FPO 👥), crop pill selection (`[🧅 Onion]`), and GPS radar pulse button.

- [ ] **Step 4: Run tests and verify**
Run: `cd /home/rupam/cropket/app && pnpm test && pnpm lint && pnpm typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**
```bash
git add app/src/routes/welcome/ app/src/routes/login/ app/src/routes/onboarding/
git commit -m "feat(ui): welcome, phone OTP login, and chat-style onboarding"
```

---

### Task 4: Farmer Core & Scan/Lots Flows

**Files:**
- Modify: `app/src/routes/farmer/FarmerHome.tsx`
- Modify: `app/src/components/camera/SmartFrameCamera.tsx`
- Modify: `app/src/routes/farmer/ScanPage.tsx`
- Modify: `app/src/routes/farmer/ScanResultPage.tsx`
- Modify: `app/src/components/lot/GradeBreakdown.tsx`
- Modify: `app/src/routes/farmer/NewLotPage.tsx`
- Modify: `app/src/components/common/NumberPad.tsx`
- Modify: `app/src/routes/farmer/LotsPage.tsx`
- Modify: `app/src/components/lot/LotCard.tsx`
- Modify: `app/src/routes/farmer/LotDetailPage.tsx`
- Test: `app/tests/unit/camera/frame.test.ts`, `app/tests/unit/common/numberPad.test.ts`

**Interfaces:**
- Consumes: Task 1-3 primitives, services (`lots.ts`, `grading.ts`)
- Produces: Redesigned Farmer Home, Camera HUD, Grade Result, NumberPad lot creation, and My Lots list.

- [ ] **Step 1: Redesign `FarmerHome.tsx`**
Render personal greeting in Baloo 2 with audio chip, Khata status strip, and category-tinted action tiles (Scan crop, My lots, Today's price, My khata).

- [ ] **Step 2: Redesign `SmartFrameCamera.tsx` & `ScanPage.tsx`**
Add precision HUD corner brackets (green when light is good, red when dark), circular ₹10 coin target guide, floating light status pill, and 76px tactile shutter button with flash chip.

- [ ] **Step 3: Redesign `ScanResultPage.tsx` & `GradeBreakdown.tsx`**
Add Grade Hero Card with `GradeBadge`, rounded metric progress pills for size/color/damage, AI confidence chip, and sticky bottom action bar.

- [ ] **Step 4: Redesign `NewLotPage.tsx` & `NumberPad.tsx`**
Add large weight hero display in Baloo 2 with `kg` badge, tactile 56px NumberPad keys with active press scale, and GPS location chip.

- [ ] **Step 5: Redesign `LotsPage.tsx`, `LotCard.tsx`, `LotDetailPage.tsx`**
Update `LotCard` with crop icon, weight, QR tag, status pill, indicative grade badge, and offline sync tag. Update `LotDetailPage` with framed QR code card and action shortcuts.

- [ ] **Step 6: Run tests and verify**
Run: `cd /home/rupam/cropket/app && pnpm test && pnpm lint && pnpm typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 7: Commit**
```bash
git add app/src/routes/farmer/ app/src/components/camera/ app/src/components/lot/ app/src/components/common/NumberPad*
git commit -m "feat(ui): farmer home, smart camera HUD, grading result, and lot management"
```

---

### Task 5: Market Intelligence & Net-₹ Comparison

**Files:**
- Modify: `app/src/routes/farmer/PricesPage.tsx`
- Modify: `app/src/components/market/PriceHero.tsx`
- Modify: `app/src/components/market/AdviceCard.tsx`
- Modify: `app/src/components/market/FloorWarning.tsx`
- Modify: `app/src/components/market/MandiList.tsx`
- Modify: `app/src/routes/farmer/ComparePage.tsx`
- Test: `app/tests/unit/services/prices.test.ts`, `app/tests/unit/domain/netRupee.test.ts`, `app/tests/unit/domain/advice.test.ts`

**Interfaces:**
- Consumes: Task 1-4 design tokens and market services (`prices.ts`, `routes.ts`)
- Produces: Redesigned `PriceHero`, `AdviceCard` with 6px signature bars, `FloorWarning`, `MandiList`, and Net-₹ comparator.

- [ ] **Step 1: Redesign `PriceHero.tsx` & `PricesPage.tsx`**
Render dignified gradient hero card with Baloo 2 price headline, up/down price movement pills, mandi tag, and audio chip. Add crop filter pills in `PricesPage`.

- [ ] **Step 2: Redesign `AdviceCard.tsx` & `FloorWarning.tsx`**
Style `AdviceCard` with 6px Haldi left bar for Hold (*"⏳ Hold for 5 days"*) or 6px Pass bar for Sell Now (*"🛒 Sell now"*), plus rationale tag bubbles. Style `FloorWarning` with high-contrast Mirchi alert card.

- [ ] **Step 3: Redesign `MandiList.tsx`**
Render interactive mandi cards with name, distance, modal price, and supply heat status badges (🔴 Over-supply, 🟡 Normal, 🟢 Needed).

- [ ] **Step 4: Redesign `ComparePage.tsx`**
Crown top destination with gold trophy badge (`🏆 Best return`), soft pass tint container, and bold "You keep" figure. Render expandable accordion cards with receipt-style breakdown (Gross, Transport, Fees, Transit loss). Add sticky "Sell on Cropket" CTA.

- [ ] **Step 5: Run tests and verify**
Run: `cd /home/rupam/cropket/app && pnpm test && pnpm lint && pnpm typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 6: Commit**
```bash
git add app/src/routes/farmer/PricesPage.tsx app/src/routes/farmer/ComparePage.tsx app/src/components/market/
git commit -m "feat(ui): prices hero, advice cards, mandi list, and net-rupee comparator"
```

---

### Task 6: Partner Stubs, Profile & System Finalization

**Files:**
- Modify: `app/src/routes/buyer/BuyerHome.tsx`
- Modify: `app/src/routes/fpo/FpoHome.tsx`
- Modify: `app/src/routes/admin/AdminHome.tsx`
- Modify: `app/src/routes/farmer/MePage.tsx`
- Modify: `app/src/locales/en.json`, `app/src/locales/hi.json`, `app/src/locales/mr.json`
- Test: `app/tests/unit/locales.test.ts`, all unit tests

**Interfaces:**
- Consumes: All redesign primitives and shell components
- Produces: Polished partner homes, Me page, and verified translation dictionary.

- [ ] **Step 1: Redesign `BuyerHome.tsx`, `FpoHome.tsx`, `AdminHome.tsx`**
Add clean welcome cards with verified badges, role summaries, and logout actions.

- [ ] **Step 2: Redesign `MePage.tsx`**
Render farmer profile card with name, phone number, village GPS chip, registered crops tags, language switcher, and logout button.

- [ ] **Step 3: Sync locales dictionaries**
Ensure any newly introduced keys exist identically across `en.json`, `hi.json`, and `mr.json`.

- [ ] **Step 4: Run full verification suite**
Run:
```bash
cd /home/rupam/cropket/app
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
Expected: All tests pass, lint passes with 0 warnings, build succeeds.

- [ ] **Step 5: Commit**
```bash
git add app/src/routes/buyer/ app/src/routes/fpo/ app/src/routes/admin/ app/src/routes/farmer/MePage.tsx app/src/locales/
git commit -m "feat(ui): partner homes, farmer profile, and locale synchronization"
```
