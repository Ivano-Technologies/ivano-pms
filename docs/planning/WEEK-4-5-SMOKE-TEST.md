# Week 4–5 smoke test

**Baseline:** commit `92645f3` | **Duration:** 45–60 min | **Requires:** signed-in Clerk user + seeded data

## Pre-flight (5 min)

```bash
pnpm install
pnpm test          # expect 126+ passing
pnpm build         # expect clean
npx convex dev     # terminal 1
pnpm web:dev       # terminal 2
```

Sign in at http://localhost:3000/sign-in → http://localhost:3000/dashboard

---

## Surface 1 — Overlap detection (10 min)

**Route:** `/dashboard/bookings`

1. Open calendar, quick-create a booking: Unit A, Jul 1–3, status **confirmed**
2. Try second booking same unit Jul 2–4 → expect toast/error: *Unit already booked for these dates*
3. Try back-to-back: Jul 3–5 same unit → should **succeed** (checkout day not occupied)
4. Cancel first booking, retry Jul 2–4 → should **succeed**
5. Try check-out before check-in → *Check-out must be after check-in*

**Pass criteria:** Steps 2 and 5 reject; steps 3–4 accept.

---

## Surface 2 — Reports (10 min)

**Route:** `/dashboard/reports`

1. Page loads revenue bar chart (6 months) and occupancy table (30-day range)
2. Create a confirmed booking in current month → revenue bar updates (may need refresh)
3. Occupancy table shows units with % badges (green ≥80%, amber ≥50%)

**Pass criteria:** No loading skeleton stuck; data reflects seed/bookings.

---

## Surface 3 — Property switcher (10 min)

**Requires:** user with 2+ `manager` rows (different `propertyId`, same `clerkUserId`)

1. Sidebar shows **Property** dropdown when ≥2 properties
2. Switch property → guests/units/channels lists change scope
3. Selection persists after page reload (`localStorage`: `ivano-selected-property-id`)

**Pass criteria:** Data scopes to selected property; no `.unique()` Convex errors.

*Single-property dev:* dropdown hidden — note as N/A, not fail.

---

## Surface 4 — Channel tokens (5 min)

**Route:** `/dashboard/settings`

1. Three channel cards: WhatsApp, Telegram, Instagram
2. All show **Not connected** by default
3. **Coming soon** button disabled on each

**Pass criteria:** Cards render; no token values exposed in UI/network tab.

---

## Surface 5 — Booking detail tabs (10 min)

**Route:** `/dashboard/bookings` → click a booking

1. **Details** tab: guest, unit, dates, status, price
2. **History** tab: lazy-loads audit trail (or “No status history yet”)
3. **Checklist** tab: add task (type, description, due date) → appears in list
4. Change status dropdown → updates; delete removes item

**Pass criteria:** Tabs switch without full-page reload; checklist CRUD works.

---

## Guest notes (bonus, 5 min)

**Route:** `/dashboard/guests` → create/edit guest

1. Notes textarea accepts text (max 500 chars)
2. Save and re-open → notes persist

---

## Sign-off

| Check | Pass | Notes |
|-------|------|-------|
| Surface 1 Overlap | ☐ | |
| Surface 2 Reports | ☐ | |
| Surface 3 Property switcher | ☐ / N/A | |
| Surface 4 Channel tokens | ☐ | |
| Surface 5 Booking tabs | ☐ | |
| Guest notes | ☐ | |

When all pass:

```bash
git tag -a v0.5.0-smoke-verified -m "Week 4-5 smoke verified"
git push origin v0.5.0-smoke-verified
```

Proceed to [WEEK-4-5-TO-WEEK-6-TRANSITION.md](./WEEK-4-5-TO-WEEK-6-TRANSITION.md).
