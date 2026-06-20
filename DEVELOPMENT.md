# Local Development Setup

## Prerequisites

- Node.js 18+
- pnpm
- [Convex](https://convex.dev) account (free tier)
- [Clerk](https://clerk.com) account (free tier)

## Install

```bash
git clone https://github.com/Ivano-Technologies/techivano-pms
cd techivano-pms
pnpm install
```

## Environment

Copy [`.env.example`](.env.example) to `apps/web/.env.local`.

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | `apps/web/.env.local` | Convex client (from `npx convex dev`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `apps/web/.env.local` | Clerk auth |
| `CLERK_SECRET_KEY` | `apps/web/.env.local` | Clerk server |
| `INTERNAL_JOB_SECRET` | Convex dashboard **and** `apps/web/.env.local` | Shared secret for webhooks + seed reset (generate with `openssl rand -hex 32`) |
| `WEBHOOK_SECRET` | `apps/web/.env.local` | HMAC signature for `POST /api/webhooks` |
| `DEFAULT_PROPERTY_ID` | `apps/web/.env.local` | Property ID after seed |
| `CLERK_JWT_ISSUER_DOMAIN` | **Convex dashboard only** | Clerk JWT issuer for Convex auth (see Clerk → JWT templates → Convex) |

## Clerk + Convex auth

1. In Clerk Dashboard, enable the **Convex** JWT template (issuer domain looks like `https://your-app.clerk.accounts.dev`).
2. In Convex Dashboard → **Settings → Environment Variables**, set `CLERK_JWT_ISSUER_DOMAIN` to that issuer (no trailing slash).
3. The web app uses `ConvexProviderWithClerk`; dashboard queries require a signed-in Clerk session mapped to a `manager` row.

## Clerk test user (local dev)

1. Clerk Dashboard → **Users** → create a test manager (email + password).
2. Start dev servers (below), then sign in at http://localhost:3000/sign-in.
3. Open http://localhost:3000/dashboard — `DashboardManagerSync` calls `upsertManagerFromClerk` and links the user to the first seeded `property`.
4. In Convex dashboard, confirm a `manager` row exists with `clerkUserId` matching the signed-in Clerk user ID.
5. For Vercel preview: add Clerk keys to the preview env and add the preview URL to Clerk **Allowed origins**.

For Playwright (optional, Week 2 stretch): store `CLERK_TEST_USER_EMAIL` / `CLERK_TEST_USER_PASSWORD` in `apps/web/.env.local` only — never commit.

## Start development (2 terminals)

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Next.js app (:3000, includes webhooks)
pnpm web:dev
```

## Seed demo data

Initial seed (empty deployment):

```bash
pnpm seed
```

Copy the returned `propertyId` into `DEFAULT_PROPERTY_ID` in `apps/web/.env.local`.

Reset and re-seed (Week 2 v2 fixtures — requires `INTERNAL_JOB_SECRET` in Convex env):

```bash
npx convex run seed:seedReset '{"secret":"YOUR_INTERNAL_JOB_SECRET"}'
```

Update `DEFAULT_PROPERTY_ID` if the returned `propertyId` changed.

## Verify

| Check | Command / URL |
|-------|----------------|
| Convex dashboard | Output from `npx convex dev` |
| Next.js landing | http://localhost:3000 |
| Dashboard (Clerk required) | http://localhost:3000/dashboard |
| Webhook intake | See [`docs/webhooks.md`](docs/webhooks.md) |
| Convex lint | `pnpm lint:convex` |
| Web build | `pnpm build:web` |

## Architecture

- **Next.js** (`apps/web`) — Manager UI, user APIs, and **webhook intake** at `/api/webhooks` (Vercel)
- **Convex** (`convex/`) — Database, queries, mutations, real-time subscriptions

See [`docs/adr/`](docs/adr/) and [`docs/webhooks.md`](docs/webhooks.md).
