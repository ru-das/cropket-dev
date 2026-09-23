#!/usr/bin/env bash
# Checks every Edge Function is wired the lasting way (CLAUDE.md §7 Learned
# Rules, 2026-09-17): its own [functions.<name>] block in config.toml with
# verify_jwt = false, no stray per-function deno.json shadowing the shared
# import map, and (once deployed) that it answers its own CORS pre-flight
# and does its own auth instead of relying on Supabase's gateway.
#
#   bash scripts/check-functions.sh          → local checks always; live
#                                               checks too if SUPABASE_URL is set
#
# Run this before every `supabase functions deploy`.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$ROOT/supabase/config.toml"
FUNCTIONS_DIR="$ROOT/supabase/functions"
failed=0

# name|verify_jwt(true/false/"" if unset) for every [functions.<name>] block.
declared="$(awk '
  /^\[functions\.[a-zA-Z0-9_-]+\]$/ {
    if (name != "") print name "|" verify
    name = $0; sub(/^\[functions\./, "", name); sub(/\]$/, "", name); verify = ""
    next
  }
  /^\[/ { if (name != "") print name "|" verify; name = "" }
  /^verify_jwt[[:space:]]*=/ { verify = ($0 ~ /false/) ? "false" : "true" }
  END { if (name != "") print name "|" verify }
' "$CONFIG")"

echo "Local checks"
echo "------------"

for dir in "$FUNCTIONS_DIR"/*/; do
  name="$(basename "$dir")"
  [ "$name" = "_shared" ] && continue

  line="$(printf '%s\n' "$declared" | awk -F'|' -v n="$name" '$1==n {print; exit}')"
  if [ -z "$line" ]; then
    echo "❌ $name — no [functions.$name] block in supabase/config.toml"
    failed=1
  elif [ "${line#*|}" != "false" ]; then
    echo "❌ $name — [functions.$name] is missing verify_jwt = false"
    failed=1
  else
    echo "✅ $name — config block ok"
  fi

  if [ -f "$dir/deno.json" ]; then
    echo "❌ $name — has its own deno.json, shadowing the shared supabase/functions/deno.json"
    failed=1
  fi
done

# The reverse: a config block with no function behind it breaks
# `supabase functions deploy` (no args) - it tries to bundle a directory
# that doesn't exist.
while IFS='|' read -r name _; do
  [ -n "$name" ] || continue
  if [ ! -d "$FUNCTIONS_DIR/$name" ]; then
    echo "❌ [functions.$name] is declared in config.toml but supabase/functions/$name/ does not exist"
    failed=1
  fi
done <<< "$declared"

SUPABASE_URL="$(bash "$ROOT/scripts/set-key.sh" --get SUPABASE_URL 2>/dev/null)"
if [ -z "$SUPABASE_URL" ]; then
  echo
  echo "⏭  Skipped the live checks (SUPABASE_URL is not set). Run: bash scripts/set-key.sh SUPABASE_URL"
  [ "$failed" = 0 ] && echo "✅ Local checks passed." || exit 1
  exit 0
fi

# _shared/http.ts's corsHeaders() only echoes access-control-allow-origin
# back for an Origin it recognizes (ALLOWED_ORIGINS, §7.2) - unset means
# every origin gets "*" instead. A real browser's pre-flight always carries
# its own Origin header, so once ALLOWED_ORIGINS is set, testing with no
# Origin at all (a shape no browser produces) would fail every function
# forever, for no real reason. Test with an origin that's actually allowed
# instead - the first one in the list - so this checks what a browser gets.
ALLOWED_ORIGINS="$(bash "$ROOT/scripts/set-key.sh" --get ALLOWED_ORIGINS 2>/dev/null)"
TEST_ORIGIN="${ALLOWED_ORIGINS%%,*}"

echo
echo "Live checks against $SUPABASE_URL"
echo "----------------------------------"

for dir in "$FUNCTIONS_DIR"/*/; do
  name="$(basename "$dir")"
  [ "$name" = "_shared" ] && continue
  url="$SUPABASE_URL/functions/v1/$name"

  # OPTIONS: the browser's real pre-flight. Must be answered before the
  # function's own auth ever runs. Origin is sent only when ALLOWED_ORIGINS
  # is set (see above) - matches what a real browser at that origin sends.
  if [ -n "$TEST_ORIGIN" ]; then
    options_status="$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "$url" -H "Origin: $TEST_ORIGIN" 2>/dev/null || echo "000")"
  else
    options_status="$(curl -s -o /dev/null -w '%{http_code}' -X OPTIONS "$url" 2>/dev/null || echo "000")"
  fi
  if [ "$options_status" = "000" ]; then
    echo "⏭  $name — could not reach it (not deployed yet?)"
    continue
  fi
  if [ "$options_status" != "204" ]; then
    echo "❌ $name — OPTIONS returned $options_status, expected 204"
    failed=1
  else
    if [ -n "$TEST_ORIGIN" ]; then
      cors="$(curl -s -D - -o /dev/null -X OPTIONS "$url" -H "Origin: $TEST_ORIGIN" 2>/dev/null | grep -i '^access-control-allow-origin:' || true)"
    else
      cors="$(curl -s -D - -o /dev/null -X OPTIONS "$url" 2>/dev/null | grep -i '^access-control-allow-origin:' || true)"
    fi
    if [ -z "$cors" ]; then
      echo "❌ $name — OPTIONS answered 204 but sent no access-control-allow-origin header"
      failed=1
    else
      echo "✅ $name — OPTIONS pre-flight ok"
    fi
  fi

  # POST with no Authorization: must be rejected by the FUNCTION's own auth,
  # not waved through by a gateway that still trusts a missing/placeholder
  # JWT. requireRole()/requireCronSecret() both return UNAUTHENTICATED;
  # cashfree-webhook has no JWT or cron secret at all, only a signature
  # (verifyWebhook), so its own-auth code is WEBHOOK_SIGNATURE_INVALID -
  # still proof its own check ran, just a more specific one.
  body="$(curl -s -X POST "$url" -H 'content-type: application/json' -d '{}' 2>/dev/null || true)"
  if printf '%s' "$body" | grep -qE '"code":"(UNAUTHENTICATED|WEBHOOK_SIGNATURE_INVALID)"'; then
    echo "✅ $name — rejects a call with no Authorization (own auth ran)"
  else
    echo "❌ $name — a call with no Authorization did not come back UNAUTHENTICATED: $body"
    failed=1
  fi
done

echo
[ "$failed" = 0 ] && echo "✅ All checks passed." || exit 1
