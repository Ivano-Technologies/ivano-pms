# Migrate `apps/web/.env.local` for Clerk dev keys

**Status:** Applied — `next dev` now runs on the Clerk **development** instance via `apps/web/.env.development.local`.

## Goal

Local `next dev` must use Clerk **development** keys. Production keys (`pk_live_` / `sk_live_`) stay on Vercel and in prod-only tooling (`scripts/smoke-prod.mjs`).

## Pattern: two files

| File | Purpose |
|------|---------|
| `apps/web/.env.local` | Shared secrets (Convex URL, `INTERNAL_JOB_SECRET`, webhooks, etc.) |
| `apps/web/.env.development.local` | Clerk **dev** keys + localhost URLs (overrides `.env.local` during `next dev`) |

Copy [`.env.development.local.example`](./.env.development.local.example) → `.env.development.local` and fill in keys.

## How overriding works (no deletion needed)

`next dev` resolves env vars with `.env.development.local` taking precedence over `.env.local`
(Next.js load order). So the prod-oriented values below **stay** in `.env.local` for prod builds
and prod tooling, but are transparently overridden during local dev:

| `.env.local` (prod) | overridden by `.env.development.local` (dev) |
|---------------------|----------------------------------------------|
| `pk_live_…` / `sk_live_…` | `pk_test_…` / `sk_test_…` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://pms.techivano.com/sign-in` | `http://localhost:3000/sign-in` |
| `NEXT_PUBLIC_APP_URL=https://pms.techivano.com` | `http://localhost:3000` |
| `CLERK_JWT_ISSUER_DOMAIN=https://clerk.techivano.com` | `https://striking-rodent-37.clerk.accounts.dev` |
| `NEXT_PUBLIC_CONVEX_URL=…flippant-eel-758…` (prod) | `…amicable-aardvark-543…` (dev) |

> **Do not delete the `pk_live_`/`sk_live_` keys from `.env.local`.** `scripts/smoke-prod.mjs`
> and `scripts/smoke-debug.mjs` load `.env.local` directly and need the production `CLERK_SECRET_KEY`
> to hit `pms.techivano.com`.

**Only deletion applied:** remove a hardcoded `NODE_ENV=production` from `.env.local` — Next.js and
the Convex CLI set `NODE_ENV` automatically, and hardcoding it misleads dev tooling.

## Keep in `.env.local` (unchanged)

- `NEXT_PUBLIC_CONVEX_URL` — point at the Convex deployment you use for local work (dev or prod)
- `INTERNAL_JOB_SECRET` — must match that Convex deployment
- `WEBHOOK_SECRET`, `DEFAULT_PROPERTY_ID`, etc.

## After keys are in `.env.development.local`

1. Restart `pnpm --filter @ivano/web dev`
2. Open http://localhost:3000/sign-in — Clerk widget should load (no 400)
3. Create/sign in as dev test user (step 2 — pending)
4. Record auth: `node scripts/record-auth-state.mjs` (defaults to localhost when `pk_test_` detected)

## Convex wiring (required for the dashboard to load, not just sign-in)

Sign-in is pure Clerk, but the dashboard's authed Convex queries (`getMyProperties`) need the
**Convex dev deployment** (`amicable-aardvark-543`) to trust dev Clerk tokens. Completed:

1. **Dev Clerk JWT template** — the dev instance had no templates; created a `convex` template
   (`aud: "convex"`, matching `applicationID: "convex"` in `convex/auth.config.ts`).
2. **Dev Convex env** — `npx convex env set CLERK_JWT_ISSUER_DOMAIN https://striking-rodent-37.clerk.accounts.dev`
   and `CLERK_SECRET_KEY sk_test_…` on the dev deployment.
3. **Re-push** — `npx convex dev --once` so `auth.config.ts` re-evaluates with the new issuer
   (env change alone does not refresh the deployed auth config).
4. **App points at dev Convex** — `NEXT_PUBLIC_CONVEX_URL=https://amicable-aardvark-543.convex.cloud`
   in `.env.development.local`.

Prod Convex (`flippant-eel-758`) keeps `https://clerk.techivano.com`. See
[DEVELOPMENT.md](../../DEVELOPMENT.md#clerk-environments-dev-vs-prod).
