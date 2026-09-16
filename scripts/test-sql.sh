#!/usr/bin/env bash
# Runs every SQL test in supabase/tests/ against the cropket-dev database.
# Each test file must start with `begin;` and end with `select * from finish(true); rollback;`
# so nothing is saved and a failed check stops the run.
#
#   bash scripts/test-sql.sh                 → all tests
#   bash scripts/test-sql.sh escrow          → only files whose name contains "escrow"

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DB_URL="$(bash "$ROOT/scripts/set-key.sh" --get SUPABASE_DB_URL)"
if [ -z "$DB_URL" ]; then
  echo "🔑 SUPABASE_DB_URL is missing. Run in your terminal: bash scripts/set-key.sh SUPABASE_DB_URL"
  exit 2
fi
command -v psql >/dev/null || { echo "psql not found. Install: sudo pacman -S postgresql-libs"; exit 2; }

shopt -s nullglob
files=("$ROOT"/supabase/tests/*"${1:-}"*.sql)
[ ${#files[@]} -gt 0 ] || { echo "No SQL test files found."; exit 0; }

failed=0
for f in "${files[@]}"; do
  echo "▶ ${f#"$ROOT"/}"
  if ! psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$f"; then
    echo "❌ FAILED: ${f#"$ROOT"/}"
    failed=1
  fi
done

[ "$failed" = 0 ] && echo "✅ All SQL tests passed." || exit 1
