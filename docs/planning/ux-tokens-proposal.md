# Ivano PMS — Design Token Directions (A.1 Proposal)

Status: Awaiting review — do not proceed to A.2/A.3 until one direction is approved or merged  
References: [ux-redesign-architecture.md §6](./ux-redesign-architecture.md#6-design-system--token-architecture), §1 (north star), §2 (constraints)

---

## What this doc is

Three distinct token directions for color, type, spacing, and radius — each a coherent design language, not a color swap on the same base. The goal is to pick one that feels deliberately *ours* before any component gets generated.

None of these hex values are final — they are direction-setters. Once a direction is approved, exact values get validated against WCAG AA contrast ratios before being committed to code.

A note on the property accent system: §4 requires that each property gets a distinct, persistent accent color in the property switcher and command bar. That color axis is dynamic (set per property, not part of the static token set), so all three directions below need to coexist with 5–10 semi-arbitrary hues without clashing. That means the brand primary should sit at a neutral-enough position that property accents can live alongside it without fighting. All three directions account for this.

---

## Direction 1 — "Operations" (Deep Teal)

**Character:** Serious, precise, operational. The color of a dashboard that people trust with real money and real guests. Closest reference-feel: Linear's command-first weight without its purple.

### Color

| Role | Value | Notes |
|---|---|---|
| Brand primary | `#0F766E` (Teal 700) | Not blue, not green-green — sits in the gap most apps avoid |
| Brand primary-light | `#CCFBF1` (Teal 100) | Hover states, selected backgrounds |
| Brand primary-dark | `#134E4A` (Teal 900) | Active/pressed states |
| Neutral scale | Slate (50→950) | Cool gray; aligns with operational density |
| Surface / background | `#F8FAFC` (Slate 50) light / `#0F172A` (Slate 900) dark | |
| Success | `#16A34A` (Green 600) | Confirmed booking, connected channel |
| Warning | `#D97706` (Amber 600) | Pending, expiring token, partial state |
| Danger | `#DC2626` (Red 600) | Overlap conflict, failed send, error |
| Info | `#2563EB` (Blue 600) | General informational messages only |

Brand teal is kept off the semantic axes entirely — it appears on the nav rail active state, the command bar, primary CTAs, and the property switcher shell. Property accent colors (set dynamically per property) live in the accent/500 slot per property and contrast against the slate neutral surfaces.

Dark mode: **recommended in scope for v1** (see open questions). Teal reads well on both light and dark surfaces, which is one of this direction's practical advantages.

### Type

| Role | Face | Notes |
|---|---|---|
| Display / heading | **Inter** (weight 600–700) | Same face as body, distinguished by weight and size — deliberate restraint over a second face |
| Body | **Inter** (weight 400–500) | Already common in the stack; no additional font load |
| Numeric / tabular | **Inter** with `font-variant-numeric: tabular-nums` | NGN amounts, dates, booking counts; CSS feature, no separate face needed |

Single-face approach. Keeps the type system simple to maintain and ensures no loading penalty. The risk is that it can feel undifferentiated at large display sizes — mitigated by tight weight contrast (400 body vs. 700 heading) and generous tracking on display headings.

### Spacing & radius

| Token | Value |
|---|---|
| Base unit | 4px |
| Scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 |
| Border radius | **6px** everywhere — medium, not pill, not sharp |
| Motion timing | 150ms ease-out for micro (hover, focus); 250ms ease-in-out for page-level transitions |

---

## Direction 2 — "Workspace" (Amber + Warm Gray)

**Character:** Warm, energetic, distinctly non-techy. The most opinionated of the three. Amber at this depth reads premium in West African design contexts and is as far from the AI-blue/purple default as you can get without going novelty. Closest feel: a bespoke hospitality product, not a generic SaaS.

### Color

| Role | Value | Notes |
|---|---|---|
| Brand primary | `#B45309` (Amber 700) | Deep amber — not the "yellow warning" shade, but a rich, mature amber |
| Brand primary-light | `#FEF3C7` (Amber 100) | Selected/hover backgrounds |
| Brand primary-dark | `#78350F` (Amber 900) | Active/pressed states |
| Neutral scale | Stone (50→950) | Warm gray; critical to stop the amber reading as a construction site |
| Surface / background | `#FAFAF9` (Stone 50) light / `#1C1917` (Stone 950) dark | Warm off-white, not pure white |
| Success | `#15803D` (Green 700) | Kept cool-green to contrast against warm brand |
| Warning | `#EA580C` (Orange 600) | Must be visually distinct from amber primary — use orange, not amber, here |
| Danger | `#B91C1C` (Red 700) | |
| Info | `#0369A1` (Sky 700) | Cool blue; maximum contrast against warm surfaces |

Key constraint: the warning semantic token cannot be amber (it would be indistinguishable from brand primary). Orange 600 is distinct enough while staying warm.

Dark mode: **possible but harder** — amber on dark stone is legible, but warm-on-warm dark surfaces need careful handling. If dark mode is deferred to v2, this direction still works cleanly in light.

### Type

| Role | Face | Notes |
|---|---|---|
| Display / heading | **DM Sans** (weight 600–700) | Geometric, warm personality; slightly more character than Inter without being decorative |
| Body | **DM Sans** (weight 400) | Same face throughout; second font load is DM Sans only (~18KB woff2) |
| Numeric / tabular | **DM Sans** with `font-variant-numeric: tabular-nums` | DM Sans supports tabular figures natively |

DM Sans is the one additional load vs. Direction 1. It earns its keep by giving headings a warmer, more intentional feel vs. Inter — which at this scale of product matters for the "designed, not assembled" read from §1.

### Spacing & radius

| Token | Value |
|---|---|
| Base unit | 4px |
| Scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 |
| Border radius | **8px** everywhere — slightly softer, fits the warmer palette |
| Motion timing | 200ms ease-out for micro; 300ms ease-in-out for page-level |

---

## Direction 3 — "Precision" (Forest Green + Zinc)

**Character:** Premium, high-contrast, enterprise-legible. Green is functionally loaded in booking contexts (availability = green, confirmed = green), which means it does double duty as brand AND semantic signal — a risk this direction manages by keeping brand green deep/dark and keeping success green in the mid-range where it reads as "status." Closest feel: Stripe's density-without-clutter, but warmer.

### Color

| Role | Value | Notes |
|---|---|---|
| Brand primary | `#166534` (Green 800) | Deep, almost-forest — premium, not "go/available" green |
| Brand primary-light | `#DCFCE7` (Green 100) | Hover / selected backgrounds |
| Brand primary-dark | `#14532D` (Green 900) | Active/pressed |
| Neutral scale | Zinc (50→950) | Cooler than Stone, more "ink" feel; pairs cleanly with deep green |
| Surface / background | `#FAFAFA` (Zinc 50) light / `#18181B` (Zinc 950) dark | |
| Success | `#22C55E` (Green 500) | Lighter/brighter than brand green — legible as a status, not brand |
| Warning | `#F59E0B` (Amber 500) | Maximum contrast against zinc neutrals |
| Danger | `#EF4444` (Red 500) | |
| Info | `#3B82F6` (Blue 500) | |

The brand/success color separation is the thing to watch: Green 800 (brand) vs. Green 500 (success) are far enough apart in luminosity that they read as different signals in context, especially on zinc backgrounds. Worth checking with a colorblind simulator before committing.

Dark mode: **best suited for dark mode of the three.** Zinc 950 backgrounds + Green 800 primaries give a premium dark-mode feel with minimal additional token work.

### Type

| Role | Face | Notes |
|---|---|---|
| Display / heading | **Plus Jakarta Sans** (weight 600–700) | Good Unicode coverage including Nigerian/West African usage; modern geometric with slightly editorial character |
| Body | **Plus Jakarta Sans** (weight 400–500) | Single face throughout; ~20KB woff2 load |
| Numeric / tabular | **Plus Jakarta Sans** with `font-variant-numeric: tabular-nums` | Supports tabular figures |

Plus Jakarta Sans is the most distinctive typographic choice of the three — it has enough character to make the app feel designed at large display sizes without veering decorative. It also has better broad-Unicode coverage than Inter, which matters if property names or guest names include characters outside Latin-1.

### Spacing & radius

| Token | Value |
|---|---|
| Base unit | 4px |
| Scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 |
| Border radius | **4px** everywhere — tighter, more enterprise-precise |
| Motion timing | 150ms ease-out for micro; 200ms ease-in-out for page-level |

---

## Side-by-side summary

| Dimension | Direction 1 "Operations" | Direction 2 "Workspace" | Direction 3 "Precision" |
|---|---|---|---|
| Primary color | Teal 700 (`#0F766E`) | Amber 700 (`#B45309`) | Green 800 (`#166534`) |
| Neutral scale | Slate (cool gray) | Stone (warm gray) | Zinc (near-neutral) |
| Typeface | Inter only | DM Sans | Plus Jakarta Sans |
| Radius | 6px | 8px | 4px |
| Feel | Operational, trusted, neutral | Warm, distinctive, hospitality | Premium, precise, enterprise |
| Dark mode | Best fit for v1 dark | Harder; better for v2 | Best fit of all three for dark |
| Risk | Can feel undifferentiated without strong weight contrast | Warning/brand amber separation needs care | Brand/success green separation needs colorblind check |

---

## Open questions (need answers before A.3)

1. **Dark mode in v1?** The architecture doc flags this explicitly — property managers on night shifts benefit from it, but it doubles token QA surface. Direction 3 is easiest to ship dark-mode-first if the answer is yes; Direction 1 is easiest to add dark mode to later.

2. **Single typeface vs. dual?** Direction 1 (Inter only) is the lowest-friction default in an existing Tailwind/Next.js project. Directions 2 and 3 require a font swap but buy more personality. Is there a current font already loaded via `next/font` that this proposal should be replacing or extending?

3. **Property accent color system:** Each property will carry a persistent accent hue (§4, §5.2). Is this a preset palette of 8–10 options the manager picks from, or a free color picker? A preset palette (e.g. 10 Tailwind-500 hues excluding the brand primary) is much safer for contrast guarantees.

4. **NGN currency display:** Confirm the existing number formatting convention (e.g. `₦ 1,250,000` or `₦1.25M` for large figures in summary cards). The tabular-nums CSS is direction-agnostic, but knowing the display format informs whether we need a monospaced face for the largest figure sizes in Reports.

---

*Next step (pending your approval): A.2 — screenshot audit + component inventory. No code written yet.*
