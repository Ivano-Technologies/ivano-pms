# Vercel webhook secrets — Ivano PMS

**Linear:** [IVA-15](https://linear.app/ivano-technologies/issue/IVA-15/team-owned-vercel-secrets-runbook-unpark-iva-11-without-kezie) (this runbook) · [IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel) (parked until go-live)

**Project:** `techivano/ivano-pms`  
**Prod host:** `https://pms.techivano.com`

Never paste real secret values into git, Slack, Linear, or this file.

---

## 1. Purpose

Set or rotate production `WEBHOOK_SECRET` and `EMAIL_WEBHOOK_SECRET` on the ivano-pms Vercel project **without Kezie**, except a one-time Member seat grant.

[IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel) stays **parked** until PMS go-live. This runbook is how Product Ops unparks it.

Do not set these vars before unpark.

---

## 2. Roles

| Role | Who | Access |
|------|-----|--------|
| Org / billing owner | Kezie | Vercel Owner. Billing, seats, delete project, org GitHub App. **Not** routine env flips. |
| Secrets operators | Named humans — **TBD**. CoS escalates one-time Member grant to Kezie. | Project **Member** (Environment Variables + Redeploy). Not billing. |
| Execution | Product Ops (or named on-call eng with a Member seat) | Runs this book. Owns Linear. |
| Unpark gate | CoS / Product Ops at PMS go-live | Unpark IVA-11, then run this book. |

**Standing rule:** Do not ping Kezie for env/secret rotation. Escalate to CoS only for the one-time seat grant.

---

## 3. Secrets

Names and headers only. Values live in the vault item `ivano-pms-prod-webhooks`, never here.

| Variable | Vercel scopes | Header / mechanism | Must match |
|----------|---------------|--------------------|------------|
| `WEBHOOK_SECRET` | **Production and Preview** (both blue/green colors) | `x-webhook-signature` — HMAC-SHA256(raw body) as lowercase hex. See [webhooks.md](../webhooks.md). | Channel senders that POST `https://pms.techivano.com/api/webhooks` |
| `EMAIL_WEBHOOK_SECRET` | **Production and Preview** (both colors) | `x-email-webhook-secret` — shared secret, not HMAC. `POST /api/webhooks/email` | Cloudflare Email Worker `EMAIL_WEBHOOK_SECRET` |

Same values on both colors. Preview builds (`staging`) must already embed prod values so a promote-to-production swap does not break signatures. See [staging-env-checklist.md](./staging-env-checklist.md).

Out of scope: `INTERNAL_JOB_SECRET`, Clerk, Convex, `TELEGRAM_WEBHOOK_SECRET`. Do not rotate those here.

---

## 4. Procedure — set or rotate

**Prereqs:** Member seat on `techivano/ivano-pms`. Vault item `ivano-pms-prod-webhooks` (fields: both secrets, last-rotated). Cloudflare Worker env access for `EMAIL_WEBHOOK_SECRET`. IVA-11 unparked.

### 4.1 Generate

```bash
openssl rand -hex 32   # WEBHOOK_SECRET
openssl rand -hex 32   # EMAIL_WEBHOOK_SECRET
```

Write both into the vault **before** Vercel. Do not leave values only in terminal scrollback.

### 4.2 Vercel

Dashboard: project **ivano-pms** → Settings → Environment Variables.

1. Set `WEBHOOK_SECRET` and `EMAIL_WEBHOOK_SECRET` for **Production** and **Preview** — **same values**.
2. Save.
3. **Redeploy** Production (and Preview if you will smoke a preview URL). Env changes do not apply to already-built deployments.

CLI (if `vercel` is linked to this project):

```bash
vercel env add WEBHOOK_SECRET production
vercel env add WEBHOOK_SECRET preview
vercel env add EMAIL_WEBHOOK_SECRET production
vercel env add EMAIL_WEBHOOK_SECRET preview
# Redeploy: dashboard Redeploy, or promote per staging-env-checklist.md
```

### 4.3 Mirror Cloudflare Worker

Set Worker `EMAIL_WEBHOOK_SECRET` to the **same** vault value.

Keep `PMS_WEBHOOK_URL=https://pms.techivano.com/api/webhooks/email`. Do not point the production worker at a `*.vercel.app` preview during a swap.

### 4.4 Smoke

Load secrets from the vault into the shell. Do not echo them. Prod host only.

If Vercel Deployment Protection returns 401 before the route runs, use the project's protection bypass token (not a webhook secret). Do not paste that token in Linear.

**Channel HMAC** (`POST /api/webhooks`) — payload schema per [webhooks.md](../webhooks.md):

```bash
BODY='{"type":"channel.message","channel":"whatsapp","senderName":"Ops Smoke","messageText":"ping","senderPhone":"+2348000000000"}'
SIG=$(node -e "const c=require('crypto');console.log(c.createHmac('sha256',process.env.WEBHOOK_SECRET).update(process.argv[1]).digest('hex'))" "$BODY")
curl -sS -o /tmp/wh.json -w "%{http_code}\n" -X POST "https://pms.techivano.com/api/webhooks" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$BODY"
```

Expect **2xx** on a valid signed body. Bad/missing signature is **400**, not a successful ingest. Missing env on the deployment is **500**.

**Email** (`POST /api/webhooks/email`):

```bash
curl -sS -o /tmp/email-wh.json -w "%{http_code}\n" -X POST "https://pms.techivano.com/api/webhooks/email" \
  -H "Content-Type: application/json" \
  -H "x-email-webhook-secret: $EMAIL_WEBHOOK_SECRET" \
  -d '{"toAddress":"booking+ops-smoke@pms.techivano.com","fromAddress":"ops-smoke@example.com","subject":"ops smoke","textBody":"ping"}'
```

Expect **200** when the header matches and required fields are present. Wrong/missing header is **401**. Schema-only failure with a matching header is **400** — secret is still good. Missing env is **500**.

Optional: `pnpm verify:webhook` / `scripts/verify-webhook-convex.mjs` against prod only with care; those scripts default to local + fixture secrets.

### 4.5 Close Linear

1. Vault: update `last-rotated`.
2. [IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel) (or successor) → Done. Comment: HTTP status codes + deployment URL/hash. **No secret values.**
3. If this was the first live use of this book, note the date on [IVA-15](https://linear.app/ivano-technologies/issue/IVA-15/team-owned-vercel-secrets-runbook-unpark-iva-11-without-kezie).

---

## 5. Go-live unpark (IVA-11)

Do not execute until PMS go-live is confirmed.

1. CoS / Product Ops confirm go-live.
2. Unpark [IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel): remove `parked`, move to In Progress. Do not escalate secrets to Kezie.
3. Confirm a named operator has a Vercel Member seat. If not: CoS → Kezie **once** for the grant, then continue without her.
4. Run §4 end-to-end (generate → vault → Vercel Production+Preview → redeploy → Worker mirror → smoke → Linear).
5. Mark IVA-11 Done with smoke evidence, no secrets.

---

## 6. Kezie only

Ping Kezie **only** for:

- Granting or revoking Vercel project Member / Admin seats
- Billing
- Deleting the Vercel project
- Org-wide GitHub App installs
- Any other org Owner action

Not for setting, rotating, or verifying `WEBHOOK_SECRET` / `EMAIL_WEBHOOK_SECRET`.

---

## Related docs

- [webhooks.md](../webhooks.md) — `POST /api/webhooks` HMAC
- [staging-env-checklist.md](./staging-env-checklist.md) — blue/green env scopes
- [deploy.md](./deploy.md) — Convex deploy + other secret rotation
- [workers/email-inbound/README.md](../../workers/email-inbound/README.md) — Worker vars (`PMS_WEBHOOK_URL`, `EMAIL_WEBHOOK_SECRET`)
