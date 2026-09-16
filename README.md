# Cropket

Offline-first app for small farmers and FPOs in India: scan a crop, get an AI
quality grade, see fair mandi prices, sell to verified buyers through live
bidding, with payment locked in escrow until delivery is proven. See
`SPEC.md` for the full design and `CLAUDE.md` for working rules.

Pilot: Nashik, Maharashtra. First crop: onion. Languages: English, Hindi, Marathi.

## Develop (2 terminals)

```bash
# Terminal 1 — App (talks to the cropket-dev Supabase project in the cloud)
cd app
pnpm install
pnpm dev

# Terminal 2 — AI service (only when working on grading / OCR)
cd ai-service
uv venv --python 3.12   # first time only
source .venv/bin/activate
uv pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

## Docs

- `SPEC.md` — full design (single source of truth)
- `CLAUDE.md` — short working rules for Claude Code
- `docs/BUILD_GUIDE.md` — step-by-step guide for the team
- `docs/progress.md` — milestone checklist + handoff notes
