# Ivano PMS — Execution Plan

**Updated:** 2026-06-22 | **Baseline:** `92645f3` (Week 4–5) | **Tests:** 128+  
**Stack:** Next.js 16 + Convex + Clerk + Shadcn UI + Sonner

---

## Phase completion

| Phase | Week | Scope | Status |
|-------|------|-------|--------|
| Phase 0 | W1 | Bootstrap, schema, auth, deploy | ✅ 100% |
| Phase 1 | W2 | Dashboard, calendar, NLP, E2E webhooks | ✅ 100% |
| Phase 1 | W3 | State machine, guests, units, inbox | ✅ 100% |
| Phase 2 | W4–5 | Overlap, reports, switcher, tokens, checklists | ✅ 100% |
| Phase 2 | W6 | OAuth, encryption, outbound messaging | 🔄 In progress (6.3 done) |
| Phase 2 | W7–10 | Payments, notifications, polish | 📋 Planned |

---

## Week 4–5 (shipped)

| ID | Task | Status |
|----|------|--------|
| 4.1 | Overlap detection | ✅ [ADR-006](docs/adr/006-booking-overlap-detection.md) |
| 4.6 | Guest notes | ✅ |
| 4.2 | Reports dashboard | ✅ |
| 4.5 | Bundle lazy-load | ✅ |
| 4.3 | Multi-property switcher | ✅ |
| 4.4 | Channel token storage (UI) | ✅ |
| 4.7 | Checklists | ✅ |

**Verification:** [docs/planning/WEEK-4-5-SMOKE-TEST.md](docs/planning/WEEK-4-5-SMOKE-TEST.md)

---

## Week 6 (current sprint)

| ID | Task | Est. | Status |
|----|------|------|--------|
| 6.3 | Token encryption (AES-256-GCM) | 0.5d | ✅ [ADR-007](docs/adr/007-channel-token-encryption.md) |
| 6.1 | WhatsApp OAuth start | 1d | 📋 |
| 6.2 | OAuth callback + token store | 1d | 📋 |
| 6.4 | Settings Connect UI | 0.5d | 📋 |
| 6.5 | Outbound WhatsApp send | 1d | 📋 |

**Spec:** [docs/planning/WEEK-6-KICKOFF.md](docs/planning/WEEK-6-KICKOFF.md)

---

## Week 7–10 (backlog)

| Week | Focus |
|------|-------|
| W7 | Payment tracking (`paidNgn`), deposit flows |
| W8 | Email/SMS notifications, checklist automation |
| W9 | Occupancy heatmap, export CSV, dashboard polish |
| W10 | Production hardening, key rotation, load test |

---

## Planning docs

| Doc | Purpose |
|-----|---------|
| [docs/planning/README.md](docs/planning/README.md) | Navigation |
| [QUICK-REFERENCE-CARD.md](docs/planning/QUICK-REFERENCE-CARD.md) | Daily cheat sheet |
| [WEEK-4-5-TO-WEEK-6-TRANSITION.md](docs/planning/WEEK-4-5-TO-WEEK-6-TRANSITION.md) | Go/no-go |

---

## Execution checklist (per task)

1. Backend (Convex)
2. `pnpm test`
3. UI (if applicable)
4. `pnpm build`
5. `npx convex dev --once`
6. Commit + push
7. Update this plan

---

## Key files (Week 4–5)

| Area | Path |
|------|------|
| Overlap | `convex/functions/bookings.ts` |
| Reports | `convex/functions/reports.ts` |
| Property scope | `convex/lib/auth.ts`, `convex/lib/customFunctions.ts` |
| Channel tokens | `convex/functions/channelTokens.ts`, `channelTokenActions.ts` |
| Checklists | `convex/functions/checklists.ts` |
