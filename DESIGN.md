# Cropket — DESIGN.md

> **PRECEDENCE RULE (MANDATORY FOR ALL AI AGENTS & CONTRIBUTORS):**
> For any and all visual design, UI/UX, styling, design tokens, component aesthetics, typography, elevation, motion, layout, and visual hierarchy decisions, **`DESIGN.md` IS THE SINGLE SOURCE OF TRUTH AND EXPLICITLY OVERRIDES `SPEC.md` §6, `AGENTS.md`, AND `CLAUDE.md`**.
>
> The legacy "Mandi-slip clear" paper aesthetic described in `SPEC.md` §6.1 has been permanently replaced with the **"Bold Agritech Vanguard"** design system defined in this document. We are building a modern, high-production-value mobile application, not a flat paper slip or receipt.

---

## 1. Core Design Philosophy: "Agritech Vanguard"

Cropket bridges the power of modern consumer mobile app craft with rigorous rural usability. It rejects the outdated assumption that agricultural apps must look austere, dull, or barebones.

### The Four Pillars
1. **Bold Visual Presence:** High-energy organic palette (deep emerald, radiant turmeric gold, rich cobalt, vivid pass green, and warm saffron), sculptural card elevation, ambient glowing auras, and bold typography.
2. **Outdoor Sunlight Legibility:** Ultra-high contrast engineered for harsh field sunlight (WCAG AA minimum, 14:1+ on hero elements). Crisp white cards (`--color-surface`) and warm earthy backgrounds (`--color-surface-subtle`).
3. **Multi-Modal Accessibility:** Every critical data point, price, advice, and grade pairs **Icon + Word + Voice (`VoiceButton`)**. Low-literacy farmers can navigate effortlessly with audio reinforcement and tactile visual cues.
4. **Zero AI-Tells (Craft Integrity):** Verified against mechanical design detectors. Rejects cliché AI design tropes such as thick colored side-tabs (`border-l-8`), generic cold-gray palettes, or lifeless flat boxes.

---

## 2. Color Tokens & Semantic Palette

Defined in [`app/src/styles/tokens.css`](file:///home/rupam/cropket/app/src/styles/tokens.css) under `@theme`. All code must use these Tailwind utility classes—**never hardcode raw hex values**.

### 2.1 Brand & Neutral Foundation
| Token | Hex Value | Tailwind Class | Usage |
|---|---|---|---|
| `--color-leaf` | `#126835` | `bg-leaf`, `text-leaf`, `border-leaf` | Primary brand green, hero CTAs, active highlights |
| `--color-leaf-pressed` | `#0a4020` | `bg-leaf-pressed` | Pressed / active state for primary buttons |
| `--color-leaf-subtle` | `#e8f5e9` | `bg-leaf-subtle`, `text-leaf-text` | Light green background pill, selected badge fill |
| `--color-ink` | `#0f1914` | `text-ink` | Primary high-contrast text (14:1+ contrast on white) |
| `--color-ink-muted` | `#4b6354` | `text-ink-muted` | Secondary meta text, labels, subtle helpers |
| `--color-surface` | `#ffffff` | `bg-surface` | Elevated card surfaces, inputs, modal dialogs |
| `--color-surface-subtle` | `#f4f6f4` | `bg-surface-subtle` | Warm organic app background, inactive pill fills |
| `--color-line` | `#e2e8e0` | `border-line` | Card borders, dividers, subtle structural strokes |

### 2.2 Semantic Meaning Colors
Color meanings are strictly consistent across all features (Khata, Mandi heatmap, Grade badges, Logistics):

| Meaning | Token | Tailwind Fill / Text | Hex | Semantics |
|---|---|---|---|---|
| **Gold / Turmeric** | `--color-haldi` | `bg-haldi`, `text-haldi-text`, `bg-haldi-light` | `#eab308` | Money locked in escrow, Grade B, Hold advice |
| **Cobalt / Indigo** | `--color-neel` | `bg-neel`, `text-neel-text`, `bg-neel-light` | `#2563eb` | In transit, driver tracking, logistics, action pills |
| **Triumphant Green** | `--color-pass` | `bg-pass`, `text-pass-text`, `bg-pass-light` | `#16a34a` | Released payout, Grade A, Delivered, Verified |
| **Crimson / Chili** | `--color-mirchi` | `bg-mirchi`, `text-mirchi-text`, `bg-mirchi-light` | `#dc2626` | Below floor alert, high supply, dispute, error |
| **Saffron / Orange** | `--color-kesar` | `bg-kesar`, `text-kesar-text`, `bg-kesar-light` | `#ea580c` | Grade C, attention needed, offline sync warning |

---

## 3. Elevation, Shadows & Depth

Defined in [`app/src/styles/globals.css`](file:///home/rupam/cropket/app/src/styles/globals.css). We do **not** use flat "border-only, zero-shadow" styling. Cards use subtle, multi-layered ambient shadows to establish clear visual depth:

- `shadow-card`: `0 2px 8px -2px rgba(15, 25, 20, 0.06), 0 1px 3px -1px rgba(15, 25, 20, 0.04)` — Default card elevation.
- `shadow-dock`: `0 -4px 16px -2px rgba(15, 25, 20, 0.08)` — Fixed bottom navigation and sticky footer action docks.
- `shadow-float`: `0 6px 20px -3px rgba(18, 104, 53, 0.22)` — Floating action buttons, voice triggers.
- `shadow-premium`: `0 8px 24px -4px rgba(18, 104, 53, 0.32)` — High-priority primary submit buttons (56px thumb targets).
- `shadow-hero`: `0 12px 32px -6px rgba(15, 25, 20, 0.12), 0 4px 12px -2px rgba(18, 104, 53, 0.08)` — Headline cards (`PriceHero`, `ScanResult`, Champion mandi card).
- `shadow-glow-leaf`: `0 0 20px 2px rgba(18, 104, 53, 0.18)` — Radiant aura for Grade A badge and leaf badges.
- `shadow-glow-haldi`: `0 0 20px 2px rgba(234, 179, 8, 0.22)` — Radiant aura for Grade B and locked money badges.

---

## 4. Typography Hierarchy

Fonts are bundled locally (no Google CDN): **Baloo 2 Variable** for headlines and numbers; **Mukta Variable** for body text and interface labels.

### 4.1 Type Scale
| Role | Font | Size / Line-Height | Tailwind Class | Usage |
|---|---|---|---|---|
| **Hero Numerals** | Baloo 2 | 44px / 48px (700) | `text-hero font-display` | Big mandi prices (₹2,450), grade letters, OTP display |
| **Display Title** | Baloo 2 | 26px / 32px (700) | `text-title font-display` | Screen titles, greeting headline, champion card name |
| **Card Subhead** | Baloo 2 | 20px / 24px (600) | `text-subhead font-display` | Card headings, section labels, big tile names |
| **Body Primary** | Mukta | 18px / 28px (500) | `text-base font-body` | Standard body copy, inputs, list row descriptions |
| **Meta / Small** | Mukta | 15px / 22px (500) | `text-sm font-body` | Timestamps, secondary hints, table headers |
| **Micro / Tag** | Mukta | 13px / 18px (600) | `text-xs font-body` | Badges, status chips, sync indicators |

### 4.2 Typography Rules
- **Base Body is 18px:** Never reduce body copy to 14px or 16px. Devanagari script (Hindi, Marathi) features conjuncts and complex diacritics that require taller line heights (≥ 1.5) and larger glyph heights.
- **Tabular Numerals for Finance:** Always apply `font-variant-numeric: tabular-nums` or `tabular-nums` class on all currency figures, kilograms, counts, and OTP inputs so digits align cleanly.
- **Sentence Case Everywhere:** Labels, buttons, and badges must be in sentence case. **Never use ALL CAPS** (e.g. use "Grade A", not "GRADE A"; "Sell now", not "SELL NOW").
- **Concise Line Length:** Keep text under 40 characters per line on mobile screens.

---

## 5. Component Patterns & Visual Blueprints

### 5.1 App Shell & Navigation
- **Header (`AppHeader`):** Glassmorphic translucent blur (`backdrop-blur-md bg-surface/90 border-b border-line`). Contains a 3D-styled brand mark, title, sync spinner, and pill language switcher.
- **Bottom Dock (`BottomNav`):** Glassmorphic fixed bar (`shadow-dock backdrop-blur-md bg-surface/95`). Active tab is highlighted with an emerald pill background, glowing dot indicator, and vibrant leaf text.
- **Language Switcher (`LanguageSwitch`):** Segmented pill switch with smooth sliding active background.

#### 5.2 Modern Consumer Action Architecture
- **Hero Action Banner (`FarmerHome`):** High-impact hero card inspired by Uber's "Where to?" and Swiggy's delivery hero. Positions "Scan & Sell Crop" with live AI grading promise and 56px high-contrast CTA button (`h-14 rounded-xl bg-leaf`).
- **Quick-Service Pods (`BigTile`):** Streamlined tactile service pods (My Lots, Mandi Rates, Digital Khata) with category-tinted squircle icon badge, clean typography, live status badges, and audio buttons (`VoiceButton`).
- **Live Market Pulse Ticker:** Prominent live rate card on the home screen displaying the best today's mandi price for the farmer's registered crop with tabular numerals and daily change pill.
- **Unified Divided Lists (`LotCard`, `LotsPage`, `MandiList`):** Eliminates isolated floating boxes in favor of cohesive, edge-to-edge containers with hairline row dividers (`divide-y divide-line/60`), crop emblems, tabular numerals, status pills, and sleek `ChevronRight` affordances.

### 5.3 SmartFrame Camera HUD (`SmartFrameCamera`)
- Futuristic agro-tech viewfinder overlay:
  - 4 sharp corner brackets (`border-white/90`) framing the target area.
  - Dashed guide reticle sized for a ₹10 reference coin (commented out for the prototype — no coin detection in the AI service yet).
  - Glowing ambient light sensor pill (`bg-black/60 backdrop-blur-md rounded-full`) indicating lighting status in real-time.
  - 80px concentric tactile shutter button with white ring and emerald center.

### 5.4 Grade Emblems (`GradeBadge` & `GradeBreakdown`)
- **Grade Badge:** Showstopping 60px Baloo 2 letter inside a rounded-3xl shield card (`min-w-[160px] border-3 shadow-hero`).
  - Grade A: `border-pass/60 bg-pass-light/40 shadow-glow-leaf`.
  - Grade B: `border-haldi/60 bg-haldi-light/40 shadow-glow-haldi`.
  - Grade C: `border-kesar/60 bg-kesar-light/40`.
- **Grade Breakdown:** Analytical card with multi-color animated progress gauges displaying healthy colour %, size mm, and surface quality.

### 5.5 Market Intelligence & Comparator
- **Headline Price Card (`PriceHero`):** High-impact financial card with massive 56px Baloo 2 numerals in tabular-nums, sleek trend badge (`+₹150`), location pin pill, and reason insight.
- **Unified Mandi Rates Sheet (`MandiList`):** Grouped market rate sheet with clean heat-status indicators, tabular bold prices, and integrated heat legend.
- **Net-₹ Compare (`ComparePage`):**
  - **Champion Mandi Card:** Highlights the highest-profit market with a glowing gold trophy badge, large "You Keep" net amount in Baloo 2, and prominent "Choose this mandi" button.
  - **Transparent Deduction Receipt:** Clear, itemized arithmetic rows (Gross Price − Road Freight − Loading/Handling = Net ₹ You Keep).
- **Floor Price Alert (`FloorWarning`):** Bold crimson alert card (`border-mirchi/30 bg-mirchi-light/70 rounded-2xl p-4`) alerting farmers when prices fall below cost of production.

### 5.6 Tactile Inputs & Keypad
- **NumberPad (`NumberPad`):** Large 5xl Baloo 2 display with 68px circular/rounded-2xl tactile keys, high-contrast pressed states, and haptic feedback.
- **OTP Entry (`LoginPage`):** 6-digit spaced input with wide tracking (`tracking-[0.55em] text-4xl font-display font-black`) and prominent countdown timer.
- **Role Cards (`StepInputs`):** High-aesthetic selection blocks (`h-28 rounded-2xl border-2 hover:border-leaf`) with category badge icons.

---

## 6. Anti-Pattern Checklist (Impeccable Standards)

Any UI contribution must be checked against these anti-patterns:

- [x] **NO Side-Tab Borders (`border-l-8`, `border-l-6`):** Do NOT use thick colored stripes along one edge of a card. Use balanced border tints, soft colored backgrounds, or icon badges instead.
- [x] **NO Flat Paper "Mandi Slips":** Do not create border-only, zero-shadow cards that feel like flat paper printouts. Use modern radius (16–24px), subtle elevation (`shadow-card`), and organic tints.
- [x] **NO Generic Cold Grays:** Never use slate/zinc grays (`#6b7280`). All neutrals must carry warm earthy undertones (`--color-ink` `#0f1914`, `--color-ink-muted` `#4b6354`, `--color-line` `#e2e8e0`).
- [x] **NO Sub-48px Touch Targets:** Primary interactive buttons must be at least 56px (`h-14`). Secondary buttons and icons must be at least 48px (`h-12`). Keypad buttons must be 68px+.
- [x] **NO Hardcoded UI Strings:** Every piece of text must come from `useTranslation()` / `t()`. Hardcoded strings will fail the ESLint CI check.
- [x] **NO Icon-Only Actions:** Critical actions must always combine Icon + Label + Voice.

---

## 7. Quality & Verification Workflow

Before considering any frontend UI task complete:

1. **Check Anti-Patterns:** Run the mechanical detector:
   ```bash
   echo Y | .agent/skills/impeccable/scripts/impeccable detect app/src
   ```
   Must report **0 anti-patterns**.
2. **Lint & Translations:** Run `pnpm --dir app lint`. Must report **0 errors** (ensures no hardcoded text).
3. **Typecheck:** Run `pnpm --dir app typecheck`.
4. **Unit Tests:** Run `pnpm --dir app test`.
5. **Production Build:** Run `pnpm --dir app build`.
