# Launch scope (Sept 1)

Status: **Locked decision** — do not treat post-launch track work as launch-blocking without an explicit revision to this document.

Related: [ux-redesign-architecture.md](./ux-redesign-architecture.md) (phase naming), [channels-telegram-email-spec.md](./channels-telegram-email-spec.md) (channel sequencing)

---

## How to use this

Before scoping work, estimating launch risk, or flagging blockers: check this list. **Phase D-pre and Phase D are explicitly out of launch scope** and continue on a parallel post-launch track.

Shell redesign phases A, B, and C are **done** — see the architecture doc §13 phase table.

---

## IN for launch

| Area | Status | Notes |
|------|--------|--------|
| Shell redesign (Phases A, B, C) | Done | Tokens/audit/primitives, command bar + nav rail, context panel wiring |
| Manual guest/booking entry | Done | Guests page, calendar create flow |
| Bulk Excel/CSV import | Done | Guests page → Import spreadsheet |
| Email inbound | Done in dev | **Needs prod deploy confirmation** — verify webhook + routing in production before calling launch-ready |
| Telegram backend | Built, parked | Pending verification; **not required for launch** — full channel enablement is deferred (see [channels-telegram-email-spec.md](./channels-telegram-email-spec.md) §0) |

---

## OUT for launch (parallel post-launch track)

| Area | Phase label | Notes |
|------|-------------|--------|
| Inbox thread states, create-booking-from-thread | D-pre.1 | Heavy flow redesign |
| Calendar timeline redesign | D-pre.2 | Timeline bars, conflict markers, drag-to-create |
| Reports redesign | D-pre.3 | Summary cards, sparklines, shared date-range picker |
| Channels & accessibility/mobile polish | Phase D | Unified channel-connection pattern, empty/loading/error pass, a11y, mobile |
| Telegram / Instagram / WhatsApp full enablement | Post-launch | Telegram backend exists; manager-facing connect + prod verification not launch gates |
| Resend outbound email | Post-launch | Inbound only for launch |
| DNS hardening | Post-launch | Email deliverability / domain auth |
| Custom domain support for email branding | Post-launch | Per-property or branded inbound addresses |

---

## Decision log

| Date | Decision |
|------|----------|
| 2026-06-28 | Launch Sept 1 with manual entry + bulk import + shell redesign. Defer D-pre/D and full channel enablement to post-launch parallel track. Email inbound must be confirmed in prod before launch sign-off. |
