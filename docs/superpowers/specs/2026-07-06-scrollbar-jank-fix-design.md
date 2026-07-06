# Scrollbar Jank Fix Design

**Date:** 2026-07-06
**Status:** Approved for implementation

## Problem

Navigating between pages of different heights causes the viewport scrollbar to appear/disappear, shifting content width by ~15-17px (the scrollbar width). This creates visible "jank" — the entire page content jumps horizontally. The sidebar also exhibits jank when navigating between pages, likely due to internal scrollbar appearance within its nav container.

## Root Causes

1. **Viewport scrollbar appearance** — Pages with different content heights cause the vertical scrollbar to toggle on/off. Even with `scrollbar-gutter: stable` on `:root`, the behavior is inconsistent.

2. **Sidebar internal scrollbar** — The sidebar's `.sidebar-scroll` container hides its scrollbar until hover, so when nav content height changes between pages, the internal scrollbar may appear, shifting nav items.

3. **`overflow: hidden` toggles** — `DetailPanel.tsx` and `Sidebar.tsx` set `overflow: hidden` on `body`/`html` when panels open, which overrides `scrollbar-gutter` and causes a width snap when panels open/close.

## Design

### Section 1: Baseline — `scrollbar-gutter` on `html`

Move `scrollbar-gutter` from `:root` to `html` explicitly with `both-edges`:

```css
html {
  scrollbar-gutter: stable both-edges;
}
```

This reserves scrollbar space on both sides of the viewport, so centered content never shifts. `both-edges` ensures symmetry regardless of which OS side the scrollbar lives on.

**Files:** `src/index.css`

### Section 2: Sidebar scroll stability

Apply `scrollbar-gutter: stable` and consistent thin scrollbar to `.sidebar-scroll` so the nav content area never changes width when a scrollbar appears internally.

Keep the existing thin scrollbar styling but make the gutter space always reserved. The hover-reveal thumb pattern can remain — the key is that the scrollbar track space is accounted for at all times.

**Files:** `src/index.css`

### Section 3: Global thin scrollbar styling

Add consistent thin scrollbar defaults across the entire app to minimize the visual impact of reserved gutter space:

- Firefox: `scrollbar-width: thin`
- Chromium/Webkit: `::-webkit-scrollbar { width: 6px; height: 6px; }` with subtle thumb color

This reduces the reserved gutter from ~17px to ~6px.

**Files:** `src/index.css`

### Section 4: Fix `overflow: hidden` toggles

Remove `overflow: hidden` toggles from:

- **`DetailPanel.tsx:17-23`** — Remove the `useEffect` that sets `document.body.style.overflow = 'hidden'`. The backdrop overlay and click-outside handler provide sufficient interaction isolation.
- **`Sidebar.tsx:114-118`** — Remove the `useEffect` that toggles `overflow-hidden` on `html` for mobile sidebar. The mobile overlay already prevents interaction with the background.

**Files:** `src/components/ui/DetailPanel.tsx`, `src/components/Sidebar.tsx`

## Scope

This is a focused CSS + minor JS cleanup. No new components, no new dependencies, no layout restructure. All changes are in existing files with minimal diff.

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `scrollbar-gutter: stable both-edges` to `html`, add global thin scrollbar styles, update `.sidebar-scroll` |
| `src/components/ui/DetailPanel.tsx` | Remove `overflow: hidden` body toggle |
| `src/components/Sidebar.tsx` | Remove `overflow-hidden` html toggle |

## Testing

- Navigate between pages of different heights (Dashboard vs Blotter Records vs Residents) — no horizontal jank
- Open and close detail panels (resident flyout, household flyout) — no width shift
- Toggle sidebar collapse — nav items don't shift
- Test on Chrome, Firefox, Edge
- Verify mobile sidebar overlay still works without body scroll lock
