# Vercel webhook secrets — Ivano PMS

**Owns:** Product Ops (vault, checklist, smoke/verify, Linear)  
**Sole Vercel admin:** Kezie — no Project Member seats  
**Linear:** [IVA-15](https://linear.app/ivano-technologies/issue/IVA-15/team-owned-vercel-secrets-runbook-unpark-iva-11-without-kezie) (this runbook) · [IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel) (parked until go-live)

**Project:** `techivano/ivano-pms`  
**Prod host:** `https://pms.techivano.com`

Never paste real secret values into git, Slack, Linear, or this file. Vault + Kezie’s Vercel UI only.

---

## 1. Purpose

At PMS go-live, get `WEBHOOK_SECRET` and `EMAIL_WEBHOOK_SECRET` onto Vercel Production with a **≤2-minute Kezie checklist**, then Product Ops verifies.

Do **not** set these vars before unpark. Never ask Kezie for secrets outside that checklist.

---

## 2. Roles

| Role | Who | Does |
|------|-----|------|
| Sole Vercel admin | Kezie | Paste two env vars + Redeploy Production (checklist only) |
| Process owner | Product Ops | Generate secrets → vault → send checklist → smoke → close [IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel) |
| Unpark gate | CoS / Product Ops | Unpark IVA-11 at go-live, then run this book |

**Standing rule:** Never escalate secrets to Kezie except the go-live checklist.

---

## 3. Secrets

Names and headers only. Values live in vault item `ivano-pms-prod-webhooks`, never here.

| Variable | Where | Header / mechanism | Must match |
|----------|-------|--------------------|------------|
| `WEBHOOK_SECRET` | Vercel **Production** and **Preview** (both blue/green colors) | `x-webhook-signature` — HMAC-SHA256(raw body) as lowercase hex. See [webhooks.md](../webhooks.md). | Channel senders that POST `https://pms.techivano.com/api/webhooks` |
| `EMAIL_WEBHOOK_SECRET` | Vercel Production and Preview; Cloudflare Email Worker | `x-email-webhook-secret` — shared secret, not HMAC. `POST /api/webhooks/email` | Worker `EMAIL_WEBHOOK_SECRET` |

Same values on both colors so a promote-to-production swap does not break signatures. See [dev-env-checklist.md](./dev-env-checklist.md).

Out of scope: `INTERNAL_JOB_SECRET`, Clerk, Convex, `TELEGRAM_WEBHOOK_SECRET`. Do not rotate those here.

---

## 4. Procedure

**Prereqs:** Vault item `ivano-pms-prod-webhooks` (both secrets + last-rotated). IVA-11 unparked. Cloudflare Worker access if Product Ops mirrors `EMAIL_WEBHOOK_SECRET` (else put the Worker step on Kezie’s checklist).

### 4.1 Product Ops — prepare (before pinging Kezie)

```bash
openssl rand -hex 32   # WEBHOOK_SECRET
openssl rand -hex 32   # EMAIL_WEBHOOK_SECRET
```

1. Store both in the vault **first**. Do not leave values only in terminal scrollback.
2. Draft the **Kezie 2-minute checklist** (below). Deliver secret values via vault share / 1Password link — **not** Linear or Slack.
3. Unpark [IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel) → In Progress.

### 4.2 Kezie 2-minute checklist (send at go-live)

> **ivano-pms — set webhook secrets (≈2 min)**
>
> 1. Open Vercel → project **ivano-pms** → Settings → Environment Variables.
> 2. Set `WEBHOOK_SECRET` = *(from vault)* for **Production** and **Preview**.
> 3. Set `EMAIL_WEBHOOK_SECRET` = *(from vault)* for the same envs.
> 4. Save → **Redeploy Production**.
> 5. Reply “done” (do not paste values).

Optional same message: Cloudflare Worker `EMAIL_WEBHOOK_SECRET` must match; keep `PMS_WEBHOOK_URL=https://pms.techivano.com/api/webhooks/email`. Include this only if Kezie owns the Worker. If Product Ops owns Worker env, Product Ops mirrors after Kezie’s “done” — do not wait on a second Kezie ping.

### 4.3 Product Ops — verify

Load secrets from the vault into the shell. Do not echo them. Prod host only.

If Vercel Deployment Protection returns 401 before the route runs, use the project’s protection bypass token (not a webhook secret). Do not paste that token in Linear.

**Channel HMAC** (`POST /api/webhooks`) — payload schema per [webhooks.md](../webhooks.md):

```bash
BODY='{"type":"channel.message","channel":"whatsapp","senderName":"Ops Smoke","messageText":"ping","senderPhone":"+2348000000000"}'
SIG=$(node -e "const c=require('crypto');console.log(c.createHmac('sha256',process.env.WEBHOOK_SECRET).update(process.argv[1]).digest('hex'))" "$BODY")
curl -sS -o /tmp/wh.json -w "%{http_code}\n" -X POST "https://pms.techivano.com/api/webhooks" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$BODY"
```

Expect **2xx** on a valid signed body. Bad/missing signature is **400**. Missing env on the deployment is **500**.

**Email** (`POST /api/webhooks/email`):

```bash
curl -sS -o /tmp/email-wh.json -w "%{http_code}\n" -X POST "https://pms.techivano.com/api/webhooks/email" \
  -H "Content-Type: application/json" \
  -H "x-email-webhook-secret: $EMAIL_WEBHOOK_SECRET" \
  -d '{"smoke":true}'
```

Expect **not 401** from secret mismatch (this body is schema-invalid → **400** is fine; secret still good). Matching header + `toAddress`/`fromAddress` → **200**. Missing env → **500**.

Optional: `pnpm verify:webhook` / `scripts/verify-webhook-convex.mjs` against prod only with care; those scripts default to local + fixture secrets.

### 4.4 Close the loop

1. Vault: update `last-rotated`.
2. [IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel) → Done. Comment: HTTP status codes + deployment URL/hash. **No secret values.**
3. If this was the first live use of this book, note the date on [IVA-15](https://linear.app/ivano-technologies/issue/IVA-15/team-owned-vercel-secrets-runbook-unpark-iva-11-without-kezie).

---

## 5. Go-live unpark (IVA-11)

Do not execute until PMS go-live is confirmed.

1. CoS / Product Ops confirm go-live.
2. Unpark [IVA-11](https://linear.app/ivano-technologies/issue/IVA-11/set-production-webhook-secret-email-webhook-secret-on-vercel): remove `parked`, move to In Progress.
3. Product Ops: generate → vault → send Kezie the §4.2 checklist (vault link, not values in chat).
4. Kezie: set Production (+ Preview) + redeploy. Reply “done”.
5. Product Ops: smoke → close IVA-11 with evidence, no secrets.

---

## 6. Kezie only

Ping Kezie **only** for:

- This go-live checklist (env paste + Redeploy Production)
- Billing
- Deleting the Vercel project
- Org-wide GitHub App installs

Never ask Kezie for secrets outside that checklist.

---

## Related docs

- [webhooks.md](../webhooks.md) — `POST /api/webhooks` HMAC
- [dev-env-checklist.md](./dev-env-checklist.md) — blue/green env scopes
- [deploy.md](./deploy.md) — Convex deploy + other secret rotation
- [workers/email-inbound/README.md](../../workers/email-inbound/README.md) — Worker vars (`PMS_WEBHOOK_URL`, `EMAIL_WEBHOOK_SECRET`)
