# Planning docs — navigation

Use this folder after Week 4–5 delivery (`92645f3`, 126 tests).

| Document | When to use |
|----------|-------------|
| [WEEK-4-5-SMOKE-TEST.md](./WEEK-4-5-SMOKE-TEST.md) | Manual verification before tagging `v0.5.0-smoke-verified` |
| [WEEK-4-5-TO-WEEK-6-TRANSITION.md](./WEEK-4-5-TO-WEEK-6-TRANSITION.md) | Go/no-go checklist after smoke test |
| [WEEK-6-KICKOFF.md](./WEEK-6-KICKOFF.md) | Week 6 sprint specs (OAuth, encryption, outbound messaging) |
| [QUICK-REFERENCE-CARD.md](./QUICK-REFERENCE-CARD.md) | Daily commands, patterns, env vars |
| [../../IVANO-PMS-EXECUTION-PLAN.md](../../IVANO-PMS-EXECUTION-PLAN.md) | Full phase roadmap |

## Typical flows

**Just shipped Week 4–5**
1. Pre-flight: `pnpm test && pnpm build`
2. Run [WEEK-4-5-SMOKE-TEST.md](./WEEK-4-5-SMOKE-TEST.md)
3. Follow [WEEK-4-5-TO-WEEK-6-TRANSITION.md](./WEEK-4-5-TO-WEEK-6-TRANSITION.md)

**Starting Week 6**
1. Set `CHANNEL_TOKEN_ENCRYPTION_KEY` in Convex dashboard (`openssl rand -base64 32`)
2. Open [WEEK-6-KICKOFF.md](./WEEK-6-KICKOFF.md) — Task 6.3 encryption is done; start 6.1 OAuth callback

**Daily dev**
- Keep [QUICK-REFERENCE-CARD.md](./QUICK-REFERENCE-CARD.md) open
