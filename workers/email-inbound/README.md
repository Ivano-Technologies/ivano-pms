## Status: inactive — pending Resend migration (post-launch)

This Cloudflare Worker handles email inbound parsing and forwarding
to the Next.js webhook route. It is NOT currently deployed or active
in production.

Reason: Cloudflare Email Routing to a Worker requires the Workers
Paid plan ($5/month), which is not yet budgeted.

Post-launch path:
- Replace this Worker with Resend inbound parsing
- The Next.js handler (`apps/web/src/app/api/webhooks/email/route.ts`)
  and Convex `processInboundEmail` function are unchanged — only this
  ingestion layer needs to swap
- When implementing: set `EMAIL_WEBHOOK_SECRET` and `WEBHOOK_SECRET` in
  Vercel (Production + Preview scopes); update `staging-env-checklist.md`

Do not wire this Worker to production routing rules or set
`EMAIL_WEBHOOK_SECRET` in Vercel until the Resend migration is complete.

---

# Cloudflare Email Inbound Worker

Receives email from Cloudflare Email Routing, parses MIME with `postal-mime`, and POSTs a normalized JSON payload to the Ivano PMS Next.js webhook (`/api/webhooks/email`).

## Routing

All properties share one mailbox domain: `pms.techivano.com`.

Per-property addresses use plus-tagging:

```
booking+<property-slug>@pms.techivano.com
```

The Worker forwards `toAddress` unchanged; Convex resolves the property from the plus-tag.

## Secrets (Cloudflare)

| Variable | Description |
|---|---|
| `PMS_WEBHOOK_URL` | e.g. `https://pms.techivano.com/api/webhooks/email` |
| `EMAIL_WEBHOOK_SECRET` | Shared secret; must match Vercel `EMAIL_WEBHOOK_SECRET` |

## Deploy

```bash
cd workers/email-inbound
pnpm install
pnpm deploy
```

Bind the worker in Cloudflare Email Routing for `pms.techivano.com` catch-all or `booking+*@pms.techivano.com`.
