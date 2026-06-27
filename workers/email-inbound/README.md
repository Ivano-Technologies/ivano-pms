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
