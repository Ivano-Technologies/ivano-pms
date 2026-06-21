# Graph Report - ivano-pms  (2026-06-21)

## Corpus Check
- 141 files · ~110,577 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 794 nodes · 1036 edges · 86 communities (69 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fcdf5079`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 37 edges
2. `compilerOptions` - 16 edges
3. `scripts` - 14 edges
4. `Go-live checklist (nmdpra-eam)` - 11 edges
5. `scripts` - 10 edges
6. `Button()` - 10 edges
7. `addDays()` - 10 edges
8. `Local Development Setup` - 10 edges
9. `Skeleton()` - 8 edges
10. `authedQuery` - 8 edges

## Surprising Connections (you probably didn't know these)
- `BookingDetailPopover()` --calls--> `formatNgn()`  [EXTRACTED]
  apps/web/src/components/bookings/booking-detail-popover.tsx → apps/web/src/lib/format.ts
- `BookingDetailPopover()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/bookings/booking-detail-popover.tsx → apps/web/src/lib/utils.ts
- `PoweredByTechivano()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/brand/powered-by-techivano.tsx → apps/web/src/lib/utils.ts
- `IvanoPmsLogo()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/brand/techivano-logo.tsx → apps/web/src/lib/utils.ts
- `TechivanoMark()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/brand/techivano-mark.tsx → apps/web/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (86 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (46): IvanoPmsLogo(), IvanoPmsLogoProps, motionClass, TechivanoMark(), TechivanoMarkAccent, TechivanoMarkProps, DashboardOverview(), CHANNEL_META (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (17): dependencies, @base-ui/react, class-variance-authority, @clerk/nextjs, clsx, convex, lucide-react, next (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (32): dependencies, convex-helpers, description, devDependencies, convex, @convex-dev/eslint-plugin, convex-test, eslint (+24 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (21): 1) Sync and build (~1 minute), 2) Convex (required before Vercel), 3) Vercel import settings (confirm), 4) Environment variables (set, then redeploy), 5) Deploy, 6) Post-deploy tests (strict order), a) Liveness, b) Data (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (20): ADR-001: Convex as Backend (Already Decided), ADR-002: Express API Layer for Integrations (NEW), ADR-003: Channel Message Queue (NOT Direct Conversion), ADR-004: Single Currency & Property (MVP Constraint), ADR-005: Soft Deletes for Guests, Hard Deletes for Audit Logs, Daily Standup Template, Ivano PMS: Cursor Agent Workflow & Architecture Decisions, PART 1: CURSOR AGENT WORKFLOW (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (19): cleanEnv(), dispatchWebhookEvent(), getConvexClient(), getDefaultPropertyId(), getInternalJobSecret(), PROCESS_WEBHOOK, logWebhook(), POST() (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (8): Adding event types, Environment, Payload schema, Phase 2 migration, Rate limiting, Signature, Smoke verification (Week 2), Webhook intake (`POST /api/webhooks`)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (13): auditAction, auditEntityType, availabilityStatus, bookingStatus, bookingType, checklistStatus, idType, managerRole (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.24
Nodes (9): getCurrentUserRole(), requirePermissionPages(), requirePermissionServer(), AuthRoleError, hasPermission(), HIERARCHY, parseUserRole(), Role (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.40
Nodes (4): Ivano IQ → Ivano PMS migration, Phase 2, Schema, Webhooks

### Community 12 - "Community 12"
Cohesion: 0.15
Nodes (12): ARCHITECTURAL DECISIONS LOCKED, IVANO PMS — PHASE 0 WEEK 1 KICKOFF, June 24–30, 2026, NEXT WEEK PREVIEW (Phase 1, July 1–28), SUCCESS CRITERIA FOR WEEK 1, Task 1.1: Audit & Archive Old Code (1 day), Task 1.2: Define PMS Schema in Convex (2 days), Task 1.3: Express Service Skeleton (1.5 days) (+4 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (9): PrefsState, DashboardLayout, DashboardSectionId, DeletionState, DigestPreferences, SavedView, SavedViewFilter, UserConsentsPreferences (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (32): description, devDependencies, dotenv, eslint, eslint-config-next, jsdom, @playwright/test, png-to-ico (+24 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (8): compilerOptions, jsx, module, moduleResolution, skipLibCheck, exclude, extends, include

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): Architecture, Clerk + Convex auth, Clerk test user (local dev), Environment, Install, Local Development Setup, Prerequisites, Seed demo data (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (8): channelMessageDoc, convertChannelMessageToBooking, createChannelMessage, getChannelMessages, messageChannel, messageStatus, assertPropertyAccess(), getCurrentManager()

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (6): compilerOptions, isolatedModules, lib, noEmit, strict, target

### Community 20 - "Community 20"
Cohesion: 0.06
Nodes (30): 1. Seed NLP population — backfill, not pre-compute, 2. Calendar status color map (locked), 3. Occupancy rate formula (locked), 4. INTERNAL_JOB_SECRET wiring (locked — not Convex admin key), 5. Task 2.5 testing strategy (locked), 6. Clerk test user setup (locked), 7. Pending messages UI edge case (locked), Acceptance criteria (+22 more)

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (4): __dirname, markPng, publicDir, root

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (7): ADR-002: Next.js API Routes for Webhooks (Revised), Architecture, Decision, Migration path (Phase 2+), Rationale, Related, Status

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (4): appendAuditLog, auditAction, auditEntityType, getAuditLog

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (5): Deployment, Ivano PMS, Monorepo layout, Quick start, Webhooks

### Community 26 - "Community 26"
Cohesion: 0.40
Nodes (3): __dirname, publicDir, root

### Community 27 - "Community 27"
Cohesion: 0.50
Nodes (3): user-playwright, npx, @playwright/mcp

### Community 28 - "Community 28"
Cohesion: 0.50
Nodes (3): Data flow, Ivano PMS architecture, Stack

### Community 30 - "Community 30"
Cohesion: 0.50
Nodes (3): Landing page snapshot (`/`), Removed sections (no longer on the page), Source order

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (3): buildCommand, installCommand, $schema

### Community 40 - "Community 40"
Cohesion: 0.12
Nodes (27): BookingCalendar, BookingCalendarProps, BookingDetailPopover(), BookingDetailPopoverProps, formatStatusLabel(), TabId, BookingsCalendarView(), GuestOption (+19 more)

### Community 43 - "Community 43"
Cohesion: 0.09
Nodes (32): seedDemoData, seedDemoDataV2, seedReset, backfillMessageNlp, backfillMessagesForProperty(), NlpCtx, channelMessageVerification, listChannelMessagesForVerification (+24 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (9): geistMono, inter, metadata, playfair, spaceGrotesk, ThemeProvider(), convex, ConvexClientProvider() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.09
Nodes (26): size, PoweredByTechivano(), PoweredByTechivanoProps, variantClass, DeleteGuestDialog(), DeleteGuestDialogProps, GuestFormModal(), GuestFormModalProps (+18 more)

### Community 71 - "Community 71"
Cohesion: 0.15
Nodes (20): createConvexClient(), __dirname, E2E_CONTEXT_PATH, listMessagesForVerification(), pollMessageByText(), readE2eContext(), cleanEnv(), computeHmacSignature() (+12 more)

### Community 72 - "Community 72"
Cohesion: 0.22
Nodes (8): Automated checks, Local setup (2 terminals), Manual acceptance, Playwright E2E, Vercel preview deploy checklist, Webhook smoke script, Week 2 gate (EOD Friday), Week 2 verification checklist

### Community 73 - "Community 73"
Cohesion: 0.50
Nodes (3): body, payload, signature

### Community 74 - "Community 74"
Cohesion: 0.31
Nodes (8): contextPath, __dirname, getInternalJobSecret(), globalSetup(), loadEnv(), parseConvexRunOutput(), repoRoot, webRoot

### Community 75 - "Community 75"
Cohesion: 0.53
Nodes (5): assertExtraction(), main(), payload, pollConvexMessage(), signBody()

### Community 77 - "Community 77"
Cohesion: 0.18
Nodes (13): EdgeSeed, seedEdgeCaseFixture(), authedClient(), createTestConvex(), modules, seedAuthedManager(), BOOKING_STATUSES, BookingStatusType (+5 more)

### Community 78 - "Community 78"
Cohesion: 0.14
Nodes (13): auditTrailEntry, bookingDoc, bookingStatus, bookingType, bookingWithGuestUnit, createBooking, getBookingAuditTrail, getBookingById (+5 more)

### Community 79 - "Community 79"
Cohesion: 0.25
Nodes (7): Deployment & Production Checklist, Deployment Protection, Environment Variables (Vercel), Known Issues & Deferrals, Post-Deploy Validation Checklist, Rollback Plan, Vercel Deployment

### Community 80 - "Community 80"
Cohesion: 0.17
Nodes (10): ACTIVE_BOOKING_STATUSES, createGuest, getGuestById, getGuests, guestDoc, guestWithBookings, idType, restoreGuest (+2 more)

### Community 81 - "Community 81"
Cohesion: 0.25
Nodes (7): Baseline Measurements (Week 2 Post-Polish), Future Optimizations (Week 4+), How to Re-Measure, Production Monitoring (Post-Deploy), Targets, Test Coverage (C1 polish), Week 2 Performance Targets & Baseline Measurements

### Community 82 - "Community 82"
Cohesion: 0.32
Nodes (6): bookingStatus, getDashboardStats, isBookingActiveOnDate(), isBookingRevenueOnDate(), OCCUPANCY_STATUSES, REVENUE_STATUSES

### Community 83 - "Community 83"
Cohesion: 0.38
Nodes (3): DashboardManagerSync(), NAV_ITEMS, PmsDashboardLayout()

### Community 84 - "Community 84"
Cohesion: 0.38
Nodes (4): getOccupancySnapshot, getProperty, AuthedCtx, authedQuery

### Community 85 - "Community 85"
Cohesion: 0.29
Nodes (6): availabilityStatus, getUnits, unitDoc, unitType, updateUnit, authedMutation

## Knowledge Gaps
- **421 isolated node(s):** `npx`, `@playwright/mcp`, `$schema`, `style`, `rsc` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getTransitionLabel()` connect `Community 77` to `Community 40`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 0` to `Community 40`, `Community 48`, `Community 83`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `convex-helpers` connect `Community 2` to `Community 77`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `npx`, `@playwright/mcp`, `$schema` to the rest of the system?**
  _421 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06057945566286216 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._