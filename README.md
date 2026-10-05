# Ivano PMS

Hospitality property management for a single property (MVP). Manage bookings, guests, units, and channel messages (WhatsApp, Telegram, Instagram).

**Stack:** Next.js + Clerk + Convex (webhooks at `/api/webhooks`)

**Production:** [https://pms.techivano.com](https://pms.techivano.com) — soft-launched (see [docs/LAUNCH.md](docs/LAUNCH.md))

## Quick start

See **[DEVELOPMENT.md](DEVELOPMENT.md)** — **2 terminals** (Convex + Next.js).

```bash
pnpm install
npx convex dev          # Terminal 1
pnpm web:dev            # Terminal 2
pnpm seed
```

## Monorepo layout

| Path | Purpose |
|------|---------|
| [`apps/web`](apps/web) | Next.js dashboard + `/api/webhooks` |
| [`convex`](convex) | Convex schema, queries, mutations |

## Webhooks

See **[docs/webhooks.md](docs/webhooks.md)** for payload schema, signature, and testing.

## Deployment

- **Web + webhooks:** Vercel
