#!/usr/bin/env bash
set -euo pipefail

export PORT_API="${PORT_API:-8080}"
export STOREFRONT_PORT="${STOREFRONT_PORT:-18539}"
export BASE_PATH="${BASE_PATH:-/}"
NGINX_PORT="${NGINX_PORT:-8081}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill any processes currently occupying our ports
echo "==> Freeing ports ${PORT_API}, ${STOREFRONT_PORT}, ${NGINX_PORT}..."
for PORT in "${PORT_API}" "${STOREFRONT_PORT}" "${NGINX_PORT}"; do
  fuser -k "${PORT}/tcp" 2>/dev/null || true
done

# Stop any running nginx instances using our config
nginx -e /tmp/nginx-error.log -c "${SCRIPT_DIR}/nginx.conf" -s stop 2>/dev/null || true
sleep 1

echo "==> Starting API server on port ${PORT_API}..."
PORT="${PORT_API}" pnpm --filter @workspace/api-server run start &
API_PID=$!

echo "==> Starting storefront on port ${STOREFRONT_PORT}..."
PORT="${STOREFRONT_PORT}" BASE_PATH="${BASE_PATH}" pnpm --filter @workspace/storefront run serve &
STOREFRONT_PID=$!

echo "==> Waiting for API and storefront to be ready..."
sleep 3

echo "==> Starting nginx on port ${NGINX_PORT}..."
nginx -e /tmp/nginx-error.log -c "${SCRIPT_DIR}/nginx.conf" -g "daemon off;" &
NGINX_PID=$!

echo "==> All services started. API=$API_PID  Storefront=$STOREFRONT_PID  Nginx=$NGINX_PID"

wait -n $API_PID $STOREFRONT_PID $NGINX_PID
echo "==> A service exited — shutting down."
kill $API_PID $STOREFRONT_PID $NGINX_PID 2>/dev/null || true
