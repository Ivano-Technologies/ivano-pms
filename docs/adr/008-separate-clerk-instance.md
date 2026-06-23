# ADR-008: Separate Clerk Instance per Product (EAM vs PMS)

**Date:** 2026-06-23
**Status:** Accepted — Implementation deferred (pre-production-user milestone)
**Deciders:** Kezie Okpala

---

## Context

Ivano PMS was initially built and deployed as `eam.techivano.com`, sharing the
Clerk application provisioned for NRCS EAM. When the domain was migrated to
`pms.techivano.com`, both products continued using the same Clerk instance
(`clerk.techivano.com`), causing the following symptoms in production:

- Unauthenticated PMS users were redirected to `eam.techivano.com/sign-in`
  (the Clerk instance's home URL) rather than `pms.techivano.com/sign-in`
- Convex JWT token requests (`tokens/convex`) returned 404 until the `convex`
  JWT template was created on the shared instance

Root cause: `NEXT_PUBLIC_CLERK_SIGN_IN_URL` was absent from Vercel's production
environment variables, causing Clerk SDK to fall back to the instance's
configured home URL (`eam.techivano.com/sign-in`). The code itself had zero
hardcoded domains; the failure was purely a missing Vercel env var.

**Immediate workaround applied:** `NEXT_PUBLIC_CLERK_SIGN_IN_URL=https://pms.techivano.com/sign-in`
added to Vercel production env vars. This overrides the instance home URL
fallback and unblocks sign-in without requiring a user pool migration, since no
real PMS property managers are onboarded yet.

---

## Decision

Ivano PMS will receive its own dedicated Clerk application, separate from NRCS
EAM, before the first real property manager account is created in production.

---

## Rationale

- **User pool isolation:** EAM staff (NRCS compliance) and PMS property managers
  are distinct customer populations. Sharing a user pool creates an auth surface
  where accounts from one product could attempt to authenticate against the other.
- **Independent configuration:** JWT templates, OAuth connections (Google,
  WhatsApp), session duration, and MFA settings can be tuned per product without
  cross-product risk.
- **Audit clarity:** Security reviews for each product operate against a clean,
  product-scoped identity store.

---

## Consequences

### Positive

- Clean separation: no cross-product auth surface to audit
- PMS can configure its own Google OAuth, WhatsApp OAuth (Week 6), and session
  policies without affecting EAM
- Independent Clerk billing and usage metrics per product

### Negative / Trade-offs

- One-time migration effort (low cost while only test accounts exist)
- Two Clerk applications to maintain (dashboard access, JWT templates, OAuth apps)

---

## Migration steps (when executed)

1. Create new Clerk application → set home domain `pms.techivano.com`
2. Enable Google OAuth → reuse the Google Cloud OAuth client already configured
   for `pms.techivano.com` (or create a new one)
3. Recreate `convex` JWT template (Convex preset, `aud: "convex"`)
4. Update Vercel PMS env vars:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → new app's publishable key
   - `CLERK_SECRET_KEY` → new app's secret key
5. Update Convex dashboard env var:
   - `CLERK_JWT_ISSUER_DOMAIN` → new instance issuer URL
6. Update `apps/web/.env.local` with new keys for local dev
7. Redeploy, run full smoke test
8. Remove old EAM Clerk keys from PMS Vercel project
9. Re-invite any existing PMS users (currently: test accounts only, no
   migration cost)

---

## Hard gate

**This migration must be completed before any real property manager account is
created in production.** After that point, user migration adds cost and risk.
This ADR converts "we'll get to it eventually" into a concrete pre-onboarding
requirement.

---

## Related

- [ADR-007](007-channel-token-encryption.md) — channel token encryption
- Week 6 OAuth work (Tasks 6.1–6.2) will add WhatsApp/Telegram OAuth connections;
  these should be configured on the new dedicated Clerk app, not the shared EAM
  instance
