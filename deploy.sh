#!/usr/bin/env bash
# deploy.sh — Full deploy: install, build, migrate, seed, then start.
# Run this on a fresh environment or after pulling new code.
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
# 1. Install dependencies
# ---------------------------------------------------------------------------
echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# 2. Build
# ---------------------------------------------------------------------------
echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Building storefront..."
PORT="${STOREFRONT_PORT}" BASE_PATH="${BASE_PATH}" \
  pnpm --filter @workspace/storefront run build

# ---------------------------------------------------------------------------
# 3. Database — push schema then seed defaults
# ---------------------------------------------------------------------------
echo "==> Pushing database schema..."
pnpm --filter @workspace/db run push

echo "==> Seeding database (admin user + default settings)..."
# Seeds admin@allmart.com and default settings via upsert — safe to re-run.
pnpm --filter @workspace/db run seed

# ---------------------------------------------------------------------------
# 4. Start
# ---------------------------------------------------------------------------
echo "==> Deploy complete. Starting server..."
exec bash "${SCRIPT_DIR}/start.sh"
