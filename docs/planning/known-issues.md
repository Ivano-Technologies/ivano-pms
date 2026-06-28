# Known Issues

Deliberately tracked tooling/config issues. Listed here so test-count
reports stop carrying them silently as "pre-existing."

Last reviewed: 2026-06-28

## Open

- **2026-06-28 — Duplicate `vite` versions break `vitest.unit.config.ts`
  typecheck.** `pnpm` resolves both `vite@8.1.0` (direct devDep) and
  `vite@7.3.1` (transitive), so the `react()` plugin (typed against one) is not
  assignable to `defineConfig` (typed against the other). Tests run fine
  (vitest uses the config at runtime, 208 passing) — this is type-level only.
  **Worked around** by excluding `vitest.unit.config.ts` / `vitest.config.ts`
  from the Next production typecheck (`apps/web/tsconfig.json`), since a vitest
  config has no place in the app build. **Proper fix when revisited:** dedupe
  vite via a `pnpm.overrides` pin so one version resolves everywhere. Not
  blocking — production build is green.

- **2026-06-28 — `pnpm --filter @ivano/web lint` not fully green (pre-existing,
  non-blocking).** 4 errors remain, none in the production bundle path:
  `property-context.tsx:51` `react-hooks/set-state-in-effect` (property
  validation writes state inside an effect — functional, needs a small
  refactor), and `src/stories/Page.tsx` (2× `react/no-unescaped-entities`) which
  is untracked `storybook init` demo scaffold. `next build` does not run eslint,
  so these do not gate the build.

- **2026-06-27 — Magic MCP (`@21st-dev/magic`) shows errored / not callable
  from the agent.** The agent runtime exposes the server with no `tools/`
  descriptors and a `STATUS.md` reading "The MCP server errored." A duplicate
  registration also exists: both `@21st-dev/magic` (from global
  `~/.cursor/mcp.json`, pinned `@0.0.46`) and a separate `Magic MCP` entry
  defined outside the JSON config (Cursor's settings store) surface to the
  runtime simultaneously.

  **Investigated (time-boxed):** the suspected Windows `cmd /c` arg-quoting of
  `API_KEY=\"...\"` was **ruled out** — running the exact configured command
  by hand boots cleanly (`Server started (PID …)`) and waits on stdio as
  expected. So quoting is not the root cause. Most likely culprit is the
  duplicate registration conflicting during the MCP handshake/reload, but this
  was not pursued further per scope guidance.

  **Next step (when revisited):** remove the stray `Magic MCP` duplicate via
  Cursor Settings → Tools & MCP so only the JSON-defined `@21st-dev/magic`
  remains, then reload and recheck. Not blocking — Phase B can proceed manually.

- **2026-06-27 — `ui-ux-pro` MCP server not registered with the agent
  runtime.** Pinned to `ui-ux-pro-mcp@1.0.0` in project `.cursor/mcp.json`
  (committed `8a0de12`). The package itself starts fine via `npx` (indexes
  initialize), but no `mcps/ui-ux-pro*` descriptor folder is generated, so no
  tools are exposed to the agent. Needs a full Cursor MCP host restart to
  confirm registration; if it still fails to appear, suspect the `--stdio`
  flag handling or host startup ordering. Not blocking Phase B.

---

## Resolved

- **2026-06-28 — Production build (`next build`) was broken by accumulated type
  errors (launch-readiness audit).** Tests were green (vitest does not
  type-check), masking a `next build` that failed on a chain of issues:
  (1) **stale Convex codegen** — `convex/_generated/api.d.ts` was committed
  without `bulkImport` / `email`, so `api.functions.bulkImport.*` and
  `api.functions.email.*` did not exist on the api type (broke bulk-import +
  email-inbound cards); fixed by `npx convex codegen`.
  (2) **`email` channel missing from return validators** — schema's
  `messageChannel` includes `"email"` but local unions in
  `channelMessages.ts`, `channelTokens.ts`, `webhooks.ts` did not, so handler
  return types did not match their `returns` validators; added `"email"`.
  Convert-to-booking now coerces an `"email"`-origin message to
  `sourceChannel: "direct"` (booking source has no `"email"` member).
  (3) **`emailWebhookActions.processInboundEmail`** hit a self-referential
  `any` (TS7022/7023); added an explicit `Promise<Id<"bookingChannelMessage">>`
  return annotation.
  (4) **JSX in a `.ts` file** — `use-booking-context-panel.ts` contained JSX
  (parse error); renamed to `.tsx`.
  (5) **missing `Button` imports** in `quick-create-booking-modal.tsx` and
  `convert-to-booking-modal.tsx`.
  (6) **`PendingMessageView`** excluded `"email"`; aligned to the shared
  `MessageChannel` type and added an email entry to its local `CHANNEL_META`.
  (7) **story/test mocks** used plain strings for branded `Id`/`Doc` types
  (`phase-c.stories.tsx`, `thread-context-content.test.tsx`); added casts.
  (8) Storybook stories imported the renderer package `@storybook/react`
  directly; switched to `@storybook/nextjs-vite`.
  `next build` and `npx convex codegen` are now both green; 208 tests pass.

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
