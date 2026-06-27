# Known Issues

Deliberately tracked tooling/config issues that surface in the aggregate
`pnpm test` run but are **not** application bugs. Listed here so test-count
reports stop carrying them silently as "pre-existing."

Last reviewed: 2026-06-27

---

## 1. Root `pnpm test` drops the web project's jsdom environment

**Symptom:** Component tests that use `@testing-library/react`'s `render`
(`apps/web/src/components/ui/skeleton.test.tsx`,
`status-chip.test.tsx`, `command-palette-shell.test.tsx` — 8 tests) fail
with `ReferenceError: document is not defined`, but **only** when run from
the repo root via `pnpm test`.

**One-line cause:** `apps/web/vitest.config.ts` defines its jsdom
`environment` (and its `src/**` `include`) inside a nested `test.projects`
array added by the A.3 Storybook scaffold; Vitest does not apply nested
projects when that file is itself consumed as a project by the root
`vitest.config.ts`, so the environment silently defaults to `node`.

**Proof it's config, not an app bug:** the same tests pass under
`pnpm --filter @ivano/web exec vitest run` (the web config is used
directly, jsdom honored). Tests using `renderToStaticMarkup`
(e.g. `booking-calendar.test.tsx`) pass from root because they need no DOM.

**Fix direction (deferred):** flatten the web Vitest config so the
unit-test project and the Storybook browser project are both exposed to the
root workspace without a second level of nesting (or have the root
reference the inner project configs directly). Low priority because the
per-package run (`pnpm --filter @ivano/web test`) is correct; only the
aggregate run is affected.

---

## 2. Playwright e2e spec collected by Vitest in root run

**Symptom:** `apps/web/e2e/webhooks.spec.mjs` fails during `pnpm test` with
`Playwright Test did not expect test.describe.configure() to be called here`.

**One-line cause:** same root cause as issue #1 — when the web project's
nested `include: ["src/**/*.test.{ts,tsx}"]` is dropped, Vitest's default
glob widens and collects the Playwright `e2e/*.spec.mjs` file, then tries to
execute Playwright's `test.describe.configure()` under the Vitest runner.

**Fix direction (deferred):** resolved by the same config flattening as #1
(restoring the `src/**`-scoped include), or by explicitly excluding
`e2e/**` from the Vitest include. Playwright e2e is intended to run via its
own runner (`pnpm test:e2e`), not Vitest.

---

## Resolved

- **2026-06-27 — `units.test.ts > getUnitById occupancy` stale assertion.**
  The test hardcoded a booking window (`2026-06-20 → 2026-06-25`) that was
  "around today" when written, but occupancy is computed against wall-clock
  `new Date()`, so the assertion broke once the clock passed the checkout
  date. Occupancy logic in `convex/functions/units.ts` is correct; the test
  now derives its booking window relative to `now`. Fixed in
  `[TASK-6.2.1-6.2.2]` follow-up.
