# Telegram verification — parked (not abandoned)

**Status:** Code complete, unit-tested; **real end-to-end round-trip never verified.**  
**Parked:** 2026-06-27  
**Revisit before:** Enabling Telegram for real users or registering the prod webhook.

---

## What is done (6.1.1–6.1.4)

| Task | Scope | Tests |
|------|--------|-------|
| **6.1.1** | Webhook route (`POST /api/webhooks/telegram`), `X-Telegram-Bot-Api-Secret-Token` validation, `/start <property_token>` resolution, `setWebhook` registration action | Passing |
| **6.1.2** | Connect tokens, chat bindings, deep links | Passing |
| **6.1.3** | Unified inbox threads (`inboxThread`, `inboxIngestion`, thread list UI) | Passing |
| **6.1.4** | Outbound reply from inbox via `sendMessage` (`telegramReply`, reply UI) | Passing |

Commits: `[TASK-6.1.3]`, `[TASK-6.1.4]` (note: 6.1.3 commit also carried some 6.1.4 UI/mutation — scoped separately in 6.1.4 commit where possible).

**Local browser check (without Telegram):** After Clerk dev + Convex auth re-push, `/dashboard/channels` loads authenticated and shows the inbox shell (empty threads). Reusable script: `scripts/verify-inbox.mjs`.

---

## What was never verified

The full path we care about for production confidence:

```
Guest messages @IvanoPMSbot (/start + text)
  → Telegram delivers POST to webhook URL
  → Next.js /api/webhooks/telegram (secret_token header)
  → Convex processTelegramUpdate
  → inboxThread + bookingChannelMessage
  → Manager sees thread in /dashboard/channels
  → Manager replies in UI
  → sendTelegramReplyInternal → guest phone
```

Unit tests mock Convex and Telegram API; they do **not** exercise the open-internet webhook receiver or real Telegram delivery.

---

## Where we stopped (2026-06-27 session)

1. **Dev deployment** (`amicable-aardvark-543`): property seeded (`Gwarimpa Estate`), connect token minted once for testing; `inboxThread` / `telegramChatBinding` were empty (no linked chat).
2. **Webhook:** Was empty before tunnel work; briefly considered registering against a tunnel; **never left pointed at a live URL.** Shutdown confirmed `getWebhookInfo.url === ""`.
3. **Tunnel attempts:**
   - **cloudflared (trycloudflare.com):** Chosen first (Cloudflare DNS customer). **Blocked** on this network — egress to `argotunnel.com` fails on port 7844 (QUIC and HTTP/2). Not a code issue.
   - **Microsoft devtunnel:** Chosen as fallback (443 to `*.devtunnels.api.visualstudio.com` reachable). Installed via winget; **GitHub device login started but not completed** — tunnel never hosted, webhook never registered via devtunnel.
   - **Vercel preview:** Discussed; deferred (more setup than devtunnel for a one-off verify).
   - **Synthetic injection (`getUpdates` + manual ingest):** Explicitly rejected — would skip testing the webhook receiver.
4. **Env added locally (gitignored):** `TELEGRAM_WEBHOOK_SECRET` in `apps/web/.env.development.local` for when verification resumes.

---

## Recommended path when resuming

1. Complete **devtunnel** login: `devtunnel user login`, then `devtunnel host -p 3000 --allow-anonymous` (or equivalent) with `next dev` running.
2. Register webhook temporarily:
   - URL: `https://<tunnel-host>/api/webhooks/telegram`
   - `secret_token`: value of `TELEGRAM_WEBHOOK_SECRET` (must match Next.js env).
   - Bot: **@IvanoPMSbot** (dev token in Convex env on `amicable-aardvark-543`).
3. Deep link: `https://t.me/IvanoPMSbot?start=<connect_token>` (create via dashboard **Channels** or `ensureTelegramConnectTokenInternal`).
4. Send a real message; confirm thread in inbox via **webhook delivery** (watch Next.js `[TELEGRAM_WEBHOOK]` logs, not `getUpdates`).
5. Reply from UI; confirm on phone.
6. **Teardown:** `deleteWebhook` (leave `url` empty) and stop tunnel — do not leave a dead tunnel URL registered.

Alternative if devtunnel is awkward: short-lived **Vercel preview** deploy with dev Convex + webhook env vars (still not prod `pms.techivano.com` until deliberately go-live).

---

## Do not enable for real users until

- [ ] Real webhook → inbox → reply round-trip verified on dev (or staging).
- [ ] Prod webhook registered to `https://pms.techivano.com/api/webhooks/telegram` with prod `TELEGRAM_WEBHOOK_SECRET`.
- [ ] `CONVEX_URL` / `CONVEX_DEPLOYMENT` mismatch in root `.env.local` reconciled (harmless for local UI today; worth cleanup before prod ops).

---

## Related docs

- Spec: `docs/planning/channels-telegram-email-spec.md`
- Webhook route: `apps/web/src/app/api/webhooks/telegram/`
- Convex: `convex/functions/telegramWebhookActions.ts`, `telegram.ts`, `telegramReply.ts`, `inboxIngestion.ts`
