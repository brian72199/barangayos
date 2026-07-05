# Barangay System — Group D: Asset Inventory, Calendar of Activities, Agenda & Minutes

## Overview

Three features completing the Planning and Administration sections: assets (admin), calendar (all roles), and agenda & minutes (admin/staff). Follows same architecture as Groups A-C: PocketBase migrations, `src/api/` modules, feature pages, routes, sidebar.

---

## 1. Asset Inventory

### Route
`/assets` — admin only (`hasRole('admin')`)

### Sidebar
Under **Administration** group (between Dashboard and System Settings). Existing group gets Assets as first entry.

### PocketBase Collection: `assets`

| Field | Type | Rules |
|---|---|---|
| name | text | required |
| asset_type | select | equipment / furniture / it_equipment / vehicle / facility / tool / other |
| description | text | |
| serial_number | text | |
| purchase_date | date | |
| purchase_cost | number | |
| current_value | number | |
| condition | select | new / good / fair / poor / damaged / disposed |
| status | select | available / assigned / disposed |
| assigned_to | relation → residents | optional, maxSelect 1 |
| location | text | |
| image_url | text | Cloudinary URL, optional |
| notes | text | max 2000 |

**Indexes**: `asset_type`, `condition`, `status`

**Access Rules**:
- list/view: `@request.auth.role = 'admin'`
- create/update/delete: `@request.auth.role = 'admin'`

### API: `src/api/assets.ts`

```typescript
interface AssetData {
  name: string
  asset_type: string
  description?: string
  serial_number?: string
  purchase_date?: string
  purchase_cost?: number
  current_value?: number
  condition: string
  status: string
  assigned_to?: string
  location?: string
  image_url?: string
  notes?: string
}

interface ApiAsset extends RecordModel, AssetData {}
interface AssetSummary {
  total: number
  byType: Record<string, number>
  byCondition: Record<string, number>
  byStatus: Record<string, number>
}

export async function getAssets(): Promise<ApiAsset[]>
export async function getAsset(id: string): Promise<ApiAsset>
export async function createAsset(data: AssetData): Promise<ApiAsset>
export async function updateAsset(id: string, data: Partial<AssetData>): Promise<ApiAsset>
export async function deleteAsset(id: string): Promise<boolean>
export async function getAssetSummary(): Promise<AssetSummary>
```

### Cloudinary Integration

Two env vars added to `.env.local` and `.env.production`:
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

Upload via Cloudinary's unsigned upload widget or direct POST to Cloudinary API from the frontend. On success, store the returned `secure_url` in `image_url`. No backend proxy needed.

A `src/api/upload.ts` utility:
```typescript
export async function uploadImage(file: File): Promise<string>
```
Returns the Cloudinary URL. Calls `POST https://api.cloudinary.com/v1_1/${cloudName}/image/upload` with `upload_preset` and file. On error, throws with user-friendly message.

### UI: AssetsPage

- **List**: Table with columns Image (thumbnail), Name, Type, Condition badge, Status badge, Assigned To, Actions
- **Search/Filter**: Text search, filter by type/condition/status dropdowns
- **Form** (slide-over):
  - Basic Info: Name (required), Type (dropdown), Description (textarea)
  - Details: Serial Number, Location
  - Financial: Purchase Date, Purchase Cost, Current Value
  - Assignment: Status (dropdown), Assigned To (resident search dropdown)
  - Condition: Condition (dropdown)
  - Image: "Upload Image" button → Cloudinary widget → preview thumbnail
  - Notes: textarea
- **Empty state**: "No assets yet. Add your first asset."
- **Activity logging**: `logActivity()` on create/update/delete

---

## 2. Calendar of Activities

### Route
`/calendar` — all roles (viewers can view, admin/staff can create/edit/delete)

### Sidebar
New **Planning** nav group:
- **Calendar** → `/calendar`
- **Agenda & Minutes** → `/agenda`

### PocketBase Collection: `calendar_events`

| Field | Type | Rules |
|---|---|---|
| title | text | required |
| description | text | |
| event_type | select | barangay_event / hearing / council_meeting / holiday / other |
| start_datetime | date | required |
| end_datetime | date | |
| all_day | bool | default false |
| location | text | |
| agenda_ref | relation → meetings | optional link to meeting |
| notes | text | |

**Indexes**: `start_datetime`, `event_type`

**Access Rules**:
- list/view: `@request.auth.id != ''`
- create/update/delete: `@request.auth.role = 'admin' || @request.auth.role = 'staff'`

### API: `src/api/calendar.ts`

```typescript
interface CalendarEventData {
  title: string
  description?: string
  event_type: string
  start_datetime: string
  end_datetime?: string
  all_day?: boolean
  location?: string
  agenda_ref?: string
  notes?: string
}

interface ApiCalendarEvent extends RecordModel, CalendarEventData {}

export async function getEvents(): Promise<ApiCalendarEvent[]>
export async function getEventsByMonth(year: number, month: number): Promise<ApiCalendarEvent[]>
export async function getEvent(id: string): Promise<ApiCalendarEvent>
export async function createEvent(data: CalendarEventData): Promise<ApiCalendarEvent>
export async function updateEvent(id: string, data: Partial<CalendarEventData>): Promise<ApiCalendarEvent>
export async function deleteEvent(id: string): Promise<boolean>
```

### UI: CalendarPage

No JS calendar library. Pure CSS month grid with event indicators.

**Layout**:
- Month/year header with prev/next buttons
- 7-column CSS grid (Sun–Sat headers, then day cells)
- Each day cell shows the day number; cells with events show colored dots/bars
- Event colors by type: barangay_event=blue, hearing=amber, council_meeting=emerald, holiday=red, other=slate
- Click a day → events list panel below the calendar
- Events list shows each event as a card: time range, title, type badge, location

**Interaction**:
- Admin/staff: click event card → edit slide-over; "Add Event" button opens create form
- Viewers: click event card → read-only detail view or slide-over
- Month navigation via prev/next buttons (updates year/month state, re-fetches)

**Form** (slide-over):
- Title (required), Description, Event Type (dropdown)
- Start Date/Time (required), End Date/Time
- All Day toggle
- Location
- Link to Meeting (dropdown of upcoming meetings)
- Notes textarea

**Empty state**: "No events this month."

**Activity logging**: `logActivity()` on create/update/delete

---

## 3. Agenda & Minutes

### Route
`/agenda` — admin, staff

### Sidebar
Under **Planning** group, below Calendar.

### PocketBase Collections

#### `meetings`

| Field | Type | Rules |
|---|---|---|
| title | text | required |
| meeting_date | date | required |
| location | text | |
| meeting_type | select | regular / special / emergency |
| status | select | scheduled / ongoing / adjourned |
| notes | text | |

**Indexes**: `meeting_date`, `status`

**Access Rules**:
- list/view: `@request.auth.role = 'admin' || @request.auth.role = 'staff'`
- create/update/delete: `@request.auth.role = 'admin' || @request.auth.role = 'staff'`

#### `agenda_items`

| Field | Type | Rules |
|---|---|---|
| meeting_id | relation → meetings | required, cascade delete |
| title | text | required |
| description | text | |
| sort_order | number | for ordering |
| status | select | pending / discussed / deferred |
| minutes | text | filled after meeting |
| submitted_by | text | auto from auth, read-only |
| submitted_at | autodate | PB managed |

**Indexes**: `meeting_id`, `sort_order`

**Access Rules**:
- list/view: `@request.auth.role = 'admin' || @request.auth.role = 'staff'`
- create/update/delete: `@request.auth.role = 'admin' || @request.auth.role = 'staff'`

### API: `src/api/meetings.ts`

```typescript
interface MeetingData {
  title: string
  meeting_date: string
  location?: string
  meeting_type: string
  status: string
  notes?: string
}

interface ApiMeeting extends RecordModel, MeetingData {}
interface MeetingWithItems extends ApiMeeting {
  agendaItems: ApiAgendaItem[]
}

export async function getMeetings(): Promise<ApiMeeting[]>
export async function getMeeting(id: string): Promise<MeetingWithItems>
export async function createMeeting(data: MeetingData): Promise<ApiMeeting>
export async function updateMeeting(id: string, data: Partial<MeetingData>): Promise<ApiMeeting>
export async function deleteMeeting(id: string): Promise<boolean>
export async function getUpcomingMeetings(): Promise<ApiMeeting[]>
```

#### `src/api/agenda.ts`

```typescript
interface AgendaItemData {
  meeting_id: string
  title: string
  description?: string
  sort_order?: number
  status: string
  minutes?: string
  submitted_by?: string
}

interface ApiAgendaItem extends RecordModel, AgendaItemData {}

export async function getAgendaItems(meetingId: string): Promise<ApiAgendaItem[]>
export async function createAgendaItem(data: AgendaItemData): Promise<ApiAgendaItem>
export async function updateAgendaItem(id: string, data: Partial<AgendaItemData>): Promise<ApiAgendaItem>
export async function deleteAgendaItem(id: string): Promise<boolean>
export async function reorderAgendaItems(items: { id: string; sort_order: number }[]): Promise<void>
```

### UI: AgendaPage

**Meetings list**:
- Table: Title, Date, Type badge, Status badge, Items count, Minutes Status (all filled / pending), Actions
- Filters: status dropdown, search by title
- "New Meeting" button → slide-over with title, date, location, type, status, notes

**Meeting detail view** (click a meeting):
- Header: Meeting title, date, type, status
- Agenda items list as a sortable table:
  - `#`, Title, Status badge, Minutes (truncated preview if filled), Actions
  - "Add Item" button → inline form or small dialog
  - Edit icon → inline edit for title/description or slide-over for full form
  - Click item → expand to show full minutes (or empty "Add minutes" textarea if status is discussed/adjourned)
- Back button to meetings list

**Minutes workflow**:
- When meeting status is `scheduled` → items show empty minutes field with "Fill minutes after meeting" placeholder
- When meeting is `ongoing` or `adjourned` → items show editable minutes textarea
- `submitted_by` auto-populated from `authStore.model?.name` on first save of minutes
- `submitted_at` auto-set by PB when minutes field is non-empty (can use a separate timestamp field or PB's updated)

**Empty states**:
- "No meetings yet. Schedule your first meeting."
- (within a meeting) "No agenda items yet. Add the first item."

**Activity logging**: `logActivity()` on create/update/delete for meetings and agenda items

---

## 4. Cross-Cutting

### Migration File
`pocketbase/migrations/004_assets_calendar_agenda.json`

Contains schemas for: `assets`, `calendar_events`, `meetings`, `agenda_items`

### Routes (`src/routes/index.tsx`)
```typescript
<Route path="/assets" element={<ProtectedRoute role="admin"><AssetsPage /></ProtectedRoute>} />
<Route path="/calendar" element={<CalendarPage />} />
<Route path="/agenda" element={<ProtectedRoute role="admin,staff"><AgendaPage /></ProtectedRoute>} />
```

### Sidebar Updates
Add to **Administration** group: Assets (before System Settings)
Add new **Planning** group: Calendar, Agenda & Minutes (between Logs and Administration)

### Environment Variables
Add to `.env.local` and `.env.production`:
```
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### Activity Logging
All CRUD operations across assets, calendar events, meetings, and agenda items call `logActivity()` following the established pattern (fire-and-forget).

---

## 5. Implementation Order

1. Migration JSON (`004_assets_calendar_agenda.json`)
2. `src/api/upload.ts` — Cloudinary upload utility
3. `src/api/assets.ts` — Asset CRUD + summary
4. `src/api/calendar.ts` — Event CRUD + month filter
5. `src/api/meetings.ts` — Meeting CRUD
6. `src/api/agenda.ts` — Agenda item CRUD + reorder
7. `src/features/assets/AssetsPage.tsx` — Asset page
8. `src/features/calendar/CalendarPage.tsx` — Calendar page
9. `src/features/agenda/AgendaPage.tsx` — Agenda & Minutes page
10. Routes + sidebar updates
11. Verify build passes
