# Staging environment variable checklist

Read this **in the Vercel dashboard** while configuring a deployment for the `staging` branch. It lists variable **names only** — never commit or paste secret values into git or chat.

**Purpose:** keep staging isolated from production (`pms.techivano.com` + Convex `flippant-eel-758`) so preview traffic does not authenticate against prod Clerk, write to the prod database, or re-arm production webhooks.

This document is **not** executed automatically. Set values manually per row, then redeploy the staging branch.

---

## Email webhook secret (reconciled)

Earlier references to a generic `WEBHOOK_SECRET` for email inbound were **incorrect**.

| Path | Secret variable | Header / mechanism |
|------|-----------------|-------------------|
| `POST /api/webhooks` (generic channel ingest) | `WEBHOOK_SECRET` | `x-webhook-signature` (HMAC) |
| `POST /api/webhooks/email` | **`EMAIL_WEBHOOK_SECRET`** | `x-email-webhook-secret` |
| `POST /api/webhooks/telegram` | `TELEGRAM_WEBHOOK_SECRET` | `X-Telegram-Bot-Api-Secret-Token` |

Email inbound is **not** gated by `WEBHOOK_SECRET` or `TELEGRAM_WEBHOOK_SECRET`. The Cloudflare Email Worker (`workers/email-inbound`) forwards to Vercel using `PMS_WEBHOOK_URL` + `EMAIL_WEBHOOK_SECRET` (worker env, not Vercel).

Convex `processInboundEmail` is reached from Next.js via `INTERNAL_JOB_SECRET`, not `EMAIL_WEBHOOK_SECRET`.

---

## Critical risk: Convex deployment pairing

The repo documents **two** Convex deployments:

| Label | Deployment slug | Typical use |
|-------|-----------------|-------------|
| **Production** | `flippant-eel-758` | `pms.techivano.com`, prod Vercel |
| **Development** | `amicable-aardvark-543` | local `next dev`, `npx convex dev` |

There is **no third “staging” Convex deployment** defined in repo docs today.

**If the Vercel staging branch is pointed at prod `NEXT_PUBLIC_CONVEX_URL` (`flippant-eel-758`), staging writes hit the production database.** That is the highest-severity misconfiguration risk.

**Recommended before staging goes live:** either (a) point staging Vercel at the **dev** Convex URL and matching dev Convex env vars, or (b) provision a **dedicated** Convex deployment for staging and document its slug here. Do not guess — confirm the URL in the Convex dashboard.

`CONVEX_DEPLOYMENT` is for CLI/deploy workflows (local/CI), not read by the Next.js runtime.

---

## Clerk (ADR-008)

[ADR-008](../adr/008-separate-clerk-instance.md) requires a **dedicated Clerk application for PMS vs NRCS EAM** — not separate Clerk instances for “staging vs production” within PMS.

For **staging Vercel**, still use **non-production** Clerk keys (`pk_test_` / `sk_test_`) or a dedicated staging Clerk app so staging sign-ins do not share the live user pool with `pms.techivano.com`. Pair staging Clerk with `CLERK_JWT_ISSUER_DOMAIN` on whichever Convex deployment staging uses.

---

## Telegram (parked)

Telegram webhook registration is **manual only** (`npx convex run internal.functions.telegramWebhookActions:registerTelegramWebhook`). Nothing on deploy re-arms it.

**For staging right now:** leave `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET` **unset** on staging Vercel and staging-target Convex until Telegram is deliberately unparked. Registering a webhook against a staging URL would repoint the **single** bot webhook away from production.

---

## Variable table

| Variable | Where read | What it gates | Must differ staging vs prod? | Why |
|----------|------------|---------------|-------------------------------|-----|
| `NEXT_PUBLIC_CONVEX_URL` | Vercel | Browser Convex client; webhook forwarders prefer this over `CONVEX_URL` | **Y** | Must target non-prod Convex unless you accept prod DB writes (see critical risk above). |
| `CONVEX_URL` | Vercel (fallback) | Webhook routes if `NEXT_PUBLIC_CONVEX_URL` unset | **Y** | Same deployment as `NEXT_PUBLIC_CONVEX_URL`; keep consistent or omit. |
| `CONVEX_DEPLOYMENT` | CLI / CI only | `npx convex deploy`, `convex run` target | **Y** (if staging has its own deployment) | Not a Vercel runtime var; set in deploy scripts for staging backend pushes. |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex dashboard | Convex auth (`convex/auth.config.ts`) — which Clerk JWTs validate | **Y** | Must match the Clerk instance whose keys are on staging Vercel. |
| `INTERNAL_JOB_SECRET` | Convex **and** Vercel | Secret-guarded internal mutations/actions (webhooks → Convex, health check) | **Y** per Convex deployment | Must be **identical** on Vercel and the paired Convex deployment; different from prod’s value when Convex differs. |
| `CHANNEL_TOKEN_ENCRYPTION_KEY` | Convex dashboard | Encrypt/decrypt OAuth channel tokens (`convex/lib/channelTokenCrypto.ts`) | **Y** if Convex deployment differs | Keys are not portable across deployments; rotation invalidates stored tokens. Lower risk if staging shares dev Convex and dev already has tokens. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | Clerk browser SDK | **Y** | Use test or staging Clerk app; avoid prod live pool on staging URL. |
| `CLERK_SECRET_KEY` | Vercel | Clerk server SDK | **Y** | Pair with publishable key and Convex `CLERK_JWT_ISSUER_DOMAIN`. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Vercel | Clerk redirect fallback (see ADR-008) | **Y** | Staging preview/production URL for the staging Vercel project (e.g. `https://<staging-host>/sign-in`). |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Vercel (optional) | Clerk sign-up redirect | **Y** | Same pattern as sign-in URL if used. |
| `NEXT_PUBLIC_APP_URL` | Vercel | Metadata / canonical origin (`layout.tsx`, `app-origin.ts`) | **Y** | Staging public URL. |
| `NEXT_PUBLIC_API_BASE_URL` | Vercel | Legacy REST client base (`lib/api.ts`) | **Y** | Staging API origin if used (e.g. `https://<staging-host>/api`). |
| `WEBHOOK_SECRET` | Vercel | `POST /api/webhooks` HMAC (`x-webhook-signature`) | **Y** (recommended) | Independent secret per environment; unrelated to email/Telegram. |
| `EMAIL_WEBHOOK_SECRET` | Vercel | `POST /api/webhooks/email` (`x-email-webhook-secret`) | **Y** | Must match Cloudflare Worker `EMAIL_WEBHOOK_SECRET` for that environment’s `PMS_WEBHOOK_URL`. |
| `PMS_WEBHOOK_URL` | Cloudflare Worker | Worker → Vercel email route URL | **Y** | e.g. staging `https://<staging-host>/api/webhooks/email` — **not** a Vercel var. |
| `DEFAULT_PROPERTY_ID` | Vercel | Default property when generic webhook payload omits property | **N** if sharing dev Convex data; **Y** if staging DB is separate | Convex document id; only matters for `/api/webhooks` ingest. |
| `TELEGRAM_BOT_TOKEN` | Convex | Telegram Bot API (`telegramWebhookActions`, `telegramReply`) | **Leave unset on staging** until unparked | One bot token globally; staging registration would steal webhook from prod. |
| `TELEGRAM_BOT_USERNAME` | Convex | Deep link / connect UI (`convex/lib/telegram.ts`) | **Leave unset on staging** until unparked | Harmless if unset; connect UI may degrade. |
| `TELEGRAM_WEBHOOK_URL` | Convex | `setWebhook` URL arg | **Leave unset on staging** until unparked | Must be prod URL when armed; staging URL would break prod ingest. |
| `TELEGRAM_WEBHOOK_SECRET` | Convex **and** Vercel | Telegram header check + `setWebhook` `secret_token` | **Leave unset on staging** until unparked | Must match between Convex and Vercel when Telegram is live. |
| `WHATSAPP_ACCESS_TOKEN` | — (listed in root `.env.example` only) | Not referenced in app code | **N** | Deferred per launch-scope; safe unset in both envs. |
| `INSTAGRAM_VERIFY_TOKEN` | — (listed in root `.env.example` only) | Not referenced in app code | **N** | Deferred per launch-scope; safe unset in both envs. |
| `BACKEND_API_ORIGIN` | Vercel (optional) | Next rewrites to external API | **N** if unused | Leave empty unless separate Express API is deployed for staging. |
| `CRON_SECRET` | Vercel (optional) | `verifyCronRequest` in `cron-auth.ts` | **N** today | No route imports `verifyCronRequest` yet — scaffold only. |
| `BLOB_READ_WRITE_TOKEN` | — | Not referenced in PMS app code | **N** | Present in `apps/web/.env.example` only; likely legacy. |
| `INGEST_SECRET` | — | Not referenced in PMS app code | **N** | Legacy scaffold in `apps/web/.env.example`. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | — | Not referenced in PMS app code | **N** | Outbound email deferred per launch-scope. |
| `VERCEL_URL` | Vercel (auto) | Fallback origin in `app-origin.ts` | Auto | Set by Vercel; no manual copy from prod. |

---

## Staging setup order (suggested)

1. Choose Convex target (dev deployment or new staging deployment) — **confirm in dashboard, not from this doc’s slugs alone if they drifted.**
2. Set Convex env vars for that deployment (`CLERK_JWT_ISSUER_DOMAIN`, `INTERNAL_JOB_SECRET`, `CHANNEL_TOKEN_ENCRYPTION_KEY`; skip Telegram vars).
3. Create Vercel **staging** environment variables for the `staging` branch (Clerk test keys, Convex URL, `INTERNAL_JOB_SECRET` match, URLs, `EMAIL_WEBHOOK_SECRET` if testing email).
4. Deploy `staging` branch; verify `GET /api/health` → `convexSecretConfigured: true`.
5. If testing email inbound on staging: configure Cloudflare Worker **staging** `PMS_WEBHOOK_URL` + matching `EMAIL_WEBHOOK_SECRET` — do not point prod worker at staging Vercel.
6. Do **not** run `registerTelegramWebhook` against staging until deliberately unparking Telegram.

---

## Could not verify from code alone

- **Whether a dedicated staging Convex deployment already exists** in the Ivano Convex team dashboard (repo only documents prod + dev slugs).
- **Current live values** in Vercel production or Cloudflare Worker dashboards.
- **Whether staging Vercel will use Preview vs Production environment** in Vercel’s UI — assign vars to the environment that matches how the `staging` branch is deployed.

---

## Related docs

- [deploy.md](./deploy.md) — production deploy flow
- [DEPLOYMENT.md](../../DEPLOYMENT.md) — prod env checklist
- [launch-scope.md](../planning/launch-scope.md) — what staging needs for Sept 1 vs deferred
- [telegram-verification-todo.md](../planning/telegram-verification-todo.md) — Telegram parking status
- [ADR-008](../adr/008-separate-clerk-instance.md) — PMS vs EAM Clerk separation
