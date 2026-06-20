# Webhook intake (`POST /api/webhooks`)

Next.js receives channel webhook events, verifies HMAC signatures, and queues them in Convex via fire-and-forget mutations.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `WEBHOOK_SECRET` | Yes | HMAC-SHA256 secret for `x-webhook-signature` |
| `INTERNAL_JOB_SECRET` | Yes | Must match Convex dashboard (mutation auth) |
| `DEFAULT_PROPERTY_ID` | Yes | Seeded property ID (after `pnpm seed`) |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |

## Payload schema

```json
{
  "type": "channel.message",
  "channel": "whatsapp",
  "senderName": "Tunde Adeyemi",
  "messageText": "Need a suite for 2 nights",
  "senderPhone": "+2348099999999"
}
```

| Field | Type | Required |
|-------|------|----------|
| `type` | `"channel.message"` | Yes |
| `channel` | `whatsapp` \| `telegram` \| `instagram` | Yes |
| `senderName` | string | Yes |
| `messageText` | string | Yes |
| `senderPhone` | string | WhatsApp |
| `telegramUserId` | string | Telegram |
| `instagramUserId` | string | Instagram |
| `propertyId` | string | No (defaults to `DEFAULT_PROPERTY_ID`) |

## Signature

Header: `x-webhook-signature`  
Value: `HMAC-SHA256(raw_body, WEBHOOK_SECRET)` as lowercase hex.

```bash
BODY='{"type":"channel.message","channel":"whatsapp","senderName":"Test","messageText":"Hi","senderPhone":"+234800"}'
SIG=$(node -e "const c=require('crypto');console.log(c.createHmac('sha256',process.env.WEBHOOK_SECRET).update(process.argv[1]).digest('hex'))" "$BODY")
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$BODY"
```

## Adding event types

1. Extend `WebhookEventType` in [`types.ts`](../apps/web/src/app/api/webhooks/types.ts)
2. Add handler branch in [`convex/functions/webhooks.ts`](../convex/functions/webhooks.ts) `processWebhookEvent`
3. Document payload in this file

## Rate limiting

100 requests per minute per `WEBHOOK_SECRET` (in-memory per server instance). Returns **429** with `Retry-After` when exceeded.

## Phase 2 migration

If volume exceeds ~1,000 bookings/month, extract this handler to Express on Railway. Convex mutation calls stay identical.
