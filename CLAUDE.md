# CLAUDE.md — Cropket

Working rules for Claude Code. Read this file at the start of every session.

- **Project root:** `/home/rupam/cropket` (Arch Linux)
- **Full design:** `SPEC.md` (single source of truth). This file is the short version.
- **If this file and `SPEC.md` disagree, `SPEC.md` wins**, except for the **"Simple setup"** rules below, which replace the "Local" row of `SPEC.md` §8.3 for now. Point out any other conflict and fix one of them in the same change.
- The old Build Roadmap PDF mentions Next.js, next-intl, `web/` and `lib/integrations/`. **Ignore those parts.** The SPEC replaced them.

## 0. Always do this

1. **Plan first.** For any feature: read the related `SPEC.md` sections, write a short plan, and **wait for "go ahead"** before writing code.
2. **One feature at a time.** One feature per commit.
3. **Build in this order:** migration + RLS → zod schema → SQL function or Edge Function → service in `app/src/services/` → UI → tests.
4. **Stay inside the prototype scope** (below). Work through the milestones in `docs/progress.md` in order. Build nothing outside the scope unless the user asks.
5. **Run the checks** in §6 before saying a task is done. If something fails, say so.
6. **Ask before you:** add or upgrade a package, change the folder structure, change a money rule, deploy, or reset a database.
7. **Never stop work because an API key is missing.** Follow §2 "API keys".
8. **Never run interactive commands** (anything that waits for typing, like `supabase login`, `supabase link`, `scripts/set-key.sh` without `--status`/`--get`). Tell the user the exact command to run in their own terminal, then keep going.
9. **Never use `sudo`, `pacman` or `yay`.** If a tool is missing, follow §2 "Missing tools".
10. **Never** put a secret in `app/`, never let money logic run on the phone, never show mock data as real.

### Prototype mode (current)
We are building a **demo version of Phases 0–4 (P0 items only)**. The team will continue by hand after that. Full details: `SPEC.md` §9.5.

- **Build:** P0 rows of Phases 0–4, plus: seed + `demo-reset`, escrow SQL tests, `split.ts` tests, one Playwright happy path, web + AI deploy, debug APK.
- **Don't build:** Phases 5–8, any P1 / P2 / P3 item, push notifications, the `tts` function, `make-voice-clips.ts`, the weather cron, the deploy workflow, signed APK, Sentry.
- **Real:** OTP login (test numbers), onion grading (simple OpenCV), Realtime bidding, escrow state machine, offline scan + sync.
- **Mock:** Cashfree (a "Pay (demo)" button simulates the webhook), buyer KYC, driver SMS (link shown on screen), road distance and map when their keys are missing, prices beyond the seed when the data.gov.in key is missing.
- If a P0 item looks too big for a prototype, **suggest a simpler version and ask**. Don't cut it silently.

**The team must be able to continue alone, so:**
- Choose the **simplest code that works**. No extra layers, factories or generic helpers "for later".
- Start every important file with a 1–3 line comment: what it does and who uses it.
- Comments explain *why*, in simple English. No clever one-liners.
- After each feature, update `docs/progress.md`: tick the item and fill in the handoff note (what was built, files touched, what is mocked, how to test it by hand, what is next).
- At the end of each reply, explain what you built in **simple words** (short), like to a teammate who will maintain it.

### Simple setup (no Docker, no local Deno)
- **No Docker on this laptop.** We do not run `supabase start` or `supabase functions serve`. We use a free cloud Supabase project called **`cropket-dev`** for development.
- **No Deno on this laptop.** Edge Functions are still written in Deno-style TypeScript, because Supabase runs them on Deno in the cloud. We deploy them and test them there.
- **The AI service runs with plain Python** (`uv` + `uvicorn`). The `Dockerfile` exists only so Hugging Face Spaces can build it on their servers.
- The prototype uses **one** Supabase project, `cropket-dev`, for development and the demo. There is no `cropket-demo` yet.
- If any command says it needs Docker, **don't install Docker.** Use the other way listed in §2 (or the Supabase dashboard), and add a line to §7 Learned Rules.

---

## 1. Project overview

### What Cropket does
Cropket is an **offline-first app for small farmers and FPOs in India** (Android APK + installable web app).

- A farmer **scans a crop** with the phone camera → gets an **AI quality grade** (A / B / C), spoken aloud.
- The farmer sees **fair mandi prices**, a **mandi heatmap**, **Net-₹** (money you really keep), and **sell / hold advice**.
- **Verified buyers bid live.** The farmer accepts with **voice consent**.
- The buyer's money is **locked by a regulated payment partner** (Cashfree) and **released after proven delivery** (driver photo + buyer's OTP, or a 24 h timer).
- The farmer sees every step in the **Digital Khata** (a colour-coded passbook).
- Later layers: logistics proof, disputes and crop rescue, consent-based micro-credit.

**Pilot:** Nashik, Maharashtra · **First crop:** onion (then tomato, potato) · **Languages:** English, Hindi, Marathi (`en`, `hi`, `mr`).

**The P0 core flow (must always work):** scan crop (even offline) → see price + advice → verified buyer bids live → farmer accepts with voice consent → buyer pays, money locked → dispatched → driver uploads delivery photo + enters buyer's code → farmers paid, Khata turns green.

### Tech stack

| Part | What we use |
|---|---|
| App | **Vite + React 19 + TypeScript**, React Router |
| Styling | Tailwind CSS v4 + shadcn/ui, lucide-react icons |
| Fonts | Mukta + Baloo 2 via `@fontsource` (bundled, no CDN) |
| Server data + offline reads | TanStack Query, saved to IndexedDB |
| Offline writes | Dexie (drafts, photos, outbox) |
| Small UI state | Zustand |
| Forms / validation | react-hook-form + zod |
| Languages | react-i18next |
| Web install | vite-plugin-pwa |
| Android | Capacitor (Vite build bundled inside the APK) |
| Database, auth, files, realtime | Supabase cloud (Postgres + PostGIS + RLS, phone OTP, Storage, Realtime, pg_cron) |
| Server logic | Supabase Edge Functions (TypeScript, run by Supabase) and Postgres functions (RPC) |
| AI service | FastAPI (Python 3.12) + OpenCV + PaddleOCR |
| Payments | Cashfree PG + Easy Split (sandbox or mock) |
| Maps | MapLibre GL JS + MapTiler tiles, OpenRouteService |
| Voice | Bundled clips → Bhashini (via `tts` function) → browser speech |
| Testing | Vitest, Playwright, SQL tests (pgTAP via `psql`), pytest |
| Hosting | Vercel (web), Supabase Cloud Mumbai, Hugging Face Spaces (AI) |

**Do not add:** Next.js or any server-rendering framework · a Node/Express backend · Redux · blockchain · an in-house wallet · heavy ML frameworks · any secret key in the app · Docker or Deno as a local requirement.

---

## 2. Key commands

### Missing tools (never blocks work)
```bash
bash scripts/check-tools.sh            # shows ✅ / ⬜ and prints the exact install commands
```
| Kind of tool | Who installs it |
|---|---|
| System tools (`pnpm`, `uv`, `psql`, Supabase CLI, `cloudflared`, Java, `adb`, Android Studio) | **The user**, in their own terminal (needs a password) |
| Python 3.12 | Claude Code may run `uv python install 3.12` (no sudo) |
| Project packages already in `package.json` / `requirements*.txt` | Claude Code may run `pnpm install` / `uv pip install -r ...` |
| **New** project packages | Claude Code **asks first**, then runs `pnpm add -E <pkg>` or adds it to `requirements.txt` |
| Playwright browser | Claude Code may run `pnpm exec playwright install chromium` (never `--with-deps`, it needs sudo and doesn't support Arch) |

**When a command fails with "command not found", Claude Code must:**
1. Run `bash scripts/check-tools.sh`.
2. **Keep working** on everything that doesn't need that tool (for example: write the migration file even if `psql` is missing).
3. Add it to the "🔑 Keys and 🧰 tools still needed" list in `docs/progress.md`. At the end of the reply, add a block like this, then carry on:
   ```
   🧰 Tools needed (I skipped the steps that need them)
   - psql — to run SQL tests. Run in your terminal: sudo pacman -S --needed postgresql-libs
   - Skipped: bash scripts/test-sql.sh (run it after installing)
   ```
4. Never guess a workaround that installs things another way (no `curl | sh`, no `npm i -g`, no downloading binaries).

### One-time setup (the user does this, Claude Code does not)
```bash
bash scripts/check-tools.sh            # then run the install commands it prints
export CAPACITOR_ANDROID_STUDIO_PATH=/opt/android-studio/bin/studio.sh   # APK step; add to ~/.bashrc or ~/.zshrc

# Supabase cloud (free): create project "cropket-dev" in region Mumbai at supabase.com, then:
cd /home/rupam/cropket
supabase login
supabase link --project-ref <cropket-dev project ref>
bash scripts/set-key.sh                # asks for keys one by one (Enter = skip)
```
In the Supabase dashboard (once): turn on extensions `postgis`, `pg_cron`, `pg_net`, `pgtap`; Auth → Phone → on, and add **test phone numbers with fixed OTPs** (if it asks for SMS provider fields, dummy values are fine; test numbers never send SMS); create the private storage buckets from `SPEC.md` §7.4.

Also create `.claude/settings.json` so Claude Code cannot read secret files:
```json
{ "permissions": { "deny": ["Read(./**/.env)"] } }
```

### Ports on this laptop
| Service | URL |
|---|---|
| App (Vite) | http://localhost:5173 |
| AI service | http://localhost:8000 |
| Supabase | the cloud URL in `app/.env` (`VITE_SUPABASE_URL`) |

### Daily development (2 terminals)
```bash
# Terminal 1 — App (talks to cropket-dev in the cloud)
cd /home/rupam/cropket/app
pnpm install
pnpm dev

# Terminal 2 — AI service (only when working on grading / OCR)
cd /home/rupam/cropket/ai-service
uv venv --python 3.12                  # first time only
source .venv/bin/activate
uv pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```
- Arch ships a newer Python. **Always use `uv` with `--python 3.12`** (PaddleOCR needs it).
- Cloud Edge Functions cannot reach `localhost`. To connect them to the local AI service, the user runs `cloudflared tunnel --url http://localhost:8000` and saves the printed `https://…trycloudflare.com` address with `bash scripts/set-key.sh AI_SERVICE_URL`. Without it, grading uses the mock (shows "Demo data").

### API keys (never blocks work)
All keys are listed in **one place**: the `KEYS` list inside `scripts/set-key.sh` (name, which `.env` file, where to get it).

| Command | Who runs it | What it does |
|---|---|---|
| `bash scripts/set-key.sh --status` | Claude Code or user | Shows ✅ set / ⬜ missing. Never shows values. |
| `bash scripts/set-key.sh` | **user only** | Asks for every missing key (hidden typing, Enter = skip, `g` = generate) |
| `bash scripts/set-key.sh NAME` | **user only** | Asks for one key, then offers to push function secrets to Supabase |
| `$(bash scripts/set-key.sh --get NAME)` | scripts / commands | Gives a value to another command. **Never run it alone** (it would print the secret). |

Which file each key goes to:
| File | What goes there |
|---|---|
| `app/.env` | `VITE_*` public values only (everything here ends up inside the app) |
| `supabase/functions/.env` | Edge Function secrets. Pushed with `supabase secrets set --env-file supabase/functions/.env` |
| `ai-service/.env` | AI service settings (`SERVICE_KEY` = same as `AI_SERVICE_KEY`) |
| `scripts/.env` | Laptop-only values for scripts and commands (`SUPABASE_DB_URL`, service role key, DB password) |

**When a feature needs a key, Claude Code must:**
1. Run `bash scripts/set-key.sh --status` to see if it is set.
2. If it's a new key: add a line to `KEYS` in `scripts/set-key.sh` **and** an empty line to the matching `.env.example`.
3. If it's missing: **keep building.** Use mock mode (see §5 "Missing keys"). Finish the task.
4. Add it to the "🔑 Keys and 🧰 tools still needed" list in `docs/progress.md`. At the **end of the reply**, add a block like this, then carry on without waiting:
   ```
   🔑 Keys needed (work continues in mock mode until you add them)
   - ORS_API_KEY — road distances. Get it: openrouteservice.org → Dashboard.
     Run in your terminal: bash scripts/set-key.sh ORS_API_KEY
   ```
5. **Never** ask the user to paste a key into the chat. **Never** open, `cat`, `grep` or print a `.env` file.

### Database (cloud `cropket-dev`)
```bash
supabase migration new <feature_name>          # new file in supabase/migrations/
SUPABASE_DB_PASSWORD="$(bash scripts/set-key.sh --get SUPABASE_DB_PASSWORD)" supabase db push
psql "$(bash scripts/set-key.sh --get SUPABASE_DB_URL)" -X -v ON_ERROR_STOP=1 -f supabase/seed.sql
bash scripts/test-sql.sh                       # all SQL tests (each file rolls back)
bash scripts/test-sql.sh escrow                # only escrow tests
supabase gen types typescript --linked | tee app/src/lib/database.types.ts > supabase/functions/_shared/database.types.ts
```
- Run `gen types` after every migration change.
- If `db push` waits for a yes/no answer, stop and ask the user to run it in their terminal.
- `supabase db reset --linked` **wipes the dev database.** Only when the user asks.
- Seed data must be safe to run twice (`on conflict do nothing`).

### Edge Functions (run in the cloud)
```bash
supabase functions new <function-name>
# --import-map is required: the installed CLI does not auto-discover the
# shared supabase/functions/deno.json (see §7 Learned Rules). Also delete
# the per-function deno.json that `functions new` scaffolds - the project
# uses one shared import map, not one per function.
supabase functions deploy <function-name> --use-api --import-map supabase/functions/deno.json
supabase functions deploy --use-api --import-map supabase/functions/deno.json   # all functions
supabase secrets set --env-file supabase/functions/.env # after keys change
supabase secrets list                                   # names only
bash scripts/check-functions.sh                         # run before every deploy - see §7 Learned Rules

# Call a function by hand
curl -X POST "$(bash scripts/set-key.sh --get SUPABASE_URL)/functions/v1/cron-auto-settle" \
  -H "Authorization: Bearer $(bash scripts/set-key.sh --get CRON_SECRET)"
```
- Function logs: Supabase dashboard → Edge Functions → pick the function → Logs.
- Deploying to `cropket-dev` is fine during normal work. Say which functions you deployed.
- If `--use-api` is not supported by the installed CLI, ask the user to update `supabase-bin`, or deploy from the dashboard.
- Every function needs its own `[functions.<name>]` block in `config.toml` (`bash scripts/check-functions.sh` checks this) - see §7 Learned Rules for why.

### App (run inside `app/`)
```bash
pnpm dev                 # dev server
pnpm build               # type-check + production build into app/dist
pnpm preview             # serve the build (test PWA + offline here, not in dev)
pnpm lint                # ESLint, includes the "no hard-coded text" rule
pnpm typecheck           # tsc --noEmit
pnpm test                # Vitest (unit, includes shared domain code)
pnpm test -- --coverage  # coverage report
pnpm test:e2e            # Playwright (uses cropket-dev + mock integrations)
pnpm format              # Prettier
```
Expected `app/package.json` scripts (create them in Phase 0):
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit -p tsconfig.app.json",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "format": "prettier --write ."
}
```

### Android (run inside `app/`, from the APK step)
```bash
pnpm build && pnpm exec cap sync android    # always after a web change
pnpm exec cap open android                  # open in Android Studio
pnpm exec cap run android                   # run on a connected phone
cd android && ./gradlew assembleDebug       # → app/android/app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Test the dev web app on a real phone over USB (camera needs localhost or HTTPS)
adb reverse tcp:5173 tcp:5173
```
Release APK (`./gradlew assembleRelease`): only when asked.

### AI service (run inside `ai-service/`, venv active)
```bash
pytest -q
curl http://localhost:8000/health
```
Hosting: the user pushes `ai-service/` to a Hugging Face Space (Docker type). Hugging Face builds it. Call `/health` before a demo (free hosts sleep).

### Scripts (run from the project root)
```bash
pnpm --dir app exec tsx --env-file=../scripts/.env ../scripts/import-agmarknet-csv.ts <file.csv>
pnpm --dir app exec tsx --env-file=../scripts/.env ../scripts/demo-reset.ts   # resets demo data in cropket-dev — only when asked
bash scripts/set-key.sh --status
bash scripts/check-tools.sh
bash scripts/test-sql.sh
```
(`tsx` is a dev dependency of `app/`.)

### Web deploy (only when asked)
```bash
cd app && vercel          # preview
cd app && vercel --prod   # production (demo)
```
GitHub Actions (prototype): `ci.yml` only runs lint, typecheck, Vitest and pytest. No `deploy.yml` yet. Deploys are done by hand.

---

## 3. Architecture and folder structure

### Big picture
```
Phone (APK or browser)
  React app (all files on the phone)
   ├─ TanStack Query cache → IndexedDB        (offline reads)
   └─ Dexie: drafts, photos, outbox           (offline writes)
        │ supabase-js (online)       │ outbox sync
        ▼                            ▼
Supabase cloud: Postgres + PostGIS + RLS + SQL functions,
                Auth, Storage, Realtime, pg_cron
                Edge Functions (secrets, payments, webhooks, driver link, cron, outside APIs)
        │                            │
        ▼                            ▼
FastAPI AI service            Outside services (real or mock)
(grading, OCR; stateless)     Cashfree, data.gov.in, ORS, Bhashini, FCM, Open-Meteo, gov APIs
```

### Folders
```
cropket/
├── CLAUDE.md  SPEC.md  README.md  .gitignore
├── .claude/settings.json             ← blocks reading .env files
├── docs/
│   ├── BUILD_GUIDE.md                ← step-by-step guide for the team (humans)
│   └── progress.md                   ← milestone checklist + handoff notes (Claude Code updates it)
├── .github/workflows/  ci.yml        ← deploy.yml comes after the prototype
├── app/                              ← Vite + React (web + Capacitor APK)
│   ├── .env.example                  ← VITE_* names, empty values
│   ├── vite.config.ts                ← PWA plugin, @shared alias
│   ├── capacitor.config.ts           ← webDir: "dist"
│   ├── vercel.json                   ← rewrite all paths to /index.html
│   ├── android/                      ← generated by Capacitor
│   ├── public/audio/{en,hi,mr}/      ← bundled voice clips
│   ├── src/
│   │   ├── main.tsx
│   │   ├── app/        router.tsx  providers.tsx  guards.tsx
│   │   ├── routes/     welcome/ login/ onboarding/ farmer/ buyer/ fpo/ admin/ salvage/ kiosk/ trip/
│   │   ├── components/ ui/ shell/ voice/ camera/ lot/ market/ trade/ money/ logistics/ rescue/ common/
│   │   ├── services/   lots.ts grading.ts prices.ts bids.ts deals.ts escrow.ts khata.ts
│   │   │               shipments.ts disputes.ts loans.ts consents.ts trip.ts
│   │   ├── offline/    db.ts outbox.ts sync.ts persist.ts network.ts
│   │   ├── lib/        supabase.ts config.ts i18n.ts native.ts errors.ts database.types.ts voice/
│   │   ├── stores/     ui.ts sync.ts
│   │   ├── locales/    en.json hi.json mr.json
│   │   └── styles/     tokens.css globals.css
│   └── tests/          unit/  e2e/
├── supabase/
│   ├── config.toml                   ← verify_jwt=false for webhook / cron / trip functions
│   ├── migrations/                   ← one feature per file
│   ├── seed.sql                      ← demo users, mandis, cold storages, transporters, prices
│   ├── tests/                        ← SQL tests (pgTAP): escrow, RLS
│   └── functions/
│       ├── deno.json                 ← import map (used by Supabase when deploying)
│       ├── .env.example              ← secret names, empty values
│       ├── _shared/
│       │   ├── domain/               ← PURE TypeScript, shared with the app
│       │   │   ├── money.ts split.ts netRupee.ts advice.ts heat.ts floor.ts
│       │   │   └── schemas/          ← zod schemas
│       │   ├── integrations/         ← mode.ts + one folder per outside service (incl. ai/)
│       │   ├── http.ts  auth.ts  db.ts  env.ts  database.types.ts
│       └── <function-name>/index.ts  ← grade, route-distance, kyc-verify, tts, escrow-pay,
│                                        cashfree-webhook, escrow-release, escrow-skip-timer,
│                                        shipments-create, trip, disputes-create, dispute-resolve,
│                                        storage-booking, loans-lead, push-send, cron-auto-settle,
│                                        cron-fetch-prices, cron-fetch-weather, whatsapp-webhook
├── ai-service/                       ← FastAPI (stateless, never touches the DB)
│   ├── Dockerfile                    ← for Hugging Face only
│   ├── requirements.txt  requirements-dev.txt  .env.example
│   ├── app/  main.py  grading/  ocr/  video_audit/  pricing/
│   ├── samples/                      ← test photos
│   └── tests/
└── scripts/
    ├── set-key.sh                    ← asks for API keys, saves them (list of all keys)
    ├── test-sql.sh                   ← runs supabase/tests/*.sql on cropket-dev
    ├── check-tools.sh                ← shows missing tools + install commands
    ├── .env                          ← laptop-only values (never committed)
    ├── import-agmarknet-csv.ts  make-voice-clips.ts  demo-reset.ts
```

### Where logic lives (strict)
| Kind of logic | Where it goes |
|---|---|
| Pure calculations (money, split, Net-₹, advice, heat colour, floor) | `supabase/functions/_shared/domain/` — used by app **and** functions |
| All-or-nothing DB changes (place bid, accept bid, flash-sale buy, escrow moves) | Postgres functions, called with `supabase.rpc()` |
| Anything with a secret or an outside API call | An Edge Function |
| Data access from the app (network, cache, outbox) | `app/src/services/*` only |
| Screen layout | `app/src/routes/*` — pages only put components together |
| Image grading and OCR | `ai-service/` (called only by Edge Functions, through `integrations/ai/`) |

### Key rules of the system
- **Pages never import `lib/supabase.ts`.** Only `services/*` and `offline/*` do.
- **Escrow state changes only through `escrow_transition()`** (service role). Allowed moves are rows in `escrow_transitions`. See `SPEC.md` §5.7.
- **Money and trading actions are online-only.** They are never put in the outbox.
- **Allowed outbox kinds:** `upload_blob`, `create_lot`, `request_grade`, `create_crates`, `rate_deal`, `create_ticket`.
- **The driver never talks to Supabase directly.** Only through the `trip` Edge Function with a token.
- **Native features** (camera, GPS, network, storage, push) go through `app/src/lib/native.ts`.
- **The service worker is not registered in the APK.** Only on the web.
- **Every outside service** lives in `_shared/integrations/<name>/` with `index.ts` (the only import), `mock.ts` and `real.ts`, and declares the keys it needs.

---

## 4. Coding conventions and patterns

### General
- TypeScript **strict** mode. No `any`. Use `unknown` + zod when data comes from outside.
- Types come from zod: `export type Lot = z.infer<typeof Lot>`.
- Small files, small functions. Clear names over comments.
- **Pin exact versions** (`pnpm add -E`, `save-exact=true` in `app/.npmrc`). Same zod version in `app/package.json` and `supabase/functions/deno.json`. Do not upgrade unless asked.

### Naming
| Thing | Style | Example |
|---|---|---|
| React components | PascalCase file + export | `GradeBadge.tsx` |
| Other TS files | camelCase | `netRupee.ts` |
| Edge Function folders | kebab-case | `cron-auto-settle/` |
| SQL tables, columns, functions | snake_case | `place_bid`, `total_paise` |
| Error codes | UPPER_SNAKE_CASE | `BID_BELOW_FLOOR` |
| Env keys | UPPER_SNAKE_CASE, `VITE_` only for public app values | `ORS_API_KEY` |
| i18n keys | dot.camelCase, grouped by screen | `khata.moneyLocked` |
| Realtime channels | `name:scope:id` | `bids:lot:{id}` |

### Reading keys and settings
- **App:** only `app/src/lib/config.ts` reads `import.meta.env`. It checks values with zod and exports a typed `config`. Other files import `config`.
- **Edge Functions:** only `_shared/env.ts` reads `Deno.env`. It has `getEnv(name)` (may be empty) and `requireEnv(name)` (throws `SETUP_MISSING_KEY`).
- **AI service:** one `settings.py` (Pydantic settings) reads `ai-service/.env`.

### Shared domain code (`_shared/domain/`)
- **No Deno APIs, no browser APIs, no Supabase, no env.** Only plain TypeScript and zod.
- Imports between these files **must use the `.ts` extension** (`import { toPaise } from "./money.ts"`), because Supabase runs them on Deno. The app tsconfig has `allowImportingTsExtensions: true`.
- The app imports them as `@shared/...`. `vite.config.ts` sets `server.fs.allow` for the parent folder and aliases `zod` to `app/node_modules/zod`.
- Edge Function code can't be type-checked on this laptop. So keep function files thin, and put real logic in `domain/` where Vitest tests it.

### Money, numbers, dates, IDs
- **Money is always whole paise (integers).** DB columns end in `_paise` (bigint). Never floats. Convert only with helpers in `money.ts`.
- Mandi prices are ₹ per quintal, as the government gives them. Convert to paise before any total.
- Show numbers with `Intl.NumberFormat('en-IN')` (₹1,50,000).
- Store times as `timestamptz` (UTC). Show them in `Asia/Kolkata`. **Timers use server time**, never phone time.
- Rows that can be made offline use `crypto.randomUUID()` on the phone and store `client_created_at`. The server uses `insert … on conflict (id) do nothing`.

### React app
- **All text comes from `app/src/locales/*.json` via `t()`.** No hard-coded text in components (lint rule). Add every new key to `en.json`, `hi.json` **and** `mr.json` in the same change.
- Server data → TanStack Query (in `services/*`). Small UI state → Zustand (`stores/`). **Never put server data in Zustand.**
- Each service file exports plain async functions plus TanStack Query hooks (for example `useMyLots()`), with query keys in the same file.
- Farmer-facing queries keep `updatedAt`. Show `<DataAge>` when data is older than 6 hours.
- Wrap money and trading buttons in `<RequireOnline reasonKey="...">`.
- Anything from a mock (`source` is a mock) shows `<DemoDataTag>`.
- Farmer routes are lazy-loaded. First screen JS < 200 KB. Photos compressed to ≤ 300 KB.

### UI rules (from `SPEC.md` §6)
- Use colour tokens from `styles/tokens.css` (`--leaf`, `--haldi`, `--neel`, `--pass`, `--mirchi`, `--kesar` …), declared as `--color-*` in Tailwind's `@theme` and used as `bg-leaf` / `text-ink` utilities. **No raw hex values in components.**
- Meaning colours are the same everywhere: 🟡 money locked · 🔵 on the way · 🟢 paid · 🔴 problem · 🟧 offline.
- Primary tap targets ≥ 56 × 56 px, secondary ≥ 48 × 48 px. Body text 18 px. Works at 320 px width.
- One main action per screen, at the bottom. Icon + word + 🔊 together. Never colour alone.
- Cards: 1 px border, no shadow. Khata rows: 6 px left colour bar. No dark mode.
- Inputs: label above, 56 px tall, `inputMode="numeric"` for numbers.
- Plain words: "Money locked safely", not "Escrow funded". Buttons say what happens ("Save lot").
- Advice says "may", never "will". Say "Assured grade", never "Certified grade". The floor price **warns, never blocks**.

### Edge Functions
Every function follows the same shape:
```ts
import { handle, json } from "../_shared/http.ts";
import { requireRole } from "../_shared/auth.ts";
import { SomethingInput } from "../_shared/domain/schemas/something.ts";

Deno.serve(handle(async (req) => {
  const user = await requireRole(req, ["farmer"]);   // role read from profiles, never from the body
  const input = SomethingInput.parse(await req.json());
  // ... work ...
  return json({ ok: true, data: result });
}));
```
- Validate every input with zod from `_shared/domain/schemas/`.
- Money calls read an `Idempotency-Key` header. A repeat returns the first result.
- Webhook, cron and trip functions set `verify_jwt = false` in `config.toml` and check their own secret.
- `_shared/db.ts` (service role) is used only inside functions. Never import it in the app.

### SQL and migrations
- One feature per migration. **Never edit a migration that is already pushed**; add a new one.
- **Turn on RLS in the same migration that creates the table**, with its policies.
- `escrows`, `escrow_events`, `payouts`: no client insert / update. `escrow_events` is insert-only.
- `security definer` functions must `set search_path = public` and check the caller's role inside.
- Money functions: `revoke all ... from public, anon, authenticated`.
- Use row locks (`for update`) for bids, flash sales and escrow moves.
- Buyer queries never return the farmer's phone number.
- Storage buckets are private. Show files with short-lived signed URLs.

### AI service (Python)
- Python 3.12, type hints, Pydantic models for every request and response.
- Stateless: gets images or signed URLs, returns JSON. **No DB access.**
- Every route except `/health` checks the `X-Service-Key` header.
- Always return a `confidence`. Low confidence is a normal result, not an error.

### Git
- Commit message: `type(area): short summary` — for example `feat(lots): save lot offline`, `fix(escrow): stop double release`.
- Commit after each working feature (after the checks in §6 pass). Don't push unless the user asks.
- **Never commit `.env` files.** Only `.env.example` with empty values.
- `main` must always be demo-ready. Update `SPEC.md` in the same commit if the design changed.

---

## 5. Error handling approach

### One error shape everywhere
Every Edge Function returns:
```json
{ "ok": true,  "data": { } }
{ "ok": false, "error": { "code": "BID_BELOW_FLOOR", "messageKey": "errors.bidBelowFloor" } }
```
- `code` is UPPER_SNAKE_CASE and stable. `messageKey` is an i18n key.
- HTTP status: `400` bad input · `401` not logged in / bad signature · `403` wrong role, banned, not verified · `404` not found · `409` wrong state / duplicate · `429` rate limit · `500` our bug or setup problem · `502` outside service failed.
- `handle()` in `_shared/http.ts` catches everything: zod errors → `400 VALIDATION_FAILED`, known `AppError` → its code, anything else → `500 INTERNAL` (details only in logs).

### Missing keys (work never stops)
| Situation | What happens |
|---|---|
| A service key is missing (Cashfree, ORS, Bhashini, data.gov.in, AI service, FCM, WhatsApp) | The adapter uses **mock mode**. Results carry `source: "mock"`, so the app shows **"Demo data"**. Log a warning `MISSING_KEY <NAME>` once. |
| `isMock(name)` | True if the name is in `INTEGRATIONS_MOCK` **or** any key the adapter needs is empty. |
| A must-have secret with no mock (`CRON_SECRET`, `OTP_PEPPER`) | That function returns `500 SETUP_MISSING_KEY` (key name only in logs). The rest of the app keeps working. **Money flows fail closed.** |
| App: `VITE_SUPABASE_URL` or publishable key missing | Show a simple "Setup needed" screen listing the missing names (dev builds only), not a white screen. |
| App: `VITE_MAPTILER_KEY` missing | Show `MandiList` instead of the map. |
| App: Firebase values missing | No push notifications. Everything else works. |

**Honesty rule:** mock because a key is **missing** is fine (the Demo data tag shows it). But if the key **is set** and the real call fails, return `502` with a clear code (for example `PRICES_UNAVAILABLE`). **Never quietly switch to mock data** in that case.

### SQL functions
- Raise errors with the code as the message: `raise exception 'BID_BELOW_FLOOR';`
- Extra details go after a space: `raise exception 'ILLEGAL_TRANSITION % -> %', old_state, p_to;`
- The app reads the **first word** of the message as the code.

### In the app
- `app/src/lib/errors.ts` has the `AppError` class and one map from `code` → `messageKey`. Unknown codes → `errors.unknown`.
- `services/*` turn every Supabase / function error into an `AppError`. Components never see raw errors.
- Show errors as: what happened + what to do. No "Oops". Never show stack traces or raw server text.
- **Reads that fail:** show the saved copy with `<DataAge>` and the `NetworkBanner`.
- **Offline writes:** go to the outbox. Retry with backoff (5 s, 30 s, 2 min, 10 min, then every 30 min). After 10 failures mark `failed` and show "Try again". Warn when items wait more than 24 h.
- **Offline money / trading actions:** blocked by `RequireOnline` with a calm reason. Never queued.
- Session expired while offline: keep drafts, ask to log in when online.

### Outside services
- Validate results with zod in **both** mock and real mode.
- Use a timeout on every outside call (`AbortSignal.timeout(10_000)`).
- Retry only safe, repeatable calls. Never blindly retry a payment call.

### Money (fail closed)
- If anything is unclear in a money flow, **stop and do nothing**. Never "catch and continue".
- Webhooks: verify the Cashfree signature **first** (bad → `401`). Idempotent on payment id. Return `200` only after the event is safely stored.
- Two parallel releases must give exactly one release (row lock + state check).
- OTP: store only a hash (with `OTP_PEPPER`). Lock after 5 wrong tries and alert admin.

### AI service
- Bad input → `HTTPException` with `{"code": "...", "detail": "..."}`.
- The `grade` function sets `grade_results.status = 'failed'` when the AI call fails; the app shows "Grade pending / try again".
- OCR with low confidence → the app offers manual entry, keeps the photo, and marks it `manual`.

### Logging
- Log as JSON: `{ fn, code, requestId, userId }`.
- **Never log:** key values, phone numbers, OTPs, trip tokens, PAN / GST numbers, consent audio paths.

---

## 6. Testing requirements

### Before saying "done", run these (all must pass)
```bash
cd /home/rupam/cropket/app && pnpm lint && pnpm typecheck && pnpm test
cd /home/rupam/cropket && bash scripts/test-sql.sh                    # if SQL or migrations changed
cd /home/rupam/cropket/ai-service && source .venv/bin/activate && pytest -q   # if ai-service changed
```
If `test-sql.sh` says `SUPABASE_DB_URL` is missing, don't stop: say which tests could not run, and add it to the 🔑 Keys needed block.

### What must be tested
| Area | Where | Must prove |
|---|---|---|
| **Escrow (most important)** | `supabase/tests/escrow_*.sql` | Every allowed move works; illegal jumps throw; a repeated release does nothing; timer does **not** release when a dispute is open; OTP locks after 5 tries; every move writes `escrow_events` |
| **RLS** | `supabase/tests/rls_*.sql` | **Every table has RLS on**; unverified or banned buyer cannot bid; farmer sees only own lots / khata / deals; clients cannot write `escrows`, `escrow_events`, `payouts` |
| `split.ts` | `app/tests/unit/domain/split.test.ts` | **100% branch coverage**; sum of payouts = escrow total to the paisa; rounding goes to the largest share; platform fee never reduces farmer money |
| `advice.ts` | `app/tests/unit/domain/advice.test.ts` | Tomato never gets "hold" > 2 days; hold days never > `max_hold_days` |
| `netRupee.ts`, `heat.ts`, `floor.ts`, `money.ts` | `app/tests/unit/domain/` | Formulas in `SPEC.md` §2.4, edge cases (zero, missing data) |
| Zod schemas | `app/tests/unit/domain/schemas/` | Good input passes, bad input fails |
| Mock adapters | `app/tests/unit/integrations/` | Mock output passes the same zod schema as real (test the pure `mock.ts` files) |
| Outbox / sync | `app/tests/unit/offline/` | Order kept (photo before lot); backoff times; `failed` after 10 tries; money kinds rejected |
| Config | `app/tests/unit/config.test.ts` | Missing optional keys don't crash; missing Supabase values give "Setup needed" |
| Locales | `app/tests/unit/locales.test.ts` | `en`, `hi`, `mr` have exactly the same keys |
| Edge Functions | by hand with `curl` on `cropket-dev` | Bad input → 400; wrong role → 403; webhook bad signature → 401 |
| AI grading / OCR | `ai-service/tests/` using `ai-service/samples/` | Dark photo → low confidence; sample onion → a grade; wrong plate → `plateMatches=false` |
| **P0 core flow** | `app/tests/e2e/core-flow.spec.ts` (Playwright) | Scan → lot → buyer bid → accept → pay (mock) → dispatch → delivery photo + OTP → Khata green |

### SQL test file shape
```sql
begin;
select plan(3);
-- checks here, e.g. select throws_ok(...), select is(...)
select * from finish(true);   -- true = a failed check stops the run
rollback;                     -- nothing is saved in cropket-dev
```

### Prototype testing level
- **Must have:** escrow SQL tests, RLS SQL tests, `split.ts` (100% branches), `advice.ts`, the other domain formulas, locales test, pytest for onion grading, **one** Playwright happy path (in M5).
- **Keep it small:** a few clear tests per feature beat many fragile ones. Don't write UI snapshot tests.

### Rules
- **Fixing a bug? First write a test that fails, then fix it.**
- SQL tests run on `cropket-dev` inside a transaction and always roll back.
- Tests use mock integrations and `DEMO_MODE=true`. Never call real Cashfree, data.gov.in, Bhashini or FCM from tests.
- Never delete or weaken a test to make it pass. Ask first.

### Manual checks for UI work
- Check the screen at **360 px** width, in **English, Hindi and Marathi**.
- If the feature should work offline: `pnpm build && pnpm preview`, then DevTools → Offline (and airplane mode on a real phone for the APK).
- Before a phase is called done: test on a low-cost Android phone with "Slow 3G", and check the phase's "Done when" list in `SPEC.md` §9.2.

---

## 7. Learned Rules

<!--
Add a rule here every time Claude Code makes a mistake we don't want again.
Format:
- [YYYY-MM-DD] Rule in one simple sentence. (Why: short reason)
Example:
- [2026-09-20] Run `supabase gen types` after every migration. (Why: app types went out of date and the build broke.)
-->

- [2026-09-16] To hoist a package for pnpm (needed once, for `vite-plugin-pwa`'s `workbox-window`), put `publicHoistPattern` in `app/pnpm-workspace.yaml`, not a `public-hoist-pattern[]=` line in `app/.npmrc`. (Why: pnpm 11 moved hoist settings to `pnpm-workspace.yaml`; the old `.npmrc` line is silently ignored — no error, `pnpm build` just fails later with "Rolldown failed to resolve import".)
- [2026-09-17] `supabase functions deploy` needs `--import-map supabase/functions/deno.json` - the shared import map is not auto-discovered by the installed CLI (2.117.0). Also delete the per-function `deno.json` that `supabase functions new <name>` scaffolds (it shadows the shared one and has no `zod` entry). (Why: without the flag, deploy fails with `Relative import path "zod" not prefixed with / or ./ or ../`.)
- [2026-09-17] Every Edge Function the browser calls needs `verify_jwt = false` in its own `[functions.<name>]` block in `config.toml`, must answer `OPTIONS` with CORS headers before doing anything else, and must check the caller itself - `requireRole()` (verifies the JWT with `auth.getUser()`) or `requireCronSecret()` for cron/webhook/driver-link functions with no user JWT at all. `handle()` in `_shared/http.ts` does the CORS/OPTIONS part for every function automatically; `ALLOWED_ORIGINS` (comma-separated, `scripts/set-key.sh`) restricts which origins get a real `access-control-allow-origin` back, unset = `*`. Run `bash scripts/check-functions.sh` before every deploy - it fails if a function is missing its config block, has a stray per-function `deno.json`, or (once deployed) doesn't answer its own pre-flight / auth. (Why: Supabase's gateway rejected the browser's pre-flight with 401 before the function ever ran, so grading looked "offline"; the app's outbox then burned all 10 retries on what was really a permanent rejection, since it retried every failure the same way. `isRetryable()` in `offline/outbox.ts` now only retries `NETWORK_ERROR` / `UPLOAD_FAILED` / `AI_UNAVAILABLE` - an auth or validation error fails on the first try instead.)

