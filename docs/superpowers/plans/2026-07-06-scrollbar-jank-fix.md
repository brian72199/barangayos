# Scrollbar Jank Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate horizontal layout jank caused by viewport scrollbar appearing/disappearing when navigating between pages of different heights, and fix sidebar scrollbar jank.

**Architecture:** Three independent changes: (1) CSS-level scrollbar gutter reservation + thin scrollbar styling on `html` and `.sidebar-scroll`; (2) remove `overflow:hidden` body toggle in `DetailPanel`; (3) remove `overflow-hidden` html toggle in `Sidebar`.

**Tech Stack:** CSS, React/TypeScript, Tailwind CSS v4

## Global Constraints

- All changes are in existing files only — no new files
- Must not alter layout dimensions, padding, or spacing of any component
- Must not remove or change backdrop overlays or click-outside handlers — only the `overflow: hidden` toggles
- Must verify `npm run build` passes (TypeScript + Vite)

---

### Task 1: CSS baseline — scrollbar-gutter + thin scrollbar styles

**Files:**
- Modify: `src/index.css` (lines 149-151, 240-264)

**Interfaces:**
- Consumes: nothing
- Produces: CSS custom properties and selectors that are purely presentational — no JS interfaces

- [ ] **Step 1: Move `scrollbar-gutter` from `:root` to `html` and add `both-edges`**

Replace line 150 in `:root`:
- Before: `scrollbar-gutter: stable;`
- After: (remove from `:root`)

Add a new `html` block above `body` (after line 238) with:
```css
html {
  scrollbar-gutter: stable both-edges;
}
```

- [ ] **Step 2: Add global thin scrollbar defaults**

After the `html` block, add:
```css
html {
  scrollbar-width: thin;
}

html::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

html::-webkit-scrollbar-track {
  background: transparent;
}

html::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 999px;
}

html::-webkit-scrollbar-thumb:hover {
  background: var(--text-subtle);
}
```

- [ ] **Step 3: Update `.sidebar-scroll` to add `scrollbar-gutter: stable`**

Modify the `.sidebar-scroll` block (line 240):
```css
.sidebar-scroll {
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
```

The rest of `.sidebar-scroll:hover` etc. stays unchanged.

- [ ] **Step 4: Verify the CSS builds**

```bash
npx tsc -b --noEmit 2>&1 | head -30
```

Expected: no errors (or only pre-existing errors unrelated to CSS).

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "fix: reserve scrollbar gutter on html and apply thin scrollbar styles"
```

---

### Task 2: Fix DetailPanel overflow toggle

**Files:**
- Modify: `src/components/ui/DetailPanel.tsx` (lines 16-23)

**Interfaces:**
- Consumes: nothing
- Produces: `DetailPanel` component without body scroll lock

- [ ] **Step 1: Remove the `useEffect` that toggles body overflow**

In `src/components/ui/DetailPanel.tsx`, delete lines 16-23 (the `useEffect` that sets `document.body.style.overflow`).

Before:
```tsx
export function DetailPanel({ open, onClose, title, onEdit, onDelete, loading, children }: DetailPanelProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
```

After:
```tsx
export function DetailPanel({ open, onClose, title, onEdit, onDelete, loading, children }: DetailPanelProps) {
  if (!open) return null
```

Also remove the unused `useEffect` import if it becomes unused. The current import is `import { useEffect, type ReactNode } from 'react'`. If `useEffect` is no longer used elsewhere in the file (check), remove it.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc -b --noEmit 2>&1 | head -30
```

Expected: no errors. The `useEffect` import removal should not break anything since it was the only usage.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/DetailPanel.tsx
git commit -m "fix: remove body overflow:hidden toggle from DetailPanel"
```

---

### Task 3: Fix Sidebar overflow toggle

**Files:**
- Modify: `src/components/Sidebar.tsx` (lines 113-120)

**Interfaces:**
- Consumes: nothing
- Produces: `Sidebar` component without `overflow-hidden` toggle on `html`

- [ ] **Step 1: Remove the `useEffect` that toggles overflow-hidden on `html`**

In `src/components/Sidebar.tsx`, delete lines 113-120 (the `useEffect` that adds/removes `overflow-hidden` on `document.documentElement.classList`).

Before:
```tsx
  useEffect(() => {
    onMobileOpenChange(false)
  }, [location.pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.documentElement.classList.add('overflow-hidden')
    } else {
      document.documentElement.classList.remove('overflow-hidden')
    }
    return () => { document.documentElement.classList.remove('overflow-hidden') }
  }, [mobileOpen])

  function handleLogout() {
```

After:
```tsx
  useEffect(() => {
    onMobileOpenChange(false)
  }, [location.pathname])

  function handleLogout() {
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc -b --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "fix: remove overflow-hidden html toggle from Sidebar mobile overlay"
```

---

### Full verification

- [ ] **Run full build**

```bash
npm run build 2>&1 | tail -20
```

Expected: exits with code 0, produces output in `dist/`.

- [ ] **Run lint**

```bash
npm run lint 2>&1 | tail -20
```

Expected: no new lint errors (pre-existing warnings are fine).
