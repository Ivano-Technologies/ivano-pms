# Ivano PMS — UI/UX Redesign Architecture

Status: Draft for review
Author: Claude (architecture), for execution by Cursor
Related: ADR-005 (soft deletes), ADR-006 (booking overlap), ADR-007 (channel token encryption), [launch-scope.md](./launch-scope.md) (Sept 1 IN/OUT)
Suggested: ADR-008 (design system foundations) once token decisions are locked

## 0. How to use this document

This is a strategy and brief, not a spec to paste verbatim into Cursor. The flow is:

1. Read sections 1–9 to align on direction.
2. **Check [launch-scope.md](./launch-scope.md)** — locked Sept 1 IN/OUT; do not treat Phase D-pre or Phase D as launch-blocking unless that doc is revised.
3. Pick or adjust the design tokens in section 6 (ideally in Figma first — see section 11).
4. Turn section 13 into actual `[TASK-X.Y]` tickets in `docs/planning/`, same as the Week 4–6 work.
5. Brief Cursor per-task using the prompting pattern in section 10, leaning on `@21st-dev/magic` for component generation and the UI/UX Pro Max skill for review/critique passes.
6. Keep the test-first gate: each UI task still ships with a test count target, same convention as the rest of the codebase.

I don't have direct access to the `ivano-pms` repo from here, so this is architecture and direction, not a line-by-line diff. Section 4 gives Cursor a short audit script to run first so the plan gets grounded in what's actually on screen today before any component gets touched.

## 1. Design north star

Ivano PMS is used by property managers and front-desk staff running real operations, often on a phone, often on inconsistent network, often switching between 2–10 properties in a session. "World-class" here doesn't mean ornate — it means:

- **Fast to operate, not just fast to load.** Every core action (reply to a guest, create a booking, check today's checklist) should be reachable in 2 actions or fewer from anywhere in the app.
- **Never ambiguous about which property you're in.** Multi-property is the single highest-risk UX surface — a wrong-property mistake means a wrong booking or a wrong guest message.
- **Resilient to bad networks.** Lagos/Abuja mobile data is not Bay Area wifi. Every view needs a meaningful loading state and an offline/stale-data indicator, not a blank screen.
- **Plain language, active voice.** A button that says "Confirm booking" produces a toast that says "Booking confirmed" — never "Submit" / "Success."
- **One visual identity, not a shadcn default.** The app should not read as "generic AI-generated SaaS template" (cream+serif, near-black+neon accent, or hairline-newspaper layouts are the three defaults to consciously avoid). Pick a palette and type pairing that's deliberately *yours*, not the first thing a component generator suggests.

Useful category reference points for behavior (not visuals to copy): Linear's command-first navigation and keyboard speed, Stripe Dashboard's density-without-clutter for financial data, Superhuman's inbox triage speed, and how Airbnb's host calendar keeps booking conflicts legible at a glance. These are reference points for *interaction patterns*, not a license to look like any of them.

## 2. Constraints to design around (from current architecture)

- Next.js 14 + Convex + Clerk + Tailwind. Components over 50KB are lazy-loaded via `next/dynamic` — the redesign should preserve and extend this, not fight it with a heavier component library.
- `selectedPropertyId` lives in localStorage and is threaded through every scoped query — the property switcher is structurally load-bearing, not cosmetic. Redesign it carefully.
- All mutations go through `assertPropertyAccess` — meaning the UI can trust that what it's allowed to show is also what it's allowed to act on. Good foundation for optimistic UI (see section 7).
- Channel tokens are encrypted server-side and never exposed to the client — so channel-connection UI is pure status/intent (connect, disconnect, reauth), never token display.
- Test-first, with explicit test counts as acceptance gates — every UI task below should ship with component/interaction tests, not just visual review.

## 3. Run this audit before designing (Cursor, 30–60 min)

Since I can't see the live app, have Cursor produce:

1. A screenshot pass of every top-level route (desktop + mobile viewport) using the existing Playwright setup — drop them in `docs/planning/ux-audit/`.
2. A component inventory: which primitives currently exist (buttons, modals, tables, forms) and whether they're hand-rolled or shadcn-based.
3. A note on current icon library in use (consolidate to one — Lucide is a safe default given it's already common in this stack).
4. Current Lighthouse/web-vitals numbers for the 3–4 heaviest routes (Inbox, Calendar/Bookings, Reports).

This gives a concrete "before" to measure the redesign against, and stops the redesign from guessing at problems that don't exist.

## 4. Information architecture redesign

Single persistent shell, three zones (see diagram shared in chat):

- **Command bar** (top, always visible): property switcher, global search (guests, bookings, threads), notifications. This is also where a `Cmd/Ctrl+K` command palette lives — jump to any property, booking, or guest thread without touching the mouse.
- **Nav rail** (left): Inbox, Calendar/Bookings, Checklists, Reports, Channels, Settings. Collapses to icons-only on smaller viewports; collapses entirely on mobile into a bottom tab bar (5 items max).
- **Workspace** (center/right): the active view, plus a **persistent context panel** on the right for anything booking- or guest-related (visible from Inbox, Calendar, and Checklists alike) — so a manager never loses booking context while triaging a message thread.

This directly addresses the multi-property risk in section 1: the property switcher lives in the one UI element that's visible from literally every screen, and it should show the property name plainly (not just an ID or initials) with a confirmation-style visual change (e.g. a colored accent bar tied to that property) so a context switch is impossible to miss.

## 5. Flow-by-flow redesign ideas

### 5.1 Unified inbox → booking conversion
- Channel identity as a visual tag on every thread (not just an icon) — WhatsApp / Telegram / Instagram clearly distinguishable at a glance in a thread list.
- Thread view with the context panel open by default, showing any linked booking, guest history, and a single "Create booking from this thread" action that pre-fills dates/guest info parsed from the conversation where possible.
- Inline status chips for thread state (new, awaiting reply, booked, closed) — this is the metric that matters most for "efficiency," since inbox-to-booking conversion is the core business workflow.
- Reply box: keyboard-first send (`Cmd+Enter`), template/canned-response picker for common replies (availability, pricing, check-in instructions).

### 5.2 Property switcher
- Searchable dropdown from the command bar, recent properties pinned to the top, each with a small distinguishing visual (initial + consistent per-property accent color, not a generic building icon).
- Switching property should never trigger a full page reload — swap data in place with a brief, deliberate transition so the change registers, but stays fast.

### 5.3 Booking calendar & overlap detection
- Timeline/Gantt-style calendar per property, not a generic month grid — bookings as horizontal bars makes overlap and gaps far easier to read than date-cell badges.
- Color encodes booking status (confirmed / pending / blocked), not channel — channel already has its own tag in the inbox; don't double up the same color axis for two different meanings.
- Conflict states (tied to the existing `.take(200)` overlap check from ADR-006) get an explicit visual marker on the calendar itself, not just a toast when creating — managers should see a conflict before they try to book into it.
- Drag-to-create and drag-to-extend for bookings, with the same overlap validation firing inline.

### 5.4 Reports
- Lead with the numbers that drive decisions (occupancy, revenue in NGN, conversion rate from inbox), formatted consistently with the NGN formatting already established elsewhere in the app.
- Sparklines on summary cards, full chart only on drill-in — keeps the dashboard scannable rather than chart-heavy.
- Date-range picker as a single reusable component shared across all report views (reduces both code surface and learning curve).

### 5.5 Checklists
- Per-booking checklist as a slide-over from the booking context panel, not a separate full-page view — checklists are almost always consulted *while* looking at a booking, not on their own.
- Templated checklists per property type, editable per property — reduces repetitive setup work.

### 5.6 Channel connection management (WhatsApp/Telegram/Instagram)
- This is your literal next task (6.1, WhatsApp OAuth start route) — worth designing the *pattern* once so Telegram/Instagram reuse it rather than each channel getting a bespoke flow.
- Clear three-state UI per channel: not connected / connecting (with real OAuth loading state, not a spinner with no context) / connected (showing which number/handle, when it was connected, and a disconnect action).
- Failure states need to say *what* failed in plain language ("WhatsApp couldn't verify this number" beats "Error: unauthorized"), consistent with the "errors don't apologize, never vague" principle.

### 5.7 Empty, loading, and error states
- Every list/table view needs three states designed up front: loading (skeleton, not spinner, matching the eventual layout), empty (an actionable invitation — "Connect a channel to start receiving guest messages" with the action right there, not just a sad illustration), and error (plain explanation + retry).
- Given Nigerian network variability: add a lightweight stale-data indicator (e.g. "Updated 2 minutes ago — reconnecting…") rather than letting a screen silently go out of date.

## 6. Design system / token architecture

Don't lock hex values in this document — that's a 30-minute exploration in Figma (see section 11), ideally with 2–3 directions screenshotted side by side before committing. But the system should have:

- **Color**: a primary brand color distinct from the generic AI-blue/purple that every shadcn-default app ships with, a semantic set (success/warning/danger/info) kept separate from brand color, and a neutral gray scale for structure. Decide early whether dark mode is in scope for v1 — if property managers work night shifts, it's worth strong consideration, but it doubles the token QA surface, so make the call explicitly rather than by default.
- **Type**: one display/heading face used with restraint, one body face, and — given how numeric this product is (NGN amounts, dates, booking counts) — consider a tabular/monospaced figure style for numbers in reports and calendars so columns of numbers align cleanly.
- **Spacing/radius**: a single scale (e.g. 4/8/12/16/24/32) and one radius value reused everywhere rather than per-component improvisation — this is what makes a UI feel "designed" rather than "assembled."
- **Motion**: deliberate, not decorative — page-level transitions only where they communicate something real (property switch, booking created), no ambient animation. Respect `prefers-reduced-motion`.
- **Icons**: pick one library project-wide (Lucide is the practical default given your existing stack) and stop mixing.

## 7. Efficiency & performance UX patterns

- **Command palette** (`Cmd/Ctrl+K`) for navigation, property switch, and search — this single feature does more for "efficiency" than almost anything else on this list.
- **Optimistic UI** for mutations already protected by `assertPropertyAccess` — booking creation, checklist toggling, and reply sending should all feel instant, with rollback-on-failure handled quietly.
- **Keyboard shortcuts** for the highest-frequency actions (reply send, mark thread done, next/previous thread) — document them in a `?`-triggered shortcut sheet.
- **Skeleton screens**, not spinners, for any view with a predictable layout — preserves spatial memory while data loads, which matters more on slower connections.
- Preserve and extend the existing `next/dynamic` lazy-loading discipline as new heavier components (calendar, charts) get built.

## 8. Accessibility & quality floor

- Keyboard navigable end to end, visible focus states (don't strip default outlines without replacing them).
- Color contrast meeting WCAG AA at minimum, checked at token-definition time, not after the fact.
- Status communicated through more than color alone (icon or label alongside color for booking status, channel, conflict states) — also makes the product usable for colorblind users and clearer for everyone else.
- All of the above should be testable: extend the existing Playwright suite with `@axe-core/playwright` checks rather than treating accessibility as a manual one-time pass.

## 9. Mobile-specific considerations

- Bottom tab bar (5 items max) replacing the nav rail below a breakpoint, not a hidden hamburger menu — the core flows need to stay one tap away.
- Inbox and calendar are the two views most likely to be used one-handed on a phone — design those mobile layouts first, not last.
- Touch targets ≥44px, especially on the calendar (booking bars) and checklist toggles.

## 10. Briefing Cursor with 21st.dev Magic + UI/UX Pro Max

Practical workflow per component/flow:

1. **Frame the brief** in the ticket itself: which flow (from section 5), what it needs to do, which existing primitives it should reuse, and the relevant token decisions from section 6. Magic and Pro Max both generate better output from a concrete brief than from "make the inbox nicer."
2. **Generate with `@21st-dev/magic`** for the component scaffold, **then run a UI/UX Pro Max critique pass** against this document's north star (section 1) and the specific flow's requirements (section 5) before accepting it — treat Pro Max as the reviewer, not just a second generator.
3. **Test-first as usual**: write/extend the interaction tests before or alongside accepting the generated component, same convention as the rest of the codebase.
4. **Screenshot diff** against the section-3 audit baseline so each change has a visible before/after in the PR.

## 11. Additional resources worth adding

Direct answer to "are there other resources we'd need":

| Resource | Why | Priority |
|---|---|---|
| **Figma** (you already have Figma MCP skills available — `figma-use`, `figma-generate-design`, `figma-generate-library`, `figma-code-connect`) | Lock the token system (section 6) and a few key screens visually *before* Cursor generates code. Cheaper to iterate on a static frame than on a live component. Code Connect can then map locked Figma components to the actual React components, keeping design and code from drifting apart. | High |
| **Storybook** | A living catalog of the new primitives (buttons, cards, status chips, calendar bar) makes it much easier to keep 21st.dev Magic generations consistent over a multi-task redesign instead of each task reinventing a slightly different button. | High |
| **`@axe-core/playwright`** | Folds accessibility checks into the existing Playwright suite rather than a manual pass — fits the test-first convention directly. | High |
| **Lighthouse CI** | Turns the section-3 audit numbers into a tracked budget so the redesign doesn't quietly regress performance while improving visuals — important given the 511ms dashboard win already achieved on EAM. | Medium |
| **PostHog (or similar) session replay/analytics** | Post-launch, this is how you validate whether the inbox-to-booking conversion flow actually got faster, not just prettier — worth wiring in before the Sept 1 hard launch, not after. | Medium |
| **Network throttling profiles in testing** (Chrome DevTools "Slow 3G"/"Fast 3G", or WebPageTest) | Given the explicit design goal of resilience to Nigerian mobile networks, this should be part of how every new view gets checked, not an afterthought. | Medium |
| **v0.dev (Vercel)** | You're already on Vercel — v0 is a reasonable second source of component scaffolds alongside 21st.dev Magic if Magic's output doesn't fit a particular flow well. Optional, not required. | Low |
| **tweakcn or a similar shadcn theme builder** | Useful only if the component layer ends up being shadcn-based — speeds up applying the section-6 token decisions consistently. Skip if Magic-generated components don't lean on shadcn. | Low |

Nothing above is a hard blocker — Cursor with `@21st-dev/magic`, `ui-ux-pro-mcp`/`uipro-cli`, your existing Playwright setup, and Figma (already available to me directly, if you want me to prototype screens there) covers the actual redesign work. Figma and Storybook are the two I'd genuinely prioritize adding, since both reduce drift on a redesign this broad.

## 12. Launch scope (Sept 1)

**Locked decision** — full IN/OUT list: [launch-scope.md](./launch-scope.md).

Summary:

- **IN:** Shell redesign (Phases A–C, done), manual guest/booking entry, bulk import, email inbound (prod confirmation pending), Telegram backend (parked — not a launch gate).
- **OUT (post-launch parallel track):** Phase D-pre flow redesigns, Phase D polish, full Telegram/Instagram/WhatsApp enablement, Resend outbound, DNS hardening, custom email domains.

Do not treat Phase D-pre or Phase D work as launch-blocking unless `launch-scope.md` is explicitly revised.

## 13. Phased execution plan (turn into `[TASK-X.Y]` tickets)

### Phase naming note (2026-06-27)

Commits tagged `[TASK-C.1]`–`[TASK-C.3]` shipped **context-shell wiring** (inbox route rename, context panel content from Inbox/Calendar, checklist slide-over). That work is **closed** — treat it as **Phase C** below.

The **heavy flow redesigns** originally listed here as “Phase C — Core flows” (inbox thread states, create-booking-from-thread, calendar timeline, reports) were **not** part of those commits. Going forward, call that scope **Phase D-pre** so “Phase C” is not overloaded.

| Label | Status | Scope |
|-------|--------|--------|
| Phase A | Done | Tokens, audit, primitives |
| Phase B | Done | Command bar, nav rail, context panel shell |
| **Phase C** | **Closed** | Context panel plumbing, checklist slide-over, `/dashboard/inbox` rename |
| **Phase D-pre** | Next | Inbox/calendar/reports flow redesigns (below) |
| Phase D | Planned | Channels & polish (section below) |

Do not retroactively relabel the shipped `[TASK-C.*]` commits; use this table for future sessions only.

---

**Phase A — Foundation (block everything else)** — *done*
- A.1 Lock design tokens (color, type, spacing, radius, motion) — Figma exploration, 2–3 directions reviewed
- A.2 Run the audit in section 3, commit screenshots + component inventory to `docs/planning/ux-audit/`
- A.3 Build/extend the primitive layer (button, card, status chip, skeleton, command palette shell) in Storybook

**Phase B — Shell** — *done*
- B.1 Command bar with property switcher + global search + `Cmd/Ctrl+K` palette
- B.2 Nav rail (desktop) + bottom tab bar (mobile breakpoint)
- B.3 Context panel pattern (shared by Inbox, Calendar, Checklists)

**Phase C — Context shell wiring** — *closed (commits `TASK-C.1`–`TASK-C.3`)*
- C.1 Inbox route rename (`/dashboard/inbox`; legacy `/dashboard/channels` redirects)
- C.2 Context panel content wired from Inbox (thread/booking) and Calendar (booking)
- C.3 Checklist slide-over from booking context panel + Storybook

**Phase D-pre — Core flow redesigns** *(formerly “Phase C — Core flows” in this doc)*
- D-pre.1 Inbox redesign (channel tags, thread states, create-booking-from-thread)
- D-pre.2 Calendar redesign (timeline bars, conflict markers, drag-to-create)
- D-pre.3 Reports redesign (summary cards + sparklines, shared date-range picker)
- ~~D-pre.4 Checklists as context-panel slide-over~~ — delivered under Phase C.3

**Phase D — Channels & polish**
- D.1 Unified channel-connection pattern (apply to the WhatsApp OAuth start route you're about to build, then reuse for Telegram/Instagram)
- D.2 Empty/loading/error states pass across all views
- D.3 Accessibility pass (`@axe-core/playwright`) + Lighthouse CI budgets
- D.4 Mobile pass + network-throttled testing

Each phase should still close with a test-count-gated commit, same as Weeks 4–6.
