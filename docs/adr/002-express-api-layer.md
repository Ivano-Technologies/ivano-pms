# ADR-002: Next.js API Routes for Webhooks (Revised)

## Status
ACCEPTED (revised) | June 2026

## Decision
Handle webhook intake in **Next.js** at `POST /api/webhooks` (Vercel). No separate Express/Railway service for MVP.

## Rationale
- Same stack as the manager app (one deploy, two terminals locally)
- Saves ~₦2,000–3,000/month (no Railway)
- HMAC verification via Node `crypto`, fire-and-forget Convex mutations
- Straightforward extraction to Express in Phase 2 if volume exceeds ~1,000 bookings/month

## Architecture

```
Channel providers → POST /api/webhooks (Next.js)
                 → verify x-webhook-signature (HMAC-SHA256)
                 → processWebhookEvent (Convex, async)
                 → bookingChannelMessage queue
```

## Migration path (Phase 2+)
Move `apps/web/src/app/api/webhooks/*` to Express unchanged Convex calls; no schema or UI changes.

## Related
- [`docs/webhooks.md`](../webhooks.md)
- ADR-003: Channel message queue
