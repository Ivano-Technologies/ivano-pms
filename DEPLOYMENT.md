# Deployment & Production Checklist

## Vercel Deployment

**Current Status (Week 2 Complete)**

- Vercel project: [techivano/ivano-pms](https://vercel.com/techivano/ivano-pms)
- Production alias: `https://ivano-pms-git-main-techivano.vercel.app`
- Latest deployment: `ed3d3c0` (Week 2.5 complete)
- Custom domain: **PENDING** — configure in Vercel Project Settings

### Environment Variables (Vercel)

Verify these match your Convex deployment (`amicable-aardvark-543`):

- [ ] `NEXT_PUBLIC_CONVEX_URL` = `https://amicable-aardvark-543.convex.cloud`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_...`
- [ ] `CLERK_SECRET_KEY` = `sk_...`
- [ ] `WEBHOOK_SECRET` = shared secret (must match local/channel config)
- [ ] `INTERNAL_JOB_SECRET` = seed/backfill guard (must match Convex env)
- [ ] `DEFAULT_PROPERTY_ID` = seeded property ID (must match Convex demo data)

Convex dashboard (not Vercel): `CLERK_JWT_ISSUER_DOMAIN` must match your Clerk JWT template issuer.

### Deployment Protection

- **Status:** Enabled (returns 401 on unauthenticated requests to preview/production URLs)
- **For automated testing:** Add a [protection bypass token](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) to CI/CD or smoke scripts
- **For human testing:** Sign in via Clerk → open `/dashboard` directly

### Post-Deploy Validation Checklist

After merging to `main` and Vercel redeploys:

1. **Clerk Authentication**
   - [ ] Visit production URL
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
   - [ ] Click a booking → detail popover with status actions (Week 3+)

4. **Webhook Endpoint**
   - [ ] `POST https://ivano-pms-git-main-techivano.vercel.app/api/webhooks`
   - [ ] Valid HMAC in `x-webhook-signature` header
   - [ ] Returns `200 OK`
   - [ ] Message inserted into Convex (verify in dashboard)
   - [ ] NLP fields populated (`extractedCheckIn`, `extractedGuestNames`, etc.)

See also [`docs/week2-verification.md`](docs/week2-verification.md) and [`docs/webhooks.md`](docs/webhooks.md).

### Known Issues & Deferrals

- Multi-property support deferred to Week 4
- Guest/Unit management UI deferred to Week 3
- Real WhatsApp/Telegram/Instagram tokens not integrated yet
- Drag-to-create calendar deferred to Week 4

### Rollback Plan

If production is broken:

```bash
# 1. Identify last-good commit (all Week 2 tests pass)
git log --oneline | grep -E "2\.[1-5]|Week 2"

# 2. Revert Vercel to that commit
# Vercel dashboard → Deployments → [good commit] → Promote to Production

# OR revert on main and redeploy
git revert HEAD
git push origin main
```
