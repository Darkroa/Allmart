#!/usr/bin/env bash
# start.sh — Build (if needed) and start the AllMart production server.
# The API server serves both /api routes and the compiled storefront static files.
#
# Environment variables:
#   PORT_API        — port the API server listens on  (default: 8080)
#   STOREFRONT_PORT — port used when building the storefront (default: 18539)
#   BASE_PATH       — URL base path for the storefront   (default: /)
set -euo pipefail

export PORT_API="${PORT_API:-8080}"
export STOREFRONT_PORT="${STOREFRONT_PORT:-18539}"
export BASE_PATH="${BASE_PATH:-/}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Free the API port before starting
# ---------------------------------------------------------------------------
echo "==> Freeing port ${PORT_API}..."
if command -v fuser &>/dev/null; then
  fuser -k "${PORT_API}/tcp" 2>/dev/null || true
elif command -v lsof &>/dev/null; then
  lsof -ti:"${PORT_API}" | xargs kill -9 2>/dev/null || true
fi
sleep 1

# ---------------------------------------------------------------------------
# Build API server if the bundle is missing
# ---------------------------------------------------------------------------
if [ ! -f "${SCRIPT_DIR}/artifacts/api-server/dist/index.mjs" ]; then
  echo "==> Building API server..."
  pnpm --filter @workspace/api-server run build
else
  echo "==> API server already built — skipping."
fi

# ---------------------------------------------------------------------------
# Build storefront if the bundle is missing
# ---------------------------------------------------------------------------
if [ ! -f "${SCRIPT_DIR}/artifacts/storefront/dist/public/index.html" ]; then
  echo "==> Building storefront..."
  PORT="${STOREFRONT_PORT}" BASE_PATH="${BASE_PATH}" \
    pnpm --filter @workspace/storefront run build
else
  echo "==> Storefront already built — skipping."
fi

# ---------------------------------------------------------------------------
# Start the API server (also serves storefront static files via express.static)
# ---------------------------------------------------------------------------
echo "==> Starting AllMart on port ${PORT_API}..."
PORT="${PORT_API}" pnpm --filter @workspace/api-server run start
