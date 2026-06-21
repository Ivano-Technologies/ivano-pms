# Week 2 Performance Targets & Baseline Measurements

Locked targets from architecture review. Baselines captured after Week 2 polish (Task 3.1 + C1/C2).

## Targets

| Metric | Target | Current (baseline) | How to Measure |
|--------|--------|-------------------|----------------|
| Dashboard load time | < 1s | **Not measured** (see notes) | Lighthouse Performance or DevTools Network tab |
| Booking calendar render (30d × 20 units) | < 500ms | **~90ms** (5 units, RTL unit test) | React Testing Library `booking-calendar.test.tsx` |
| Audit trail query (100 entries) | < 200ms | **< 50ms** (convex-test, ≤10 rows) | Convex dashboard → function execution time |
| Web app JS bundle (first load) | < 200kb | **~306kb gzipped est.** (872kb raw) | `pnpm build:web` → `.next/diagnostics/route-bundle-stats.json` |
| Convex functions bundle | < 50kb | **Not surfaced in CLI** | Convex dashboard deploy metrics |

## Baseline Measurements (Week 2 Post-Polish)

**Measured on:** 2026-06-20  
**Environment:** Local dev (`pnpm build:web` production build; convex-test for backend queries)

| Metric | Value | Notes |
|--------|-------|-------|
| Dashboard first-load JS | **872 KB** uncompressed (~306 KB gzipped est.) | Route `/dashboard` from `route-bundle-stats.json` |
| Calendar first-load JS | **886 KB** uncompressed | Route `/dashboard/bookings` (includes shared Clerk/Convex chunks) |
| Calendar component render | **~90ms** | `booking-calendar.test.tsx` (5 units × 30 days, jsdom) |
| Audit trail query | **< 50ms** | `getBookingAuditTrail` in convex-test (3 audit rows) |
| Total static JS chunks | **1,029 KB** | All `.next/static/chunks/*.js` (not first-load only) |
| Convex bundle | **N/A** | `npx convex dev --once` does not print bundle size |

**Dashboard load (stats + pending messages):** Not run in this session — requires signed-in browser session. Use Lighthouse on `http://localhost:3000/dashboard` after `pnpm web:dev`.

**Calendar render (30d × 5 units local):** Unit test covers grid render latency only; excludes Convex `getBookingsByDateRange` fetch. Profile in DevTools Performance tab with live data for end-to-end timing.

**Bundle:** First-load JS **exceeds** the 200 KB gzip target due to Clerk + Convex + Next.js shared chunks. Track weekly; optimize in Week 4 (code splitting).

**Anomalies:**

- Vercel deployment protection returns 401 for unauthenticated smoke tests (see `DEPLOYMENT.md`).
- NLP relative dates (e.g. `next weekend`) resolve from message `createdAt`, not wall-clock “today” — document in support runbooks.

## Future Optimizations (Week 4+)

- Virtual scrolling for audit trail (if > 50 entries)
- Calendar virtualization (if > 50 units)
- Suspense boundaries + streaming on dashboard
- Image optimization (if product photos added)
- Code splitting for booking detail popover / quick-create modal
- Route-level dynamic imports for Clerk-heavy dashboard shell

## Production Monitoring (Post-Deploy)

After Vercel redeploy from `0f6b41e` (and subsequent `8e10553`):

- [ ] Enable Vercel Analytics (automatic, check project dashboard)
- [ ] Set performance alerts: Dashboard > 2s, Calendar > 1s
- [ ] Weekly review of bundle sizes in Vercel deployment logs
- [ ] Lighthouse CI optional (add `@vercel/speed-insights` or Lighthouse CI if budget exceeded)

## How to Re-Measure

```bash
# Tests (calendar render proxy)
pnpm test src/components/bookings/__tests__/booking-calendar.test.tsx

# Production build + route bundle stats
pnpm build:web
# Read apps/web/.next/diagnostics/route-bundle-stats.json

# Convex query timing
# Convex dashboard → Logs → filter getBookingAuditTrail

# Browser (human)
# 1. pnpm web:dev && npx convex dev
# 2. Sign in → /dashboard → Lighthouse Performance
# 3. /dashboard/bookings → Performance tab, record BookingCalendar paint
```

## Test Coverage (C1 polish)

After C1/C2: **81 tests** passing (`pnpm test`), including:

- `tests/convex/booking-edge-cases.test.ts` — overlap, boundaries, FK, scoping
- `tests/convex/nlp.test.ts` — malformed dates, ambiguous unit types, backfill batch
- `tests/convex/booking-transitions.test.ts` — rapid transitions, cancel paths, long reasons

```bash
pnpm test:coverage   # Tier-1 convex + web unit tests
```
