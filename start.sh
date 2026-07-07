#!/usr/bin/env bash
set -euo pipefail

export PORT_API="${PORT_API:-8080}"
export STOREFRONT_PORT="${STOREFRONT_PORT:-18539}"
export BASE_PATH="${BASE_PATH:-/}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill anything on our port
echo "==> Freeing port ${PORT_API}..."
fuser -k "${PORT_API}/tcp" 2>/dev/null || true
sleep 1

# Build storefront if not already built (API build also needed)
if [ ! -f "${SCRIPT_DIR}/artifacts/api-server/dist/index.mjs" ]; then
  echo "==> Building API server..."
  pnpm --filter @workspace/api-server run build
else
  echo "==> API server already built — skipping."
fi

if [ ! -f "${SCRIPT_DIR}/artifacts/storefront/dist/public/index.html" ]; then
  echo "==> Building storefront..."
  PORT="${STOREFRONT_PORT}" BASE_PATH="${BASE_PATH}" pnpm --filter @workspace/storefront run build
else
  echo "==> Storefront already built — skipping."
fi

echo "==> Starting server on port ${PORT_API}..."
PORT="${PORT_API}" pnpm --filter @workspace/api-server run start
