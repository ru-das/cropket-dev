#!/usr/bin/env bash
# Syncs required Edge Function secrets into Supabase Vault for pg_cron.
# Sets `functions_url` and `cron_secret` in vault.secrets.
#
#   bash scripts/sync-vault-secrets.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DB_URL="$(bash "$ROOT/scripts/set-key.sh" --get SUPABASE_DB_URL)"
if [ -z "$DB_URL" ]; then
  echo "🔑 SUPABASE_DB_URL is missing. Run in your terminal: bash scripts/set-key.sh SUPABASE_DB_URL"
  exit 2
fi

SUPABASE_URL="$(bash "$ROOT/scripts/set-key.sh" --get SUPABASE_URL)"
if [ -z "$SUPABASE_URL" ]; then
  echo "🔑 SUPABASE_URL is missing. Run in your terminal: bash scripts/set-key.sh SUPABASE_URL"
  exit 2
fi

CRON_SECRET="$(bash "$ROOT/scripts/set-key.sh" --get CRON_SECRET)"
if [ -z "$CRON_SECRET" ]; then
  echo "🔑 CRON_SECRET is missing. Run in your terminal: bash scripts/set-key.sh CRON_SECRET"
  exit 2
fi

command -v psql >/dev/null || { echo "psql not found. Install: sudo pacman -S postgresql-libs"; exit 2; }

FUNCTIONS_URL="${SUPABASE_URL%/}/functions/v1"

psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 \
  -v functions_url="$FUNCTIONS_URL" \
  -v cron_secret="$CRON_SECRET" <<'SQL'
begin;
delete from vault.secrets where name in ('functions_url', 'cron_secret');
select vault.create_secret(:'functions_url', 'functions_url', 'Supabase Edge Functions base URL');
select vault.create_secret(:'cron_secret', 'cron_secret', 'Shared secret for pg_cron to invoke Edge Functions');
commit;
SQL

echo "✅ Vault secrets (functions_url, cron_secret) synced successfully."
