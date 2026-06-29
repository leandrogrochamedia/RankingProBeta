#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if command -v python3 >/dev/null 2>&1; then
  exec python3 launcher.py
fi

if command -v node >/dev/null 2>&1; then
  exec node server.js
fi

echo "Instale Python 3 ou Node.js para rodar o DevTool." >&2
exit 1