#!/bin/sh
# Netlify / CI — gera config.js a partir de env e roda build Vite → dist/
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT_CONFIG="${ROOT}/config.js"
EXAMPLE="${ROOT}/config.example.js"

if [ ! -f "$EXAMPLE" ]; then
  echo "build-config: config.example.js não encontrado" >&2
  exit 1
fi

SUPABASE_URL="${SUPABASE_URL:-https://pyywdhjstvhmarvzijji.supabase.co}"
SUPABASE_KEY="${SUPABASE_KEY:-${SUPABASE_ANON_KEY:-}}"
DEBUG_MODE="${DEBUG_MODE:-false}"
PROOFLY_DEV_MENU="${PROOFLY_DEV_MENU:-false}"
SHARK_MODE="${SHARK_MODE:-true}"

if [ -z "$SUPABASE_KEY" ] && [ -f "$OUT_CONFIG" ]; then
  echo "build-config: usando config.js local (SUPABASE_KEY não definida no env)"
  cp "$OUT_CONFIG" "${ROOT}/dist/config.js" 2>/dev/null || true
else
  if [ -z "$SUPABASE_KEY" ]; then
    echo "build-config: aviso — SUPABASE_KEY vazia; copie config.example.js manualmente" >&2
    SUPABASE_KEY="sua-anon-key-aqui"
  fi

  cat > "$OUT_CONFIG" <<EOF
// Gerado por scripts/build-config.sh — não editar em CI
const APP_NAME = 'Ranking Pro';
const APP_ICON = '🏆';
const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_KEY = '${SUPABASE_KEY}';
const DEBUG_MODE = ${DEBUG_MODE};
const PROOFLY_DEV_MENU = ${PROOFLY_DEV_MENU};
const SHARK_MODE = ${SHARK_MODE};
window.APP_NAME = APP_NAME;
window.APP_ICON = APP_ICON;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;
window.DEBUG_MODE = DEBUG_MODE;
window.PROOFLY_DEV_MENU = PROOFLY_DEV_MENU;
window.SHARK_MODE = SHARK_MODE;
window.RANKING_PRO_CONFIG = { SUPABASE_URL: SUPABASE_URL, SUPABASE_ANON_KEY: SUPABASE_KEY };
EOF
fi

python3 "${ROOT}/scripts/generate-pwa-icons.py"

if ! command -v npm >/dev/null 2>&1; then
  echo "build-config: npm não encontrado — instale Node 18+ para vite build" >&2
  exit 1
fi

npm ci 2>/dev/null || npm install
npm run build

mkdir -p "${ROOT}/dist"
cp "$OUT_CONFIG" "${ROOT}/dist/config.js"

echo "build-config: dist/ pronto ($(du -sh dist 2>/dev/null | cut -f1 || echo ok))"