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
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `apps/web/.env.development.local` | Clerk **development** key (`pk_test_`) for `next dev` |
| `CLERK_SECRET_KEY` | `apps/web/.env.development.local` | Clerk **development** secret (`sk_test_`) for `next dev` |
| `INTERNAL_JOB_SECRET` | Convex dashboard **and** `apps/web/.env.local` | Shared secret for webhooks + seed reset (generate with `openssl rand -hex 32`) |
| `CHANNEL_TOKEN_ENCRYPTION_KEY` | **Convex dashboard only** | AES-256 key for channel OAuth tokens (`openssl rand -base64 32`). Validated on every encrypt/decrypt action — missing or wrong-size keys throw immediately. |

**Key rotation (not automated):** The `v1:` ciphertext prefix is a format version, not a key ID. To rotate the key, set a new `CHANNEL_TOKEN_ENCRYPTION_KEY` and re-save each channel token via `upsertChannelToken` so tokens are re-encrypted. Until re-saved, legacy plaintext rows (no `v1:` prefix) still decrypt as-is. See [ADR-007](docs/adr/007-channel-token-encryption.md).
| `WEBHOOK_SECRET` | `apps/web/.env.local` | HMAC signature for `POST /api/webhooks` |
| `DEFAULT_PROPERTY_ID` | `apps/web/.env.local` | Property ID after seed |
| `CLERK_JWT_ISSUER_DOMAIN` | **Convex dashboard only** | Clerk JWT issuer for Convex auth — **must match the Clerk instance** (see below) |

## Clerk environments (dev vs prod)

Ivano PMS uses one Clerk application with two instances:

| | Development | Production |
|---|-------------|------------|
| Keys | `pk_test_` / `sk_test_` | `pk_live_` / `sk_live_` |
| Frontend API | `striking-rodent-37.clerk.accounts.dev` | `clerk.techivano.com` |
| App URL | `http://localhost:3000` | `https://pms.techivano.com` |
| Convex `CLERK_JWT_ISSUER_DOMAIN` | `https://striking-rodent-37.clerk.accounts.dev` | `https://clerk.techivano.com` |
| User pool | Dev-instance users only | Real managers / demo account |

**Local `next dev` must use development keys.** Production keys do not work on `localhost` (Clerk returns 400). Do not use `pk_live_` in `.env.local` for day-to-day local work.

### Setup (draft — keys pending)

1. Clerk Dashboard → PMS app → **Development** → API Keys → copy `pk_test_` / `sk_test_`.
2. Copy `apps/web/.env.development.local.example` → `apps/web/.env.development.local` and paste keys.
3. Follow `apps/web/CLERK-DEV-MIGRATION-DRAFT.md` to stop overriding dev with prod Clerk values in `.env.local`.
4. Convex **dev** deployment: set `CLERK_JWT_ISSUER_DOMAIN` to the dev issuer above (prod deployment keeps `https://clerk.techivano.com`).
5. Create a test user in the **development** instance (separate from prod `ivanonigeria@gmail.com`).

### Tooling

| Script | Clerk instance | Default URL |
|--------|----------------|-------------|
| `next dev` | Development (`pk_test_` in `.env.development.local`) | `http://localhost:3000` |
| `node scripts/record-auth-state.mjs` | Auto from key prefix | localhost if `pk_test_`, else `https://pms.techivano.com` |
| `node docs/planning/ux-audit/screenshot-script.mjs` | Uses `auth.json` (record against same `BASE_URL` you will screenshot) |
| `node scripts/smoke-prod.mjs` | **Production only** | `https://pms.techivano.com` |

`auth.json` is gitignored. Re-record after switching Clerk instance or base URL.

## Clerk + Convex auth

1. In Clerk Dashboard, enable the **Convex** JWT template on **each** instance you use (dev and prod issuers differ).
2. In Convex Dashboard → **Settings → Environment Variables**, set `CLERK_JWT_ISSUER_DOMAIN` to that instance’s issuer (no trailing slash).
3. The web app uses `ConvexProviderWithClerk`; dashboard queries require a signed-in Clerk session mapped to a `manager` row.

## Clerk test user (local dev)

1. Clerk Dashboard → **Development** → **Users** → create a test manager (email + password). This user does not exist in production until you create it there separately.
2. Set `DEV_SMOKE_EMAIL` in `.env.development.local` once the user exists.
3. Start dev servers (below), then sign in at http://localhost:3000/sign-in.
4. Open http://localhost:3000/dashboard — `DashboardManagerSync` calls `upsertManagerFromClerk` and links the user to the first seeded `property`.
5. In Convex dashboard, confirm a `manager` row exists with `clerkUserId` matching the signed-in Clerk user ID.
6. For Vercel preview: use development keys and add the preview URL to Clerk **Allowed origins**.

For Playwright webhook E2E: set `WEBHOOK_SECRET` in `apps/web/.env.local` (defaults to `test-webhook-secret-12345` in tests if unset). Optional `WEBHOOK_TEST_URL` overrides `http://localhost:3000`.

For Playwright dashboard stretch (optional): store `CLERK_TEST_USER_EMAIL` / `CLERK_TEST_USER_PASSWORD` in `apps/web/.env.local` only — never commit.

## Planning & smoke tests

After Week 4–5 delivery, see [docs/planning/README.md](docs/planning/README.md) for smoke test and Week 6 kickoff.

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

`seedReset` / `seedDemoDataV2` automatically backfill NLP fields on channel messages after insert (Task 2.4). To re-run extraction on existing messages without resetting seed data:

```bash
npx convex run functions/nlp:backfillMessageNlp '{"secret":"YOUR_INTERNAL_JOB_SECRET"}'
```

Optional `propertyId` scopes the backfill to one property.

## Verify

| Check | Command / URL |
|-------|----------------|
| Convex dashboard | Output from `npx convex dev` |
| Next.js landing | http://localhost:3000 |
| Dashboard (Clerk required) | http://localhost:3000/dashboard |
| Webhook intake | See [`docs/webhooks.md`](docs/webhooks.md) |
| Webhook E2E smoke | `node scripts/verify-webhook-convex.mjs` |
| Playwright webhooks | `pnpm test:e2e` (see [`docs/week2-verification.md`](docs/week2-verification.md)) |
| Convex lint | `pnpm lint:convex` |
| Web build | `pnpm build:web` |

## Architecture

- **Next.js** (`apps/web`) — Manager UI, user APIs, and **webhook intake** at `/api/webhooks` (Vercel)
- **Convex** (`convex/`) — Database, queries, mutations, real-time subscriptions

See [`docs/adr/`](docs/adr/) and [`docs/webhooks.md`](docs/webhooks.md).
