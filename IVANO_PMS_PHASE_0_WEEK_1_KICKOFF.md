# IVANO PMS — PHASE 0 WEEK 1 KICKOFF
## June 24–30, 2026

---

## ARCHITECTURAL DECISIONS LOCKED

**Decision 1: Replace Ivano IQ (Option B)**
- Remove all vendor-licensing code from Convex schema, Express routes, and UI
- Build Ivano PMS from scratch in the same monorepo
- Reuse: Next.js + Convex + Clerk stack (no new dependencies)
- Archive old code in git history only; don't maintain alongside

**Decision 2: Express at `/services/api` for webhooks (Option B)**
- Convex/Next.js = user-facing app APIs (`/apps/web/src/app/api/`)
- Express = webhook intake + integrations (`/services/api/`)
- Webhook endpoints: POST `/api/webhooks/whatsapp`, `/api/webhooks/telegram`, `/api/webhooks/instagram`
- Express will be deployed to Railway (₦2,000–3,000/month)
- Signature verification + async message queueing in Express; Convex detects new messages via real-time

---

## WEEK 1 TASK BREAKDOWN
**Target: June 24–30 (6 working days)**

### Task 1.1: Audit & Archive Old Code (1 day)
**Owner:** Dev A (or solo if single dev)
**Deliverable:** Commit with old code removed, git history preserved

**Cursor Prompt:**
```
We're transforming ivano-pms from Ivano IQ (vendor licensing) to Ivano PMS (hospitality bookings).

Task: Remove all Ivano IQ code from the repo while preserving git history.

1. Identify all code/routes/tables related to Ivano IQ:
   - Convex schema: any tables for vendors, licenses, licensing_domains, tier_configs
   - Express routes: any /vendors, /licenses, /licensing endpoints
   - Next.js pages: any /vendors, /admin/licensing routes
   - Environment variables: any IQ-specific keys (VENDOR_DB_URL, LICENSE_KEY, etc.)
   - Database seed data: any vendor/license fixtures

2. Create a checklist of all artifacts to remove.

3. Delete identified code. Do NOT refactor—just remove.

4. Commit with message: "chore: remove Ivano IQ vendor licensing code (git history preserved)"

5. List all remaining directories and files so we confirm the repo is clean for PMS setup.
```

---

### Task 1.2: Define PMS Schema in Convex (2 days)
**Owner:** Dev A
**Deliverable:** Complete Convex schema with 9 core tables, indexes, and seed data

**Cursor Prompt:**
```
Task: Build the core Convex schema for Ivano PMS.

Context:
- Single property (MVP)
- Single currency (NGN)
- Hospitality bookings: nightly, weekly, monthly, long-term leases
- Channel intake: WhatsApp, Telegram, Instagram DMs
- Manager dashboard + occupancy reporting

Schema Definition (9 tables):

TABLE: property
  - id: _id
  - name: string (e.g., "Gwarimpa Estate")
  - address: string
  - phone: string
  - whatsapp: string
  - currency_code: "NGN" (fixed)
  - timezone: "Africa/Lagos"
  - created_at, updated_at

TABLE: unit (rooms, suites, villas, studios)
  - id: _id
  - property_id: reference (property)
  - unit_number: string (e.g., "A101")
  - unit_type: enum ["room", "suite", "villa", "studio"]
  - capacity_guests: number
  - price_per_night_ngn: number
  - amenities: string[] (tags: "wifi", "ac", "kitchen", etc.)
  - availability_status: enum ["available", "occupied", "maintenance", "reserved"]
  - created_at, updated_at

TABLE: guest
  - id: _id
  - property_id: reference (property)
  - first_name, last_name: string
  - email: string (optional)
  - phone: string (primary contact)
  - whatsapp: string (optional, may differ from phone)
  - telegram_id: string (optional)
  - instagram_handle: string (optional)
  - id_type: enum ["passport", "drivers_license", "national_id", "other"]
  - id_number: string
  - created_at, updated_at

TABLE: booking
  - id: _id
  - property_id: reference (property)
  - guest_id: reference (guest)
  - unit_id: reference (unit)
  - booking_type: enum ["nightly", "weekly", "monthly", "lease"]
  - check_in_date: datetime
  - check_out_date: datetime (null for open-ended leases)
  - adults_count, children_count: number
  - status: enum ["inquiry", "pending_confirmation", "confirmed", "checked_in", "checked_out", "completed", "cancelled"]
  - source_channel: enum ["whatsapp", "telegram", "instagram", "direct", "phone", "walk_in"]
  - notes: string (optional)
  - total_price_ngn: number
  - paid_ngn: number (0 for MVP, payment phase 2)
  - created_at, updated_at

TABLE: booking_channel_message
  - id: _id
  - property_id: reference (property)
  - booking_id: reference (booking, nullable until conversion)
  - channel: enum ["whatsapp", "telegram", "instagram"]
  - sender_phone: string (whatsapp) OR telegram_user_id (telegram) OR instagram_user_id (instagram)
  - sender_name: string
  - message_text: string (raw user input)
  - extracted_check_in: datetime (nullable, from NLP)
  - extracted_check_out: datetime (nullable, from NLP)
  - extracted_guest_names: string[] (from NLP)
  - extracted_unit_type: string (nullable, from NLP keywords: "room", "suite", "villa")
  - status: enum ["new", "reviewed", "converted", "archived"]
  - manager_id: reference (manager, who reviewed/converted it)
  - created_at, updated_at

TABLE: manager
  - id: _id
  - property_id: reference (property)
  - clerk_user_id: string (from Clerk auth)
  - email: string
  - full_name: string
  - phone: string
  - role: enum ["owner", "manager", "staff"]
  - created_at, updated_at

TABLE: checklist
  - id: _id
  - property_id: reference (property)
  - booking_id: reference (booking)
  - unit_id: reference (unit)
  - task_type: enum ["guest_checkin", "guest_checkout", "cleaning", "maintenance", "follow_up"]
  - task_description: string
  - due_date: datetime
  - assigned_to: reference (manager, nullable)
  - status: enum ["pending", "in_progress", "completed", "cancelled"]
  - created_at, updated_at

TABLE: occupancy_snapshot (pre-computed daily)
  - id: _id
  - property_id: reference (property)
  - snapshot_date: date
  - total_units: number
  - occupied_units: number
  - occupancy_rate: number (0–1)
  - revenue_ngn: number
  - booking_sources: json object { whatsapp: count, telegram: count, instagram: count, direct: count }
  - created_at

TABLE: audit_log (soft-deleted guests/managers + security audit)
  - id: _id
  - property_id: reference (property)
  - action: enum ["create", "update", "delete", "status_change", "booking_convert", "payment_received"]
  - entity_type: enum ["guest", "booking", "unit", "manager", "checklist"]
  - entity_id: string
  - old_values: json (before update)
  - new_values: json (after update)
  - actor_id: reference (manager, who made the change)
  - created_at
  - (Hard-delete records > 1 year old; guests/managers use soft-delete via is_deleted flag, not this table)

INDEXES:
  - booking: [property_id, status, check_in_date]
  - booking: [property_id, source_channel, created_at]
  - booking_channel_message: [property_id, status, created_at]
  - guest: [property_id, phone]
  - unit: [property_id, availability_status]
  - occupancy_snapshot: [property_id, snapshot_date]

Actions (Convex Mutations):
  1. createBooking(guestId, unitId, checkInDate, checkOutDate, bookingType, sourceChannel)
  2. updateBookingStatus(bookingId, newStatus) → triggers checklist generation (checkin/checkout)
  3. convertChannelMessageToBooking(messageId, guestData, unitId, dates)
  4. createChannelMessage(channel, senderPhone, senderName, messageText)
  5. createGuest(firstName, lastName, phone, email, idType, idNumber)
  6. updateUnit(unitId, { price_per_night_ngn, availability_status, amenities })

Actions (Convex Queries):
  1. getBookings(propertyId, { status?, sourceChannel?, dateRange? })
  2. getGuests(propertyId)
  3. getUnits(propertyId)
  4. getChannelMessages(propertyId, { status?, channel? })
  5. getOccupancySnapshot(propertyId, snapshotDate)
  6. getAuditLog(propertyId, { entityType?, dateRange? })

Implementation:
  1. Create /convex/schema.ts with all 9 tables + indexes
  2. Create /convex/functions/ with mutations and queries above
  3. Create /convex/seed.ts with sample data:
     - 1 property (Gwarimpa Estate, Abuja)
     - 10 units (5 rooms, 3 suites, 2 villas)
     - 5 sample guests
     - 3 sample bookings (one per booking_type)
     - 2 sample channel messages (new, awaiting review)
  4. Run: npx convex dev (check schema compiles, seed data loads)
  5. Test 3 queries locally in Convex dashboard: getBookings, getUnits, getChannelMessages
  6. Commit: "feat: add PMS core schema (9 tables, mutations, queries, seed data)"
```

---

### Task 1.3: Express Service Skeleton (1.5 days)
**Owner:** Dev C (or Dev A if solo)
**Deliverable:** `/services/api` with webhook endpoints, signature verification, basic structure

**Cursor Prompt:**
```
Task: Set up Express service for webhook intake at /services/api.

Context:
- This service receives POST requests from WhatsApp Business API, Telegram Bot, Instagram Graph API
- Each provider sends a different payload format and signature scheme
- We need to: verify signature, extract sender + message, queue to Convex, return 200 immediately

Structure:
  /services/api/
    src/
      index.ts (main Express app)
      routes/
        webhooks.ts (POST /webhooks/whatsapp, /webhooks/telegram, /webhooks/instagram)
      middleware/
        whatsapp-verify.ts (signature verification for WhatsApp)
        telegram-verify.ts (signature verification for Telegram)
        instagram-verify.ts (signature verification for Instagram)
      utils/
        convex-client.ts (mutation calls to create channel messages)
    .env.example
    package.json

Implementation:

1. /services/api/package.json:
   - Dependencies: express, dotenv, axios (for Convex API calls), crypto (for signatures)
   - Add npm script: "dev": "tsx watch src/index.ts"

2. /services/api/src/index.ts:
   ```typescript
   import express from 'express';
   import webhooksRouter from './routes/webhooks';
   
   const app = express();
   app.use(express.json());
   
   app.post('/webhooks/whatsapp', webhooksRouter.whatsapp);
   app.post('/webhooks/telegram', webhooksRouter.telegram);
   app.post('/webhooks/instagram', webhooksRouter.instagram);
   
   // Health check
   app.get('/health', (req, res) => res.json({ status: 'ok' }));
   
   app.listen(3001, () => console.log('Webhook service running on :3001'));
   ```

3. /services/api/src/routes/webhooks.ts:
   - POST /webhooks/whatsapp: 
     * Verify X-Twilio-Signature (or Meta signature, depending on provider)
     * Extract: to (phone), from (sender), message_body
     * Call createChannelMessage mutation in Convex
     * Return: { status: 'queued' }
   - POST /webhooks/telegram:
     * Verify token in message (or signature)
     * Extract: message.chat.id, message.from.first_name, message.text
     * Call createChannelMessage mutation
     * Return: { ok: true }
   - POST /webhooks/instagram:
     * Verify X-Hub-Signature
     * Extract: sender_id, text, recipient_id
     * Call createChannelMessage mutation
     * Return: { status: 'ok' }

4. Signature verification middleware:
   - Each provider has a different scheme; we'll implement placeholder logic
   - Later (Week 2): integrate actual webhook credentials (WHATSAPP_TOKEN, TELEGRAM_BOT_TOKEN, INSTAGRAM_VERIFY_TOKEN)

5. Convex client util:
   - Initialize with CONVEX_URL and CONVEX_API_KEY from environment
   - Async mutation call: createChannelMessage(channel, senderPhone, senderName, messageText)

6. .env.example:
   ```
   PORT=3001
   NODE_ENV=development
   
   # Convex
   CONVEX_URL=https://your-deployment.convex.cloud
   CONVEX_API_KEY=your-api-key
   
   # Webhook credentials (Week 2)
   WHATSAPP_BUSINESS_ACCOUNT_ID=
   WHATSAPP_ACCESS_TOKEN=
   TELEGRAM_BOT_TOKEN=
   INSTAGRAM_VERIFY_TOKEN=
   ```

7. Test locally:
   - npm run dev (starts Express on :3001)
   - curl -X POST http://localhost:3001/health (verify server)
   - Mock POST to /webhooks/whatsapp with test payload (returns 200)

8. Commit: "feat: add Express webhook service skeleton (whatsapp, telegram, instagram endpoints)"
```

---

### Task 1.4: Next.js Route Skeleton (1 day)
**Owner:** Dev B
**Deliverable:** Next.js app routes clean of old code, new PMS route structure ready

**Cursor Prompt:**
```
Task: Clean up Next.js app and establish route structure for Ivano PMS.

Current state: /apps/web contains Ivano IQ code (vendor routes, licensing pages)
Target state: /apps/web ready for PMS dashboard

Actions:

1. Remove old routes:
   - Delete /apps/web/src/app/(admin) or any vendor/licensing routes
   - Delete /apps/web/src/app/(public) if it's IQ-specific
   - Keep: authentication routes (Clerk-managed), layout.tsx, globals.css

2. Create PMS route structure:
   /apps/web/src/app/
     (auth)/
       login/
       register/
     (dashboard)/
       layout.tsx (main dashboard layout)
       page.tsx (home/overview)
       bookings/
         page.tsx (booking list)
         [id]/
           page.tsx (booking detail)
       guests/
         page.tsx (guest list)
       units/
         page.tsx (unit/room list)
       channels/
         page.tsx (unified inbox)
       reports/
         page.tsx (occupancy, revenue)
       settings/
         page.tsx (property settings, manager settings)

3. Create placeholder pages:
   - Each page.tsx: <h1>Section Name</h1> + comment "TODO: Build UI"
   - Dashboard layout: Sidebar (nav), header (user/settings), main content area

4. Create /apps/web/src/app/api/
   (User-facing APIs; different from /services/api which handles webhooks)
   
   /api/
     bookings/
       route.ts (GET/POST /api/bookings)
       [id]/
         route.ts (GET/PATCH /api/bookings/:id)
     guests/
       route.ts (GET/POST /api/guests)
     units/
       route.ts (GET /api/units)
     property/
       route.ts (GET/PATCH /api/property)

5. API stubs:
   Each route.ts returns JSON placeholder:
   ```typescript
   import { NextResponse } from 'next/server';
   
   export async function GET() {
     return NextResponse.json({ message: 'TODO: Implement' });
   }
   ```

6. Convex integration:
   - /apps/web/src/convex.ts (Convex client initialization)
   - All API routes will call Convex mutations/queries internally

7. Test:
   - npm run dev (start Next.js)
   - Navigate to http://localhost:3000/login (should load, Clerk auth)
   - Navigate to http://localhost:3000/dashboard (should load sidebar + placeholder)
   - Verify no 404s on new routes

8. Commit: "feat: establish PMS dashboard route structure and API stubs"
```

---

### Task 1.5: Local Dev Setup Checklist (0.5 days)
**Owner:** Any dev
**Deliverable:** README with dev env setup verified

**Cursor Prompt:**
```
Task: Document and verify local dev setup for Ivano PMS.

Checklist (run in order):

1. Clone repo & dependencies:
   git clone https://github.com/Ivano-Technologies/techivano-pms
   cd techivano-pms
   pnpm install

2. Environment variables:
   Copy .env.example → .env.local
   Set CONVEX_DEPLOYMENT and other keys (from Convex dashboard)
   Set CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from Clerk dashboard)

3. Start services (in separate terminals):
   Terminal 1: npx convex dev (Convex local backend + dashboard)
   Terminal 2: cd services/api && npm run dev (Express webhook service on :3001)
   Terminal 3: cd apps/web && npm run dev (Next.js app on :3000)

4. Verify:
   - Convex dashboard loads at http://localhost:8001 (default Convex dev port)
   - Schema is synced (shows PROPERTY, UNIT, BOOKING, etc. tables)
   - Seed data loads (check Data tab)
   - Express health: curl http://localhost:3001/health → { status: 'ok' }
   - Next.js dashboard: http://localhost:3000/login (Clerk login screen)
   - After login: http://localhost:3000/dashboard (PMS dashboard layout)

5. Create /DEVELOPMENT.md:
   ```markdown
   # Local Development Setup
   
   ## Prerequisites
   - Node.js 18+
   - pnpm
   - Convex account (free tier)
   - Clerk account (free tier)
   
   ## Start Development
   
   1. npm install (root)
   2. Terminal 1: npx convex dev
   3. Terminal 2: cd services/api && npm run dev
   4. Terminal 3: cd apps/web && npm run dev
   5. Access:
      - Dashboard: http://localhost:3000
      - Convex: http://localhost:8001
      - Webhooks: http://localhost:3001
   ```

6. Commit: "docs: add development setup guide"
```

---

## SUCCESS CRITERIA FOR WEEK 1

**By EOD Friday, June 28:**

- [ ] Old Ivano IQ code removed (audit + delete)
- [ ] Convex schema defined, compiled, seed data loads (9 tables + sample records)
- [ ] Express service running on :3001, responds to /health
- [ ] Next.js dashboard routes established, no 404s
- [ ] All 3 services start locally without errors
- [ ] DEV commits clean, descriptive messages
- [ ] Cursor task prompts completed; blockers documented

**Deliverables in git:**
1. `chore: remove Ivano IQ vendor licensing code`
2. `feat: add PMS core schema (9 tables, mutations, queries, seed data)`
3. `feat: add Express webhook service skeleton`
4. `feat: establish PMS dashboard route structure and API stubs`
5. `docs: add development setup guide`

---

## TEAM SYNC POINTS

**Daily standup:** 9 AM (each dev reports blockers, yesterday/today/tomorrow)

**EOW sync (Friday 3 PM):** 
- Confirm all Week 1 tasks complete
- Preview Week 2 (Phase 1: Manager dashboard + booking lifecycle)
- Adjust timeline if blockers

---

## NEXT WEEK PREVIEW (Phase 1, July 1–28)

Week 2 (July 1–7):
- Manager dashboard: home, quick stats (occupancy, revenue, pending messages)
- Booking calendar: visual grid (units × dates), drag-to-create, color-coded status
- NLP keyword extraction: dates + guest names from channel messages

Week 3–4:
- Booking lifecycle: status machine (inquiry → confirmed → checked-in → completed)
- Guest CRUD, unit management
- Channel message intake UI (unified inbox, manager review/convert/archive)

Week 5:
- Reporting foundation (occupancy snapshot queries, revenue breakdown)

---

**Questions? Ask Cursor or this doc. Let's build.**
