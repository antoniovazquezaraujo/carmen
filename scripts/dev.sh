#!/usr/bin/env bash
#
# Start the Carmen dev server with the project's Node 22 toolchain.
# Usage: ./scripts/dev.sh [ng serve options]
#
set -euo pipefail

cd "$(dirname "$0")/.."

# Angular 21 expects Node 22 (see CONTRIBUTING.md "Build and test").
NODE22_BIN="${NODE22_BIN:-$HOME/.nvm/versions/node/v22.23.3/bin}"
if [ -d "$NODE22_BIN" ]; then
  export PATH="$NODE22_BIN:$PATH"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "error: node not found. Install Node 22 (e.g. 'nvm install 22') and retry." >&2
  exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 22 ]; then
  echo "warning: Node $(node -v) is active; this project expects Node 22 (tests/build may fail)." >&2
fi

if [ ! -d node_modules ]; then
  echo "==> node_modules is missing: running 'npm ci' first (one-time, takes a while)..."
  npm ci
fi

echo "==> Starting the dev server on http://localhost:4200 (Ctrl+C to stop)"
exec npm start -- "$@"
