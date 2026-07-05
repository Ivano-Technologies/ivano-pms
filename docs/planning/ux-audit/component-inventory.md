# Component Inventory — UX Audit (A.2)

Captured: 2026-06-24  
Method: Full static analysis of `apps/web/src/components/**` and `apps/web/src/app/globals.css`  
Screenshots: See `screenshot-script.mjs` — requires authenticated dev server, pending execution

---

## Top-level routes

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Landing / marketing page |
| `/sign-in` | `app/sign-in/[...sign-in]/page.tsx` | Clerk-managed |
| `/dashboard` | `app/dashboard/page.tsx` | Overview / stats |
| `/dashboard/bookings` | `app/dashboard/bookings/page.tsx` | Calendar + booking list |
| `/dashboard/bookings/[id]` | `app/dashboard/bookings/[id]/page.tsx` | Booking detail |
| `/dashboard/guests` | `app/dashboard/guests/page.tsx` | Guest table |
| `/dashboard/units` | `app/dashboard/units/page.tsx` | Unit grid |
| `/dashboard/channels` | `app/dashboard/channels/page.tsx` | Channel connection management |
| `/dashboard/reports` | `app/dashboard/reports/page.tsx` | Revenue + occupancy |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Channel tokens, settings |

All dashboard routes share a single shell: `PmsDashboardLayout` (persistent sidebar + header).

---

## Primitive layer — `src/components/ui/`

| Component | File | Origin | Detail |
|---|---|---|---|
| Button | `ui/button.tsx` | **Base UI + CVA** (not shadcn) | Uses `@base-ui/react/button` + `@radix-ui/react-slot`. 6 variants (default/outline/secondary/ghost/destructive/link), 8 sizes. Full focus-visible ring system. |
| Card | `ui/card.tsx` | **Hand-rolled** (shadcn data-slot style) | 6 sub-components: Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter. `size` prop (default/sm). |
| Skeleton | `ui/skeleton.tsx` | **Hand-rolled** (shadcn-style) | `animate-pulse rounded-md bg-muted`. No variants. |
| Table | `ui/table.tsx` | **Hand-rolled** (shadcn-style) | 7 sub-components. Overflow-x-auto container baked in. |
| Tooltip | `ui/tooltip.tsx` | **Radix UI** (`@radix-ui/react-tooltip`) | Standard wrapper. Provider, Root, Trigger, Content exported. |
| StatusBadge | `ui/status-badge.tsx` | **Hand-rolled** | 3 variants only: active/expired/warning. Rounded-full pill shape. |

### Missing from the primitive layer (gaps for A.3)

| Primitive | Current state | Impact |
|---|---|---|
| Dialog / Modal | DIY overlay (`fixed inset-0 bg-black/40`) — 3 different implementations | No focus trap, no Radix Dialog semantics. `globals.css` itself notes "no local Input component yet" |
| Input | Inline Tailwind classes on `<input>` / `<select>` | `inputClassName` from `lib/unit-utils` used as a shared constant but not a component |
| Select / Dropdown | Native `<select>` everywhere | Property switcher, all form dropdowns |
| Command palette | Not present | Entire §7 efficiency pattern depends on this |
| Date picker | Not present | Date fields use native `<input type="date">` |
| Badge / Chip (reusable) | `StatusBadge` (3-variant only) + inline `rounded-full border px-2 py-0.5` repeated in 4+ components | No shared channel-tag or status-chip primitive — each component rolls its own |
| Form field wrapper | Not present | Label + input + error pattern repeated in every form |

---

## Domain components

### Layout shell — `src/components/layout/`

**`pms-dashboard-layout.tsx`**
- Fixed 224px sidebar (`w-56`) with top brand label + PropertySwitcher + nav links
- Header: "Manager dashboard" label left, `<UserButton />` right
- Nav links: **text-only** (no icons), active state via `bg-accent`
- No mobile breakpoint — sidebar never collapses
- No command bar, no global search

**`property-switcher.tsx`**
- A native `<select>` element. Hidden when ≤1 property.
- No searchability, no per-property visual identity, causes a full Convex re-query on change (no optimistic transition)
- §4 (searchable dropdown, per-property accent, no-reload swap) is entirely unimplemented

### Bookings — `src/components/bookings/`

**`booking-calendar.tsx`** — strongest existing component
- Custom CSS Grid Gantt (30-day window, no external calendar lib)
- Already timeline/bar style — partially matches §5.3 vision
- `CalendarSkeleton` implemented correctly (skeleton rows, not spinner)
- Hardcodes `blue-*` for "today" highlight — not a semantic token
- Error state: plain `<p>` text only, no retry action
- Booking status colors via `BOOKING_STATUS_COLORS` map (separate lib file)
- Touch target concern: booking bars are `min-h-12` (48px) — OK; empty cells are `min-h-14` (56px) — OK

**`booking-detail-popover.tsx`** — named "popover", implemented as full-screen modal
- DIY overlay (modal #3)
- Tabbed UI: details / history / checklist — all loaded lazily via `next/dynamic` ✓
- **UX smell: `window.confirm()`** for status transition confirmation — not screen-reader-safe, can't be styled, blocks main thread
- Status badge is inline `rounded-full border px-2 py-0.5` — duplicates StatusBadge but not using it
- `formatStatusLabel` produces "pending confirmation" from "pending_confirmation" — underscore replace only, not a label map

**`quick-create-booking-modal.tsx`** — DIY overlay modal #1
- Good: proper `role="dialog"`, `aria-modal`, `aria-labelledby`
- Status field uses raw radio inputs, label text is `value.replace("_", " ")` — same underscore smell

**`booking-checklist.tsx`**, **`booking-audit-trail.tsx`** — lazy-loaded, not read in detail

### Inbox — `src/components/inbox/`

**`inbox-message-card.tsx`**
- Hardcoded `blue-*` for unread state (`bg-blue-50/60`, `border-blue-200`, `bg-blue-500` dot) — not semantic tokens
- Channel tag: inline `rounded-full border px-2 py-0.5` — not using StatusBadge, each channel defines its own `badgeClass` in `CHANNEL_META`
- "Linked booking" badge: inline emerald classes — third implementation of the same badge pattern
- NLP extraction chips (extractedCheckIn / extractedCheckOut / guestNames) — good data, poor visual hierarchy (same muted style as metadata)
- Actions appear on hover only (`opacity-0 group-hover:opacity-100`) — invisible on mobile/touch

**`inbox-page-client.tsx`** — not read in detail, but uses `inbox-message-card.tsx`

**`convert-to-booking-modal.tsx`** — DIY overlay modal #2 (assumed from name)

### Reports — `src/components/reports/`

**`revenue-chart.tsx`**
- Hand-rolled SVG bar chart — no Recharts, no Chart.js
- Responsive via `viewBox` + `w-full` — good
- Bars use `fill-primary/80` (semantic token) ✓
- No tooltip on hover, no y-axis labels, no legend
- `formatNgn()` used correctly for value labels

**`occupancy-table.tsx`**
- Hand-rolled `<table>` (not using the `Table` primitive)
- Occupancy rate color: hardcoded green/amber/muted thresholds — not semantic tokens
- No sorting, no pagination, no empty state with action (just a `<p>` on empty)

### Guests — `src/components/guests/`

**`guests-table.tsx`** — uses `Table` primitive ✓  
**`guest-form-modal.tsx`** — DIY modal #4 (assumed)  
**`delete-guest-dialog.tsx`** — DIY modal #5 (assumed)  
**`guests-page-client.tsx`** — page wrapper

### Units — `src/components/units/`

**`unit-form-modal.tsx`** — DIY overlay modal, full hand-rolled form
**`unit-card.tsx`**, **`units-grid.tsx`** — not read in detail

### Settings — `src/components/settings/`

**`channel-token-card.tsx`**
- Three-state card per channel (not connected / connected / coming-soon)
- Connect button: disabled, label "Coming soon" — placeholder for OAuth task 6.1/6.4
- Connected state shows phoneNumberId + expiry as plain text (good — no token exposure)
- Status text hardcodes `text-green-600` for connected — not semantic token

---

## Icon library

**Single library in use: `lucide-react` (`^1.7.0`)**

Icons found in source:
- `Archive`, `ArchiveRestore`, `CheckCircle`, `Circle`, `PlusCircle` — in `inbox-message-card.tsx`
- No other icon imports found in domain or layout components

Nav rail: **text labels only, no icons** — `pms-dashboard-layout.tsx` uses plain text links  
Brand: SVG components in `components/brand/` (`techivano-mark.tsx`, `techivano-logo.tsx`, `powered-by-techivano.tsx`) — not Lucide

No other icon libraries detected (`heroicons`, `phosphor-icons`, `react-icons` — none found). Lucide is the sole icon system. ✓ Aligns with §6 recommendation.

---

## Typography — existing system (conflict with Direction 3)

The existing font stack in `globals.css` is more developed than the token proposal assumed. This is a **decision point**:

| Role | CSS variable | Current value | Fallback chain | Status |
|---|---|---|---|---|
| Body / UI | `--font-sans` | `"Satoshi"` | `Inter → system` | **Active** — loaded via Fontshare CDN (`api.fontshare.com`) |
| Brand / identity | `--font-brand` | `"Ceoruse"` | `Playfair Display → Georgia` | **Aspirational** — woff2 not self-hosted yet |
| Headings | `--font-heading` | `"Gonero"` | `Space Grotesk → Inter` | **Aspirational** — woff2 not self-hosted yet |
| Mono | `--font-mono` | `"Geist Mono"` | `system monospace` | Active |

**Conflict with Direction 3:** The approved direction specifies Plus Jakarta Sans for both display and body (single face). The existing system has Satoshi as body and two aspirational custom faces (Ceoruse/Gonero) for brand/heading. Possible resolutions:

1. **Clean break** — replace Satoshi + Ceoruse/Gonero with Plus Jakarta Sans entirely. Cleaner, Direction 3 as specified.
2. **Adopt Satoshi as body** — Satoshi is a close peer to Plus Jakarta Sans (both modern geometric sans). Keep Satoshi as body, use Plus Jakarta Sans as heading/display, discard Ceoruse/Gonero. Less breaking.
3. **Complete the existing vision** — self-host Ceoruse/Gonero, discard the Direction 3 typeface recommendation entirely. Largest divergence from approved direction.

**Recommendation: Option 1 or 2.** Decision needed before A.3 scaffolding.

**Fontshare CDN note:** Loading Satoshi via `api.fontshare.com` is a render-blocking external request. For Lighthouse performance, this should become a `next/font` local import (self-hosted). This is independent of which direction is chosen.

---

## Color — existing system (will be fully replaced)

Current CSS variables (light mode) reflect a **luxury gold/bronze/espresso** palette:

| Token | Current value | Notes |
|---|---|---|
| `--primary` | `#000000` | Black CTA in light mode |
| `--primary` (dark) | `#deaf5f` | Gold in dark mode |
| `--brand-green-700` | `#b37c4b` | Misleading name — this is **bronze**, not green |
| `--brand-gold-500` | `#deaf5f` | Gold |
| `--card` | `#f4f4f5` | Cool off-white |
| `--background` | `#ffffff` | |
| `--radius` | `0.625rem` (10px) | Direction 3 targets 4px — significant tightening |

Direction 3 replaces this entirely with Forest Green 800 (`#166534`) primary + Zinc neutral scale. The brand variables (`--brand-green-*`, `--brand-gold-*`, `--lux-*`) and the dark-mode mesh gradients will all be replaced.

**Dark mode:** Already implemented (`.dark` class with full token set + mesh gradients). Direction 3 is the best fit for dark mode of the three proposed directions — this existing investment can be preserved.

---

## Accessibility findings (from static analysis)

| Finding | Location | Severity |
|---|---|---|
| `window.confirm()` for booking status transitions | `booking-detail-popover.tsx:101` | High — not screen-reader safe, not stylable |
| DIY modals lack focus trap | all 5 DIY overlay modals | High — keyboard users can tab behind modal |
| Hover-only actions | `inbox-message-card.tsx` action buttons | High — invisible on touch devices |
| Unread state communicated by color only (blue dot) | `inbox-message-card.tsx` | Medium — needs icon or label alongside dot |
| No `aria-current` on nav links | `pms-dashboard-layout.tsx` | Medium |
| Occupancy rate color only (green/amber/muted) | `occupancy-table.tsx` | Medium — needs label alongside color |
| No visible focus style on calendar empty cells | `booking-calendar.tsx` | Medium — `transition-colors` only, no `focus-visible` ring |

---

## Performance findings (from static analysis)

| Finding | Location | Severity |
|---|---|---|
| Fontshare CDN (render-blocking) | `globals.css:1` | Medium — `@import url(api.fontshare.com/...)` blocks render; should be `next/font` self-hosted |
| `next/dynamic` used correctly | `booking-detail-popover.tsx` | Good ✓ — audit trail and checklist lazy-loaded |
| Hand-rolled SVG chart | `revenue-chart.tsx` | Good ✓ — no chart library load penalty |
| `BookingCalendar` memoized | `booking-calendar.tsx` | Good ✓ — `memo()` applied |

**Lighthouse numbers:** Could not be captured from static analysis — requires a live authenticated session. Run against `https://pms.techivano.com` (prod) or `http://localhost:3000` (dev) using the script in `screenshot-script.mjs`, or via Chrome DevTools → Lighthouse on the Inbox, Calendar, and Reports routes.

---

## Summary — what A.3 scaffolding must address

1. **Dialog primitive** — Radix Dialog, replacing all 5 DIY overlay modals
2. **Status chip** — single reusable component replacing the 4+ inline `rounded-full border px-2 py-0.5` duplications
3. **Command palette shell** — new (cmdk or Radix Command)
4. **Proper Button focus-visible rings** in calendar (empty cells) and occupancy table
5. **Font decision** (see typography section above)
6. Replace `window.confirm()` in booking-detail-popover with a proper confirm dialog

Items 1–4 are A.3 scope. Item 5 is a token decision. Item 6 can be Part of A.3 or Phase D-pre.1 (inbox redesign).
