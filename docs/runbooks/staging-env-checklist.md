# Blue/green environment variable checklist

Read this **in the Vercel dashboard** while configuring deployments for the **two production colors** of Ivano PMS. It lists variable **names only** — never commit or paste secret values into git or chat.

## Deployment model (not a staging sandbox)

Ivano PMS uses **true blue/green**, aligned with the NRCS EAM pattern:

| Concept | This repo |
|---------|-----------|
| **Color A** | `main` branch → one deployable Vercel slot |
| **Color B** | `staging` branch → the other deployable slot |
| **Shared backend** | Convex **production** `flippant-eel-758` — **both colors read/write the same database** |
| **Shared auth** | Production Clerk (PMS instance) — **both colors use the same keys** |
| **What differs** | Deployed **code** (git commit on each branch) and, transiently, which color serves `https://pms.techivano.com` |
| **Swap** | Promote the inactive color so the production custom domain serves the other branch’s build — **no separate “staging database”** |

**`amicable-aardvark-543` (Convex dev) is not used by either color.** Dev stays on local `next dev` / `npx convex dev` only. Do not point either blue/green Vercel deployment at the dev Convex URL.

[ADR-008](../adr/008-separate-clerk-instance.md) separates **PMS vs NRCS EAM** Clerk applications — not “staging vs production” within PMS. Both colors use production PMS Clerk.

This document is **not** executed automatically.

---

## Email webhook secrets (reference)

| Path | Variable | Header / mechanism |
|------|----------|-------------------|
| `POST /api/webhooks` | `WEBHOOK_SECRET` | `x-webhook-signature` (HMAC) |
| `POST /api/webhooks/email` | `EMAIL_WEBHOOK_SECRET` | `x-email-webhook-secret` |
| `POST /api/webhooks/telegram` | `TELEGRAM_WEBHOOK_SECRET` | `X-Telegram-Bot-Api-Secret-Token` |

Email inbound is **not** gated by `WEBHOOK_SECRET` or `TELEGRAM_WEBHOOK_SECRET`. The Cloudflare Email Worker posts to `PMS_WEBHOOK_URL` with `EMAIL_WEBHOOK_SECRET` (worker env). Convex `processInboundEmail` is reached via `INTERNAL_JOB_SECRET` from Next.js.

---

## Webhook secrets: identical on both colors?

**Reasoning (read before setting values):**

External senders (Cloudflare Worker, channel partners, Telegram) target **hostnames**, not “a color” abstractly.

- **`PMS_WEBHOOK_URL`** (Cloudflare Worker) should remain `https://pms.techivano.com/api/webhooks/email` in production. That hostname is attached to **whichever Vercel deployment is currently promoted** to the production custom domain. Only one deployment receives that traffic at a time under normal Vercel routing.
- During a swap, Vercel typically moves the domain alias in one step; you do **not** get two deployments both serving `pms.techivano.com` with different secrets unless misconfigured.
- Each color also has its own **preview URL** (`*.vercel.app`). Preview URLs only receive webhook traffic if something explicitly points a sender at them (manual test, misconfigured worker). That is not the production path.

**Conclusion for production paths:**

| Variable | Must differ between colors? | Recommendation |
|----------|----------------------------|----------------|
| `WEBHOOK_SECRET` | **N** | **Same value on both colors.** Whichever deployment is live on `pms.techivano.com` must validate with the secret senders use. Identical secrets avoid a failed swap window; preview-only traffic is optional to test separately. |
| `EMAIL_WEBHOOK_SECRET` | **N** | **Same on both Vercel colors**; must match Cloudflare Worker `EMAIL_WEBHOOK_SECRET`. Worker `PMS_WEBHOOK_URL` stays on the prod hostname. |
| `PMS_WEBHOOK_URL` | **N** (single worker config) | One production worker target: prod hostname. Not a per-color Vercel var. |

If you **intentionally** test email ingest against a color’s preview URL, point a **test** worker route or manual `curl` at that preview host — do not repoint the production worker during a blue/green swap.

---

## App URL vars: differ per color?

| Variable | Must differ? | Notes |
|----------|--------------|-------|
| `NEXT_PUBLIC_APP_URL` | **Optional / situational** | **Promoted color:** should be `https://pms.techivano.com` (or rely on `VERCEL_URL` only on previews). **Inactive color:** only matters if someone opens that color’s `*.vercel.app` preview directly; metadata/canonical URLs on preview are irrelevant to managers using the custom domain. |
| `NEXT_PUBLIC_API_BASE_URL` | **Optional / situational** | Same pattern — prod value on both is fine (`https://pms.techivano.com/api`). Preview testers may use preview origin; production traffic uses the custom domain on the promoted deployment only. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | **N** | **Same on both:** `https://pms.techivano.com/sign-in` (ADR-008). Clerk must not fall back to EAM home URL. Inactive color’s preview sign-in still redirects managers to the prod sign-in URL, which is correct for shared Clerk. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | **N** | Same pattern as sign-in if used. |

**Custom domain rule:** `pms.techivano.com` should alias **only the currently promoted color**. The non-promoted color’s URL env vars do not affect managers until that color is swapped in and promoted.

---

## Telegram (parked — one bot, one webhook)

There is **one** Telegram bot and **one** webhook URL globally — this is not about “isolating staging.”

- **Convex** (`flippant-eel-758`) holds a **single** set of `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME` — not duplicated per git branch.
- **`registerTelegramWebhook` is manual** and does not run on deploy. It points Telegram at whatever `TELEGRAM_WEBHOOK_URL` is set in Convex (today: prod hostname when armed).

**Inactive color (not serving `pms.techivano.com`):** Vercel `TELEGRAM_WEBHOOK_SECRET` may be **unset** — that deployment will not receive Telegram POSTs at the prod hostname.

**When promoting a color that should serve Telegram:** Telegram config **travels with the live slot**, not automatically:

1. Promoted Vercel deployment must have `TELEGRAM_WEBHOOK_SECRET` matching Convex.
2. Convex `TELEGRAM_WEBHOOK_URL` must be `https://pms.techivano.com/api/webhooks/telegram` (prod hostname — follows the domain, not the branch name).
3. If the webhook was never registered or URL changed: run `registerTelegramWebhook` manually after promotion (**required swap-runbook step** — not CI).

Until Telegram is unparked per [telegram-verification-todo.md](../planning/telegram-verification-todo.md), leave Telegram vars unset on the **inactive** Vercel color and avoid re-registering the webhook during routine code swaps.

---

## Variable table

| Variable | Where read | What it gates | Must differ between colors? | Why |
|----------|------------|---------------|----------------------------|-----|
| `NEXT_PUBLIC_CONVEX_URL` | Vercel | Browser Convex client; webhook forwarders | **N** | Both colors: `https://flippant-eel-758.convex.cloud` (prod). Same database. |
| `CONVEX_URL` | Vercel (fallback) | Webhook routes if public URL unset | **N** | Same prod deployment as above. |
| `CONVEX_DEPLOYMENT` | CLI / CI | `npx convex deploy` target | **N** for runtime | Both deploy pipelines target `prod:flippant-eel-758` when pushing backend. Not a Vercel runtime var. |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex | Convex auth JWT validation | **N** | Single prod Convex deployment; prod Clerk issuer (e.g. `https://clerk.techivano.com`). |
| `INTERNAL_JOB_SECRET` | Convex **and** Vercel | Webhooks → Convex, health, internal jobs | **N** | One prod Convex deployment; value must match on Vercel **both colors** and Convex. |
| `CHANNEL_TOKEN_ENCRYPTION_KEY` | Convex | Channel OAuth token encryption | **N** | Single prod Convex; one key for all encrypted tokens in prod DB. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | Clerk browser SDK | **N** | Production PMS Clerk on both colors. |
| `CLERK_SECRET_KEY` | Vercel | Clerk server SDK | **N** | Production PMS Clerk on both colors. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Vercel | Clerk redirect fallback | **N** | `https://pms.techivano.com/sign-in` on both (ADR-008). |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Vercel (optional) | Clerk sign-up redirect | **N** | Prod URL if used. |
| `NEXT_PUBLIC_APP_URL` | Vercel | Metadata / app origin | **Optional** | Prod URL on both is typical; preview-only difference irrelevant until swap. See section above. |
| `NEXT_PUBLIC_API_BASE_URL` | Vercel | Legacy REST client | **Optional** | `https://pms.techivano.com/api` on both is typical. |
| `WEBHOOK_SECRET` | Vercel | `POST /api/webhooks` HMAC | **N** | Same secret both colors — see webhook reasoning. |
| `EMAIL_WEBHOOK_SECRET` | Vercel | `POST /api/webhooks/email` | **N** | Same both colors; matches Cloudflare Worker. |
| `PMS_WEBHOOK_URL` | Cloudflare Worker | Worker → Vercel email route | **N** | Single prod hostname; not per Vercel color. |
| `DEFAULT_PROPERTY_ID` | Vercel | Default property for generic webhook | **N** | Same prod Convex document id on both colors. |
| `TELEGRAM_BOT_TOKEN` | Convex (once) | Telegram Bot API | **N/A per Vercel color** | Lives on prod Convex only; not a branch-pairing decision. |
| `TELEGRAM_BOT_USERNAME` | Convex (once) | Connect deep links | **N/A per Vercel color** | Same. |
| `TELEGRAM_WEBHOOK_URL` | Convex (once) | `setWebhook` URL | **N/A per Vercel color** | Prod hostname when armed; follows promoted deployment. |
| `TELEGRAM_WEBHOOK_SECRET` | Convex + Vercel (promoted color) | Telegram header + setWebhook | **Inactive Vercel color: unset** | Promoted color must match Convex; manual webhook step on Telegram enable/swap. |
| `WHATSAPP_ACCESS_TOKEN` | — (`.env.example` only) | Not in code | **N** | Deferred; unset OK. |
| `INSTAGRAM_VERIFY_TOKEN` | — (`.env.example` only) | Not in code | **N** | Deferred; unset OK. |
| `BACKEND_API_ORIGIN` | Vercel (optional) | Next rewrites | **N** if unused | Leave empty unless external API deployed. |
| `CRON_SECRET` | Vercel | Vercel Cron `Authorization: Bearer …` | **N** | Required when cron routes exist (`verifyCronRequest`). Today: `vercel.json` schedules three paths but **handlers were removed** — crons 404; secret unused until routes are restored. |
| `BLOB_READ_WRITE_TOKEN` | — | Not in PMS code | **N** | Legacy scaffold. |
| `INGEST_SECRET` | — | Not in PMS code | **N** | Legacy scaffold. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | — | Not in PMS code | **N** | Outbound deferred per launch-scope. |
| `VERCEL_URL` | Vercel (auto) | Origin fallback | Auto | Per-deployment; no manual sync between colors. |

---

## How promotion actually works

### What “swap” means here

**Goal:** Ship new code on the inactive color (`staging` or `main`), validate, then make `https://pms.techivano.com` serve that build **without** changing Convex or Clerk.

**Backend:** Convex deploy is **branch-independent**. After merging or deploying either color, if `convex/` changed, run once against prod:

```bash
CONVEX_DEPLOYMENT=prod:flippant-eel-758 npx convex deploy --yes
```

Both colors then talk to the same updated backend. Schema migrations affect prod data immediately — there is no “staging Convex” safety net.

### Verified Vercel topology

Project `techivano/ivano-pms` (`prj_qNzAGh7EqNuZq1JURu3Oja2MEUOJ`), root directory `apps/web`. Verified via Vercel CLI against the live API on **2026-06-28** (the Vercel MCP server was erroring; CLI uses the same account/team):

| Fact | Verified value | Source |
|------|---------------|--------|
| **Production Branch** | **`main`** (the only one) | domain shares `main`'s deployment hash |
| **`pms.techivano.com` binding** | aliased to the **`main` production deployment** (same hash as `ivano-pms-git-main-…`) | `vercel alias ls` |
| **`staging` deployments** | **Preview** environment only — **not** a second Production Branch | `vercel ls` (Environment column) |
| **`staging` URL** | `ivano-pms-git-staging-techivano.vercel.app` (Preview), **not** attached to the custom domain | `vercel alias ls` |

**Consequence:** There is **no automatic branch-flip blue/green today.** `main` owns production and the custom domain; `staging` is a Preview color that must be **explicitly** promoted to take over `pms.techivano.com`.

> **Build-time env caveat (critical):** `staging` builds run with the **Preview** env scope. `NEXT_PUBLIC_*` values are **inlined at build time**. For a staging deployment to be safely promotable to production, its **Preview** env scope must already hold the **production** values (prod Convex URL, prod Clerk keys, prod sign-in URL, matching `INTERNAL_JOB_SECRET`, webhook secrets) — exactly the "same on both colors" guidance in the variable table above, applied to the **Preview** scope, not only the Production scope.

### Promotion mechanism (choose one — both are manual)

**Option A — Promote a deployment (no settings change; available today).**
`staging` already builds as Preview. After validating, promote that specific deployment so `pms.techivano.com` re-aliases to it — no rebuild, no Production Branch change. This is the same machinery as the documented rollback, used forward.

- Vercel Dashboard → project → **Deployments** → the validated `staging` deployment → **Promote to Production** (re-points the production domain alias).
- CLI equivalent: `vercel promote <deployment-url>` (run from an authenticated session; operator action, not CI).
- **Rollback:** promote the previous **`main`** production deployment the same way.
- **Requires** the Preview-scope env values to equal production (see build-time caveat).

**Option B — Flip the Production Branch (true blue/green branch swap).**
Project **Settings → Git → Production Branch**: `main` → `staging`. The next `staging` build is then a **Production** deployment (built with Production env scope) and the custom domain follows it. Revert by flipping back to `main`.

- Cleaner env story (Production scope, no Preview-inlining caveat) but it **is** a Vercel settings change.
- Revert is another settings flip, not an instant deployment promote — slightly slower break-glass than Option A.

**Operator decision required:** Pick one as the standing mechanism. For same-day, low-friction swaps with instant rollback, **Option A** is recommended provided Preview-scope env = production values. Use **Option B** if you want `staging` to become the durable production branch.

### Swap sequence (code on `staging`, prod on `main` today — Option A)

1. Push validated code to **`staging`** → wait for the Vercel **Preview** build to go Ready.
2. Smoke the **staging preview URL** (`ivano-pms-git-staging-techivano.vercel.app`): sign-in, dashboard, `/api/health` (`convexSecretConfigured: true`).
3. If `convex/` changed: `CONVEX_DEPLOYMENT=prod:flippant-eel-758 npx convex deploy --yes` (affects prod DB immediately — see schema discipline below).
4. **Promote** the staging deployment to production (Dashboard → Promote to Production, or `vercel promote <url>`) → `pms.techivano.com` now serves it.
5. Post-promotion smoke on the **custom domain**: `node scripts/smoke-prod.mjs` (from `apps/web`).
6. **Telegram (only when unparked):** ensure the promoted slot has `TELEGRAM_WEBHOOK_SECRET`; confirm Convex `TELEGRAM_WEBHOOK_URL` is the prod hostname; run `registerTelegramWebhook` if needed — **manual, not automatic**.

### Rollback (fastest path)

If the newly promoted color is broken:

1. **Vercel:** Promote the **last known-good `main` production deployment** (Dashboard → Deployments → Promote to Production, or `vercel promote <url>`) — instant domain re-alias, no rebuild. Same mechanism as [`deploy.md`](./deploy.md) rollback note. (If you swapped via **Option B / Production Branch flip**, revert by flipping the Production Branch back to `main`.)
2. **Do not** roll back Convex schema/data unless you have a migration reversal plan — both colors share one database; a bad Convex deploy cannot be undone by “swapping color” alone.
3. **Git:** Fix forward on the inactive branch; avoid force-pushing `main` unless that is your agreed break-glass process.
4. **Telegram:** If webhook was re-registered during a bad swap, re-run `registerTelegramWebhook` after rollback so Telegram points at the live deployment again.

---

## Schema changes under blue/green

Both colors share **one** Convex production deployment (`flippant-eel-758`). The database is **not** versioned per color — there is no “staging Convex” copy behind the inactive Vercel slot.

| Fact | Implication |
|------|-------------|
| `npx convex deploy` targets prod immediately | Schema and function changes affect live data **before** any Vercel promotion |
| Vercel swap only rolls back **frontend** code | Promoting the previous color **cannot** undo a Convex migration already applied |
| Both colors may run against the same schema during a swap window | Old and new Next.js builds must tolerate the **current** prod schema |

**Discipline while both colors are live:**

1. **Additive / backward-compatible migrations only** — new optional fields, new tables, new indexes; old clients and the inactive color must keep working until promotion completes.
2. **Promote the same day as any schema change** — deploy Convex, then ship and promote the Vercel color that depends on that schema; do not leave prod on a build that assumes a schema the other color cannot satisfy.
3. **Destructive changes: expand → migrate → contract** — add the new shape, backfill or dual-write, cut reads to the old shape, then remove it in a later deploy. **Never** bare `rename` / `drop` on prod while blue/green is the rollback strategy.

If a migration cannot be made backward-compatible, treat it as a **maintenance window** (take traffic off prod or accept that swap-back will not fix data shape) — not as something a Vercel color swap alone can reverse.

---

## First-time setup checklist (both colors)

1. Vercel env vars in **both the Production scope (for `main`) and the Preview scope (for `staging`)**: prod Convex URL, prod Clerk keys, `INTERNAL_JOB_SECRET` (match Convex), `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, webhook secrets (**same values in both scopes**). `staging` builds as Preview today, so Preview-scope values are what a promoted staging build embeds — they must equal production.
2. Convex prod (`flippant-eel-758`): `CLERK_JWT_ISSUER_DOMAIN`, `INTERNAL_JOB_SECRET`, `CHANNEL_TOKEN_ENCRYPTION_KEY`.
3. Cloudflare Email Worker: `PMS_WEBHOOK_URL` → prod hostname; `EMAIL_WEBHOOK_SECRET` → match Vercel.
4. Deploy both branches; verify health on each preview URL before first promotion.
5. Skip Telegram Vercel vars on inactive color until unparked; document manual webhook step in swap runbook when enabling.

---

## Verification status (resolved 2026-06-28 via Vercel CLI)

- ✅ **Production Branch = `main`** (sole production branch).
- ✅ **`pms.techivano.com` → `main` production deployment** (verified by shared deployment hash with the `git-main` alias).
- ✅ **`staging` = Preview env scope** (not a second Production Branch). → identical secrets must be set in the **Preview** scope so a promoted staging build embeds prod `NEXT_PUBLIC_*` values.
- ✅ **Promotion mechanism** documented (Option A promote-deployment / Option B Production-Branch flip); no `pnpm swap` script exists in-repo — promotion is a manual Dashboard/CLI action.

Still open (operator choice, not a code fact):

- Which promotion **option** becomes the standing mechanism (A vs B).
- Confirmation that the **Preview** env scope currently holds production values (required for Option A safety).

---

## Related docs

- [deploy.md](./deploy.md) — Convex deploy + prod smoke
- [DEPLOYMENT.md](../../DEPLOYMENT.md) — prod checklist + promote rollback mention
- [launch-scope.md](../planning/launch-scope.md) — launch IN/OUT
- [telegram-verification-todo.md](../planning/telegram-verification-todo.md) — Telegram parking
- [ADR-008](../adr/008-separate-clerk-instance.md) — PMS vs EAM Clerk
