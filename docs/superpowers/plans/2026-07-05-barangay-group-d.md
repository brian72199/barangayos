# Group D: Assets, Calendar, Agenda & Minutes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Asset Inventory (admin), Calendar of Activities (all roles), and Agenda & Minutes (admin/staff) following existing patterns from Groups A-C.

**Architecture:** Each feature gets a PocketBase collection, an API module in `src/api/`, and a page component in `src/features/`. Shared `uploadImage()` utility for Cloudinary. Migration JSON for all 4 new collections. Sidebar gets new Planning group + Assets in Administration.

**Tech Stack:** React + TypeScript + PocketBase SDK + Cloudinary unsigned upload + Vite env vars

## Global Constraints

- Zero new JS dependencies beyond existing `package.json`
- No JS animation libraries; CSS-only motion utilities (transform/opacity, GPU-composited)
- `prefers-reduced-motion` respected
- Filipino palette (capiz, gold, narra, bamboo, red-pinoy, barangay) within clean enterprise design
- Dark mode base `#12100E`
- All pages responsive: mobile bottom-drawer panels, desktop slide-over panels
- `cn()` utility (`@/lib/utils`) for conditional classes
- `hasRole()` from `@/auth/session` for role gating
- PocketBase migration JSON files for collection schemas
- Purok options hardcoded as `['Purok 1', ..., 'Purok 7']` fallback
- `logActivity()` from `@/api/activity` for audit trail (fire-and-forget)
- All API types extend `RecordModel` from PocketBase

---

## File Structure

**New files:**
- `pocketbase/migrations/004_assets_calendar_agenda.json` — 4 collections: assets, calendar_events, meetings, agenda_items
- `src/api/upload.ts` — Cloudinary image upload utility
- `src/api/assets.ts` — Asset CRUD + summary
- `src/api/calendar.ts` — Calendar event CRUD + month filter
- `src/api/meetings.ts` — Meeting CRUD
- `src/api/agenda.ts` — Agenda item CRUD + reorder
- `src/features/assets/AssetsPage.tsx` — Asset inventory page
- `src/features/calendar/CalendarPage.tsx` — Calendar page with CSS month grid
- `src/features/agenda/AgendaPage.tsx` — Meetings list + detail view with agenda items

**Modified files:**
- `.env.local` — add `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`
- `.env.local.example` — same
- `.env.production` — same
- `.env.production.example` — same
- `src/routes/index.tsx` — add /assets, /calendar, /agenda routes
- `src/components/Sidebar.tsx` — add Planning group + Assets in Administration

---

### Task 1: Migration JSON + Cloudinary utility

**Files:**
- Create: `pocketbase/migrations/004_assets_calendar_agenda.json`
- Create: `src/api/upload.ts`
- Modify: `.env.local`, `.env.local.example`, `.env.production`, `.env.production.example`

**Interfaces:**
- Consumes: nothing
- Produces: `uploadImage(file: File): Promise<string>` — returns Cloudinary URL

- [ ] **Step 1: Create migration JSON**

Write `pocketbase/migrations/004_assets_calendar_agenda.json` with 4 collections: `assets`, `calendar_events`, `meetings`, `agenda_items`. Schema matches the spec exactly.

- [ ] **Step 2: Create Cloudinary upload utility**

Create `src/api/upload.ts`:

```typescript
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export async function uploadImage(file: File): Promise<string> {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to upload image')
  }

  const data = await res.json()
  return data.secure_url as string
}
```

- [ ] **Step 3: Update env files**

Add to `.env.local`, `.env.local.example`, `.env.production`, `.env.production.example`:

```
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

- [ ] **Step 4: Verify build passes**

Run: `npm run build`

Expected: builds cleanly

- [ ] **Step 5: Commit**

```
git add pocketbase/migrations/004_assets_calendar_agenda.json src/api/upload.ts .env.local .env.local.example .env.production .env.production.example
git commit -m "feat: add Group D migration for assets/calendar/agenda + Cloudinary upload utility"
```

---

### Task 2: Asset API + AssetsPage

**Files:**
- Create: `src/api/assets.ts`
- Create: `src/features/assets/AssetsPage.tsx`

**Interfaces:**
- Consumes: `uploadImage(file: File): Promise<string>` from `@/api/upload`
- Consumes: `logActivity(...)` from `@/api/activity`
- Produces: `ApiAsset`, `AssetData`, `AssetSummary`, `getAssets()`, `getAsset()`, `createAsset()`, `updateAsset()`, `deleteAsset()`, `getAssetSummary()`

- [ ] **Step 1: Create assets API**

Create `src/api/assets.ts` with:
- `AssetData` interface (name, asset_type, description, serial_number, purchase_date, purchase_cost, current_value, condition, status, assigned_to, location, image_url, notes)
- `ApiAsset extends RecordModel, AssetData`
- `AssetSummary` interface (total, byType, byCondition, byStatus)
- `getAssets()` — `getFullList` sorted by `-created`
- `getAsset(id)` — `getOne`
- `createAsset(data)` — `create` + `logActivity('create', ...)`
- `updateAsset(id, data)` — `update` + `logActivity('update', ...)`
- `deleteAsset(id)` — fetch name first, delete, then `logActivity('delete', ...)`
- `getAssetSummary()` — fetches all, computes counts by type/condition/status

- [ ] **Step 2: Create AssetsPage**

Create `src/features/assets/AssetsPage.tsx` with:
- Table: Image thumbnail (or Camera icon), Name, Type badge, Condition badge, Status badge, Location, Actions
- Filters: search, type dropdown, condition dropdown, status dropdown
- Slide-over form: Name *, Type *, Description, Serial Number, Purchase Date, Purchase Cost, Current Value, Condition *, Status, Assigned To (resident search dropdown), Image upload (Cloudinary via file input + preview + clear), Notes
- Image upload: file input hidden behind a dashed border box, preview with X button to clear, uploading state shown as text
- `getResidents()` for the assignment dropdown (filtered by `residentSearch`)
- All CRUD operations via assets API
- Admin-only access via `hasRole('admin')`
- Skeleton loading, empty state, error banner, ConfirmDialog for delete

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

Expected: builds cleanly

- [ ] **Step 4: Commit**

```
git add src/api/assets.ts src/features/assets/AssetsPage.tsx
git commit -m "feat: add Asset Inventory API and page"
```

---

### Task 3: Meetings API + Agenda API

**Files:**
- Create: `src/api/meetings.ts`
- Create: `src/api/agenda.ts`

**Interfaces:**
- Consumes: `logActivity(...)` from `@/api/activity`
- Produces from meetings: `ApiMeeting`, `MeetingData`, `MeetingWithItems`, `getMeetings()`, `getMeeting()`, `createMeeting()`, `updateMeeting()`, `deleteMeeting()`, `getUpcomingMeetings()`
- Produces from agenda: `ApiAgendaItem`, `AgendaItemData`, `getAgendaItems()`, `createAgendaItem()`, `updateAgendaItem()`, `deleteAgendaItem()`, `reorderAgendaItems()`

- [ ] **Step 1: Create meetings API**

Create `src/api/meetings.ts`:
- `MeetingData` interface (title, meeting_date, location?, meeting_type, status, notes?)
- `ApiMeeting extends RecordModel, MeetingData`
- `MeetingWithItems extends ApiMeeting { agendaItems: ApiAgendaItem[] }`
- `getMeetings()` — `getFullList` sorted by `-meeting_date`
- `getMeeting(id)` — fetches meeting + calls `getAgendaItems(id)` from agenda module
- `createMeeting(data)` — `create` + logActivity
- `updateMeeting(id, data)` — `update` + logActivity
- `deleteMeeting(id)` — fetch, delete, logActivity
- `getUpcomingMeetings()` — filter by `meeting_date >= today`, sorted by `meeting_date`

- [ ] **Step 2: Create agenda API**

Create `src/api/agenda.ts`:
- `AgendaItemData` interface (meeting_id, title, description?, sort_order?, status, minutes?, submitted_by?)
- `ApiAgendaItem extends RecordModel, AgendaItemData`
- `getAgendaItems(meetingId)` — `getFullList` filtered by `meeting_id`, sorted by `sort_order`
- `createAgendaItem(data)` — `create` + logActivity
- `updateAgendaItem(id, data)` — `update` + logActivity
- `deleteAgendaItem(id)` — `delete` + logActivity
- `reorderAgendaItems(items)` — batch update sort_order

Note: `getMeeting` in meetings.ts imports `getAgendaItems` from `./agenda`. This is a unidirectional dependency (agenda.ts does not import from meetings.ts).

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

Expected: builds cleanly

- [ ] **Step 4: Commit**

```
git add src/api/meetings.ts src/api/agenda.ts
git commit -m "feat: add Meetings and Agenda API modules"
```

---

### Task 4: Calendar API + CalendarPage

**Files:**
- Create: `src/api/calendar.ts`
- Create: `src/features/calendar/CalendarPage.tsx`

**Interfaces:**
- Consumes: `logActivity(...)` from `@/api/activity`
- Consumes: `getMeetings()`, `ApiMeeting` from `@/api/meetings` (Task 3)
- Produces: `ApiCalendarEvent`, `CalendarEventData`, `getEvents()`, `getEventsByMonth()`, `getEvent()`, `createEvent()`, `updateEvent()`, `deleteEvent()`

- [ ] **Step 1: Create calendar API**

Create `src/api/calendar.ts`:
- `CalendarEventData` interface (title, description?, event_type, start_datetime, end_datetime?, all_day?, location?, agenda_ref?, notes?)
- `ApiCalendarEvent extends RecordModel, CalendarEventData`
- `getEvents()` — `getFullList` sorted by `start_datetime`
- `getEventsByMonth(year, month)` — filter by `start_datetime >= startOfMonth && start_datetime < startOfNextMonth`
- `getEvent(id)` — `getOne`
- `createEvent(data)` — `create` + logActivity
- `updateEvent(id, data)` — `update` + logActivity
- `deleteEvent(id)` — fetch, delete, logActivity

- [ ] **Step 2: Create CalendarPage**

Create `src/features/calendar/CalendarPage.tsx`:
- Month/year header with prev/next buttons
- CSS 7-column grid calendar (Sun-Sat headers, day cells)
- Events per day shown as colored dots (color by event_type)
- Today highlighted with gold ring
- Selected day highlighted with gold bg
- Click day → right panel shows events for that day
- Event cards in right panel: type dot + label, title, time/date, location, Edit/Delete buttons (admin/staff only)
- Slide-over form: Title *, Description, Event Type *, Start datetime-local *, End datetime-local, All-day checkbox, Location, Link to Meeting dropdown (upcoming meetings from getMeetings), Notes
- All roles can view; admin/staff can CRUD
- Skeleton loading, error banner, ConfirmDialog for delete

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

Expected: builds cleanly (all API deps from Task 3 are available)

- [ ] **Step 4: Commit**

```
git add src/api/calendar.ts src/features/calendar/CalendarPage.tsx
git commit -m "feat: add Calendar API and page with CSS month grid"
```

---

### Task 5: AgendaPage — Meetings + Agenda Items UI

**Files:**
- Create: `src/features/agenda/AgendaPage.tsx`

**Interfaces:**
- Consumes: all exports from `@/api/meetings` (Task 3) and `@/api/agenda` (Task 3)
- Consumes: `hasRole()` from `@/auth/session`

- [ ] **Step 1: Create AgendaPage**

Create `src/features/agenda/AgendaPage.tsx` with two views:

**Meetings list view (default):**
- Table: Title, Date, Type badge (regular/special/emergency with color), Status badge (scheduled/ongoing/adjourned), Items count, Minutes status, Actions
- Filters: search by title, status dropdown
- Click row → detail view
- "New Meeting" button opens slide-over form
- Slide-over form: Title *, Date *, Location, Type dropdown, Status dropdown, Notes

**Meeting detail view:**
- Header: meeting title, date, type badge, status badge, location
- Back button → list
- Edit Meeting button, Add Item button
- Notes section (if any)
- Agenda items table: #, Title (+ description), Status badge, Minutes (truncated preview or "Pending meeting" / "Fill minutes"), Actions (Edit/Delete)
- Click item → slide-over form for agenda item
- Item form: Title *, Description, Sort Order, Status dropdown, Minutes textarea (shown only if meeting status is not 'scheduled')
- `submitted_by` auto-set from authStore on first minutes save
- ConfirmDialog for delete

- [ ] **Step 2: Verify build passes**

Run: `npm run build`

Expected: builds cleanly

- [ ] **Step 3: Commit**

```
git add src/features/agenda/AgendaPage.tsx
git commit -m "feat: add Agenda & Minutes page with meetings list and detail view"
```

---

### Task 6: Routes + Sidebar

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Read current routes**

Read `src/routes/index.tsx`. Add imports for AssetsPage, CalendarPage, AgendaPage. Add three new Route elements:
- `/agenda` → `ProtectedRoute role="admin,staff"` → AgendaPage
- `/assets` → `ProtectedRoute role="admin"` → AssetsPage
- `/calendar` → CalendarPage (no role gate, all roles)

- [ ] **Step 2: Read current sidebar**

Read `src/components/Sidebar.tsx`. Add import for `Package` from lucide-react if not already imported. Ensure `Calendar` and `FileText` are available.

1. Add Assets link to **Administration** nav group (before System Settings):
```
<SidebarItem icon={Package} href="/assets" label="Assets" />
```
Gated with `hasPermission('admin')`.

2. Add new **Planning** nav group after Logs (before Administration):
```
<NavGroup label="Planning">
  <SidebarItem icon={Calendar} href="/calendar" label="Calendar" />
  {hasPermission('admin', 'staff') && (
    <SidebarItem icon={FileText} href="/agenda" label="Agenda & Minutes" />
  )}
</NavGroup>
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

Expected: builds cleanly

- [ ] **Step 4: Commit**

```
git add src/routes/index.tsx src/components/Sidebar.tsx
git commit -m "feat: add routes and sidebar entries for Group D features"
```

---

### Task 7: Verify build + integration

**Files:** none

- [ ] **Step 1: Full build**

Run: `npm run build`

Expected: 0 errors

- [ ] **Step 2: Verify route integration**

Check that:
- `/assets` has `ProtectedRoute role="admin"`
- `/calendar` has no role gate (all roles)
- `/agenda` has `ProtectedRoute role="admin,staff"`
- Routes are in alphabetical order among existing routes

- [ ] **Step 3: Verify sidebar ordering**

Sidebar groups in correct order:
1. Overview
2. Residents
3. Documents
4. Records
5. Logs
6. Planning (new — Calendar, Agenda & Minutes)
7. Administration (with Assets before System Settings)
8. Reports

- [ ] **Step 4: Final commit**

```
git add -A
git commit -m "chore: finalize Group D implementation"
```
