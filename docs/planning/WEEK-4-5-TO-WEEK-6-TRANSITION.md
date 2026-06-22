# Week 4–5 → Week 6 transition

## Go / no-go

| Gate | Required | Status |
|------|----------|--------|
| `pnpm test` green | Yes | Run before smoke |
| `pnpm build` clean | Yes | Run before smoke |
| Smoke test signed off | Yes | [WEEK-4-5-SMOKE-TEST.md](./WEEK-4-5-SMOKE-TEST.md) |
| Tag `v0.5.0-smoke-verified` | Recommended | After smoke pass |
| Convex schema deployed | Yes | `npx convex dev --once` |

**No-go:** overlap still allows double-booking, reports blank with seed data, or Convex auth errors on dashboard.

---

## Week 4–5 delivery checklist

- [x] 4.1 Overlap detection + ADR-006
- [x] 4.6 Guest notes
- [x] 4.2 Reports dashboard
- [x] 4.5 Bundle lazy-load (modals + audit/checklist tabs)
- [x] 4.3 Property switcher + `selectedPropertyId` scoping
- [x] 4.4 Channel token storage (UI placeholder)
- [x] 4.7 Checklists CRUD + tab
- [x] 126 tests, clean build

---

## Week 6 prep (before coding)

1. **Encryption key** (Convex dashboard only):
   ```bash
   openssl rand -base64 32
   ```
   Set as `CHANNEL_TOKEN_ENCRYPTION_KEY`.

2. **Meta developer app** (Task 6.1): WhatsApp Business API app, redirect URI for OAuth.

3. **Review** [WEEK-6-KICKOFF.md](./WEEK-6-KICKOFF.md) task order.

---

## Week 6 task order

```
6.3 Token encryption     ← DONE (channelTokenActions + AES-256-GCM)
6.1 WhatsApp OAuth       ← Next
6.2 OAuth callback route
6.4 Settings Connect UI
6.5 Outbound message send (uses getDecryptedChannelToken)
```

---

## Handoff notes

- Public `getChannelTokens` never returns raw tokens — only connection metadata.
- OAuth callbacks must call `internal.functions.channelTokenActions.upsertChannelToken`, not the raw mutation.
- Plaintext tokens stored before 6.3 still work via legacy decrypt fallback until re-saved through the action.
