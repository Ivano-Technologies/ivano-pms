# Deployment & Production Checklist

## Vercel Deployment

**Current Status (Week 5 Complete)**

- Vercel project: [techivano/ivano-pms](https://vercel.com/techivano/ivano-pms)
- Production URL: `https://pms.techivano.com` (custom domain live)
- Latest deployment: `da01c15` (Week 4–5 complete, channel token encryption)

### Environment Variables (Vercel)

Verify these match your Convex deployment (`flippant-eel-758`):

- [ ] `NEXT_PUBLIC_CONVEX_URL` = `https://flippant-eel-758.convex.cloud`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_Y2xlcmsudGVjaGl2YW5vLmNvbSQ`
- [ ] `CLERK_SECRET_KEY` = `sk_live_...`
- [ ] `INTERNAL_JOB_SECRET` = shared secret (must match Convex dashboard env var)
- [ ] `CHANNEL_TOKEN_ENCRYPTION_KEY` = base64-encoded 32-byte key (`openssl rand -base64 32`)
- [ ] `WEBHOOK_SECRET` = shared secret (must match channel config)
- [ ] `DEFAULT_PROPERTY_ID` = seeded property ID (must match Convex demo data)

Convex dashboard (not Vercel): `CLERK_JWT_ISSUER_DOMAIN` must match your Clerk JWT template issuer (`https://clerk.techivano.com`).

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
