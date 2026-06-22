# Week 6 kickoff — OAuth & secure channel integration

**Sprint goal:** Connect WhatsApp Business API with encrypted token storage and outbound messaging.

**Prerequisite:** Week 4–5 smoke verified, `CHANNEL_TOKEN_ENCRYPTION_KEY` set in Convex.

---

## Task 6.3 — Token encryption ✅

**Status:** Implemented

| File | Purpose |
|------|---------|
| `convex/lib/channelTokenCrypto.ts` | AES-256-GCM encrypt/decrypt (`v1:` prefix) |
| `convex/functions/channelTokenActions.ts` | `upsertChannelToken`, `getDecryptedChannelToken` |
| `convex/functions/channelTokens.ts` | Storage + public metadata query |

**Env:** `CHANNEL_TOKEN_ENCRYPTION_KEY` (base64, 32 bytes) — Convex dashboard only.

**Tests:** `tests/convex/channel-token-crypto.test.ts`, updated `channel-tokens.test.ts`

**ADR:** [ADR-007](../adr/007-channel-token-encryption.md)

---

## Task 6.1 — WhatsApp OAuth initiation (1d)

**Goal:** Start Meta OAuth from Settings.

**Files:**
- `apps/web/src/app/api/oauth/whatsapp/start/route.ts` — redirect to Meta OAuth URL
- `apps/web/src/lib/whatsapp-oauth.ts` — build auth URL, state param (propertyId + CSRF)

**Env (apps/web):**
- `WHATSAPP_APP_ID`
- `WHATSAPP_APP_SECRET` (server only)
- `WHATSAPP_OAUTH_REDIRECT_URI` (e.g. `{APP_URL}/api/oauth/whatsapp/callback`)

**UI:** Enable Connect button on WhatsApp card → links to start route.

---

## Task 6.2 — OAuth callback (1d)

**Goal:** Exchange code for token, store encrypted.

**Files:**
- `apps/web/src/app/api/oauth/whatsapp/callback/route.ts`
- Exchange code via Meta Graph API
- Call Convex HTTP action or `ConvexHttpClient` → `upsertChannelToken` internal action

**Returns:** Redirect to `/dashboard/settings?connected=whatsapp`

**Tests:** Mock Graph API in unit test; manual test with Meta sandbox app.

---

## Task 6.4 — Settings Connect UI (0.5d)

**Files:**
- `apps/web/src/components/settings/channel-token-card.tsx` — enable WhatsApp Connect; keep Telegram/Instagram as Coming soon until providers configured

**States:** disconnected → connecting → connected (show phoneNumberId, expiry)

---

## Task 6.5 — Outbound WhatsApp send (1d)

**Goal:** Send template/message using stored token.

**Files:**
- `convex/functions/channelTokenActions.ts` — extend or add `sendWhatsAppMessage` internal action
- Uses `getDecryptedChannelToken` → Graph API `POST /{phone-number-id}/messages`
- Log outbound in `bookingChannelMessage` or new `outboundMessage` table (optional)

**Tests:** Mock fetch in action test; do not hit Meta in CI.

---

## Schema changes

None required for 6.1–6.5 (uses existing `channelToken` table).

---

## Security checklist

- [x] Tokens encrypted at rest (6.3)
- [ ] OAuth state CSRF validation (6.1)
- [ ] App secret never sent to client
- [ ] Decrypted tokens only in internal actions
- [ ] Rotate encryption key procedure documented before production

---

## Success criteria

- Manager connects WhatsApp from Settings
- Token stored encrypted in Convex
- Settings shows Connected + phone number ID
- Test outbound message delivers in Meta sandbox
