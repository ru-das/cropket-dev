# Cropket — Build Guide (for the team)

This is the "what do I do now" guide. It covers:
1. Setting up once.
2. Building the prototype (Phases 0–4, demo version) with Claude Code.
3. Continuing on our own afterwards.

Files you should know:
| File | What it is | Who edits it |
|---|---|---|
| `SPEC.md` | The full design. §9.5 = prototype scope | Team (Claude Code updates it only if the design changes) |
| `CLAUDE.md` | Rules Claude Code follows. It loads automatically. | Team |
| `docs/progress.md` | Milestone checklist + handoff notes | Claude Code, after every feature |
| `scripts/check-tools.sh` | Shows missing tools + install commands | — |
| `scripts/set-key.sh` | Asks for API keys and saves them | — |
| `scripts/test-sql.sh` | Runs the database tests | — |

---

## Part 1 — Set up once (about 1 hour)

### 1. Put the files in place
```
/home/rupam/cropket/
├── CLAUDE.md
├── SPEC.md                  ← rename SPEC(1).md to this
├── .claude/settings.json    ← create it (content below)
├── docs/BUILD_GUIDE.md
├── docs/progress.md
└── scripts/set-key.sh  check-tools.sh  test-sql.sh
```
`.claude/settings.json`:
```json
{ "permissions": { "deny": ["Read(./**/.env)"] } }
```

### 2. Start Git
```bash
cd /home/rupam/cropket
git init
git add .
git commit -m "chore: docs, rules and helper scripts"
```
(Optional: create a GitHub repo and push, so the team shares one copy.)

### 3. Install tools
```bash
bash scripts/check-tools.sh
```
Run the install commands it prints. You only need the "needed now" ones today. Tools marked "APK step" can wait until M5.

### 4. Create the Supabase project
1. Go to supabase.com → New project → name **`cropket-dev`**, region **Mumbai**.
2. **Save the database password** somewhere safe. You'll need it in step 5.
3. In the dashboard:
   - **Database → Extensions:** turn on `postgis`, `pg_cron`, `pg_net`, `pgtap`.
   - **Authentication → Sign In / Providers → Phone:** turn it on. Add **test phone numbers** with fixed OTPs, for example 3 farmers, 2 buyers, 1 FPO and 1 admin. If it asks for SMS provider details, dummy values are fine.
   - **Storage:** create private buckets: `crop-photos`, `weigh-slips`, `pod`, `consent-audio`, `dispute-photos`, `kyc-docs`, `tts-audio`.
4. Link your folder to it:
```bash
supabase login
supabase link --project-ref <your project ref>   # the ref is in the project URL
```

### 5. Add keys
```bash
bash scripts/set-key.sh
```
- It asks for each key. Typing is hidden. Press **Enter** to skip one, or type **g** to generate a random one.
- **Add these now:**
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` and `SUPABASE_DB_URL`
  - Generate `CRON_SECRET`, `OTP_PEPPER` and `AI_SERVICE_KEY` with **g**.
- **Nice to have** (all free): `DATA_GOV_API_KEY`, `ORS_API_KEY`, `VITE_MAPTILER_KEY`.
- **Skip everything else.** The app uses mocks for those.
- Check what's set any time with `bash scripts/set-key.sh --status`.

### 6. Pick a "driver"
Only **one person runs Claude Code on the repo at a time**. If two people run it at once, they will change the same files. The others:
- review the plan before "go ahead";
- test each finished feature on a real phone;
- read the handoff notes and the code, so the team understands it before continuing by hand.

---

## Part 2 — Build the prototype with Claude Code

### The loop (repeat for every item in `docs/progress.md`)
1. **Start fresh.** Open Claude Code in `/home/rupam/cropket` (or type `/clear` in an open session). Small sessions work better.
2. **Ask for a plan.** Use the prompt below.
3. **Check the plan** with the review list further down. Fix it by replying in plain words.
4. **Say "Go ahead."**
5. **Answer anything it can't do.** It may end with **🔑 Keys needed** or **🧰 Tools needed**. Run those commands in *your own* terminal whenever you're ready. It does not wait for you.
6. **Test by hand.** Follow the "Test by hand" steps in the handoff note in `docs/progress.md`.
7. **Commit.** Claude Code commits after checks pass. If it didn't, run `git add . && git commit -m "feat(...): ..."`.
8. **Next item.**

### Prompt to start an item
```
Next item in docs/progress.md: <number and name, e.g. "0.1 Repo skeleton">.
Read the SPEC.md sections it needs. Plan it first: steps, files, packages (with versions),
what will be mocked, and which tests. Don't write code yet.
If the item is big, split it into smaller steps.
```

### First prompt of the project (item 0.1)
```
Next item in docs/progress.md: 0.1 Repo skeleton.
Read SPEC.md §1, §3, §7 and §9.5. Plan the setup of app/, supabase/ and ai-service/:
the exact commands, the files you'll create, the packages with exact versions,
the package.json scripts from CLAUDE.md, and the .env.example files.
Don't write code yet.
```

### Plan review list (30 seconds)
- [ ] Is it **inside the prototype scope**? Nothing from Phases 5–8, no P1 extras.
- [ ] Does it follow the **build order**: table + RLS → schema → function → service → screen → tests?
- [ ] Are the file paths the ones in `SPEC.md` §3?
- [ ] Is it clear **what is mocked**?
- [ ] Are there **tests** for money, escrow, advice or RLS parts?
- [ ] Is it **simple enough** that you could change it yourself later?
- [ ] Does it add **new packages**? Are they really needed?

### Useful short prompts
| Situation | Say |
|---|---|
| The plan is too big | "Too big for a prototype. Give me the simplest version that still meets the 'Done when' check." |
| You don't understand the code | "Explain how `<file>` works in simple words, step by step." |
| Something broke | "`<what you did>` → `<what happened>`. Find the cause first and tell me. Don't change code yet." |
| It keeps repeating a mistake | "Add a rule to CLAUDE.md §7 Learned Rules so this doesn't happen again." |
| You want to see what's left | "Summarise docs/progress.md: done, in progress, next, and keys/tools still needed." |
| Before a milestone ends | "Check milestone M<n> against SPEC.md §9.2 'Done when' (P0 parts only). What's missing?" |

### Milestone checkpoints (test these yourself)
| Milestone | You should be able to… |
|---|---|
| **M0** | Log in with a test number · farmer, buyer and FPO see different homes · switch language and all text changes · install the web app on a phone |
| **M1** | Dark photo is blocked · onion photo gives a grade + confidence · grade is spoken in Hindi / Marathi · lot made in airplane mode syncs later |
| **M2** | Prices show with data age · heat colours / list show · tomato never says "hold > 2 days" · low price shows a warning · Net-₹ picks the best row |
| **M3** | Unverified buyer can't bid · two browser windows show the same bid instantly · small lots combine into a mega lot · accepting creates a deal |
| **M4** | "Pay (demo)" → Khata 🟡 · mark dispatched → 🔵 · driver photo + correct OTP → 🟢 · skip-timer releases money · mega lot money splits with no paisa lost |
| **M5** | APK opens in airplane mode · live URL works · full flow runs 3 times in a row |

### When something goes wrong
- **Claude Code changed too much:** press `Esc` to stop it. Then `git diff` to see the changes, or `git restore .` to undo everything since your last commit.
- **Supabase says "paused":** free projects pause after about a week without use. Open the dashboard and click Restore.
- **A key or tool is missing:** it's in the 🔑 / 🧰 list at the bottom of `docs/progress.md`. Run the command shown.
- **The build broke and you don't know why:** go back to the last good commit with `git log`, then `git checkout <commit> -- <file>`. Or ask Claude Code to find the cause first.
- **Never** paste keys into the chat. Use `bash scripts/set-key.sh`.

---

## Part 3 — After the prototype (building on our own)

### 1. Switch Claude Code to "helper mode"
In `CLAUDE.md`, replace the whole **"Prototype mode (current)"** section with this:
```markdown
### Helper mode (current)
The team writes the code now. Claude Code helps only when asked.
- Answer the question asked. Don't change files unless asked to.
- Prefer explaining and pointing to the right file over writing big changes.
- Keep changes small and in the style of the existing code.
- The scope is whatever the user names. Follow SPEC.md §9 for priorities.
- Still follow every other rule in this file (keys, tools, money, tests).
```
Also update the note at the top of `SPEC.md` and mark §9.5 as "finished".

### 2. How to add a feature yourself
Follow the same order Claude Code used (`SPEC.md` §9.4):
1. **Migration:** `supabase migration new <name>`. Write the table + RLS. Then `supabase db push`.
2. **Types:** `supabase gen types typescript --linked | tee app/src/lib/database.types.ts > supabase/functions/_shared/database.types.ts`
3. **Zod schema** in `supabase/functions/_shared/domain/schemas/`.
4. **Logic:**
   - pure maths → `_shared/domain/`
   - all-or-nothing DB change → SQL function
   - secret or outside API → Edge Function
5. **Service** in `app/src/services/`.
6. **Screen** in `app/src/routes/`, built from components in `app/src/components/`.
7. **Text** in all three files in `app/src/locales/`.
8. **Tests:** `pnpm test`, and `bash scripts/test-sql.sh` for SQL.
9. **Handoff note** in `docs/progress.md` (keep the habit).

### 3. How to turn a mock into the real thing
Example: Cashfree.
1. Get the key and run `bash scripts/set-key.sh CASHFREE_APP_ID` (and `CASHFREE_SECRET_KEY`).
2. Write the real call in `supabase/functions/_shared/integrations/cashfree/real.ts`. It must return the **same shape** as `mock.ts`.
3. Remove `cashfree` from `INTEGRATIONS_MOCK` in `supabase/functions/.env`, then push secrets: `supabase secrets set --env-file supabase/functions/.env`.
4. Deploy: `supabase functions deploy --use-api`.
5. The "Demo data" tag disappears by itself, because `source` is no longer `mock`.

Nothing else in the app should need to change. That is the point of the adapter pattern.

### 4. What to build next (from `SPEC.md` §9.3)
1. The P1 items of Phases 0–4, for example: the `tts` function (Bhashini), push notifications, 30-day price chart, ratings, FPO dashboard, Khata PDF.
2. **Phase 5:** logistics (full driver checklist, weighbridge OCR, live tracking).
3. **Phase 6:** disputes and crop rescue.
4. **Phase 7:** loans and Consent Vault.
5. **Phase 8:** WhatsApp, kiosk, video audit.
6. **Later setup:** a second Supabase project (`cropket-demo`), `deploy.yml` in GitHub Actions, and a signed APK.

### 5. Asking AI for help later
- Use Claude Code in the repo. It reads `CLAUDE.md` and knows the rules.
- In a normal chat, paste the file you're working on and the related `SPEC.md` section.
- Ask for explanations and small changes. Big rewrites are hard to review.
