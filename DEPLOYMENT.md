# Deployment & Production Checklist

## Convex Backend Deployment

**REQUIRED — must be run whenever Convex schema or functions change. Vercel deploys the frontend; Convex is separate.**

```bash
CONVEX_DEPLOYMENT=prod:flippant-eel-758 npx convex deploy --yes
```

### Convex Production Environment Variables

Set these in the Convex dashboard (`flippant-eel-758`) or via CLI:

```bash
export CONVEX_DEPLOYMENT=prod:flippant-eel-758
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://clerk.techivano.com"
npx convex env set CHANNEL_TOKEN_ENCRYPTION_KEY "<base64-32-bytes>"  # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npx convex env set INTERNAL_JOB_SECRET "<uuid>"
npx convex env set CLERK_SECRET_KEY "sk_live_..."
```

**Critical:** `CLERK_JWT_ISSUER_DOMAIN` must be `https://clerk.techivano.com` — not the Clerk dev instance (`striking-rodent-37.clerk.accounts.dev`). A mismatch silently breaks all authenticated queries without throwing visible JS errors.

**Verified correct prod state (2026-06-24):**

| Variable | Value |
|---|---|
| `CLERK_JWT_ISSUER_DOMAIN` | `https://clerk.techivano.com` |
| `CHANNEL_TOKEN_ENCRYPTION_KEY` | generated 2026-06-24, 44 chars base64, 32 bytes |
| `INTERNAL_JOB_SECRET` | present |
| `CLERK_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://pms.techivano.com/api` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` (live key, not test) |
| `NODE_ENV` | `production` |

### Clerk JWT Template

In Clerk Dashboard → JWT Templates, the `convex` template must use the **Convex preset**:
- `aud` claim: `"convex"` (must match `applicationID: "convex"` in `convex/auth.config.ts`)
- Lifetime: 3600s
- Algorithm: RS256

---

## Vercel Deployment

**Current Status (Week 5 Complete)**

- Vercel project: [techivano/ivano-pms](https://vercel.com/techivano/ivano-pms)
- Production URL: `https://pms.techivano.com` (custom domain live)
- Latest deployment: `43efb76` (property context fix, domain migration complete)

### Environment Variables (Vercel)

Verify these are set in Vercel → Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_CONVEX_URL` = `https://flippant-eel-758.convex.cloud`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_Y2xlcmsudGVjaGl2YW5vLmNvbSQ` (live key)
- [ ] `CLERK_SECRET_KEY` = `sk_live_...`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `https://pms.techivano.com/sign-in`
- [ ] `INTERNAL_JOB_SECRET` = shared secret (must match Convex dashboard env var)
- [ ] `WEBHOOK_SECRET` = shared secret (must match channel config)

> **Note:** `CHANNEL_TOKEN_ENCRYPTION_KEY` lives in Convex dashboard only — tokens are encrypted/decrypted in Convex actions, never in Next.js.

### Deployment Protection

- **Status:** Enabled (returns 401 on unauthenticated requests to preview/production URLs)
- **For automated testing:** Add a [protection bypass token](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) to CI/CD or smoke scripts
- **For human testing:** Sign in via Clerk → open `/dashboard` directly

### Post-Deploy Validation Checklist

After merging to `main` and Vercel redeploys:

1. **Clerk Authentication**
   - [ ] Visit `https://pms.techivano.com`
   - [ ] Sign in with Clerk
   - [ ] Redirected to `/dashboard` after auth

2. **Dashboard Load**
   - [ ] `/dashboard` renders without 500 errors
   - [ ] Stats cards load (Occupancy %, Revenue, Pending Messages, Active Bookings)
   - [ ] Pending messages list populated (if demo data exists)
   - [ ] Browser console: no Convex subscription errors

3. **Booking Calendar**
   - [ ] `/dashboard/bookings` renders 30-day grid
   - [ ] Unit rows visible
   - [ ] Booking blocks render with correct colors
   - [ ] Click a date → quick-create modal opens
   - [ ] Click a booking → detail popover with status actions

4. **Webhook Endpoint**
   - [ ] `POST https://pms.techivano.com/api/webhooks`
   - [ ] Valid HMAC in `x-webhook-signature` header
   - [ ] Returns `200 OK`
   - [ ] Message inserted into Convex (verify in dashboard)
   - [ ] NLP fields populated (`extractedCheckIn`, `extractedGuestNames`, etc.)

5. **Channel Token Security** (network tab)
   - [ ] Navigate to `/dashboard/settings`
   - [ ] Open DevTools → Network → WS/Fetch → filter `convex.cloud`
   - [ ] `getChannelTokens` response contains only: `channel`, `isConnected`, `expiresAt`, `phoneNumberId`, `updatedAt`
   - [ ] `accessToken` and `refreshToken` are absent from all response payloads

See also [`docs/planning/WEEK-4-5-SMOKE-TEST.md`](docs/planning/WEEK-4-5-SMOKE-TEST.md) for the full smoke test checklist.

### Known Issues & Deferrals

- OAuth channel connection (WhatsApp/Telegram/Instagram) deferred to Week 6
- Outbound message sending deferred to Week 6

### Rollback Plan

If production is broken:

```bash
# 1. Identify last-good commit
git log --oneline | head -10

# 2. Revert Vercel to that commit
# Vercel dashboard → Deployments → [good commit] → Promote to Production

# OR revert on main and redeploy
git revert HEAD
git push origin main
```
