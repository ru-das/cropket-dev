# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: small farmers and FPO (Farmer Producer Organisation) members in India**, many with limited literacy, weak or no mobile data, and little prior experience with apps or digital payments. They open the app to sell a crop: scan it, see what it's worth, sell to a real buyer, and be sure the money actually arrives.

**Secondary:**
- **Verified buyers** — bid live on listed lots, mostly online, KYC-gated.
- **Drivers/transporters** — no login; reach a single delivery page by link (`/t/:token`) to upload a delivery photo and enter the buyer's OTP.
- **FPO admins** — manage member lots as mega-lots, wallet.
- **Platform admins / NBFC partners** — resolve disputes, approve KYC, review loan leads.

Pilot market: Nashik, Maharashtra. First crop: onion, then tomato and potato. Interface languages: English, Hindi, Marathi.

## Product Purpose

Cropket lets a small farmer scan a crop with a phone camera to get an AI quality grade (A/B/C, spoken aloud), see fair mandi prices and sell/hold advice, receive live bids from verified buyers, accept with voice consent, and get paid only once delivery is proven — all visible step-by-step in a colour-coded passbook ("Digital Khata"). Success means a farmer who cannot read well and has unreliable internet can still sell a crop at a fair, transparent price and trust that the payment is real and safe.

## Positioning

The mechanism a neighboring price-discovery or listing app could not truthfully copy: **payment is locked by a regulated payment partner and released only against proof of delivery** (driver photo + buyer's OTP, or a 24h timer), not on trust or a listing fee. Combined with on-device-camera AI grading (no lab, no certifying body) and an offline-first design that keeps scanning, price-checking and the Khata working with zero signal.

## Operating Context

- Farmers use the app in fields and on low-cost Android phones, often in bright sunlight, on slow or absent mobile data, sometimes fully offline.
- The core farmer loop (scan → price/advice → Khata) must work offline; money, bidding, consent, KYC, disputes and OTP are online-only by explicit design (never queued).
- Voice is a first-class input/output channel, not an accessibility add-on: bundled audio clips, then Bhashini TTS, then browser speech, in three languages.
- Cropket never holds money itself (RBI-regulated payment partner holds funds); Cropket is only a Loan Service Provider for the credit feature, never a lender; floor prices are advisory and warn, never block, a trade; "Assured Grade" not "Certified Grade" (Cropket is not a certifying body).

## Capabilities and Constraints

- **Currently real** (prototype, in progress per `docs/progress.md`): OTP login, onion AI grading (OpenCV), lot creation + offline sync, mandi price/heatmap/advice screens, route-distance + Net-₹ comparator. **Not yet built**: buyer marketplace/bidding, escrow/Khata, delivery flow (M3–M5 in `docs/progress.md`).
- Money is stored and reasoned about only in whole paise (integers), never floats.
- Mock vs. real is always visible to the user: anything sourced from a mock integration (Cashfree payment, buyer KYC, driver SMS, road distance without an ORS key, prices beyond seed data) carries a "Demo data" tag rather than pretending to be live.
- No dark mode (farmers use phones outdoors in sunlight).
- Terminology is deliberately plain: "Money locked safely" not "Escrow funded", "Assured grade" not "Certified grade", advice says "may" never "will".

## Brand Commitments

- Name: **Cropket**.
- Design idea, stated in `SPEC.md`: **"Mandi-slip clear"** — as plain and trustworthy as a printed mandi receipt, with the colours of a farm field.
- Fixed palette and meaning-colours already tokenized in `app/src/styles/tokens.css` (deep leaf green primary, turmeric/indigo/soil accents; 🟡 money locked · 🔵 on the way · 🟢 paid · 🔴 problem · 🟧 offline — same meaning everywhere, never colour alone).
- Fonts: Mukta (body) + Baloo 2 (display/numbers), bundled, no CDN.
- Sentence case everywhere, no ALL CAPS labels, very little motion (only on state change, respects reduced-motion).

## Evidence on Hand

- Seed/demo data only (`supabase/seed.sql`): 5 real Nashik-district mandis with checked Agmarknet IDs, 60 days of generated (not real-reported) onion prices marked `source = 'seed'`, weather, transporters — explicitly demo data, not a real pilot yet.
- Sample onion photos for AI grading tests: `ai-service/samples/onion/`.
- No real testimonials, customer logos, press, or completed pilot results exist yet — future work must not fabricate these.

## Product Principles

1. **Simple and understandable above all.** The product must be easy enough for a non-technical, low-literacy user to use confidently alone — this is a first-order design constraint, not a nice-to-have layered on later. Icon + word + 🔊 together, one main action per screen, plain everyday words, no jargon outside small "Learn more" text.
2. **Offline-first, online-honest.** The app stays useful with zero signal for reading (prices, Khata, lots); it never fakes an online action (money, bidding, consent) offline — those are blocked with a calm explanation, never silently queued.
3. **Money fails closed, always visibly real.** When a money flow is unclear, stop and do nothing rather than guess. Demo/mock data is always labeled as such — never shown as if it were real.
4. **Voice and multilingual by default**, not bolted on — English, Hindi, Marathi with audio for every main screen.
5. **Trust through proof, not promises.** Payment release is tied to verifiable delivery proof; grading and advice are always shown with their confidence/limits rather than overstated certainty.

## Accessibility & Inclusion

- WCAG AA contrast minimum everywhere; primary tap targets ≥ 56×56 px, secondary ≥ 48×48 px; body text 18 px; works at 320 px width.
- Every screen's main content can be read aloud with one 🔊 tap; every numeric input accepts voice or a big number pad.
- Crops shown as picture + word, not text alone; money always shown with ₹ and spoken out on confirm screens.
- Visible 3px focus ring for kiosk/keyboard use.
