#!/usr/bin/env bash
set -euo pipefail

export PORT_API="${PORT_API:-8080}"
export STOREFRONT_PORT="${STOREFRONT_PORT:-18539}"
export BASE_PATH="${BASE_PATH:-/}"

# Build the API server
echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

# Build the storefront
echo "==> Building storefront..."
PORT="${STOREFRONT_PORT}" BASE_PATH="${BASE_PATH}" pnpm --filter @workspace/storefront run build

# Start the API server
echo "==> Starting API server on port ${PORT_API}..."
PORT="${PORT_API}" pnpm --filter @workspace/api-server run start &
API_PID=$!

# Start the storefront preview server (serves the pre-built dist/public/)
echo "==> Starting storefront on port ${STOREFRONT_PORT}..."
PORT="${STOREFRONT_PORT}" BASE_PATH="${BASE_PATH}" pnpm --filter @workspace/storefront run serve &
STOREFRONT_PID=$!

echo "==> Both services started. API PID=$API_PID  Storefront PID=$STOREFRONT_PID"

# Exit if either process dies
wait -n $API_PID $STOREFRONT_PID
echo "==> A service exited — shutting down."
kill $API_PID $STOREFRONT_PID 2>/dev/null || true
