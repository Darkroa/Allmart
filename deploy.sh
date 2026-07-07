#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Building storefront..."
pnpm --filter @workspace/storefront run build

echo "==> Pushing database schema..."
pnpm --filter @workspace/db run push

echo "==> Deploy complete."
