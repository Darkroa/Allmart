# AllMart

AI-powered Nigerian e-commerce platform with full storefront, admin panel, AI shopping assistant, and Telegram bot integration.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/storefront run dev` — run the storefront (port 18539)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed-admin` — seed/reset admin user
- `pnpm --filter @workspace/scripts run seed-products` — seed sample products

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, base path `/api`)
- Frontend: React + Vite + Tailwind CSS v4 + Wouter routing (port 18539)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: OpenAI via Replit AI Integrations
- Auth: Custom cookie-based auth (bcryptjs)
- Object Storage: Google Cloud Storage (Replit sidecar)
- Email: Resend SDK or SMTP fallback (nodemailer)
- Payments: Stripe

## Where things live

- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/storefront/src/pages/` — React pages (home, products, cart, checkout, admin, pm, etc.)
- `lib/db/src/schema/` — Drizzle schema (users, products, orders, cart, chat, notifications, support_tickets, cashback, landing_pages, visitors)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `scripts/src/` — seed and backup scripts

## Admin Account

- Email: `admin@allmart.com`
- Password: `admin@allmart1234`
- Admin panel: `/admin`

## User Roles

- `buyer` — Regular customers
- `admin` — Full admin access (users, orders, catalog, bank, notifications, support, Telegram)
- `pm` — Product manager (orders + catalog only)

## Architecture decisions

- Cookie-based session auth (no JWT) — sessions stored server-side
- NGN currency throughout
- All API routes prefixed at `/api`
- Vite proxy routes `/api` → `http://localhost:8080` in dev

## Required Secrets

- `DATABASE_URL` — Postgres connection string (auto-provisioned)
- `SESSION_SECRET` — Cookie signing secret (auto-provisioned)
- `RESEND_API_KEY` — For email (or use SMTP fallback below)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` — SMTP fallback (e.g. Gmail: smtp.gmail.com:587)
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLIC_KEY` — Payment processing
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` / `TELEGRAM_WEBHOOK_SECRET` — Telegram bot
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — GCS image bucket

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- DB schema changes require `pnpm --filter @workspace/db run push` (dev) — production schema is synced on Publish
- Storefront vite.config.ts requires both `PORT` and `BASE_PATH` env vars

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
