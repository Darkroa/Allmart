# AllMart

> Full project reference is in **`replit.md`**.
> Deployment and environment setup is in **`local.txt`**.

AI-powered Nigerian e-commerce platform — React + Vite storefront, Express 5 API, PostgreSQL, Stripe, Telegram bot, SMTP email.

## Quick start (Replit)

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev   # port 8080
pnpm --filter @workspace/storefront run dev   # port 18539
```

## Quick start (local / outside Replit)

See `local.txt` for the full guide including Cloudflare Pages, Vercel, and VPS deployment.
