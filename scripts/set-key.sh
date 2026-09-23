#!/usr/bin/env bash
# Cropket key helper. Asks for API keys and saves them to the right .env file.
#
#   bash scripts/set-key.sh                 → asks for every missing key (Enter = skip)
#   bash scripts/set-key.sh NAME            → asks for one key
#   bash scripts/set-key.sh --status        → shows which keys are set / missing (never shows values)
#   bash scripts/set-key.sh --get NAME      → prints one value (only for use inside $(...) in scripts)
#
# Typing is hidden. For secrets we make ourselves, type g and press Enter to generate one.
# To add a new key: add one line to the KEYS list below and to the matching .env.example.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Where each target lives
target_file() {
  case "$1" in
    app)   echo "$ROOT/app/.env" ;;                 # public values only (bundled into the app)
    fn)    echo "$ROOT/supabase/functions/.env" ;;  # Edge Function secrets (pushed to Supabase)
    ai)    echo "$ROOT/ai-service/.env" ;;          # AI service
    local) echo "$ROOT/scripts/.env" ;;             # only for scripts and commands on this laptop
    *)     echo "unknown target: $1" >&2; exit 1 ;;
  esac
}

# NAME | target | gen (yes = can be generated) | where to get it
KEYS=$(cat <<'EOF'
VITE_SUPABASE_URL|app|no|Supabase dashboard → cropket-dev → Project Settings → API → Project URL
VITE_SUPABASE_PUBLISHABLE_KEY|app|no|Supabase dashboard → Project Settings → API Keys → publishable (anon) key
VITE_MAPTILER_KEY|app|no|cloud.maptiler.com → API keys (restrict to your domains). Without it: mandi list instead of map
VITE_FIREBASE_API_KEY|app|no|Firebase console → Project settings → Your apps → Web app config. Without it: no push
VITE_FIREBASE_PROJECT_ID|app|no|Firebase console → Project settings → Web app config
VITE_FIREBASE_MESSAGING_SENDER_ID|app|no|Firebase console → Project settings → Web app config
VITE_FIREBASE_APP_ID|app|no|Firebase console → Project settings → Web app config
VITE_FIREBASE_VAPID_KEY|app|no|Firebase console → Project settings → Cloud Messaging → Web Push certificates
SUPABASE_URL|local|no|Same as VITE_SUPABASE_URL (used by scripts)
SUPABASE_SERVICE_ROLE_KEY|local|no|Supabase dashboard → Project Settings → API Keys → service_role / secret key. NEVER put in app/
SUPABASE_DB_PASSWORD|local|no|The database password you chose when creating cropket-dev
SUPABASE_DB_URL|local|no|Supabase dashboard → Connect → Session pooler connection string (with password filled in)
AI_SERVICE_URL|fn|no|Your AI service address (Hugging Face Space URL or cloudflared tunnel URL). Without it: mock grades
AI_SERVICE_KEY|fn|yes|Any long random string. Also saved as SERVICE_KEY in ai-service/.env
DATA_GOV_API_KEY|fn|no|data.gov.in → sign up → My Account → API key. Without it: seeded prices only
AGMARKNET_RESOURCE_ID|fn|no|data.gov.in → "Current Daily Price of Various Commodities…" dataset page → resource id
APP_URL|fn|no|Your web app's address (Vercel URL or http://localhost:5173 in dev). Used to build the driver trip link (shipments-create). Without it: falls back to the calling request's Origin
CASHFREE_APP_ID|fn|no|merchant.cashfree.com → switch to Test/Sandbox → Developers → API Keys. Without it: mock payments
CASHFREE_SECRET_KEY|fn|no|Same page as CASHFREE_APP_ID
ORS_API_KEY|fn|no|openrouteservice.org → sign up → Dashboard → API key. Without it: straight-line distance (demo)
BHASHINI_USER_ID|fn|no|bhashini.gov.in (ULCA) → sign up → profile. Without it: bundled clips + browser voice
BHASHINI_API_KEY|fn|no|Bhashini (ULCA) profile → generate API key
BHASHINI_PIPELINE_ID|fn|no|Bhashini (ULCA) → pipeline details
FIREBASE_SERVICE_ACCOUNT_JSON|fn|no|Firebase → Project settings → Service accounts → generate key, then: base64 -w0 file.json
INTEGRATIONS_MOCK|fn|no|Comma-separated adapter names to force mock mode, e.g. "ai" while ai-service has no /grade route yet (SPEC.md §2.2)
ALLOWED_ORIGINS|fn|no|Comma-separated web origins allowed to call functions from a browser, e.g. https://cropket.vercel.app,http://localhost:5173. Without it: every origin is allowed (fine until the web deploy, M5)
CRON_SECRET|fn|yes|Random string. Also add it in Supabase Vault as cron_secret
OTP_PEPPER|fn|yes|Random string. Needed before delivery OTP works
WHATSAPP_TOKEN|fn|no|developers.facebook.com → your app → WhatsApp → API Setup (Phase 8)
WHATSAPP_PHONE_NUMBER_ID|fn|no|Same page as WHATSAPP_TOKEN (Phase 8)
WHATSAPP_VERIFY_TOKEN|fn|yes|Random string you also type into the Meta webhook settings (Phase 8)
WHATSAPP_APP_SECRET|fn|no|developers.facebook.com → your app → Settings → Basic → App secret (Phase 8)
EOF
)

key_line() { printf '%s\n' "$KEYS" | awk -F'|' -v k="$1" '$1==k {print; exit}'; }

get_value() { # file name
  [ -f "$1" ] || return 0
  grep -E "^$2=" "$1" 2>/dev/null | tail -n1 | cut -d= -f2- | sed -e "s/^['\"]//" -e "s/['\"]\$//"
}

upsert() { # file name value
  local file="$1" name="$2" value="$3" tmp
  mkdir -p "$(dirname "$file")"
  touch "$file"
  tmp="$(mktemp)"
  grep -v -E "^$name=" "$file" > "$tmp" || true
  printf '%s=%s\n' "$name" "$value" >> "$tmp"
  mv "$tmp" "$file"
  chmod 600 "$file"
}

ensure_gitignore() {
  local gi="$ROOT/.gitignore"
  touch "$gi"
  grep -qxF ".env" "$gi" || printf '\n# secrets (added by set-key.sh)\n.env\n' >> "$gi"
}

FN_CHANGED=0
APP_CHANGED=0

ask_one() { # name
  local name="$1" line target gen hint file value
  line="$(key_line "$name")"
  if [ -z "$line" ]; then
    echo "❌ $name is not in the KEYS list in scripts/set-key.sh. Add it there first." >&2
    return 1
  fi
  IFS='|' read -r _ target gen hint <<< "$line"
  file="$(target_file "$target")"

  echo
  echo "🔑 $name"
  echo "   Where to get it: $hint"
  if [ "$gen" = "yes" ]; then
    echo "   Type g + Enter to generate one. Enter alone = skip."
  else
    echo "   Paste it (typing is hidden). Enter alone = skip."
  fi
  read -r -s -p "   Value: " value < /dev/tty
  echo
  value="$(printf '%s' "$value" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

  if [ -z "$value" ]; then echo "   ⏭  Skipped."; return 0; fi
  if [ "$gen" = "yes" ] && [ "$value" = "g" ]; then
    value="$(openssl rand -hex 32)"
    echo "   ✨ Generated."
  fi

  upsert "$file" "$name" "$value"
  echo "   ✅ Saved to ${file#"$ROOT"/}"

  case "$name" in
    AI_SERVICE_KEY)
      upsert "$(target_file ai)" SERVICE_KEY "$value"
      echo "   ✅ Also saved as SERVICE_KEY in ai-service/.env" ;;
    CRON_SECRET)
      echo "   👉 Also add it in Supabase dashboard → Vault as: cron_secret" ;;
  esac

  [ "$target" = "fn" ] && FN_CHANGED=1
  [ "$target" = "app" ] && APP_CHANGED=1
  return 0
}

status() {
  local name target gen hint file mark
  printf '%s\n' "$KEYS" | while IFS='|' read -r name target gen hint; do
    file="$(target_file "$target")"
    if [ -n "$(get_value "$file" "$name")" ]; then mark="✅ set    "; else mark="⬜ missing"; fi
    printf '%s  %-34s → %s\n' "$mark" "$name" "${file#"$ROOT"/}"
  done
}

finish() {
  if [ "$FN_CHANGED" = 1 ]; then
    echo
    if command -v supabase >/dev/null 2>&1 && [ -f "$ROOT/supabase/.temp/project-ref" ]; then
      read -r -p "Push Edge Function secrets to Supabase now? [y/N] " ans < /dev/tty
      if [[ "$ans" =~ ^[Yy]$ ]]; then
        (cd "$ROOT" && supabase secrets set --env-file supabase/functions/.env) \
          && echo "✅ Secrets pushed." \
          || echo "⚠️  Push failed. Try later: supabase secrets set --env-file supabase/functions/.env"
      else
        echo "👉 Later run: supabase secrets set --env-file supabase/functions/.env"
      fi
    else
      echo "👉 Supabase is not linked yet. After 'supabase link', run:"
      echo "   supabase secrets set --env-file supabase/functions/.env"
    fi
  fi
  if [ "$APP_CHANGED" = 1 ]; then
    echo "👉 Restart 'pnpm dev' so the app sees the new values."
  fi
}

ensure_gitignore

case "${1:-}" in
  --status)
    status ;;
  --get)
    [ -n "${2:-}" ] || { echo "usage: --get NAME" >&2; exit 1; }
    line="$(key_line "$2")"
    [ -n "$line" ] || { echo "unknown key: $2" >&2; exit 1; }
    IFS='|' read -r _ target _ _ <<< "$line"
    get_value "$(target_file "$target")" "$2" ;;
  -h|--help)
    sed -n '2,12p' "$0" ;;
  "")
    missing=0
    while IFS='|' read -r name target _ _; do
      if [ -z "$(get_value "$(target_file "$target")" "$name")" ]; then
        missing=1
        ask_one "$name"
      fi
    done <<< "$KEYS"
    [ "$missing" = 0 ] && echo "✅ All keys are set."
    finish ;;
  *)
    ask_one "$1"
    finish ;;
esac
