# ADR-006: Booking Overlap Detection

## Status
ACCEPTED | June 2026

## Decision
Reject overlapping bookings on the same unit at `createBooking` time for active statuses: `inquiry`, `pending_confirmation`, `confirmed`, `checked_in`.

## Overlap rule
Two ranges overlap when:

```
existing.checkInDate < new.checkOut AND existing.checkOut > new.checkIn
```

- Checkout day is **not** occupied (hospitality convention): back-to-back bookings are allowed when checkout equals the next check-in.
- Open-ended bookings (no `checkOutDate`) use the new booking's check-out as a conservative fallback for the existing booking's end date.

## Scan limit
`checkOverlap()` uses `.withIndex("by_unit").take(200)`.

**Known limit:** Units with more than 200 booking rows may miss overlaps against older records outside the scan window. Acceptable for MVP; revisit with a date-bounded index query if unit histories grow large.

## Date validation
`createBooking` rejects `checkOutDate <= checkInDate` when check-out is provided.

## Related
- [`convex/functions/bookings.ts`](../../convex/functions/bookings.ts) — `checkOverlap()`, `createBooking`
- [`tests/convex/booking-overlap.test.ts`](../../tests/convex/booking-overlap.test.ts)
