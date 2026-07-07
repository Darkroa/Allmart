#!/usr/bin/env bash
set -euo pipefail

export BASE_PATH="${BASE_PATH:-/}"
export STOREFRONT_PORT="${STOREFRONT_PORT:-18539}"

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Building storefront..."
PORT="${STOREFRONT_PORT}" BASE_PATH="${BASE_PATH}" pnpm --filter @workspace/storefront run build

echo "==> Pushing database schema..."
pnpm --filter @workspace/db run push

echo "==> Seeding database..."
pnpm --filter @workspace/db run seed

echo "==> Deploy complete. Starting servers..."
bash "$(dirname "${BASH_SOURCE[0]}")/start.sh"
