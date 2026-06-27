# Draft: migrate `apps/web/.env.local` for Clerk dev keys

**Status:** Draft only — apply after you paste `pk_test_` / `sk_test_` from Clerk Dashboard (Development).

## Goal

Local `next dev` must use Clerk **development** keys. Production keys (`pk_live_` / `sk_live_`) stay on Vercel and in prod-only tooling (`scripts/smoke-prod.mjs`).

## Pattern: two files

| File | Purpose |
|------|---------|
| `apps/web/.env.local` | Shared secrets (Convex URL, `INTERNAL_JOB_SECRET`, webhooks, etc.) |
| `apps/web/.env.development.local` | Clerk **dev** keys + localhost URLs (overrides `.env.local` during `next dev`) |

Copy [`.env.development.local.example`](./.env.development.local.example) → `.env.development.local` and fill in keys.

## Remove or stop using in `.env.local` for local dev

These production-oriented values should **not** drive `next dev` once migration is complete:

```diff
- CLERK_PUBLISHABLE_KEY=pk_live_...
- CLERK_SECRET_KEY=sk_live_...
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
- NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://pms.techivano.com/sign-in
- NEXT_PUBLIC_APP_URL=https://pms.techivano.com
- NODE_ENV=production
```

`NODE_ENV` is set automatically by Next.js; remove a manual `NODE_ENV=production` from `.env.local` if present.

## Keep in `.env.local` (unchanged)

- `NEXT_PUBLIC_CONVEX_URL` — point at the Convex deployment you use for local work (dev or prod)
- `INTERNAL_JOB_SECRET` — must match that Convex deployment
- `WEBHOOK_SECRET`, `DEFAULT_PROPERTY_ID`, etc.

## After keys are in `.env.development.local`

1. Restart `pnpm --filter @ivano/web dev`
2. Open http://localhost:3000/sign-in — Clerk widget should load (no 400)
3. Create/sign in as dev test user (step 2 — pending)
4. Record auth: `node scripts/record-auth-state.mjs` (defaults to localhost when `pk_test_` detected)

## Convex note

If local app uses Clerk **dev** JWTs, the **Convex dev deployment** `CLERK_JWT_ISSUER_DOMAIN` must be `https://striking-rodent-37.clerk.accounts.dev`, not `https://clerk.techivano.com`. Prod Convex keeps `https://clerk.techivano.com`. See [DEVELOPMENT.md](../../DEVELOPMENT.md#clerk-environments-dev-vs-prod).
