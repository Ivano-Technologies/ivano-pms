# Ivano PMS — quick reference

## Commands

```bash
# Dev
npx convex dev          # Terminal 1 — backend
pnpm web:dev            # Terminal 2 — Next.js :3000

# Quality
pnpm test               # 126+ vitest (convex + web)
pnpm build              # Production build
pnpm test:e2e           # Playwright (webhooks)

# Seed
pnpm seed
npx convex run seed:seedReset '{"secret":"YOUR_INTERNAL_JOB_SECRET"}'

# Deploy schema once
npx convex dev --once
```

## Key env vars

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | apps/web | Convex client |
| `INTERNAL_JOB_SECRET` | Convex + apps/web | Webhooks, seed, internal jobs |
| `CHANNEL_TOKEN_ENCRYPTION_KEY` | Convex only | AES-256 for channel tokens |
| `WEBHOOK_SECRET` | apps/web | HMAC for POST /api/webhooks |
| `DEFAULT_PROPERTY_ID` | apps/web | Webhook property scope |
| Clerk keys | apps/web | Auth |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex only | JWT validation |

Generate secrets:
```bash
openssl rand -hex 32      # INTERNAL_JOB_SECRET
openssl rand -base64 32   # CHANNEL_TOKEN_ENCRYPTION_KEY
```

## Convex patterns

```typescript
// Authed query with optional multi-property scope
useQuery(api.functions.guests.getGuests, {
  ...propertyArgs  // { selectedPropertyId } from usePropertyScope()
});

// Internal channel token upsert (encrypted)
await ctx.runAction(internal.functions.channelTokenActions.upsertChannelToken, {
  secret: process.env.INTERNAL_JOB_SECRET!,
  propertyId, channel: "whatsapp", accessToken: "..."
});
```

## UI conventions

- Toasts: `sonner` — `toast.success` / `toast.error`
- Inputs: `inputClassName` from `@/lib/guest-utils` or `@/lib/unit-utils`
- Modals: lazy-loaded via `next/dynamic` + `{ ssr: false }`
- Currency: `formatNgn()` from `@/lib/format` or `@/lib/unit-utils`

## Routes

| Path | Feature |
|------|---------|
| `/dashboard` | Overview stats |
| `/dashboard/bookings` | Calendar + overlap |
| `/dashboard/guests` | Guest CRUD + notes |
| `/dashboard/units` | Unit grid |
| `/dashboard/channels` | Inbox |
| `/dashboard/reports` | Revenue + occupancy |
| `/dashboard/settings` | Channel connections |

## Troubleshooting

| Symptome | Fix |
|----------|-----|
| Not authenticated on dashboard | Sign in via Clerk; check `manager` row exists |
| `.unique()` error on manager | Use property switcher; ensure `getCurrentManager` uses `.take()` |
| Overlap not blocking | Confirm booking status is in block set; check unit index |
| Channel token test fails | Set `INTERNAL_JOB_SECRET` + `CHANNEL_TOKEN_ENCRYPTION_KEY` in test env |
| Convex types stale | `npx convex dev --once` |

## ADRs

- [002 Webhooks in Next.js](../adr/002-express-api-layer.md)
- [005 Soft deletes](../adr/005-soft-deletes-audit-logs.md)
- [006 Booking overlap](../adr/006-booking-overlap-detection.md)
- [007 Channel token encryption](../adr/007-channel-token-encryption.md)
