#!/bin/bash
cd "$(dirname "$0")"
PORT="${DEVTOOL_PORT:-8790}"
LAUNCHER_PORT="${DEVTOOL_LAUNCHER_PORT:-8789}"
URL="http://127.0.0.1:${PORT}"
LAUNCHER_URL="http://127.0.0.1:${LAUNCHER_PORT}"

if curl -sf "${URL}/api/health" >/dev/null 2>&1; then
  open "$URL"
  exit 0
fi

if curl -sf "${LAUNCHER_URL}/api/health" >/dev/null 2>&1; then
  curl -sf -X POST "${LAUNCHER_URL}/api/server/start" >/dev/null 2>&1 || true
  for i in $(seq 1 20); do
    if curl -sf "${URL}/api/health" >/dev/null 2>&1; then
      open "$URL"
      exit 0
    fi
    sleep 0.5
  done
  open "$URL"
  exit 0
fi

if command -v python3 >/dev/null 2>&1; then
  exec python3 launcher.py
fi

osascript -e 'display alert "Instale Python 3 para rodar o DevTool" as critical'
exit 1