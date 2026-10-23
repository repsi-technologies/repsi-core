# REPSI — DESIGN.md

Format follows the DESIGN.md convention collected in
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT). The content is REPSI's own
system, taken from `app/globals.css` and `components/ui/*`. Tokens in code are the source of truth: if this file
and `globals.css` disagree, `globals.css` wins and this file should be updated.

## Overview

Professional B2B SaaS for gym owners, front-desk staff, trainers and members. Calm warm-neutral surfaces, one
strong orange accent, dense but readable data screens. Owners use it on a laptop at the desk; members and trainers
mostly on phones. It should feel like a tool, not a landing page.

## Colors

### Brand & Accent
| Role | Light | Dark | Token |
|---|---|---|---|
| Primary (actions, active nav indicator, focus ring) | `#E25822` | `#E25822` | `--primary` |
| Primary hover | `#C94715` | `#EB6D3A` | `--primary-hover` |
| Link / accent text | `#AC3A0E` | `#EB6D3A` | `--link`, `--primary-dark` |
| Primary soft (selected rows, active nav bg) | `#FDF1EB` | orange 15% | `--primary-soft` |

Use orange for one primary action per view, the active nav item and focus. Not for large backgrounds or body text.

### Surface
`--background` `#F7F7F5` / `#17191C` · `--surface` `#FFFFFF` / `#24272B` · `--surface-secondary` `#EFEEEA` / `#2E3237`
· `--border` `#E4E2DC` / `#3A3F45` · `--border-strong` `#C9C7C1` / `#4B5158`.

### Text
`--text` `#17191C` / `#F7F7F5` · `--text-secondary` `#6B6F76` / `#A6A8AC` · `--text-disabled` `#A6A8AC` / `#70747A`.

### Semantic
Success `#047857`, warning `#A16207`, error `#BE123C`, info `#475569` (light), each with a `-soft` background.
Status is always text + colour (badge label), never colour alone.

## Typography

- Family: IBM Plex Sans (`--font-sans`, `--font-heading`), system fallback. Caveat only for marketing accents.
- Page title 24–28px/600, section title 18px/600, body 14–15px/400, table and meta 13px, labels 13px/500.
- Numbers in tables, KPIs and money use `tabular-nums`. Money via `formatCurrency` (INR by default).

## Layout

- Spacing on a 4px grid; card padding 24px (`p-6`), compact cards 16px.
- App shell: fixed left sidebar on `lg+`, bottom/mobile nav below. Content max width ~1280px on dashboards.
- Page pattern: title + breadcrumb → primary action (right) → filters/search → content → pagination.

## Elevation & Depth

Very low shadows (`--shadow-sm` … `--shadow-lg`, 4% alpha in light). Separate surfaces with borders first,
shadow second. Dialogs use `--shadow-lg` plus an overlay.

## Shapes

Radius scale: 6 / 8 (default, buttons, inputs) / 10 / 12 (cards) / 16px. Avatars and status dots are round.

## Components

- **Buttons** (`components/ui/button.tsx`): variants default (orange), secondary, outline, ghost, destructive, link;
  sizes sm 40px, default 48px, lg 52px, icon 48/40px. `loading` prop shows a spinner and disables the button.
- **Cards** (`card.tsx`): surface background, 1px border, 12px radius.
- **Inputs** (`input.tsx`, `phone-input.tsx`, `country-select.tsx`): labelled, start/end icon slots, inline error.
- **Dialogs** (`dialog.tsx`, Radix): confirm destructive or money-related actions (refund, cancel, suspend, delete).
- **Feedback**: `skeleton.tsx`/`dashboard-skeleton.tsx` for loading, `empty-state.tsx` for empty, toasts for success.
- **Tables**: sticky header, right-aligned numbers, row actions in a dropdown menu; become cards below `md`.
- **Charts**: recharts; neutral gridlines, orange for the primary series, semantic colours for status series.

## Do's and Don'ts

Do: reuse `components/ui`; keep one primary action per screen; show empty states that explain the next step;
write labels in plain words ("Record payment", not "Submit").

Don't: hard-code hex or `gray/zinc/slate` utilities on app screens; use gradient text, glassmorphism, giant hero
type or decorative 3D on working screens; copy another brand's look from awesome-design-md; add a second UI kit.

## Responsive Behavior

Breakpoints: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Check 375, 768, 1024 and 1440px.
Touch targets ≥ 44px on member and trainer screens. No page-level horizontal scroll at 375px.

## Accessibility

WCAG 2.2 AA target. Visible `focus-visible` ring using `--ring`. Icon buttons need `aria-label`. Honour
`prefers-reduced-motion`. Check every screen in light and dark mode.
