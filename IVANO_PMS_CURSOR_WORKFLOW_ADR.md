# Ivano PMS: Cursor Agent Workflow & Architecture Decisions
**Team Collaboration Guide | Structured Prompting | Decision Log**

---

## PART 1: CURSOR AGENT WORKFLOW

### Session Structure & Handoff Protocol

When working with Cursor (solo or async team collaboration), follow this pattern for each feature:

#### **Step A: Context Dump (Start of Session)**

Before giving Cursor a task, paste this into the chat:

```
# Session Context: Ivano PMS Development

## Project Status
- **Target Launch:** Sept 1, 2026
- **Current Phase:** [Phase 0/1/2/3/4]
- **Sprint:** Week [X] of 10
- **Last Completed:** [List 2–3 recent commits from git log]

## Relevant Files
- Convex schema: convex/schema.ts
- API routes: services/api/src/routes/
- Components: app/components/
- Config: .env.example

## Team & Dependencies
- **Dev A (Backend):** Working on [current task]
- **Dev B (Frontend):** Working on [current task]
- **Dev C (Integration):** Working on [current task]
- **Blocked by:** [If any inter-team dependency]

## Key Constraints (This Project)
1. Single currency (NGN)
2. Single property, single branch
3. Hospitality PMS (future mixed-use)
4. Sept 1, 2026 hard deadline
5. Conservative budget (no external contractors)
6. WhatsApp/Telegram/Instagram messaging (core)
7. No payment processing in MVP

## Code Style Guidelines
- TypeScript strict mode
- Convex: v_namespace conventions, validators
- React: React Hook Form + Zod
- Styling: Tailwind CSS
- Error handling: Custom error classes + consistent response format
- Testing: Vitest for unit, Playwright for E2E
- Commits: Conventional commits (feat:, fix:, refactor:, docs:, test:, chore:)

---

[Now paste your task below]
```

#### **Step B: Task Prompt (Specific Feature)**

Use the structure from Section 7 of the main plan. Example:

```
## Task: Implement Booking Calendar Component

### Current State
- Convex schema ready (BOOKING, UNIT, GUEST, PROPERTY)
- Booking API endpoints 80% complete
- Dashboard layout in place

### Requirements
1. Display month view calendar, color-coded by booking status
2. Click date to create booking
3. Click event to open booking detail modal
4. Show occupancy % per unit in footer
5. Responsive: mobile-first, desktop-optimized
6. Accessibility: WCAG 2.1 AA (keyboard nav, aria labels)

### Deliverables
1. components/BookingCalendar.tsx — Main calendar component
2. app/dashboard/bookings/page.tsx — Route & layout integration
3. components/common/DateCell.tsx — Per-cell rendering logic
4. __tests__/BookingCalendar.test.tsx — Unit tests + Storybook stories
5. MIGRATION.md — If schema changes needed

### Constraints
- Max 8 hours dev time
- No external dependencies beyond: react-calendar, recharts, date-fns
- Mobile layout must work on 320px+ width
- Must not exceed 2s render time with 90-day calendar

### Testing Checklist
- [ ] Create 10 mock bookings across 3 units
- [ ] Verify calendar renders without lag
- [ ] Test date picker on mobile (iOS Safari, Android Chrome)
- [ ] Verify keyboard nav (Tab, Enter, Escape)
- [ ] Storybook story for each state (booked, available, maintenance, past)

### Rollback Plan
- If >2s render time: implement virtual scrolling or day-view-only fallback
- If accessibility fails: simplify to list-based view + date filter

---

[Cursor responds with implementation]
```

#### **Step C: Output Review & Integration**

Once Cursor outputs code:

1. **Scan for issues** (30 seconds):
   - TypeScript errors? (use `tsc --noEmit`)
   - Missing imports?
   - Off-by-one errors in dates?

2. **Test locally**:
   ```bash
   cd apps/web
   npm run dev
   # Navigate to /dashboard/bookings
   # Click calendar, verify rendering & interactions
   ```

3. **Commit & push**:
   ```bash
   git add components/BookingCalendar.tsx app/dashboard/bookings/page.tsx __tests__/BookingCalendar.test.tsx
   git commit -m "feat: implement booking calendar with month view and event details"
   git push origin feature/booking-calendar
   ```

4. **Create PR**:
   - Paste Cursor output (or summary) in PR description
   - Link to this task in the issue
   - Tag reviewers (other team members)

5. **Code review**:
   - Check for: performance, accessibility, test coverage, style consistency
   - Request changes if needed → Cursor iterates

6. **Merge to `develop`**:
   - Vercel auto-deploys to staging
   - Manual test on staging before pushing to main

---

### Session Handoff (Async Team Collaboration)

When handing off mid-task to another developer:

```
# Handoff: Booking Calendar → [Next Dev]

## Completed
✅ BookingCalendar.tsx — Core component, month view working
✅ DateCell rendering logic
✅ Unit tests (8/10 passing)

## In Progress
🟡 Storybook stories (5 of 6 done)
🟡 Mobile layout testing (iOS Safari need to verify)

## Blockers
❌ Accessibility test failing: keyboard Nav (Tab key not reaching calendar)
   - Suspect: z-index issue with modal overlay
   - File: components/BookingCalendar.tsx line 127

## Next Steps
1. Fix accessibility (Tab key focus trap)
2. Finish Storybook stories
3. Deploy to staging & UAT
4. Merge to main

## Files to Review
- components/BookingCalendar.tsx
- __tests__/BookingCalendar.test.tsx
- app/dashboard/bookings/page.tsx

---

[@dev-b, ready to take this?]
```

---

## PART 2: STRUCTURED CURSOR RULES (`.cursor/rules`)

Create `.cursor/rules` in repo root to guide Cursor on style, patterns, and constraints:

```yaml
# .cursor/rules.yaml - Cursor agent guidelines for Ivano PMS

project_name: "Ivano Hospitality PMS"
launch_date: "2026-09-01"
team_size: "2-3 developers"

## CODING STANDARDS

typescript:
  strict_mode: true
  no_any: "only when absolutely necessary (document with @ts-expect-error)"
  naming:
    components: "PascalCase (BookingCalendar, GuestForm)"
    functions: "camelCase (getBookings, formatCurrency)"
    constants: "UPPER_SNAKE_CASE (API_TIMEOUT, MAX_BOOKINGS_PER_DAY)"
    types: "PascalCase (BookingStatus, GuestData)"

react:
  version: "18+"
  functional_components_only: true
  hooks_only: "useState, useEffect, useContext, useCallback, useReducer"
  custom_hooks: "use[Name] pattern (useBooking, useGuests)"
  performance:
    - "Memoize expensive components (React.memo)"
    - "useMemo for derived data"
    - "useCallback for event handlers passed as props"
  styling: "Tailwind CSS only (no inline styles)"
  forms: "React Hook Form + Zod validation"
  state_management: "Convex for server state, local React state for UI"

convex:
  conventions:
    tables: "snake_case (bookings, channel_messages)"
    validators: "v_namespace (v.number(), v.string(), v.optional())"
    mutations: "createX, updateX, deleteX (not addX or removeX)"
    queries: "getX, listX (plural for lists)"
  auth: "JWT via Express middleware + Convex auth context"
  indexes: "Add indexes for: check_in_date, status, created_at, channel"

express:
  routing: "Feature-scoped routes (bookings.ts, guests.ts, channels.ts)"
  error_handling: "Custom AppError class with status codes + message"
  middleware: "Auth, logging, validation, CORS"
  response_format: '{ success: boolean, data?: T, error?: string, code?: string }'

## ERROR HANDLING

error_class: |
  class AppError extends Error {
    constructor(
      public message: string,
      public status: number = 500,
      public code: string = "INTERNAL_ERROR"
    ) {
      super(message);
    }
  }

response_format: |
  Success: { success: true, data: {...} }
  Failure: { success: false, error: "User-friendly message", code: "ERROR_CODE" }
  Validation: { success: false, error: "Field required", field: "email" }

## DATABASE

convex_schema:
  soft_deletes: true
  audit_log: "Log all mutations for compliance"
  timestamps: "created_at, updated_at on all tables"
  constraints: "Foreign keys enforced, no orphan records"
  timezone: "UTC for all timestamps"

## TESTING

unit_tests:
  framework: "Vitest"
  coverage_target: "80%"
  pattern: "__tests__/[Feature].test.ts"
  imports: "describe, it, expect, vi (mocking)"

e2e_tests:
  framework: "Playwright"
  pattern: "tests/e2e/[Feature].spec.ts"
  browsers: "chromium, firefox, webkit"

## PERFORMANCE

performance_targets:
  page_load: "<2s (Core Web Vitals: LCP <2.5s, FCP <1.8s, CLS <0.1)"
  api_response: "<500ms p95"
  mutations: "<1s"
  calendar_render: "<1.5s (90-day view)"

optimization:
  - "Lazy load routes (React.lazy)"
  - "Code split by route"
  - "Image optimization (next/image)"
  - "Memoize expensive queries"
  - "Pagination for large lists (limit 50, offset)"

## SECURITY

security_checklist:
  - "HTTPS enforced (Vercel)"
  - "CORS restricted to origin domain"
  - "JWT validation on all protected routes"
  - "Rate limiting: 100 req/min per IP"
  - "Input validation (Zod schemas)"
  - "No secrets in logs (PII, tokens masked)"
  - "Webhook signature validation (WhatsApp, Telegram)"

## ACCESSIBILITY

wcag_2_1_aa:
  - "Keyboard navigation (Tab, Enter, Escape)"
  - "ARIA labels on interactive elements"
  - "Color contrast: 4.5:1 text, 3:1 non-text"
  - "Focus indicators visible"
  - "Semantic HTML (<button>, <nav>, <form>)"

## NAMING CONVENTIONS

features:
  booking: "Lease/booking management (create, edit, check-in, check-out)"
  guest: "Guest/tenant profile (full name, contact, ID verification)"
  unit: "Room/unit inventory (occupancy, pricing, amenities)"
  channel: "Messaging intake (WhatsApp, Telegram, Instagram)"
  dashboard: "Manager dashboard (overview, calendar, stats)"
  reports: "Analytics (occupancy, revenue, sources, exports)"

files:
  components: "Singular descriptive name: BookingCalendar, GuestForm, ChannelInbox"
  pages: "Route-based names: app/dashboard/bookings/page.tsx"
  hooks: "use[Domain][Action]: useBooking, useGuests, useChannelMessages"
  types: "domain.[entity].ts: types/booking.types.ts, types/guest.types.ts"
  utils: "Grouped by function: utils/date.ts, utils/currency.ts, utils/validation.ts"

## COMMIT MESSAGE FORMAT

commit_format: "Conventional Commits"
examples:
  - "feat: add booking calendar with month view"
  - "fix: prevent overlapping bookings on same unit"
  - "refactor: extract date utilities to lib/date.ts"
  - "docs: add API endpoint documentation"
  - "test: add unit tests for booking validation"
  - "chore: update dependencies"

## DOCUMENTATION

code_comments:
  - "Complex logic: explain WHY, not WHAT"
  - "API contracts: JSDoc for params, return, throws"
  - "TODOs: format as 'TODO: [scope] [description] - @[dev]'"

readme:
  - "Keep up-to-date with feature additions"
  - "Link to docs/ folder"
  - "Update .env.example on env var changes"

## CONSTRAINTS (Project-Specific)

project_constraints:
  - "Single currency: NGN (format: ₦X,XXX.XX)"
  - "Single property: No multi-property logic in MVP"
  - "Single branch: No organizational hierarchy yet"
  - "Launch hard deadline: Sept 1, 2026 (no exceptions)"
  - "Conservative budget: No SaaS tools beyond essentials"
  - "No payment processing in MVP: Placeholder for Oct 2026"
  - "Hospitality-first: Design for short-term bookings (nightly, weekly)"
  - "Future mixed-use: Design data model to support residential leases"

## BRANCHING STRATEGY

branches:
  main: "Production-ready, tagged releases"
  develop: "Integration branch, staging deploys"
  feature/[name]: "Feature branches, PR to develop"
  release/[version]: "Release candidates, PR to main"
  hotfix/[name]: "Production fixes, PR to main + develop"

pull_requests:
  template: |
    ## Description
    [What does this PR do?]

    ## Related Issue
    [Link to GitHub issue]

    ## Checklist
    - [ ] Tests pass locally
    - [ ] No console warnings/errors
    - [ ] Accessibility: WCAG 2.1 AA
    - [ ] Performance: <2s page load
    - [ ] Code review ready

    ## Testing Steps
    1. [Step 1]
    2. [Step 2]

  required_approvals: 1
  auto_merge: false

## ROLLBACK PLAN

rollback:
  minor_issue: "Revert commit, redeploy main"
  data_corruption: "Restore from daily backup, audit affected records"
  performance_regression: "Switch to previous release tag, investigate root cause"

---

# END OF RULES
```

---

## PART 3: ARCHITECTURE DECISION RECORD (ADR)

Use this template for major technical decisions. Store in `docs/adr/`:

### ADR-001: Convex as Backend (Already Decided)

**File:** `docs/adr/001-convex-backend.md`

```markdown
# ADR-001: Use Convex as Primary Backend

## Status
ACCEPTED | Date: June 2024 | Author: Kezie

## Context
We need a backend for a real-time hospitality PMS with minimal operations overhead.
Options:
1. **Convex** — Serverless, real-time subscriptions, built-in auth
2. **Firebase** — Similar, but past auth issues
3. **Express + PostgreSQL** — Full control, but more ops

## Decision
**Use Convex for core backend logic (mutations, queries, real-time subscriptions).**
**Use Express API for integrations (webhooks, payment processors, third-party APIs).**

## Rationale
- Real-time booking updates → Convex subscriptions
- Serverless = 0 DevOps cost
- Typed mutations/queries prevent bugs
- Auth + RLS out-of-box
- Convex Dashboard for debugging

## Alternatives Considered
1. Firebase: Rejected due to past auth complexity
2. PostgreSQL + Prisma: Would need separate deployment, scaling concerns
3. Supabase: Good, but Convex better for real-time

## Consequences
- **Positive**: Fast development, real-time, serverless scaling
- **Negative**: Convex-specific vendor lock-in, limited query flexibility (no joins)
- **Mitigation**: Keep business logic in Express layer, Convex = data access only

## Related Decisions
- ADR-002: Express API Layer for Integrations

## Review Notes
- Confirmed with team on June 20, 2026
- No blockers identified
```

### ADR-002: Express API Layer for Integrations (NEW)

**File:** `docs/adr/002-express-api-layer.md`

```markdown
# ADR-002: Express API Layer for Integrations

## Status
ACCEPTED | Date: June 2026 | Author: [Team]

## Context
Convex is great for core data, but:
- Webhook handling (WhatsApp, Telegram, Instagram) needs custom logic
- Payment processors (Flutterwave, Paystack) require API keys + business logic
- Rate limiting, request logging, middleware chains are easier in Express

## Decision
**Implement thin Express API layer that:**
1. Receives webhooks from channels
2. Authenticates + logs requests
3. Calls Convex mutations
4. Handles external API calls (future payment processing)

```
Frontend (Next.js + Convex client)
    ↓
Express API Layer (services/api)
    ├─ POST /api/webhooks/whatsapp
    ├─ POST /api/webhooks/telegram
    ├─ POST /api/webhooks/instagram
    ├─ GET/POST /api/bookings (delegates to Convex)
    └─ [Future: POST /api/payments]
    ↓
Convex Backend (mutations, queries)
    ↓
Database
```

## Rationale
- Separates concerns: frontend (Next.js) ↔ API (Express) ↔ data (Convex)
- Easier to add non-Convex services (payments, SMS)
- Middleware stack for logging, auth, rate limiting
- Can scale Express independently if needed

## Alternatives Considered
1. Put webhook logic in Convex directly: Harder to debug, less flexible
2. Next.js API routes only: No Express, but adds complexity to Next.js build
3. Separate Express server (current setup): Chosen, kept

## Consequences
- **Positive**: Clean separation, easier to maintain + extend
- **Negative**: Extra network hop (frontend → Express → Convex)
- **Mitigation**: Local (same machine) deploy in dev, Vercel + Railway in prod

## Related Decisions
- ADR-001: Convex Backend
- ADR-003: Channel Webhook Strategy

## Review Notes
- Agreed June 20, 2026
- Dev C to implement webhook layer in Week 6
```

### ADR-003: Channel Message Queue (NOT Direct Conversion)

**File:** `docs/adr/003-channel-message-queue.md`

```markdown
# ADR-003: Channel Message Queue (Manager Review Before Booking Conversion)

## Status
ACCEPTED | Date: June 2026 | Author: [Team]

## Context
Incoming WhatsApp/Telegram/IG messages could directly create bookings (auto-convert).
But risk: fake/spam messages, scammers, malformed data → corrupted bookings.

## Decision
**Implement message queue:**
1. Webhook receives message → store in `BOOKING_CHANNEL_MESSAGE`
2. Status = "new" (not yet converted)
3. Manager reviews queue: "Convert to Booking" button
4. Manager fills form (pre-populated from message) → creates BOOKING
5. Sends confirmation back to guest via same channel

## Rationale
- Human-in-the-loop: Manager catches spam/scams
- Time to review: Manager can refine dates, guest count, unit choice
- Audit trail: All messages logged, intent clear
- Future: Auto-conversion for trusted senders (repeat guests)

## Alternatives Considered
1. Direct booking creation: Faster, but risk of data corruption
2. Email confirmation (no immediate feedback): Slower, worse UX
3. Manager approval in booking table: Less visible, messages scattered

## Consequences
- **Positive**: Safety, flexibility, audit trail
- **Negative**: Extra step for manager (queue → conversion)
- **Mitigation**: 1-click convert, pre-filled form, keyboard shortcuts for power users

## Related Decisions
- ADR-002: Express API Layer

## Review Notes
- Product decision: Safety > speed for MVP
- Team agreed June 20, 2026
```

### ADR-004: Single Currency & Property (MVP Constraint)

**File:** `docs/adr/004-single-currency-property-mvp.md`

```markdown
# ADR-004: Single Currency (NGN) & Single Property in MVP

## Status
ACCEPTED | Date: June 2026 | Author: Kezie

## Context
Multi-currency + multi-property = design complexity (schema, UI, reporting).
Timeline: 10 weeks to launch.
Budget: Conservative (no extra time/money).

## Decision
**MVP:** Single property (Lagos Beach House), single currency (NGN).
**Phase 2 (Oct 2026):** Add multi-property + multi-currency support.

## Data Model Impact
- PROPERTY table: Store single property record, no property_id foreign key in most tables
- UNIT table: Simple unit_id → implicit property_id = 1
- Currency: Hardcode NGN in reports, API responses
- Future: Add multi-property cascade (property_id on every booking, guest, etc.)

## Schema Migration Path
```
MVP (Aug 2026):
BOOKING { id, unit_id, guest_id, check_in_date, check_out_date, total_price_ngn }

Phase 2 (Oct 2026):
BOOKING { id, property_id, unit_id, guest_id, check_in_date, check_out_date, total_price_ngn, currency }
PROPERTY { id, name, country, currency, ... }

Migration: Add property_id = 1 to all existing bookings
```

## Rationale
- Reduces schema complexity by ~30%
- Faster UI development (no property selector)
- Clearer reporting queries
- Planned path to multi-property clear

## Alternatives Considered
1. Build multi-property from day 1: Over-engineering for Sept deadline
2. Hard-code values in code: Bad, but faster (not chosen)
3. Hybrid: Dynamic but default to single: Confusing

## Consequences
- **Positive**: Faster MVP, clear upgrade path
- **Negative**: Rework in Oct (small risk)
- **Mitigation**: Schema designed for future migration (property_id in schema, just 1 record for now)

## Review Notes
- Strategic decision: Conservative scope = make deadline
- Migration plan documented
- No tech debt
```

### ADR-005: Soft Deletes for Guests, Hard Deletes for Audit Logs

**File:** `docs/adr/005-soft-deletes-audit-logs.md`

```markdown
# ADR-005: Soft Deletes for Guests & Managers, Hard Deletes for Audit Logs

## Status
ACCEPTED | Date: June 2026 | Author: [Team]

## Context
When a guest is deleted, should their booking history remain visible?
When an audit log is created, should it be kept forever (liability) or pruned?

## Decision
1. **Guests/Managers:** Soft delete (is_deleted = true, keep records for history)
2. **Audit Logs:** Hard delete after 1 year (daily batch job)
3. **Bookings:** Soft delete (can_delete if not checked_in, else hidden in UI)

## Rationale
- Soft deletes: Maintain referential integrity + booking history
- Audit logs: Reduce storage, comply with data retention policies
- Bookings: Prevent accidental loss of reservation data

## Schema Changes
```
GUEST { is_deleted boolean default false, deleted_at timestamp }
MANAGER { is_deleted boolean default false, deleted_at timestamp }
AUDIT_LOG { created_at timestamp } + daily cleanup job
BOOKING { is_deleted boolean default false }

Query: WHERE is_deleted = false
```

## Consequences
- **Positive**: Data safety, compliance, history preservation
- **Negative**: Extra storage, cleanup jobs needed
- **Mitigation**: Efficient queries with is_deleted index

## Related Decisions
- ADR-006: Audit Logging

## Review Notes
- Approved June 20, 2026
- Dev A to implement cleanup job in Week 8
```

---

## PART 4: TEAM COMMUNICATION CHECKLIST

### Daily Standup Template

```markdown
## Daily Standup: [Date]

### Dev A (Backend)
- ✅ Yesterday: Implemented BOOKING mutations, 15/20 tests passing
- 🟡 Today: Finish booking mutations, start CHECKLIST table
- ❌ Blocker: None

### Dev B (Frontend)
- ✅ Yesterday: Dashboard layout, sidebar nav, basic routing
- 🟡 Today: Start BookingCalendar component, coordinate with Dev A API
- ❌ Blocker: Waiting for /api/bookings GET response format from Dev A (can mock for now)

### Dev C (Integration)
- ✅ Yesterday: CI/CD setup, GitHub Actions, Vercel auto-deploy
- 🟡 Today: Set up WhatsApp webhook receiver (stub), Telegram bot (stub)
- ❌ Blocker: None

### Team Risks
- ⚠️ Calendar performance: Need to test 90-day view rendering; if slow, pivot to week view
- ⚠️ Timezone handling: Confirm all timestamps stored as UTC (not local time)

### Decisions Needed
- [ ] Approve ADR-004 (single currency/property MVP) — vote by EOD

---
[Add link to: Issues board, Vercel deploy, API test results]
```

### Weekly Retrospective & Planning

```markdown
## Week [N] Retrospective + Week [N+1] Planning

### What Went Well ✅
- [Dev A]: Schema migration done 2 days early
- [Dev B]: BookingCalendar responsive design solid on first try
- [Team]: Clear Cursor prompts saved ~8 hours of back-and-forth

### What Could Be Better 🟡
- [Dev C]: Webhook testing setup took longer than expected (doc updates help)
- [All]: More code reviews earlier → caught 2 bugs late

### Blockers Resolved
- ✅ [Dev A] ← [Dev C]: Webhook format finalized, integration unblocked
- ✅ [Dev B] ← [Dev A]: API contract agreed, can stop mocking

### Velocity & Burn-Down
- **Target:** [20 tasks/week]
- **Completed:** [18 tasks]
- **Carried over:** [2 tasks] (non-critical)
- **Status:** 🟢 On track for Sept 1

### Week [N+1] Planning
- **Dev A:** CHECKLIST table, integration with BOOKING
- **Dev B:** Channel inbox UI, reply composer
- **Dev C:** WhatsApp/Telegram integration (real tokens)
- **Team:** Code review day (Wed), deploy to staging (Fri)

### Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Performance regression on calendar | Medium | High | Add perf tests, benchmarks |
| Payment vendor integration slips to Sept | Low | High | Pre-coordinate with vendor Aug |
| Key person unavailable (sickness) | Low | High | Cross-train on critical paths |

---
```

### Sprint Retrospective Template (Every 2 Weeks)

```markdown
## Sprint Retrospective: Week [5–6] of 10

### Metrics
- **Burndown:** [Chart: target vs actual]
- **Velocity:** 36 points (target: 40)
- **Bugs closed:** 4 | Bugs created: 2 (net -2) ✅
- **Code coverage:** 78% → 82% ⬆️
- **Performance:** Dashboard 1.8s → 1.2s ⬆️

### Highlights
1. ✅ Channel message queue MVP complete (ahead of schedule)
2. ✅ Accessibility audit: WCAG 2.1 AA passed
3. ✅ Webhook integration ready for real tokens

### Retros (Stop, Start, Continue)
**Stop:**
- Stop: Manual testing calendar rendering; automate with Cypress
- Stop: Slack discussions on tech decisions; use ADRs instead

**Start:**
- Start: Weekly security checklist (OWASP Top 10)
- Start: Performance regression testing (Lighthouse CI)

**Continue:**
- Continue: Daily standups (clear visibility)
- Continue: Cursor agent workflow (saves time)

### Action Items for Next Sprint
1. [ ] [Dev C] Implement Sentry error tracking (1 day, Week 7)
2. [ ] [All] Complete data model documentation (ADR-001 to ADR-006)
3. [ ] [Dev B] Add dark mode toggle (nice-to-have, if time permits)

### Risks Escalated
- [ ] Payment integration vendor (Flutterwave) response time slow → escalate to week 8
- [ ] No new critical risks

---
```

---

## PART 5: CODE REVIEW CHECKLIST

Use this for every PR before merging:

```markdown
## Code Review Checklist

PR: [#XXX] [feat: ...] by [@dev-name]

### Functionality ✅
- [ ] Feature works as described in PR + issue
- [ ] Edge cases handled (empty state, errors, validation)
- [ ] No console errors/warnings (dev tools)
- [ ] Database constraints enforced (no orphan records)

### Code Quality ✅
- [ ] TypeScript strict: no `any`, proper types
- [ ] Naming conventions: camelCase functions, PascalCase components
- [ ] No code duplication (DRY principle)
- [ ] Comments: Complex logic explained (WHY, not WHAT)
- [ ] Commit message: Conventional commits format

### Testing ✅
- [ ] Unit tests: 80%+ coverage
- [ ] E2E tests: Happy path + error case
- [ ] Tests pass locally: `npm run test` + `npm run test:e2e`
- [ ] No flaky tests (run 3x)

### Performance ✅
- [ ] Lighthouse: CLS <0.1, LCP <2.5s, FCP <1.8s
- [ ] No N+1 queries (batch Convex calls)
- [ ] Images optimized (next/image)
- [ ] Memoization where needed (React.memo, useMemo)

### Accessibility ✅
- [ ] WCAG 2.1 AA: Keyboard nav (Tab, Enter, Escape)
- [ ] Color contrast: 4.5:1 (text), 3:1 (non-text)
- [ ] ARIA labels on interactive elements
- [ ] Focus indicators visible
- [ ] Semantic HTML (<button>, <nav>, <form>)

### Security ✅
- [ ] No hardcoded secrets (check .env.example)
- [ ] Input validation (Zod schemas)
- [ ] Auth checks on protected routes
- [ ] No PII in logs
- [ ] Webhook signatures validated

### Documentation ✅
- [ ] JSDoc on exported functions
- [ ] README updated (if new config, env vars, routes)
- [ ] .env.example updated
- [ ] Complex logic documented inline

### Deployment Readiness ✅
- [ ] Convex schema migrations: version bumped, migration script tested
- [ ] Database: No breaking schema changes without migration plan
- [ ] Env vars: All documented in .env.example
- [ ] Rollback plan: Clear if something breaks

### Final Checks ✅
- [ ] No merge conflicts
- [ ] Branch is up-to-date with `develop`
- [ ] CI/CD passes (GitHub Actions)
- [ ] Ready for staging deploy

### Approval ✅
- [ ] Approved by: [@reviewer-1, @reviewer-2]
- [ ] Auto-merge enabled
- **Status:** ✅ **Ready to Merge**

---

**Reviewer Notes:**
[Any concerns or suggestions for next time?]

**Author Response:**
[Address feedback or acknowledge]
```

---

## PART 6: DEPLOYMENT CHECKLIST

Before deploying to production:

```markdown
## Pre-Deployment Checklist: Week 10 → Production (Sept 1, 2026)

### Code Freeze (Day 1, Aug 28)
- [ ] All features merged to `main`
- [ ] Git tag: `v1.0.0`
- [ ] Release notes drafted

### Pre-Flight Checks (Day 2–3, Aug 29–30)
**Convex:**
- [ ] Schema migrations applied (staging env)
- [ ] Data backup taken
- [ ] Audit log cleanup job tested

**Express API:**
- [ ] All environment variables configured (prod secrets in Vercel)
- [ ] Rate limiting active
- [ ] Error logging (Sentry) configured
- [ ] Webhook signatures validated
- [ ] CORS restricted to prod domain

**Next.js Frontend:**
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in prod build
- [ ] Images optimized + loaded correctly

**Integrations:**
- [ ] WhatsApp Business API tokens in prod
- [ ] Telegram bot token configured
- [ ] Instagram Meta Graph API set up
- [ ] Email (sendgrid) configured for notifications

### Testing (Day 3–4, Aug 30–31)
**Staging Environment:**
- [ ] Create test booking from each channel (WhatsApp, Telegram, IG)
- [ ] End-to-end: Incoming message → booking created → check-in/out
- [ ] Reports: Occupancy, revenue accurate
- [ ] CSV/PDF exports work
- [ ] Mobile view tested (iOS Safari, Android Chrome)
- [ ] Keyboard navigation: Tab, Enter, Escape all work
- [ ] Accessibility audit: WCAG 2.1 AA passed (axe DevTools)

**Performance:**
- [ ] Lighthouse: All green (CLS <0.1, LCP <2.5s)
- [ ] Dashboard load <2s
- [ ] API response <500ms p95
- [ ] Calendar render <1.5s (90-day view)

**Security:**
- [ ] HTTPS enforced
- [ ] No PII in logs
- [ ] Secrets not in version control
- [ ] Rate limiting active
- [ ] CORS misconfiguration test (fail if origin wrong)

### Backup & Disaster Recovery (Day 4, Aug 31)
- [ ] Database backup: Convex auto-backup confirmed
- [ ] Rollback plan: Previous tag (`v0.9.9`) in production (1-click)
- [ ] Incident runbook: Slack channel, escalation chain, who to call
- [ ] Monitoring: Sentry alerts configured, Vercel Analytics active

### Go-Live (Day 5, Sept 1)
**Pre-Deploy (Morning, 6 AM):**
- [ ] Team assembled (Dev A, B, C on standby)
- [ ] Slack #incidents channel open
- [ ] Monitoring dashboard visible

**Deploy (7 AM):**
- [ ] Run: `git checkout main && git tag v1.0.0 && git push origin v1.0.0`
- [ ] Vercel auto-deploys
- [ ] Staging → production traffic switch
- [ ] Monitor error rate (target: <0.1%)

**Post-Deploy (8 AM):**
- [ ] Property manager logs in: ✅
- [ ] Test incoming WhatsApp message: ✅
- [ ] Verify booking created: ✅
- [ ] Check occupancy report: ✅
- [ ] Monitor Sentry + Vercel logs: No critical errors

**24-Hour Monitoring (Sept 1–2):**
- [ ] No major issues reported
- [ ] Performance metrics stable
- [ ] Database size normal
- [ ] Logs clean (no repeated errors)

### Celebration 🎉
- [ ] Announce launch to stakeholders
- [ ] Thank the team
- [ ] Post-launch review scheduled (Sept 3)

---

**Deployment Owner:** [Dev C]
**Staging Deployed:** [Date + time]
**Production Deployed:** [Date + time]
```

---

**END OF CURSOR WORKFLOW & ARCHITECTURE DECISIONS**

Questions on structured prompting or ADRs? Ready to start Week 1?
