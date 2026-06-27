# UX Audit — A.2

Date: 2026-06-24  
Approved token direction: Direction 3 "Precision" (Forest Green 800 + Zinc + Plus Jakarta Sans + 4px radius)

---

## Contents

| File | What it is |
|---|---|
| `component-inventory.md` | Full static analysis: primitives, domain components, typography, color, accessibility, performance findings |
| `screenshot-script.mjs` | Playwright script — run against a live authenticated session to capture before-screenshots |
| `screenshots/` | PNGs will land here after the script runs (not yet committed — requires live auth session) |

---

## How to capture screenshots

### Production baseline (current — uses prod Clerk + demo account)

```bash
# Record session (auto-targets https://pms.techivano.com when pk_live_ keys are active)
node scripts/record-auth-state.mjs

BASE_URL=https://pms.techivano.com node docs/planning/ux-audit/screenshot-script.mjs
```

### Local (after Clerk dev-key migration)

```bash
# 1. Dev keys in apps/web/.env.development.local, dev server running
pnpm --filter @ivano/web dev

# 2. Record session (auto-targets localhost when pk_test_ keys are active)
node scripts/record-auth-state.mjs

# 3. Capture
node docs/planning/ux-audit/screenshot-script.mjs
```

Manual alternative: `npx playwright codegen --save-storage=auth.json http://localhost:3000/sign-in`

See [DEVELOPMENT.md](../../DEVELOPMENT.md#clerk-environments-dev-vs-prod) for dev vs prod split.

Screenshots land in `docs/planning/ux-audit/screenshots/` — 14 files total (7 routes × 2 viewports).

---

## How to capture Lighthouse numbers

Run against the three priority routes from §3 of the architecture doc:

```bash
# Requires Chrome and lighthouse CLI: npm i -g lighthouse
lighthouse http://localhost:3000/dashboard/bookings \
  --output html --output-path ./docs/planning/ux-audit/lighthouse-bookings.html \
  --chrome-flags="--headless"

lighthouse http://localhost:3000/dashboard \
  --output html --output-path ./docs/planning/ux-audit/lighthouse-inbox.html \
  --chrome-flags="--headless"

lighthouse http://localhost:3000/dashboard/reports \
  --output html --output-path ./docs/planning/ux-audit/lighthouse-reports.html \
  --chrome-flags="--headless"
```

Note: Lighthouse on Convex-backed routes with Clerk auth will show unauthenticated page metrics. For realistic numbers, run against the production URL logged in as an authenticated user via Chrome DevTools → Lighthouse tab.

---

## Key findings summary

Full detail in `component-inventory.md`. Headline items:

### What already works well
- `BookingCalendar` — already a Gantt/timeline bar layout (matches §5.3 vision)
- `next/dynamic` used correctly for heavy sub-components (audit trail, checklist)
- `lucide-react` is the only icon library — no mixing ✓
- Dark mode CSS already implemented (`.dark` token set + mesh gradients)
- `Skeleton` used in calendar and detail popover — not spinners ✓

### Gaps that A.3 must close
1. **No Dialog primitive** — 5 DIY overlay modals with no focus trap or Radix Dialog semantics
2. **No reusable status chip** — the same `rounded-full border px-2 py-0.5` pattern is copy-pasted 4+ times across components
3. **No command palette** — entire §7 efficiency pattern unimplemented
4. **Nav rail has no icons** — text-only links, no mobile breakpoint, no command bar
5. **Property switcher is a native `<select>`** — no search, no per-property accent, full re-query on change
6. **`window.confirm()` in booking status transitions** — not accessible, not stylable

### Decision needed before A.3
**Typography:** Existing CSS has Satoshi (body, active) + Ceoruse/Gonero (brand/heading, aspirational but not self-hosted). Direction 3 specified Plus Jakarta Sans for everything. Three options:
- **A (clean break):** Replace Satoshi + Ceoruse/Gonero entirely with Plus Jakarta Sans
- **B (keep Satoshi as body):** Plus Jakarta Sans for heading/display only; discard Ceoruse/Gonero
- **C (complete existing):** Self-host Ceoruse/Gonero; discard PJK recommendation

Options A or B are consistent with the approved direction. Option C departs from it.
