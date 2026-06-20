# Ivano PMS architecture

## Stack

- **Frontend:** Next.js 16 (App Router) + Clerk + Tailwind
- **Backend:** Convex (queries, mutations, real-time)
- **Integrations:** Next.js `POST /api/webhooks` (Vercel, same deploy as UI)

## Data flow

```
Channel providers → POST /api/webhooks (Next.js)
                 → HMAC verify (crypto)
                 → processWebhookEvent (Convex, fire-and-forget)
                 → bookingChannelMessage queue

Manager UI → Next.js /api/* (Week 2+) → Convex
```

See [`docs/adr/`](adr/) for decision records.
