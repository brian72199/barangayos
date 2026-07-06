# UI/UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full UI/UX polish across all pages — shared component library, visual system refinement, page migration, interaction improvements.

**Architecture:** Build 10 new shared UI components (Toast, Spinner, EmptyState, DataTable, etc.), update design tokens in index.css, then migrate all 16+ pages to use new components — phased to keep each task independently testable.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, sonner (new dep ~4KB), Vitest 3 + jsdom (no existing tests — we add component tests)

## Global Constraints

- Only new dependency allowed: `sonner` (~4KB gzipped)
- All animations use CSS only — 0 JS overhead for motion
- Every animation must respect `prefers-reduced-motion`
- Bundle size monitoring via `npx vite build --report` after Phase 1
- No virtualization — 25 rows/page is within DOM budget
- Follow existing file patterns (CVA for variants, `cn()` for classes, `forwardRef` with displayName)
- All new components in `src/components/ui/`
- Import alias `@/` maps to `src/`

---

### Task 1: Install sonner + Create Toast component

**Files:**
- Modify: `package.json`
- Create: `src/lib/toast.ts`
- Create: `src/components/ui/toast.tsx`
- Create: `src/components/ui/toast.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `toast.success(msg, opts?)`, `toast.error(msg, opts?)`, `toast.info(msg, opts?)` — imperative API. `Toaster` component to mount in layout.

- [ ] **Step 1: Install sonner**

Run: `npm install sonner`

Expected: added to `package.json` dependencies

- [ ] **Step 2: Create Toast wrapper `src/lib/toast.ts`**

```ts
import { toast as sonnerToast } from 'sonner'

type ToastOptions = { duration?: number; action?: { label: string; onClick: () => void } }

export const toast = {
  success: (message: string, options?: ToastOptions) => sonnerToast.success(message, options),
  error: (message: string, options?: ToastOptions) => sonnerToast.error(message, options),
  info: (message: string, options?: ToastOptions) => sonnerToast.info(message, options),
}
```

- [ ] **Step 3: Create `src/components/ui/toast.tsx`**

```tsx
export { Toaster } from 'sonner'
```

Simple re-export so pages import from `@/components/ui/toast` instead of directly from `sonner`.

- [ ] **Step 4: Mount Toaster in Layout**

Edit `src/components/Layout.tsx` — add Toaster import and component above `</main>`:

```tsx
import { Toaster } from '@/components/ui/toast'
```

Add `<Toaster position="bottom-right" richColors closeButton />` before the closing `</main>` tag.

- [ ] **Step 5: Write test for Toast wrapper**

Create `src/components/ui/toast.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { toast } from '@/lib/toast'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('toast', () => {
  it('calls sonner on success', () => {
    const { toast: mockToast } = require('sonner')
    toast.success('Saved')
    expect(mockToast.success).toHaveBeenCalledWith('Saved', undefined)
  })

  it('calls sonner on error', () => {
    const { toast: mockToast } = require('sonner')
    toast.error('Failed')
    expect(mockToast.error).toHaveBeenCalledWith('Failed', undefined)
  })

  it('calls sonner on info with options', () => {
    const { toast: mockToast } = require('sonner')
    const opts = { duration: 8000 }
    toast.info('Something', opts)
    expect(mockToast.info).toHaveBeenCalledWith('Something', opts)
  })
})
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/components/ui/toast.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/toast.ts src/components/ui/toast.tsx src/components/ui/toast.test.tsx src/components/Layout.tsx
git commit -m "feat: add toast notification system with sonner"
```

---

### Task 2: Create Spinner + EmptyState + Tooltip components

**Files:**
- Create: `src/components/ui/spinner.tsx`
- Create: `src/components/ui/spinner.test.tsx`
- Create: `src/components/ui/empty-state.tsx`
- Create: `src/components/ui/empty-state.test.tsx`
- Create: `src/components/ui/tooltip.tsx`
- Create: `src/components/ui/tooltip.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `<Spinner size="sm" label="Loading..." />`, `<EmptyState variant="default" title="..." description="..." action={...} />`, `<Tooltip content="..."><button>...</button></Tooltip>`

- [ ] **Step 1: Create Spinner**

`src/components/ui/spinner.tsx`:

```tsx
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const spinnerVariants = cva('animate-spin rounded-full border-2 border-current border-t-transparent', {
  variants: {
    size: {
      sm: 'size-3',
      md: 'size-5',
      lg: 'size-8',
    },
  },
  defaultVariants: { size: 'md' },
})

export interface SpinnerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, label, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
      <div className={spinnerVariants({ size })} role="status" aria-label={label ?? 'Loading'} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  ),
)
Spinner.displayName = 'Spinner'

export { Spinner, spinnerVariants }
```

- [ ] **Step 2: Create EmptyState**

`src/components/ui/empty-state.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Inbox, SearchX, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  variant?: 'default' | 'search' | 'error'
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

const icons = {
  default: Inbox,
  search: SearchX,
  error: AlertCircle,
}

export function EmptyState({ variant = 'default', title, description, action, className }: EmptyStateProps) {
  const Icon = icons[variant]
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center motion-fade-in motion-scale-in', className)}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className={cn('size-6', variant === 'error' ? 'text-destructive' : 'text-muted-foreground')} />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create Tooltip**

`src/components/ui/tooltip.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className={cn('group relative inline-flex', className)}>
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {content}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write tests**

`src/components/ui/spinner.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './spinner'

describe('Spinner', () => {
  it('renders with default size', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('renders label when provided', () => {
    render(<Spinner label="Loading..." />)
    expect(screen.getByText('Loading...')).toBeTruthy()
  })
})
```

`src/components/ui/empty-state.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No data" description="Nothing here yet" />)
    expect(screen.getByText('No data')).toBeTruthy()
    expect(screen.getByText('Nothing here yet')).toBeTruthy()
  })

  it('renders action button and handles click', () => {
    const onClick = vi.fn()
    render(<EmptyState title="Empty" action={{ label: 'Add', onClick }} />)
    fireEvent.click(screen.getByText('Add'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

`src/components/ui/tooltip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip } from './tooltip'

describe('Tooltip', () => {
  it('renders children and tooltip content', () => {
    render(<Tooltip content="Help text"><button>Hover me</button></Tooltip>)
    expect(screen.getByText('Hover me')).toBeTruthy()
    expect(screen.getByText('Help text')).toBeTruthy()
  })
})
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/components/ui/spinner.test.tsx src/components/ui/empty-state.test.tsx src/components/ui/tooltip.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/spinner.tsx src/components/ui/spinner.test.tsx src/components/ui/empty-state.tsx src/components/ui/empty-state.test.tsx src/components/ui/tooltip.tsx src/components/ui/tooltip.test.tsx
git commit -m "feat: add Spinner, EmptyState, and Tooltip components"
```

---

### Task 3: Create DropdownMenu component

**Files:**
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/dropdown-menu.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `<DropdownMenu trigger={<Button>Open</Button>} items={[{ label, onClick, icon, separator? }]} />`

- [ ] **Step 1: Create DropdownMenu**

`src/components/ui/dropdown-menu.tsx`:

```tsx
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DropdownItem {
  label: string
  onClick: () => void
  icon?: ReactNode
  destructive?: boolean
  separator?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, items, align = 'left' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[10rem] overflow-hidden rounded-lg border bg-card p-1 shadow-lg motion-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.separator && <div className="my-1 border-t" />}
              <button
                type="button"
                role="menuitem"
                onClick={() => { item.onClick(); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  item.destructive
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {item.icon && <span className="size-4 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write test**

`src/components/ui/dropdown-menu.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DropdownMenu } from './dropdown-menu'

describe('DropdownMenu', () => {
  it('opens and closes on trigger click', () => {
    render(<DropdownMenu trigger={<button>Menu</button>} items={[{ label: 'Option 1', onClick: vi.fn() }]} />)
    fireEvent.click(screen.getByText('Menu'))
    expect(screen.getByText('Option 1')).toBeTruthy()
    fireEvent.click(screen.getByText('Menu'))
    expect(screen.queryByText('Option 1')).toBeNull()
  })

  it('calls onClick when item is clicked', () => {
    const onClick = vi.fn()
    render(<DropdownMenu trigger={<button>Menu</button>} items={[{ label: 'Delete', onClick, destructive: true }]} />)
    fireEvent.click(screen.getByText('Menu'))
    fireEvent.click(screen.getByText('Delete'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/ui/dropdown-menu.test.tsx`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/dropdown-menu.tsx src/components/ui/dropdown-menu.test.tsx
git commit -m "feat: add DropdownMenu component"
```

---

### Task 4: Create Modal component

**Files:**
- Create: `src/components/ui/modal.tsx`
- Create: `src/components/ui/modal.test.tsx`

**Interfaces:**
- Consumes: `Spinner`, `Button`
- Produces: `<Modal open onClose title size="sm" footer={<Button>Save</Button>}><div>body</div></Modal>`

- [ ] **Step 1: Create Modal**

`src/components/ui/modal.tsx`:

```tsx
import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = scrollbarWidth + 'px'
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => { document.body.style.overflow = ''; document.body.style.paddingRight = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm motion-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative w-full motion-scale-in rounded-lg border bg-card shadow-lg',
          size === 'sm' && 'max-w-sm',
          size === 'md' && 'max-w-md',
          size === 'lg' && 'max-w-lg',
        )}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write test**

`src/components/ui/modal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './modal'

describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal open title="Test" onClose={vi.fn()}><p>Content</p></Modal>)
    expect(screen.getByText('Test')).toBeTruthy()
    expect(screen.getByText('Content')).toBeTruthy()
  })

  it('does not render when closed', () => {
    render(<Modal open={false} title="Test" onClose={vi.fn()}><p>Content</p></Modal>)
    expect(screen.queryByText('Test')).toBeNull()
  })

  it('calls onClose on escape', () => {
    const onClose = vi.fn()
    render(<Modal open title="Test" onClose={onClose}><p>Content</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/ui/modal.test.tsx`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/modal.tsx src/components/ui/modal.test.tsx
git commit -m "feat: add Modal component"
```

---

### Task 5: Create Tabs + Breadcrumb components

**Files:**
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/tabs.test.tsx`
- Create: `src/components/ui/breadcrumb.tsx`
- Create: `src/components/ui/breadcrumb.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `<Tabs tabs={[{ id, label, icon? }]} activeId onChange />`, `<Breadcrumb items={[{ href, label }]} />`

- [ ] **Step 1: Create Tabs**

`src/components/ui/tabs.tsx`:

```tsx
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            tab.id === activeId
              ? 'border-gold text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.icon && <span className="size-4">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create Breadcrumb**

`src/components/ui/breadcrumb.tsx`:

```tsx
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  href?: string
  label: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link to={item.href} className="hover:text-foreground transition-colors">{item.label}</Link>
          ) : (
            <span className={i === items.length - 1 ? 'text-foreground font-medium' : ''}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Write tests**

`src/components/ui/tabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tabs } from './tabs'

describe('Tabs', () => {
  it('renders tabs and highlights active', () => {
    render(<Tabs tabs={[{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }]} activeId="a" onChange={vi.fn()} />)
    expect(screen.getByText('Tab A')).toBeTruthy()
    expect(screen.getByText('Tab B')).toBeTruthy()
  })

  it('calls onChange on click', () => {
    const onChange = vi.fn()
    render(<Tabs tabs={[{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }]} activeId="a" onChange={onChange} />)
    fireEvent.click(screen.getByText('Tab B'))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
```

`src/components/ui/breadcrumb.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Breadcrumb } from './breadcrumb'

describe('Breadcrumb', () => {
  it('renders all items', () => {
    render(
      <MemoryRouter>
        <Breadcrumb items={[{ href: '/', label: 'Home' }, { label: 'Current' }]} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Current')).toBeTruthy()
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/components/ui/tabs.test.tsx src/components/ui/breadcrumb.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/tabs.tsx src/components/ui/tabs.test.tsx src/components/ui/breadcrumb.tsx src/components/ui/breadcrumb.test.tsx
git commit -m "feat: add Tabs and Breadcrumb components"
```

---

### Task 6: Create DataTable component

**Files:**
- Create: `src/components/ui/data-table.tsx`
- Create: `src/components/ui/data-table.test.tsx`

**Interfaces:**
- Consumes: `Spinner`, `EmptyState` (from Task 2), `Pagination` (existing), `cn`
- Produces: `<DataTable columns={[...]} data={[...]} loading={false} sortable onSort emptyState={<EmptyState.../>} onRowClick />`

- [ ] **Step 1: Create DataTable**

`src/components/ui/data-table.tsx`:

```tsx
import { type ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import Pagination from '@/components/ui/Pagination'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  hideBelow?: 'sm' | 'md' | 'lg'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (item: T) => void
  emptyState?: ReactNode
  page?: number
  totalPages?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  pageSize?: number
  rowKey: (item: T) => string
}

export function DataTable<T>({
  columns, data, loading, sortKey, sortDir, onSort, onRowClick,
  emptyState, page, totalPages, totalItems, onPageChange, pageSize = 25, rowKey,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            {columns.map((col) => (
              <div key={col.key} className="h-4 animate-pulse rounded bg-muted flex-1" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return <div>{emptyState}</div> || null
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'py-3 px-3 font-medium text-muted-foreground',
                    col.sortable && 'cursor-pointer hover:text-foreground select-none',
                    col.className,
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={rowKey(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'border-b last:border-0 transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-muted/50' : '',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('py-3 px-3', col.className)}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <div
            key={rowKey(item)}
            onClick={() => onRowClick?.(item)}
            className={cn(
              'rounded-lg border bg-card p-4 space-y-2',
              onRowClick ? 'cursor-pointer hover:bg-muted/30' : '',
            )}
          >
            {columns.map((col) => {
              const value = col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')
              if (!value) return null
              return (
                <div key={col.key} className="flex justify-between gap-2 text-sm">
                  <span className="text-muted-foreground shrink-0">{col.label}</span>
                  <span className="text-right">{value}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {page !== undefined && totalPages !== undefined && totalItems !== undefined && onPageChange && (
        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={onPageChange} pageSize={pageSize} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write test**

`src/components/ui/data-table.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from './data-table'

interface Item { id: string; name: string; role: string }

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' },
]

const data: Item[] = [
  { id: '1', name: 'Alice', role: 'Admin' },
  { id: '2', name: 'Bob', role: 'Staff' },
]

describe('DataTable', () => {
  it('renders data rows', () => {
    render(<DataTable columns={columns} data={data} rowKey={(i) => i.id} />)
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
  })

  it('shows loading skeleton', () => {
    const { container } = render(<DataTable columns={columns} data={[]} loading rowKey={(i) => i.id} />)
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows empty state when no data', () => {
    render(<DataTable columns={columns} data={[]} rowKey={(i) => i.id} emptyState={<p>No items</p>} />)
    expect(screen.getByText('No items')).toBeTruthy()
  })

  it('calls onSort when sortable header clicked', () => {
    const onSort = vi.fn()
    render(<DataTable columns={columns} data={data} onSort={onSort} rowKey={(i) => i.id} />)
    fireEvent.click(screen.getByText('Name'))
    expect(onSort).toHaveBeenCalledWith('name')
  })

  it('calls onRowClick when row clicked', () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} rowKey={(i) => i.id} />)
    fireEvent.click(screen.getByText('Alice'))
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/ui/data-table.test.tsx`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/data-table.tsx src/components/ui/data-table.test.tsx
git commit -m "feat: add DataTable component with sort, loading, empty state, and responsive card layout"
```

---

### Task 7: Visual system refinement (index.css + index.html)

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: nothing
- Produces: Updated design tokens, Inter font, refined dark mode, shimmer keyframes

- [ ] **Step 1: Add Inter font to `index.html`**

Add Inter font link after the Outfit link in `index.html`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 2: Update `src/index.css`**

Replace the entire file content with this refined version:

```css
@import "tailwindcss";

@theme {
  --color-background: var(--bg);
  --color-foreground: var(--fg);
  --color-card: var(--card);
  --color-card-foreground: var(--card-fg);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-fg);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-fg);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-fg);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-fg);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-fg);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-fg);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius: 0.5rem;

  --color-surface-raised: var(--surface-raised);
  --color-surface-overlay: var(--surface-overlay);
  --color-text-subtle: var(--text-subtle);

  --color-capiz: var(--capiz);
  --color-barangay: var(--barangay);
  --color-gold: var(--gold);
  --color-narra: var(--narra);
  --color-bamboo: var(--bamboo);
  --color-red-pinoy: var(--red-pinoy);

  --font-display: 'Outfit', system-ui, sans-serif;
  --font-body: 'Inter', 'Outfit', system-ui, sans-serif;

  --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
}

@utility motion-fade-in {
  animation: motion-fade-in 0.3s ease-out;
  @media (prefers-reduced-motion: reduce) { animation: none; }
}

@utility motion-slide-up {
  animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  @media (prefers-reduced-motion: reduce) { animation: none; }
}

@utility motion-scale-in {
  animation: motion-scale-in 0.2s ease-out;
  @media (prefers-reduced-motion: reduce) { animation: none; }
}

@utility motion-lift {
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  @media (prefers-reduced-motion: reduce) {
    &:hover { transform: none; box-shadow: none; }
  }
}

@utility motion-press {
  &:active { transform: scale(0.97); }
}

@utility motion-stagger-50 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 50ms);
    }
  }
}

@utility motion-stagger-75 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 75ms);
    }
  }
}

@utility motion-stagger-100 {
  @media (prefers-reduced-motion: no-preference) {
    & > * {
      animation: motion-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger-index, 0) * 100ms);
    }
  }
}

@utility shimmer {
  background: linear-gradient(90deg, var(--muted) 25%, var(--accent) 50%, var(--muted) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) { animation: none; }
}

@keyframes motion-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes motion-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes motion-scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes theme-swirl {
  from { transform: rotate(-90deg) scale(0.6); opacity: 0; }
  to { transform: rotate(0deg) scale(1); opacity: 1; }
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

.theme-icon-enter {
  animation: theme-swirl 0.3s ease;
  @media (prefers-reduced-motion: reduce) { animation: none; }
}

a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]) {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  a, button, input, select, textarea, [tabindex]:not([tabindex="-1"]) {
    transition: none;
  }
}

:root {
  color-scheme: light;
  --bg: #F6F2EB;
  --fg: #1A1513;
  --card: #FFFFFF;
  --card-fg: #1A1513;
  --popover: #FFFFFF;
  --popover-fg: #1A1513;
  --primary: #1B3A4B;
  --primary-fg: #FFFFFF;
  --secondary: #F0EBE0;
  --secondary-fg: #1A1513;
  --muted: #F0EBE0;
  --muted-fg: #7A6E62;
  --accent: #F0EBE0;
  --accent-fg: #1A1513;
  --destructive: #CE1126;
  --destructive-fg: #FFFFFF;
  --border: #E8DFD0;
  --input: #E8DFD0;
  --ring: #C9953E;
  --capiz: #F6F2EB;
  --barangay: #1B3A4B;
  --gold: #C9953E;
  --narra: #5C4033;
  --bamboo: #E8DFD0;
  --red-pinoy: #CE1126;
  --surface-raised: #FFFFFF;
  --surface-overlay: rgba(0, 0, 0, 0.4);
  --text-subtle: #A09688;
}

.dark {
  color-scheme: dark;
  --bg: #12100E;
  --fg: #E5DCD0;
  --card: #141211;
  --card-fg: #E5DCD0;
  --popover: #141211;
  --popover-fg: #E5DCD0;
  --primary: #6B9BAB;
  --primary-fg: #0B0A09;
  --secondary: #1C1917;
  --secondary-fg: #E5DCD0;
  --muted: #1A1714;
  --muted-fg: #948A7E;
  --accent: #1C1917;
  --accent-fg: #E5DCD0;
  --destructive: #D94A45;
  --destructive-fg: #FFFFFF;
  --border: #2A2622;
  --input: #2A2622;
  --ring: #C9953E;
  --capiz: #0B0A09;
  --barangay: #6B9BAB;
  --gold: #C9953E;
  --narra: #C4B4A0;
  --bamboo: #2A2622;
  --red-pinoy: #D94A45;
  --surface-raised: #1C1917;
  --surface-overlay: rgba(0, 0, 0, 0.6);
  --text-subtle: #7A7064;
  --shadow-sm: inset 0 1px 0 rgba(255,255,255,0.03);
}

.dark .elevated {
  background-color: #141211;
  border-color: #2A2622;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(107,155,171,0.08);
  backdrop-filter: blur(8px);
}

* {
  border-color: var(--color-border);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-body);
  transition: background-color 0.25s ease, color 0.25s ease;
}

html {
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
}

html::-webkit-scrollbar { width: 6px; height: 6px; }
html::-webkit-scrollbar-track { background: transparent; }
html::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 999px; }
html::-webkit-scrollbar-thumb:hover { background: var(--text-subtle); }

.sidebar-scroll { scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: transparent transparent; }
.sidebar-scroll::-webkit-scrollbar { width: 4px; }
.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
.sidebar-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 999px; }
.sidebar-scroll:hover { scrollbar-color: var(--color-border) transparent; }
.sidebar-scroll:hover::-webkit-scrollbar-thumb { background: var(--color-border); }
```

Key changes from original:
- `--bg` shifted from `#F8F5F0` to `#F6F2EB` (warmer)
- `--card` gets subtle `0.5px` inner glow via the elevated pattern
- `--primary` dark mode from `#608B99` to `#6B9BAB` (lighter)
- `--muted` dark mode split from `--secondary` to `#1A1714`
- `--font-body` set to `'Inter', 'Outfit', system-ui, sans-serif`
- Added `--shadow-xs`, `--shadow-md`, `--shadow-lg` tokens
- Added `shimmer` utility and keyframe for skeleton loading
- `.dark .elevated` updated to use `#6B9BAB` tint

- [ ] **Step 3: Verify build still works**

Run: `npx vite build 2>&1 | head -20`

Expected: Build succeeds (no errors)

- [ ] **Step 4: Commit**

```bash
git add src/index.css index.html
git commit -m "refactor: refine visual design tokens, add Inter font and shimmer animation"
```

---

### Task 8: Replace window.alert calls with Toast

**Files:**
- Modify: `src/features/reports/ExportBar.tsx`
- Modify: other files using `window.alert` (search first)

**Interfaces:**
- Consumes: `toast` from Task 1
- Produces: Toast-based feedback instead of `window.alert`

- [ ] **Step 1: Find all window.alert usages**

Run: `rg "window\.alert" src/ --include="*.tsx" --include="*.ts"`

- [ ] **Step 2: Update ExportBar.tsx**

Replace both `window.alert()` calls in `ExportBar.tsx`:

```tsx
import { toast } from '@/lib/toast'
```

Replace:
```tsx
window.alert('Please select both start and end dates.')
// → toast.error('Please select both start and end dates.')

window.alert('An error occurred while exporting.')
// → toast.error('An error occurred while exporting.')
```

- [ ] **Step 3: Replace in other files**

For each `window.alert` found, replace with appropriate `toast.error()` or `toast.success()`.

- [ ] **Step 4: Commit**

```bash
git add src/features/reports/ExportBar.tsx
git commit -m "refactor: replace window.alert calls with toast notifications"
```

---

### Task 9: Dashboard + Login page polish

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/DashboardHero.tsx`
- Modify: `src/pages/DashboardKPI.tsx`
- Modify: `src/pages/DashboardChart.tsx`
- Modify: `src/auth/LoginPage.tsx`

**Consumes:** Spinner, EmptyState, Toast, new design tokens
**Produces:** Polished dashboard and login with new visual system

- [ ] **Step 1: Update DashboardHero.tsx**

- Apply Inter font for body text (body already uses `font-body`)
- Add `motion-stagger-50` to stat pills
- Polish spacing to use `space-y-6`

- [ ] **Step 2: Update DashboardKPI.tsx**

Change grid from `grid-cols-1 lg:grid-cols-2` to `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` for better large-screen layout.

- [ ] **Step 3: Update Dashboard.tsx section spacing**

Change parent div from `space-y-5` to `space-y-6`.

- [ ] **Step 4: Update LoginPage.tsx**

- Change `bg-capiz` → uses new `--bg` color automatically via body background (can remove explicit bg class — body already has it)
- Refine card: add `shadow-md` class (from new token) to the login card
- Focus ring on form: `focus-within:ring-gold/20` already correct

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/DashboardHero.tsx src/pages/DashboardKPI.tsx src/pages/DashboardChart.tsx src/auth/LoginPage.tsx
git commit -m "refactor: polish Dashboard and Login page with refined visual tokens"
```

---

### Task 10: Residents page — DataTable migration

**Files:**
- Modify: `src/features/residents/ResidentsPage.tsx`

**Consumes:** DataTable, Toast, EmptyState, Spinner, Tooltip
**Produces:** Refactored residents page with reusable DataTable

- [ ] **Step 1: Replace inline table with DataTable**

Define columns for DataTable:

```tsx
const columns: Column<ApiResident>[] = [
  { key: 'last_name', label: 'Name', sortable: true,
    render: (r) => `${r.last_name}, ${r.first_name}${r.middle_name ? ' ' + r.middle_name : ''}` },
  { key: 'purok', label: 'Purok', sortable: true, hideBelow: 'sm' },
  { key: 'gender', label: 'Gender', hideBelow: 'sm' },
  { key: 'birth_date', label: 'Age',
    render: (r) => calculateAge(r.birth_date).toString(), hideBelow: 'md' },
  { key: 'tags', label: 'Tags',
    render: (r) => (
      <div className="flex flex-wrap gap-1">
        {tagKeys.filter((k) => r[k]).map((k) => (
          <span key={k} className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${tagColors[k]}`}>
            {tagLabels[k]}
          </span>
        ))}
      </div>
    ) },
]
```

Replace the table section in the JSX with:

```tsx
<DataTable
  columns={columns}
  data={filteredResidents}
  loading={loading}
  sortKey={sortKey}
  sortDir={sortDir}
  onSort={handleSort}
  onRowClick={(r) => openDetail(r)}
  emptyState={<EmptyState title="No residents found" description={search ? 'Try a different search.' : 'Add your first resident to get started.'} />}
  page={page}
  totalPages={Math.ceil(filteredResidents.length / PAGE_SIZE)}
  totalItems={filteredResidents.length}
  onPageChange={setPage}
  pageSize={PAGE_SIZE}
  rowKey={(r) => r.id}
/>
```

- [ ] **Step 2: Remove inline statusClass function**

The `statusClass()` function at the top of ResidentsPage is only used by the flyout detail panel's referenced documents/blotters. Check if it can be replaced by imports from `src/lib/statusStyles.ts`. If yes, replace the inline function calls.

- [ ] **Step 3: Commit**

```bash
git add src/features/residents/ResidentsPage.tsx
git commit -m "refactor: Residents page — adopt DataTable, EmptyState, Toast, remove inline table"
```

---

### Task 11: Households page — DataTable migration

**Files:**
- Modify: `src/features/households/HouseholdsPage.tsx`

**Consumes:** DataTable, EmptyState
**Produces:** Refactored households page with DataTable

- [ ] **Step 1: Read current file and identify table section**

Read the file to find the inline table JSX.

- [ ] **Step 2: Replace with DataTable**

```tsx
const columns: Column<ApiHousehold>[] = [
  { key: 'household_number', label: 'Household #', sortable: true },
  { key: 'head_name', label: 'Head of Household', sortable: true },
  { key: 'address', label: 'Address', hideBelow: 'sm' },
  { key: 'purok', label: 'Purok', sortable: true, hideBelow: 'sm' },
  { key: 'member_count', label: 'Members',
    render: (h) => h.member_count?.toString() ?? '0', hideBelow: 'md' },
]
```

- [ ] **Step 3: Commit**

```bash
git add src/features/households/HouseholdsPage.tsx
git commit -m "refactor: Households page — adopt DataTable, remove inline table"
```

---

### Task 12: Documents + Release pages — DataTable migration

**Files:**
- Modify: `src/features/documents/DocumentsPage.tsx`
- Modify: `src/features/documents/ReleasePage.tsx`

**Consumes:** DataTable, EmptyState, Toast, statusStyles
**Produces:** Refactored document pages with DataTable

- [ ] **Step 1: Refactor DocumentsPage.tsx**

Replace inline table. Use `documentStatusColors` from `@/lib/statusStyles` for badge styling.

```tsx
import { documentStatusColors } from '@/lib/statusStyles'

const columns: Column<ApiDocument>[] = [
  { key: 'control_number', label: 'Control No.', sortable: true },
  { key: 'resident_name', label: 'Resident', sortable: true },
  { key: 'document_type', label: 'Type', sortable: true, hideBelow: 'sm' },
  { key: 'purpose', label: 'Purpose', hideBelow: 'md',
    render: (d) => <span className="truncate max-w-[200px] block">{d.purpose}</span> },
  { key: 'status', label: 'Status',
    render: (d) => (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${documentStatusColors[d.status] ?? ''}`}>
        {d.status.replace(/_/g, ' ')}
      </span>
    ) },
]
```

- [ ] **Step 2: Refactor ReleasePage.tsx** similarly

- [ ] **Step 3: Commit**

```bash
git add src/features/documents/DocumentsPage.tsx src/features/documents/ReleasePage.tsx
git commit -m "refactor: Documents and Release pages — adopt DataTable and status badge components"
```

---

### Task 13: Records (Blotter) page — DataTable migration

**Files:**
- Modify: `src/features/records/RecordsPage.tsx`

**Consumes:** DataTable, EmptyState, statusStyles

- [ ] **Step 1: Replace inline table with DataTable**

Use `blotterStatusColors` from `@/lib/statusStyles`.

```tsx
import { blotterStatusColors } from '@/lib/statusStyles'

const columns: Column<ApiBlotter>[] = [
  { key: 'blotter_number', label: 'Case No.', sortable: true },
  { key: 'complainant', label: 'Complainant', sortable: true },
  { key: 'respondent', label: 'Respondent', sortable: true, hideBelow: 'sm' },
  { key: 'incident_type', label: 'Type', hideBelow: 'sm' },
  { key: 'status', label: 'Status',
    render: (b) => (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${blotterStatusColors[b.status] ?? ''}`}>
        {b.status}
      </span>
    ) },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/features/records/RecordsPage.tsx
git commit -m "refactor: Records page — adopt DataTable and blotter status badges"
```

---

### Task 14: Assets, Calendar, Agenda pages — DataTable migration

**Files:**
- Modify: `src/features/assets/AssetsPage.tsx`
- Modify: `src/features/calendar/CalendarPage.tsx`
- Modify: `src/features/agenda/AgendaPage.tsx`

**Consumes:** DataTable, EmptyState, statusStyles

- [ ] **Step 1: Refactor AssetsPage.tsx**

Use `assetConditionColors`, `assetStatusColors` from `@/lib/statusStyles`.

```tsx
const columns: Column<ApiAsset>[] = [
  { key: 'name', label: 'Asset Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true, hideBelow: 'sm' },
  { key: 'condition', label: 'Condition',
    render: (a) => (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${assetConditionColors[a.condition] ?? ''}`}>{a.condition}</span>
    ) },
  { key: 'status', label: 'Status',
    render: (a) => (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${assetStatusColors[a.status] ?? ''}`}>{a.status}</span>
    ) },
  { key: 'acquisition_date', label: 'Acquired', hideBelow: 'md', render: (a) => formatDate(a.acquisition_date) },
  { key: 'value', label: 'Value', render: (a) => `₱${Number(a.value).toLocaleString()}`, hideBelow: 'md' },
]
```

- [ ] **Step 2: Refactor CalendarPage.tsx**

Replace table portion with DataTable if applicable (calendar may use a grid view instead — adapt as appropriate, only convert table-like lists to DataTable).

- [ ] **Step 3: Refactor AgendaPage.tsx**

Replace inline table with DataTable.

- [ ] **Step 4: Commit**

```bash
git add src/features/assets/AssetsPage.tsx src/features/calendar/CalendarPage.tsx src/features/agenda/AgendaPage.tsx
git commit -m "refactor: Assets, Calendar, Agenda pages — adopt DataTable"
```

---

### Task 15: Finance pages — DataTable, Breadcrumb, Tabs adoption

**Files:**
- Modify: `src/features/finance/BudgetOverview.tsx`
- Modify: `src/features/finance/RevenueTracking.tsx`
- Modify: `src/features/finance/FundSources.tsx`
- Modify: `src/features/finance/Disbursements.tsx`
- Modify: `src/features/finance/FinanceAudit.tsx`

**Consumes:** DataTable, Breadcrumb, EmptyState, Toast

- [ ] **Step 1: Add Breadcrumb to each finance page**

Each page gets a consistent breadcrumb at the top:

```tsx
import { Breadcrumb } from '@/components/ui/breadcrumb'

<Breadcrumb items={[
  { href: '/', label: 'Home' },
  { href: '/finance/budget', label: 'Finance' },
  { label: 'Budget Overview' },
]} className="mb-4" />
```

- [ ] **Step 2: Replace inline tables with DataTable in each finance page**

Each page follows the same pattern: define columns array, replace `<table>` with `<DataTable>`.

- [ ] **Step 3: Commit**

```bash
git add src/features/finance/BudgetOverview.tsx src/features/finance/RevenueTracking.tsx src/features/finance/FundSources.tsx src/features/finance/Disbursements.tsx src/features/finance/FinanceAudit.tsx
git commit -m "refactor: Finance pages — adopt DataTable and Breadcrumb components"
```

---

### Task 16: Logs, Reports, Settings pages — polish pass

**Files:**
- Modify: `src/features/logs/ActivityPage.tsx`
- Modify: `src/features/logs/VisitorLogPage.tsx`
- Modify: `src/features/reports/ReportsPage.tsx`
- Modify: `src/features/settings/SystemSettings.tsx`

**Consumes:** DataTable, EmptyState, Tabs (ReportsPage already has inline tabs — replace with Tabs component)

- [ ] **Step 1: Refactor ActivityPage.tsx and VisitorLogPage.tsx**

Replace inline tables with DataTable.

- [ ] **Step 2: Refactor ReportsPage.tsx**

Replace inline tab implementation with the shared `Tabs` component.

- [ ] **Step 3: Refactor SystemSettings.tsx**

Replace any inline tables with DataTable. Polish layout spacing to use `space-y-6`.

- [ ] **Step 4: Commit**

```bash
git add src/features/logs/ActivityPage.tsx src/features/logs/VisitorLogPage.tsx src/features/reports/ReportsPage.tsx src/features/settings/SystemSettings.tsx
git commit -m "refactor: Logs, Reports, Settings pages — adopt DataTable and Tabs"
```

---

### Task 17: Interaction polish pass

**Files:**
- Modify: `src/components/ui/card.tsx` — add motion-lift on hover
- Modify: `src/components/ui/button.tsx` — add brightness filter on hover
- Modify: `src/components/ui/Pagination.tsx` — add motion-stagger to page buttons
- Modify: `src/components/Layout.tsx` — refine page transition animation
- Modify: `src/offline/OfflineIndicator.tsx` — add toast on connectivity change

- [ ] **Step 1: Add card hover effect**

In `src/components/ui/card.tsx`, change the base className from `shadow-sm` to `shadow-sm motion-lift`:

```tsx
className={cn('rounded-lg border bg-card text-card-foreground shadow-sm motion-lift', className)}
```

- [ ] **Step 2: Add button hover brightness**

In `src/components/ui/button.tsx`, add hover brightness to the default variant in CVA:

```
default: 'bg-primary text-primary-foreground hover:brightness-110',
```

- [ ] **Step 3: Add toast on connectivity change**

In `src/offline/OfflineIndicator.tsx`, import `toast` and show a toast when transitioning between online/offline:

```tsx
import { useEffect } from 'react'
import { toast } from '@/lib/toast'

// Inside the component:
useEffect(() => {
  function online() { toast.success('Back online — changes will sync automatically.') }
  function offline() { toast.error('You are offline. Changes will be saved locally.') }
  window.addEventListener('online', online)
  window.addEventListener('offline', offline)
  return () => {
    window.removeEventListener('online', online)
    window.removeEventListener('offline', offline)
  }
}, [])
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/card.tsx src/components/ui/button.tsx src/offline/OfflineIndicator.tsx
git commit -m "refactor: interaction polish — card hover lift, button hover brightness, offline toast"
```

---

### Task 18: Consistency sweep — final pass

**Files:**
- Global scan of all feature pages

- [ ] **Step 1: Verify section spacing consistency**

Run a grep for `space-y-` in feature pages to find any that don't use `space-y-6` and standardize.

- [ ] **Step 2: Verify PageHeader usage**

Ensure all pages use `<PageHeader>` with consistent title/subtitle pattern.

- [ ] **Step 3: Run full build and test**

Run: `npx vite build`

Expected: Build succeeds.

Run: `npx vitest run`

Expected: All tests pass.

- [ ] **Step 4: Run lint**

Run: `npx oxlint`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "fix: consistency sweep — standardize spacing, PageHeader usage"
```
