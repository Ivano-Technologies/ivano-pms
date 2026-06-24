# Channel Integration Spec — Telegram + Email (v1)

Status: Draft for review
Supersedes: Task 6.1 "WhatsApp OAuth start route" (renamed/rescoped below)
Suggested: lift the rationale in section 0 into ADR-008 ("Channel sequencing: Telegram + Email first")
Related: ADR-007 (channel token encryption)

## 0. Why this sequencing

Per-channel cost reality at the point of this decision:

| Channel | Cost to build | Cost to operate | Notes |
|---|---|---|---|
| Telegram | $0 | $0, no exceptions | No app review, no business verification, no message window |
| Email | $0 | $0 at Ivano's expected volume | Cloudflare Email Routing (inbound) is free indefinitely; Resend's free tier (3,000/mo) covers outbound |
| Instagram DM | $0 | $0 — no paid override exists once the 24h reply window closes | Needs Instagram Business account + linked Facebook Page + Meta App Review (real setup friction, no run-cost) |
| WhatsApp | $0 | **Not $0** | Free only for replies within 24h of a guest messaging first. Proactive sends (booking confirmations, reminders) are billed per template message — and those are core to a PMS, not optional |

Decision: ship Telegram + Email now. Instagram and WhatsApp stay architecturally available (see section 4) but are not built until a client specifically requests them or the cost calculus changes.

## 1. Telegram — connection model

**Use a single shared Ivano platform bot, not one bot per property.** Rationale: per-property bots would require each property manager to go through @BotFather, copy a token, and configure a webhook — real friction for a non-technical audience, and exactly the kind of setup cost the redesign doc's north star (section 1, "2 actions or fewer") is meant to eliminate. A shared bot with deep-linking has none of that.

### Flow
1. Ivano registers one bot via @BotFather (`@IvanoPMSBot` or similar), once, platform-wide. The bot token is a platform secret (env var / Convex env), not a per-tenant credential — it does not go through the ADR-007 encryption path, since there's nothing per-tenant to encrypt here.
2. "Connecting Telegram" for a property means: generate a unique deep link `https://t.me/IvanoPMSBot?start=<property_token>` (and optionally a QR code) — shown in the Channels view from the redesign doc's section 5.6 pattern (status display, no OAuth-style consent screen needed since there's no third-party auth at all).
3. Property manager shares that link with guests (property listing page, booking confirmation footer, social bio).
4. Guest taps the link, opens a chat with the bot, Telegram sends a `/start <property_token>` message to Ivano's webhook on first contact.
5. Ivano resolves `property_token` → `propertyId`, stores the mapping `{ telegramChatId, propertyId, guestName }` in Convex, and routes all subsequent messages from that `chatId` into that property's inbox thread.
6. Outbound replies from the inbox call Telegram's `sendMessage` with the bot token + stored `chatId` — no per-message cost, no window restriction.

### Data model addition
- `telegramConnections`: `propertyId`, `connectionToken` (used in the deep link, rotatable if compromised), `createdAt`.
- `telegramThreads`: `chatId`, `propertyId`, `guestTelegramUserId`, `guestDisplayName`, `lastMessageAt` — feeds the same unified inbox thread model as other channels.

### Webhook
- Single Telegram webhook endpoint for the whole platform (Telegram only supports one webhook URL per bot) — incoming updates get routed to the right property via the stored `chatId` mapping, falling back to the `/start` token resolution on first contact.
- Validate Telegram's `secret_token` header on every webhook call (set via `setWebhook`) to confirm requests genuinely originate from Telegram.

## 2. Email — connection model

Inbound and outbound are different products; keep them that way rather than forcing one provider to do both.

### Inbound (free, Cloudflare Email Routing)
- Already have Cloudflare DNS on `techivano.com` (per NRCS EAM setup) — this reuses existing infrastructure rather than adding a new vendor.
- Per-property inbound address: `<property-slug>@inbox.techivano.com` (or plus-addressing on one mailbox: `inbox+<property-slug>@techivano.com` — slightly simpler DNS setup, functionally equivalent).
- Cloudflare Email Routing forwards matching addresses to an Email Worker. The Worker parses the MIME body (`postal-mime` or equivalent), extracts sender, subject, body, attachments, and POSTs a normalized payload to a Convex HTTP action — same shape as the Telegram/WhatsApp webhook pattern, so the unified inbox doesn't need a third ingestion code path.
- This is free indefinitely — Cloudflare Email Routing carries no per-message charge and is a mature product (not the newer beta send product).

### Outbound (free at this scale, Resend)
- Resend's free tier (3,000 emails/month, free forever) covers transactional sends — booking confirmations, reply-to-guest emails — comfortably at Ivano's current scale.
- Deliberately **not** using Cloudflare's outbound Email Service for this — it's in public beta as of writing, and the redesign doc's reliability bar (section 1: "never ambiguous," section 7 quality floor) argues for a GA-stable product on anything guest-facing like a booking confirmation. Cloudflare's inbound product is mature and fine to use; its outbound product isn't yet.
- Sending domain: `mail.techivano.com` (or similar subdomain) with SPF/DKIM/DMARC configured once at the DNS level.

### Data model addition
- `emailThreads`: `propertyId`, `guestEmail`, `subject`, `lastMessageAt` — same shape as `telegramThreads`, feeding the same inbox.
- No token encryption needed here either — Resend API key and the Cloudflare Worker's shared secret are platform-level secrets, not per-tenant credentials.

## 3. Inbox integration

Both channels plug into the same unified inbox pattern from the redesign doc (section 5.1): channel-tagged threads, status chips, "create booking from this thread." The only new UI surface is the Channels view (section 5.6) showing Telegram's deep link/QR (with a copy button and regenerate option) and Email's per-property inbound address — both are *display + copy*, not connect flows requiring OAuth, which is a meaningfully simpler component than the WhatsApp connect pattern originally scoped.

## 4. Keeping WhatsApp/Instagram available later

Nothing here should block adding either later:

- The unified inbox's thread/message model is channel-agnostic already (channel is just a tag) — adding WhatsApp or Instagram later means a new ingestion webhook and a new connect-flow component, not a redesign of the inbox itself.
- ADR-007's encryption scheme stays relevant the moment a channel *does* need per-tenant secrets (WhatsApp access tokens, Instagram page tokens) — Telegram and Email simply don't need it because neither has a per-property credential to protect.
- If a client requests WhatsApp specifically, the cost conversation becomes concrete and per-client (their own Meta Business account bears the template costs), rather than a platform-wide budget decision — worth revisiting section 0's table at that point rather than assuming today's calculus still holds.

## 5. Revised task breakdown

**Task 6.1 (rescoped from WhatsApp OAuth) — Telegram connection**
- 6.1.1: Register platform bot, implement `/start` token resolution + webhook signature validation
- 6.1.2: `telegramConnections` + `telegramThreads` schema, deep-link/QR generation in Channels view
- 6.1.3: Inbound message ingestion → inbox thread creation
- 6.1.4: Outbound send from inbox reply box

**Task 6.2 — Email connection**
- 6.2.1: Cloudflare Email Routing + Worker setup, per-property address resolution
- 6.2.2: Inbound parsing → inbox thread creation (reuse 6.1.3's ingestion shape)
- 6.2.3: Resend integration for outbound sends + booking confirmation templates
- 6.2.4: SPF/DKIM/DMARC DNS configuration on `techivano.com`

Each closes with the usual test-count-gated commit.
