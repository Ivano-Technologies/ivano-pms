# Deploy Runbook — Ivano PMS

Production URL: `https://pms.techivano.com`  
Convex production: `flippant-eel-758` (`https://flippant-eel-758.convex.cloud`)

See also [`DEPLOYMENT.md`](../../DEPLOYMENT.md) for environment variable checklists and post-deploy validation.

---

## Standard release flow

### 1. Merge and deploy frontend (Vercel)

Push to `main`. Vercel builds and promotes `pms.techivano.com` automatically.

Verify env vars in Vercel (especially `NEXT_PUBLIC_CONVEX_URL`, Clerk keys, `INTERNAL_JOB_SECRET`).

### 2. Deploy Convex backend (required for schema/function changes)

Vercel does **not** deploy Convex. Run this whenever `convex/` changes:

```bash
CONVEX_DEPLOYMENT=prod:flippant-eel-758 npx convex deploy --yes
```

### 3. First-time production data (one-time per empty deployment)

**Dev and prod Convex deployments are separate databases.** Seed data in dev does not carry over.

Before the first manager signs in on a fresh prod deployment, ensure at least one property exists:

```bash
# Demo / smoke-test data (throws if property already exists)
npx convex run seed:seedDemoData --prod
```

For real launch, replace this with onboarding that creates the first property — but **something** must exist before `upsertManagerFromClerk` can link a Clerk user to a property.

Verify:

```bash
npx convex data property --prod --limit 5
```

### 4. Post-deploy smoke (Chrome)

From `apps/web` (requires `CLERK_SECRET_KEY` in `apps/web/.env.local`):

```bash
node ../../scripts/smoke-prod.mjs
```

Covers: dashboard stability, channel token WS boundary, overlap rejection, property switcher.

---

## Environment variables

| Variable | Convex prod | Vercel | Notes |
|---|---|---|---|
| `CLERK_JWT_ISSUER_DOMAIN` | ✅ | — | Must be `https://clerk.techivano.com` |
| `CHANNEL_TOKEN_ENCRYPTION_KEY` | ✅ | — | Convex only; generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `INTERNAL_JOB_SECRET` | ✅ | ✅ | Must match in both places |
| `CLERK_SECRET_KEY` | ✅ (optional mirror) | ✅ | Required on Vercel for Next.js |
| `NEXT_PUBLIC_CONVEX_URL` | — | ✅ | `https://flippant-eel-758.convex.cloud` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | — | ✅ | Live key (`pk_live_...`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | — | ✅ | `https://pms.techivano.com/sign-in` |

---

## Secret rotation

Rotate secrets in this order — **update every location that reads the secret, then redeploy, then verify**.

### `CLERK_SECRET_KEY`

1. Clerk Dashboard → API Keys → roll secret key.
2. Update **Vercel** env var `CLERK_SECRET_KEY`.
3. Update **Convex** env if mirrored: `npx convex env set CLERK_SECRET_KEY "sk_live_..." --prod`
4. Redeploy Vercel (or wait for next deploy).
5. Verify: sign in at `https://pms.techivano.com` → dashboard loads with property data.

### `INTERNAL_JOB_SECRET`

Read from:

- **Convex:** `convex/lib/secrets.ts` (seed reset, internal mutations, NLP backfill)
- **Vercel:** `apps/web/src/app/api/webhooks/process.ts`, `apps/web/src/app/api/health/route.ts`

Rotation steps:

1. Generate: `openssl rand -hex 32`
2. `npx convex env set INTERNAL_JOB_SECRET "<new>" --prod`
3. Update Vercel `INTERNAL_JOB_SECRET` to the same value.
4. Redeploy Vercel.
5. Verify: `GET https://pms.techivano.com/api/health` → `convexSecretConfigured: true`; webhook path still accepts signed payloads.

### `CHANNEL_TOKEN_ENCRYPTION_KEY`

Convex only. **Rotating invalidates existing encrypted channel tokens** — only rotate on a fresh deployment or when reconnecting all channels.

```bash
npx convex env set CHANNEL_TOKEN_ENCRYPTION_KEY "<new-base64-32-bytes>" --prod
npx convex deploy --yes
```

---

## Common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| Dashboard loads but “Manager profile not found” | Prod DB has no property | `npx convex run seed:seedDemoData --prod` or onboarding |
| All authed Convex queries throw / blank dashboard | Wrong `CLERK_JWT_ISSUER_DOMAIN` on Convex | Set to `https://clerk.techivano.com`, redeploy Convex |
| Redirect to `eam.techivano.com/sign-in` | Missing `NEXT_PUBLIC_CLERK_SIGN_IN_URL` on Vercel | Set to `https://pms.techivano.com/sign-in` |
| `upsertManagerFromClerk` server error in console | Empty prod property table | See prod seed step above |
| Telegram updates return 401 | `TELEGRAM_WEBHOOK_SECRET` mismatch | Same value in Convex (`setWebhook`) and Vercel (route header check) |

---

## Telegram bot webhook (Task 6.1.1)

**Convex env:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET`  
**Vercel env:** `TELEGRAM_WEBHOOK_SECRET` (must match Convex)

1. Set secrets (generate webhook secret with `openssl rand -hex 32`):
   ```bash
   npx convex env set TELEGRAM_WEBHOOK_URL "https://pms.techivano.com/api/webhooks/telegram" --prod
   npx convex env set TELEGRAM_WEBHOOK_SECRET "<secret>" --prod
   ```
   Add the same `TELEGRAM_WEBHOOK_SECRET` to Vercel.

2. Register webhook with Telegram (once per URL):
   ```bash
   npx convex run internal.functions.telegramWebhookActions:registerTelegramWebhook \
     '{"secret":"YOUR_INTERNAL_JOB_SECRET"}' --prod
   ```

3. Property managers share deep link: `https://t.me/<bot>?start=<property_token>`  
   Guest sends `/start <property_token>` → chat binds to property → messages flow to inbox.

4. Smoke: `node scripts/smoke-prod.mjs` (dashboard) + send test message to bot after linking.

---

## Rollback

```bash
# Vercel: promote last-good deployment in dashboard
# Convex: redeploy previous git commit
git checkout <last-good>
CONVEX_DEPLOYMENT=prod:flippant-eel-758 npx convex deploy --yes
```
