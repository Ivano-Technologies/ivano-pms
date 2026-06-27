# Known Issues

Deliberately tracked tooling/config issues. Listed here so test-count
reports stop carrying them silently as "pre-existing."

Last reviewed: 2026-06-27

No open issues. See **Resolved** below.

---

## Resolved

- **2026-06-27 — Root `pnpm test` dropped the web jsdom environment + e2e
  miscollection.** `apps/web/vitest.config.ts` declared its jsdom
  `environment` and `src/**` `include` inside a nested `test.projects`
  array (added by the A.3 Storybook scaffold). Vitest does not apply nested
  projects when that file is consumed as a project by the root workspace, so
  in the aggregate `pnpm test` run the environment defaulted to `node`
  (breaking `@testing-library/react` renders with `document is not defined`
  across `skeleton`, `status-chip`, `command-palette-shell` — 8 tests) and
  the default include widened to collect the Playwright `e2e/webhooks.spec.mjs`
  (failing on `test.describe.configure()`).

  **Fix:** extracted the flat unit-test project into
  `apps/web/vitest.unit.config.ts` (jsdom + `src/**` include + `e2e/**`
  excluded + node override for `src/app/api/**`). The root `vitest.config.ts`
  now references that flat config directly (no nesting), and
  `apps/web/vitest.config.ts` composes the flat unit project plus the
  Storybook browser project for the web-package run. Aggregate `pnpm test`
  is now fully green (189 passed). Fixed in `[TASK-6.2.1-6.2.2]` follow-up.

- **2026-06-27 — `units.test.ts > getUnitById occupancy` stale assertion.**
  The test hardcoded a booking window (`2026-06-20 → 2026-06-25`) that was
  "around today" when written, but occupancy is computed against wall-clock
  `new Date()`, so the assertion broke once the clock passed the checkout
  date. Occupancy logic in `convex/functions/units.ts` is correct; the test
  now derives its booking window relative to `now`. Fixed in
  `[TASK-6.2.1-6.2.2]` follow-up.
