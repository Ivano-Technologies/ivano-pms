# Graph Report - ivano-pms  (2026-06-20)

## Corpus Check
- 102 files · ~94,639 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 558 nodes · 584 edges · 71 communities (55 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c5b7e338`
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
- [[_COMMUNITY_Community 15|Community 15]]
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
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
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
- [[_COMMUNITY_Community 73|Community 73]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 32 edges
2. `compilerOptions` - 16 edges
3. `Go-live checklist (nmdpra-eam)` - 11 edges
4. `scripts` - 10 edges
5. `Local Development Setup` - 10 edges
6. `scripts` - 9 edges
7. `authedQuery` - 8 edges
8. `Locked decisions (pre–Task 2.1)` - 8 edges
9. `Ivano PMS: Cursor Agent Workflow & Architecture Decisions` - 7 edges
10. `IVANO PMS — PHASE 0 WEEK 1 KICKOFF` - 7 edges

## Surprising Connections (you probably didn't know these)
- `IvanoPmsLogo()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/brand/techivano-logo.tsx → apps/web/src/lib/utils.ts
- `TechivanoMark()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/brand/techivano-mark.tsx → apps/web/src/lib/utils.ts
- `Card()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/ui/card.tsx → apps/web/src/lib/utils.ts
- `CardHeader()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/ui/card.tsx → apps/web/src/lib/utils.ts
- `CardTitle()` --calls--> `cn()`  [EXTRACTED]
  apps/web/src/components/ui/card.tsx → apps/web/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (71 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (39): size, PoweredByTechivano(), PoweredByTechivanoProps, variantClass, IvanoPmsLogo(), IvanoPmsLogoProps, motionClass, TechivanoMark() (+31 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (17): dependencies, @base-ui/react, class-variance-authority, @clerk/nextjs, clsx, convex, lucide-react, next (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (25): dependencies, convex-helpers, description, devDependencies, convex, @convex-dev/eslint-plugin, eslint, tsx (+17 more)

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
Cohesion: 0.25
Nodes (7): Adding event types, Environment, Payload schema, Phase 2 migration, Rate limiting, Signature, Webhook intake (`POST /api/webhooks`)

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
Cohesion: 0.08
Nodes (25): description, devDependencies, eslint, eslint-config-next, png-to-ico, sharp, tailwindcss, @tailwindcss/postcss (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (9): geistMono, inter, metadata, playfair, spaceGrotesk, ThemeProvider(), convex, ConvexClientProvider() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (8): compilerOptions, jsx, module, moduleResolution, skipLibCheck, exclude, extends, include

### Community 17 - "Community 17"
Cohesion: 0.18
Nodes (10): Architecture, Clerk + Convex auth, Clerk test user (local dev), Environment, Install, Local Development Setup, Prerequisites, Seed demo data (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.06
Nodes (34): bookingDoc, bookingStatus, bookingType, createBooking, getBookings, sourceChannel, updateBookingStatus, channelMessageDoc (+26 more)

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

### Community 43 - "Community 43"
Cohesion: 0.28
Nodes (7): seedDemoData, seedDemoDataV2, seedReset, clearSeedData(), insertDemoData(), SeedCtx, SeedResult

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (3): messageChannel, processWebhookEvent, webhookEventType

### Community 73 - "Community 73"
Cohesion: 0.50
Nodes (3): body, payload, signature

## Knowledge Gaps
- **333 isolated node(s):** `npx`, `@playwright/mcp`, `$schema`, `style`, `rsc` (+328 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 1` to `Community 14`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `npx`, `@playwright/mcp`, `$schema` to the rest of the system?**
  _333 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05868118572292801 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._