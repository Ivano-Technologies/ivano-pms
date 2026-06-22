# ADR-005: Soft Deletes for Guests & Managers, Hard Deletes for Audit Logs

## Status
ACCEPTED | June 2026

## Decision

1. **Guests / managers:** Soft delete (`isDeleted = true`, retain records for booking history)
2. **Audit logs:** Hard delete after retention window (future batch job; logs kept for liability in MVP)
3. **Bookings:** Status transitions to `cancelled` rather than physical delete

## Rationale

- Soft deletes preserve referential integrity and booking history
- Audit logs support dispute resolution; pruning is a later operational concern
- Bookings are never hard-deleted in MVP

## Related

- [`convex/functions/guests.ts`](../../convex/functions/guests.ts) — `softDeleteGuest`, `restoreGuest`
- [`IVANO_PMS_CURSOR_WORKFLOW_ADR.md`](../../IVANO_PMS_CURSOR_WORKFLOW_ADR.md) — original decision record
