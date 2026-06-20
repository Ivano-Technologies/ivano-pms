# Ivano IQ → Ivano PMS migration

June 2026: The monorepo was rebuilt as **Ivano Hospitality PMS**. Ivano IQ (vendor licensing) code was removed; history remains in git.

## Schema

The Convex deployment was replaced with nine PMS tables. Running `pnpm seed` loads **Gwarimpa Estate** demo data.

## Webhooks

Set `INTERNAL_JOB_SECRET` and `WEBHOOK_SECRET` in `apps/web/.env.local`. Set `INTERNAL_JOB_SECRET` in the Convex dashboard too. Set `DEFAULT_PROPERTY_ID` after `pnpm seed`.

## Phase 2

Multi-property, payments, and live channel credentials are planned for July–October 2026.
