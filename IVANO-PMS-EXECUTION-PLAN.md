# Ivano PMS — Execution Plan

**Generated:** 2026-06-22 | **Sprint cadence:** ~1 day per task  
**Stack:** Next.js 16 + Convex + Clerk + Shadcn UI + Sonner toasts

---

## Phase Completion Status

| Phase | Week | Tasks | Status |
|-------|------|-------|--------|
| Phase 0 | — | Bootstrap, schema, auth, deploy pipeline | ✅ 100% |
| Phase 1 | W2 | 2.1 wiring, 2.2 dashboard, 2.3 calendar, 2.4 NLP, 2.5 E2E | ✅ 100% |
| Phase 1 | W3 | 3.1 state machine, 3.2 Guest CRUD, 3.3 Unit Mgmt, 3.4 Inbox | 🔄 75% |
| Phase 2 | W4+ | Billing, reporting, multi-property, overlap detection | 📋 Backlog |

---

## Remaining Tasks

### ✅ DONE — Week 3

| ID | Task | Files | Status |
|----|------|-------|--------|
| 3.1 | Booking state machine + audit trail | `convex/lib/bookingStates.ts`, `convex/functions/bookings.ts`, booking-detail-popover.tsx | ✅ |
| 3.2 | Guest CRUD UI | `convex/functions/guests.ts`, `components/guests/`, `lib/guest-utils.ts` | ✅ |
| 3.3 | Unit management UI + occupancy | `convex/functions/units.ts`, `components/units/`, `lib/unit-utils.ts` | ✅ |

### 🔄 IN SPRINT — Week 3

| ID | Task | Dependencies | Est. |
|----|------|-------------|------|
| **3.4** | **Channel Inbox UI** | `channelMessages.ts` (backend exists) | 0.5d |

### 📋 BACKLOG — Week 4+

| ID | Task | Notes |
|----|------|-------|
| 4.1 | Overlap booking detection | ADR-005 deferred |
| 4.2 | Revenue / occupancy reports | `/dashboard/reports` stub exists |
| 4.3 | Multi-property manager UI | Schema supports it |
| 4.4 | Real OAuth channel tokens | WhatsApp Business API |
| 4.5 | Bundle size optimisation | Current: ~200kb target. Code-split modals |
| 4.6 | Guest `notes` field | Schema migration needed |
| 4.7 | Checklist / housekeeping tasks | `checklist` table already in schema |

---

## Task 3.4 — Channel Inbox (Detailed Scope)

### Current backend state (`convex/functions/channelMessages.ts`)

**Already exists:**
- `getChannelMessages` — authedQuery, filters by `status` and `channel`, sorted newest-first
- `createChannelMessage` — internal mutation (webhook ingestion, requires `INTERNAL_JOB_SECRET`)
- `convertChannelMessageToBooking` — authedMutation; requires existing `guestId` + `unitId`

**Schema status field:** `"new" | "reviewed" | "converted" | "archived"` (NOT an `isRead` boolean)

**Missing mutations to add:**
- `markMessageReviewed` — `status → "reviewed"`
- `markMessageNew` — `status → "new"` (unreview / "mark unread")
- `archiveMessage` — `status → "archived"`
- `unarchiveMessage` — `status → "reviewed"` (restore from archive)

### Convert-to-booking modal reality

The existing `convertChannelMessageToBooking` requires:
- `guestId` (existing guest) — must search/select from guest list
- `unitId` (existing unit) — must search/select from unit list
- `checkInDate`, optional `checkOutDate`
- `bookingType: nightly|weekly|monthly|lease`
- `totalPriceNgn`

The modal therefore needs:
1. Guest selector (dropdown from `getGuests`)
2. Unit selector (dropdown from `getUnits`)
3. Date fields (pre-filled from `extractedCheckIn/Out` if present)
4. Booking type select + price field

### Files to create / modify

| File | Action |
|------|--------|
| `convex/functions/channelMessages.ts` | Add 4 mutations |
| `apps/web/src/app/dashboard/channels/page.tsx` | Replace stub with `<InboxPageClient />` |
| `apps/web/src/components/inbox/inbox-page-client.tsx` | Main client component |
| `apps/web/src/components/inbox/inbox-message-card.tsx` | Single message card |
| `apps/web/src/components/inbox/convert-to-booking-modal.tsx` | Convert modal with guest/unit selectors |
| `apps/web/src/lib/inbox-utils.ts` | Formatters, filter helpers |
| `tests/convex/inbox.test.ts` | 6 test cases |

---

## Cursor Prompt Templates

### Prompt 3.4 — Channel Inbox (execute now)

```
Implement Task 3.4: Channel Inbox UI for Ivano PMS.

CONTEXT:
- Stack: Next.js 16, Convex, Clerk, Shadcn UI, Sonner toasts
- Existing backend: convex/functions/channelMessages.ts
  - getChannelMessages(status?, channel?, limit?) — authedQuery
  - convertChannelMessageToBooking(messageId, guestId, unitId, ...) — authedMutation
- Schema status field: "new" | "reviewed" | "converted" | "archived"
  (NOT isRead — "new" = unread, "reviewed" = read, "archived" = archived)
- Existing guests/units available from getGuests / getUnits queries

BACKEND ADDITIONS (convex/functions/channelMessages.ts):
Add these 4 mutations to the existing file:
- markMessageReviewed({ messageId }) → null
  - assertPropertyAccess(ctx.manager, message.propertyId)
  - patch status="reviewed", updatedAt=now
- markMessageNew({ messageId }) → null  
  - assertPropertyAccess
  - patch status="new", updatedAt=now
- archiveMessage({ messageId }) → null
  - assertPropertyAccess
  - patch status="archived", updatedAt=now
- unarchiveMessage({ messageId }) → null
  - assertPropertyAccess
  - patch status="reviewed", updatedAt=now

UI FILES TO CREATE:

1. apps/web/src/lib/inbox-utils.ts
   - CHANNEL_META: { whatsapp, telegram, instagram } → { label, icon: string }
   - STATUS_FILTERS: [{ value, label }] for "new", "reviewed", "archived"
   - formatRelativeTime(createdAt: number): string — uses date-fns formatDistanceToNow
   - truncateMessage(text: string, len = 120): string
   - isUnread(status): boolean — status === "new"

2. apps/web/src/components/inbox/inbox-message-card.tsx
   "use client"
   Props: message (channelMessageDoc), onMarkReviewed, onMarkNew, onArchive, onUnarchive, onConvert
   Display:
   - Left: Blue dot if status="new" (unread indicator)
   - Bold sender name if unread, normal weight if reviewed
   - Channel badge (WhatsApp green, Telegram blue, Instagram purple)
   - Message preview (truncated to 120 chars)
   - Relative timestamp (bottom right)
   - Extracted fields chips: check-in, check-out, guest names (if present, small muted text)
   - If message.bookingId set: "Linked booking →" badge instead of Convert button
   Actions (icon buttons, right side):
   - Mark reviewed/new toggle (CheckCircle / Circle icon)
   - Archive / Unarchive (ArchiveIcon)
   - Convert to booking (Plus icon) — only if status != "converted" and !bookingId

3. apps/web/src/components/inbox/convert-to-booking-modal.tsx
   "use client"
   Props: message, isOpen, onClose
   State: guestId, unitId, checkInDate, checkOutDate, bookingType, totalPriceNgn
   Pre-fill: checkInDate from message.extractedCheckIn, checkOutDate from message.extractedCheckOut
   Queries:
   - useQuery(api.functions.guests.getGuests, {}) → guest selector options
   - useQuery(api.functions.units.getUnits, {}) → unit selector options
   Mutation: convertChannelMessageToBooking
   Form fields:
   - Guest: searchable select dropdown (firstName + lastName, phone)
   - Unit: select dropdown (unitNumber, unitType, pricePerNightNgn)
   - Check-in date (required, date input)
   - Check-out date (optional, date input)
   - Booking type: select (nightly|weekly|monthly|lease)
   - Total price NGN (number input, auto-suggest = nights × unit.pricePerNightNgn)
   Validation: guestId required, unitId required, checkInDate required
   On success: toast "Booking created", onClose()

4. apps/web/src/components/inbox/inbox-page-client.tsx
   "use client"
   State:
   - statusFilter: "new" | "reviewed" | "archived" | undefined (default "new")
   - channelFilter: "whatsapp" | "telegram" | "instagram" | undefined
   - convertingMessage: channelMessageDoc | null
   useQuery: getChannelMessages({ status: statusFilter, channel: channelFilter, limit: 50 })
   Counts: separate query getChannelMessages({ status: "new" }) → unreadCount
   Layout:
   - Header: "Inbox" title + unread badge (count)
   - Filter tabs: All | New | Reviewed | Archived (pill tabs)
   - Channel filter chips (optional): WhatsApp / Telegram / Instagram
   - "Mark all reviewed" button (top right, only on "new" tab)
   - Scrollable message list of InboxMessageCard
   - Empty state per tab
   - ConvertToBookingModal (overlay)
   Mark all reviewed: sequential mutation calls for all messages with status="new"

5. apps/web/src/app/dashboard/channels/page.tsx
   Replace stub with:
   import { InboxPageClient } from "@/components/inbox/inbox-page-client";
   export default function ChannelsPage() {
     return <InboxPageClient />;
   }

TESTS (tests/convex/inbox.test.ts — 6 cases):
1. getChannelMessages returns "new" messages for property
2. markMessageReviewed sets status="reviewed"
3. markMessageNew sets status back to "new"
4. archiveMessage sets status="archived"
5. unarchiveMessage sets status="reviewed"
6. convertChannelMessageToBooking creates booking and sets message.status="converted"
   (use existing seed unitId, guestId from seedAuthedManager)

Note: Seed a channel message in t.run() using ctx.db.insert("bookingChannelMessage", {...})
with status: "new", channel: "whatsapp", senderName: "Test Sender", messageText: "..."

ACCEPTANCE CRITERIA:
✅ getChannelMessages filters by status (new/reviewed/archived)
✅ markMessageReviewed / markMessageNew toggle
✅ archiveMessage / unarchiveMessage toggle
✅ ConvertToBookingModal creates booking with existing guest + unit
✅ Unread count badge updates reactively
✅ Empty state per filter tab
✅ All tests pass: pnpm test tests/convex/inbox.test.ts
✅ pnpm build succeeds (no TypeScript errors)
```

---

### Prompt 4.1 — Revenue & Occupancy Reports (Week 4)

```
Implement Task 4.1: Reports dashboard for Ivano PMS.

CONTEXT: /dashboard/reports page currently shows a stub.
Backend: occupancySnapshot table in schema, dashboard.ts has stats helpers.

Files:
1. convex/functions/reports.ts — authedQuery: getRevenueByMonth, getOccupancyByUnit
2. apps/web/src/app/dashboard/reports/page.tsx — replace stub
3. apps/web/src/components/reports/revenue-chart.tsx — monthly bar chart (recharts or native SVG)
4. apps/web/src/components/reports/occupancy-heatmap.tsx — unit × date grid

Revenue query:
- Group bookings by month (createdAt), sum totalPriceNgn
- Return last 6 months

Occupancy query:
- For each unit, count booked nights in date range
- Return occupancyRate = bookedNights / totalNights
```

---

### Prompt 4.2 — Overlap Detection (Week 4)

```
Implement Task 4.2: Booking overlap validation for Ivano PMS.

Context: ADR-005 deferred this from Week 2. Tests exist in booking-edge-cases.test.ts 
showing overlapping bookings are currently allowed.

Files:
1. convex/functions/bookings.ts — add checkOverlap() helper
   - Query bookings by unit with by_unit index
   - Filter: status in [inquiry, pending_confirmation, confirmed, checked_in]
   - Check date range intersection with new booking dates
   - Throw "Unit already booked for these dates" if overlap found
2. createBooking mutation — call checkOverlap before insert
3. Update booking-edge-cases.test.ts — change "allows overlap" tests to expect throws
```

---

## Design System Notes (UI/UX Pro Max)

### Inbox UI patterns
- **Unread indicator:** `w-2 h-2 rounded-full bg-blue-500` dot on the left of the row
- **Read vs unread:** `font-semibold` vs `font-normal` on sender name
- **Channel badges:** WhatsApp `bg-green-100 text-green-800`, Telegram `bg-blue-100 text-blue-800`, Instagram `bg-purple-100 text-purple-800`
- **Extracted fields:** `text-muted-foreground text-xs` chips below message preview
- **Action row:** ghost icon buttons, `size-sm`, appear on hover (`group-hover:opacity-100`)
- **Filter tabs:** pill-style with `bg-primary text-primary-foreground` for active tab
- **Empty state:** centred, icon + title + subtitle (no action button needed for archived)

### Convert-to-booking modal UX
- Guest selector: show `{firstName} {lastName} · {phone}` in option
- Unit selector: show `{unitNumber} ({unitType}) — {formatNgn(pricePerNightNgn)}/night`
- Auto-calculate total: `nights × unit.pricePerNightNgn` on date change
- Auto-focus: guest selector on modal open

---

## Current Test Count

| Suite | Tests | Status |
|-------|-------|--------|
| units.test.ts | 8 | ✅ |
| guests.test.ts | 8 | ✅ |
| bookings.test.ts | 6 | ✅ |
| booking-transitions.test.ts | 21 | ✅ |
| booking-edge-cases.test.ts | 8 | ✅ |
| nlp.test.ts | 19 | ✅ |
| verify.test.ts | 5 | ✅ |
| calendar-utils.test.ts | 16 | ✅ |
| booking-calendar.test.tsx | 6 | ✅ |
| **Total** | **97** | ✅ |

After Task 3.4: target **103 tests** (+6 inbox tests).
