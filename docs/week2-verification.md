# Week 2 verification checklist

End-to-end checks for Phase 1 Week 2 (Convex + Clerk + dashboard + calendar + NLP + webhooks).

## Local setup (2 terminals)

```bash
# Terminal 1 — Convex
npx convex dev

# Terminal 2 — Next.js (webhooks + dashboard)
pnpm web:dev
```

Copy `apps/web/.env.local` from [`.env.example`](../.env.example) and set:

| Variable | Required for |
|----------|----------------|
| `NEXT_PUBLIC_CONVEX_URL` | All Convex clients |
| `WEBHOOK_SECRET` | Webhook HMAC |
| `INTERNAL_JOB_SECRET` | Convex mutations (match Convex dashboard) |
| `DEFAULT_PROPERTY_ID` | Webhook default property (after seed) |
| Clerk keys | Dashboard sign-in |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex dashboard only |

Seed (or reset) demo data:

```bash
npx convex run seed:seedReset '{"secret":"YOUR_INTERNAL_JOB_SECRET"}'
```

Update `DEFAULT_PROPERTY_ID` if the returned `propertyId` changed.

## Automated checks

```bash
# Unit + integration tests
pnpm test

# Webhook HTTP → Convex smoke (servers must be running)
node scripts/verify-webhook-convex.mjs

# Playwright webhook E2E (servers + Convex must be running)
pnpm test:e2e

# Production build
pnpm build:web
```

### Webhook smoke script

[`scripts/verify-webhook-convex.mjs`](../scripts/verify-webhook-convex.mjs):

1. POSTs `channel.message` with NLP-friendly text
2. Expects HTTP **200** `OK`
3. Polls Convex for the new `bookingChannelMessage` within **2s**
4. Asserts `status: "new"` and NLP fields (`extractedCheckIn`, `extractedGuestNames`, etc.)

### Playwright E2E

[`apps/web/e2e/webhooks.spec.ts`](../apps/web/e2e/webhooks.spec.ts) runs `seedReset` once, then tests:

- Valid HMAC → insert + NLP extraction
- Missing / invalid signature → **400**, no insert
- Malformed JSON / invalid payload → **400**, no insert

Set `WEBHOOK_E2E_SKIP_SEED=1` to reuse existing data (requires `DEFAULT_PROPERTY_ID`).

## Manual acceptance

- [ ] Sign in at http://localhost:3000/sign-in → `/dashboard` loads stats
- [ ] Pending messages show NLP badges (e.g. `Jul 20–22 · suite`)
- [ ] `/dashboard/bookings` calendar renders without console errors
- [ ] `node scripts/test-webhook.mjs` returns 200
- [ ] `node scripts/verify-webhook-convex.mjs` exits 0

## Vercel preview deploy checklist

| Variable | Preview env |
|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Production or dev deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk |
| `CLERK_SECRET_KEY` | Clerk |
| `WEBHOOK_SECRET` | Same as channel provider config |
| `INTERNAL_JOB_SECRET` | Match Convex deployment |
| `DEFAULT_PROPERTY_ID` | Seeded property on target Convex deployment |

Clerk: add preview URL to **Allowed origins**.

After deploy: hit `/api/health`, POST test webhook, confirm Convex row in dashboard.

## Week 2 gate (EOD Friday)

- [ ] Tasks 2.1–2.5 complete
- [ ] `pnpm test` green
- [ ] Webhook path verified (HTTP + Convex)
- [ ] `pnpm build:web` green
