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
| `CHANNEL_TOKEN_ENCRYPTION_KEY` | **Convex dashboard only** | AES-256 key for channel OAuth tokens (`openssl rand -base64 32`). Validated on every encrypt/decrypt action — missing or wrong-size keys throw immediately. |

**Key rotation (not automated):** The `v1:` ciphertext prefix is a format version, not a key ID. To rotate the key, set a new `CHANNEL_TOKEN_ENCRYPTION_KEY` and re-save each channel token via `upsertChannelToken` so tokens are re-encrypted. Until re-saved, legacy plaintext rows (no `v1:` prefix) still decrypt as-is. See [ADR-007](docs/adr/007-channel-token-encryption.md).
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
