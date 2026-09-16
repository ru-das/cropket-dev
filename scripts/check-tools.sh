#!/usr/bin/env bash
# Cropket tool checker. Shows which tools are installed and prints the install commands for missing ones.
# It never installs anything and never uses sudo. It always exits 0 (so it never stops other work),
# unless you pass --strict (then it exits 1 when a "now" tool is missing).
#
#   bash scripts/check-tools.sh
#   bash scripts/check-tools.sh --strict

set -uo pipefail
STRICT="${1:-}"

# name | command to check | how to install | when needed (now / apk / optional)
TOOLS=$(cat <<'EOF'
git|git|pacman:git|now
Node.js (20+)|node|pacman:nodejs|now
pnpm|pnpm|pacman:pnpm|now
uv (Python manager)|uv|pacman:uv|now
openssl|openssl|pacman:openssl|now
psql|psql|pacman:postgresql-libs|now
yay (AUR helper)|yay|manual:yay|now
Supabase CLI|supabase|aur:supabase-bin|now
cloudflared|cloudflared|pacman:cloudflared|optional
Java 21|java|pacman:jdk21-openjdk|apk
adb|adb|pacman:android-tools|apk
Android Studio|/opt/android-studio/bin/studio.sh|aur:android-studio|apk
EOF
)

have() { # command or path
  if [[ "$1" == /* ]]; then [ -x "$1" ]; else command -v "$1" >/dev/null 2>&1; fi
}

pacman_missing=()
aur_missing=()
need_yay=0
now_missing=0

echo "Cropket tools"
echo "-------------"
while IFS='|' read -r name cmd how when; do
  if have "$cmd"; then
    mark="✅"
  else
    mark="⬜"
    case "$how" in
      pacman:*) pacman_missing+=("${how#pacman:}") ;;
      aur:*)    aur_missing+=("${how#aur:}") ;;
      manual:yay) need_yay=1 ;;
    esac
    [ "$when" = "now" ] && now_missing=1
  fi
  case "$when" in
    now)      label="needed now" ;;
    apk)      label="needed for the APK step" ;;
    optional) label="optional (connect cloud functions to local AI)" ;;
  esac
  printf '%s  %-22s %s\n' "$mark" "$name" "$label"
done <<< "$TOOLS"

# Version checks
if have node; then
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [ "$major" -lt 20 ]; then
    echo "⚠️  Node.js $(node -v) is too old. Need 20 or newer: sudo pacman -Syu nodejs"
    now_missing=1
  fi
fi

if have uv; then
  if uv python find 3.12 >/dev/null 2>&1; then
    echo "✅  Python 3.12 (via uv)"
  else
    echo "⬜  Python 3.12 (via uv)   → no sudo needed, Claude Code may run: uv python install 3.12"
  fi
fi

# Install commands
if [ ${#pacman_missing[@]} -eq 0 ] && [ ${#aur_missing[@]} -eq 0 ] && [ "$need_yay" = 0 ]; then
  echo
  echo "✅ Everything is installed."
else
  echo
  echo "👉 Run these in YOUR terminal (they need your password):"
  if [ ${#pacman_missing[@]} -gt 0 ]; then
    echo "   sudo pacman -S --needed ${pacman_missing[*]}"
  fi
  if [ "$need_yay" = 1 ]; then
    echo "   # install yay (AUR helper):"
    echo "   sudo pacman -S --needed base-devel git"
    echo "   git clone https://aur.archlinux.org/yay-bin.git /tmp/yay-bin && (cd /tmp/yay-bin && makepkg -si)"
  fi
  if [ ${#aur_missing[@]} -gt 0 ]; then
    echo "   yay -S ${aur_missing[*]}"
  fi
  echo "   (Tools marked 'APK step' or 'optional' can wait.)"
fi

if [ "$STRICT" = "--strict" ] && [ "$now_missing" = 1 ]; then
  exit 1
fi
exit 0
