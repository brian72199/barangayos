# UI/UX Polish Design

> Full UI/UX polish pass for BarangayOS — visual refinement, shared component library, page polish patterns, and interaction improvements.

**Date:** 2026-07-06
**Approach:** Hybrid — build shared components + refine visual system in parallel, then migrate pages

---

## 1. Visual Design System

### Palette Refinements

| Token | Light | Dark | Change |
|-------|-------|------|--------|
| `--bg` | `#F6F2EB` (warmer) | `#12100E` | Slightly warmer light bg for better card contrast |
| `--card` | `#FFFFFF` | `#141211` | Keep |
| `--fg` | `#1A1513` | `#E5DCD0` | Keep |
| `--border` | `#E8DFD0` | `#2A2622` | Keep |
| `--primary` | `#1B3A4B` | `#6B9BAB` | Dark mode lightened for AA contrast |
| `--muted` | `#F0EBE0` | `#1A1714` | Differentiate from `--secondary` in dark mode |
| `--secondary` | `#F0EBE0` | `#1C1917` | Keep |
| `--gold` | `#C9953E` | `#C9953E` | Keep (accent, focus ring) |
| `--capiz` | `#F8F5F0` | `#0B0A09` | Keep |
| `--narra` | `#5C4033` | `#C4B4A0` | Keep |

Add shadow tokens to `@theme`:
- `--shadow-xs`: `0 1px 2px rgba(0,0,0,0.04)`
- `--shadow-md`: `0 4px 16px rgba(0,0,0,0.08)`
- `--shadow-lg`: `0 8px 32px rgba(0,0,0,0.12)`

### Typography Scale

- **Display font:** `Outfit` — headings, sidebar, page titles, dashboard hero
- **Body font:** `Inter` — body text, table cells, form labels, captions

| Role | Font | Size | Weight |
|------|------|------|--------|
| Page title | Outfit | `2xl` (1.5rem) | `semibold` |
| Card title | Outfit | `base` (1rem) | `semibold` |
| Section heading | Outfit | `lg` (1.125rem) | `semibold` |
| Body / labels | Inter | `sm` (0.875rem) | `normal` |
| Table cells | Inter | `sm` (0.875rem) | `normal` |
| Captions | Inter | `xs` (0.75rem) | `normal` |
| Badges | Inter | `xs` (0.75rem) | `semibold` |

### Spacing Rhythm

- Page padding: `p-4 sm:p-6 lg:p-8` (keep current)
- Between sections: `space-y-6` (up from `space-y-5`)
- Between cards: `gap-5` (keep)
- PageHeader bottom: `mb-6` (keep)
- Card padding: `p-6` (keep)
- Form field gap: `space-y-4` (standardize)

### Component Shape Language

- Buttons: `rounded-md` default, `rounded-lg` for primary CTAs
- Cards: `rounded-lg` (keep)
- Inputs: `rounded-md` (keep)
- Focus ring: `ring-2 ring-gold` (distinctive gold accent, not primary)
- Consistently use `ring-offset-background` for focus visibility

---

## 2. Shared Component Library

### P0 — Build First

#### Toast (`ui/toast.tsx` + `lib/toast.ts`)
- Use `sonner` (~4KB gzipped) for accessible, keyboard-navigable toasts
- API: `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`
- Fixed bottom-right, auto-dismiss 4s, stacked
- Replaces `window.alert()` and inline error messages

#### EmptyState (`ui/empty-state.tsx`)
- Centered layout with icon, title, description, optional CTA
- Variants: `default` (empty box), `search` (no results), `error` (with retry)
- Animated entry via `motion-fade-in`

#### Spinner (`ui/spinner.tsx`)
- CSS-only spinner, 3 sizes (sm/md/lg), optional label
- Used by DataTable skeleton, button loading states, page loads

### P1 — Build Second

#### DropdownMenu (`ui/dropdown-menu.tsx`)
- Click-triggered popover menu with items, separators, icons
- Portal-rendered to avoid overflow clipping
- Keyboard accessible: arrow keys, enter, escape

#### Modal (`ui/modal.tsx`)
- Generic reusable modal — backdrop, title, body, footer
- Sizes: sm/md/lg
- Reuses patterns from existing ConfirmDialog (focus trap, escape to close)
- Animations: `motion-scale-in` + backdrop fade

#### DataTable (`ui/data-table.tsx`)
- Props: `columns`, `data`, `loading`, `sortable`, `onSort`, `emptyState`, `onRowClick`
- Columns config: `{ key, label, sortable, render, hideBelow }`
- Loading: 5-row skeleton matching column widths
- Empty: delegates to EmptyState
- Sort: clickable headers with asc/desc chevron
- Responsive: on `<md` breakpoint, renders each row as stacked card (label + value)
- Pagination integration (reuses existing Pagination component)

### P2 — Polish

#### Tabs (`ui/tabs.tsx`)
- Horizontal tab bar with active indicator, optional icons
- Content panel area below

#### Breadcrumb (`ui/breadcrumb.tsx`)
- `Home > Section > Page` pattern
- Each segment clickable, last segment current (plain text)

#### Tooltip (`ui/tooltip.tsx`)
- CSS-only tooltip on hover, positioned above by default
- For icon-only buttons, truncated text

### Component Dependencies

```
Toast (standalone, uses sonner)
Spinner (standalone)
EmptyState (standalone)
DropdownMenu (standalone)
Modal → Spinner, Button
DataTable → Spinner, EmptyState, Pagination, DropdownMenu (sort)
Tabs (standalone)
Breadcrumb (standalone)
Tooltip (standalone)
```

### Performance Notes

- No animation libraries — CSS animations only
- DataTable renders only visible rows (25/page with Pagination)
- DropdownMenu portal-rendered to avoid z-index/overflow issues
- Bundle impact: ~15KB gzipped total

---

## 3. Page Polish Patterns

### Standard Page Template

```
PageHeader (title + subtitle + gold accent bar + actions)
├── FilterBar (search + dropdowns + sort) — accordion below md
├── DataTable or CardGrid
│   ├── Loading skeleton
│   ├── EmptyState (if no data)
│   └── Data rows (hover, click-to-detail)
├── DetailPanel (slide-in view/edit — keep current pattern)
└── Pagination
```

### Mobile Responsiveness

| Pattern | Approach |
|---------|----------|
| Tables | DataTable card layout below `md` breakpoint |
| Filter bars | Collapsed into "Filters" toggle, expandable accordion below md |
| Detail panels | Keep current side panel / bottom sheet pattern |
| Sidebar | Keep current hamburger + overlay drawer |
| Dashboard grid | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` (KPI) |
| Touch targets | All interactive ≥ 44×44px on touch |

### Loading State Strategy

| Scenario | UX |
|----------|-----|
| Page load | Spinner or page skeleton |
| Table load | DataTable skeleton (5 rows) |
| Action submit | Spinner inside button |
| Detail panel | Pulsing lines (keep current) |
| Image upload | Progress indicator |

### Error Handling

| Scenario | UX |
|----------|-----|
| API fail on page load | EmptyState error + Retry |
| API fail on form submit | Toast error, keep form data |
| Network offline | Existing OfflineIndicator + toast on transition |
| Network reconnects | Toast "Back online — syncing..." |
| Form validation | Inline errors below fields |
| Permission denied | Toast error |

---

## 4. Interaction & Micro-animations

| Element | Animation | Trigger |
|---------|-----------|---------|
| Page transitions | `motion-fade-in` + `motion-slide-up` | Route change (keep current) |
| DataTable rows | `motion-stagger-50` | Initial load |
| Toast | `motion-slide-up` + fade | on `toast()` |
| Modal | `motion-scale-in` + backdrop fade | Open |
| Button hover | `brightness-95`/`125` | Hover |
| Card hover | `motion-lift` (translateY(-1px) + shadow) | Hover |
| Skeleton | `animate-pulse` + shimmer gradient | Loading |
| Empty state | `motion-fade-in` + `motion-scale-in` | On mount |

All animations respect `prefers-reduced-motion`.

---

## 5. Implementation Phases

### Phase 1: Foundation — Build Shared Components

1. Toast (`sonner` + wrapper utility)
2. Spinner
3. EmptyState
4. DropdownMenu
5. Modal
6. Tooltip
7. DataTable
8. Tabs
9. Breadcrumb

### Phase 2: Visual System Refinement

1. Update `index.css` tokens
2. Add Inter font to `index.html`
3. Standardize focus ring to gold
4. Add shimmer skeleton keyframes

### Phase 3: Page Migration

| Batch | Pages |
|-------|-------|
| 3.1 | Dashboard, Login |
| 3.2 | Residents, Households |
| 3.3 | Documents (+ Release), Records |
| 3.4 | Assets, Calendar, Agenda |
| 3.5 | Finance (all 5 sub-pages) |
| 3.6 | Logs, Reports, Settings |

### Phase 4: Interaction Polish

- Shimmer skeleton
- Card hover refinement
- Toast stacked dismiss timing
- Mobile filter accordion
- DataTable card fallback
- Empty state animations

---

## 6. Performance Guardrails

- Bundle monitoring via `npx vite build --report` after each phase
- All CSS animations, 0 JS overhead for motion
- No virtualization — 25 rows/page is well within DOM budget
- Only new dependency: `sonner` (~4KB gzipped)
- `prefers-reduced-motion` respected everywhere

---

## 7. Files Changed

### New files
- `src/components/ui/data-table.tsx`
- `src/components/ui/toast.tsx`
- `src/lib/toast.ts`
- `src/components/ui/spinner.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/modal.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/tooltip.tsx`

### Modified files
- `src/index.css` — tokens, keyframes, Inter font
- `index.html` — Inter font import
- `src/lib/utils.ts` — any shared utility additions
- `src/components/Layout.tsx` — minor polish
- `src/lib/statusStyles.ts` — consolidate inline duplications
- `src/pages/Dashboard.tsx` — adopt new components
- `src/auth/LoginPage.tsx` — visual polish
- `src/features/residents/ResidentsPage.tsx` — DataTable migration
- `src/features/households/HouseholdsPage.tsx` — DataTable migration
- `src/features/documents/DocumentsPage.tsx` — DataTable migration
- `src/features/documents/ReleasePage.tsx` — DataTable migration
- `src/features/records/RecordsPage.tsx` — DataTable migration
- `src/features/assets/AssetsPage.tsx` — DataTable migration
- `src/features/calendar/CalendarPage.tsx` — DataTable migration
- `src/features/agenda/AgendaPage.tsx` — DataTable migration
- `src/features/finance/*.tsx` — DataTable migration, Breadcrumb, Tabs
- `src/features/logs/*.tsx` — DataTable migration
- `src/features/reports/ReportsPage.tsx` — polish
- `src/features/settings/SystemSettings.tsx` — polish
