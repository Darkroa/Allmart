#!/usr/bin/env bash
set -euo pipefail

# Start the API server (uses the pre-built dist/ from deploy.sh)
echo "==> Starting API server on port ${PORT_API:-8080}..."
pnpm --filter @workspace/api-server run start &
API_PID=$!

# Start the storefront preview server (serves the pre-built dist/public/)
echo "==> Starting storefront on port ${PORT:-18539}..."
pnpm --filter @workspace/storefront run serve &
STOREFRONT_PID=$!

echo "==> Both services started. API PID=$API_PID  Storefront PID=$STOREFRONT_PID"

# Exit if either process dies
wait -n $API_PID $STOREFRONT_PID
echo "==> A service exited — shutting down."
kill $API_PID $STOREFRONT_PID 2>/dev/null || true
