# Group A: Resident Profiles & Household Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Resident Profiles and Household Mapping features with full CRUD, search/filter, and responsive UI.

**Architecture:** Two PocketBase collections (`residents`, `households`), each with its own API module and page. Residents can optionally belong to a household. Household page shows expandable resident list per household. Both follow the existing RecordsPage pattern (table + slide-over form + delete confirm).

**Tech Stack:** React 19, PocketBase 0.27+, Tailwind CSS v4, Lucide React icons, React Router 8

## Global Constraints

- Zero new JavaScript dependencies beyond what's already in `package.json`
- All pages must be responsive (mobile bottom-drawer form, desktop slide-over panel)
- Follow existing RecordsPage pattern for page structure, form panels, error handling, skeleton loading
- Use `clsx`/`tailwind-merge` via `cn()` utility for conditional classes
- All API files use `getClient()` from `src/api/client.ts` and `handleApiError()` from `src/api/errorHandler.ts`
- Only `admin` and `staff` roles can create/edit/delete; `viewer` is read-only
- Routes use `ProtectedRoute` with role guard matching the spec

---

## File Structure

### Create:
| File | Purpose |
|------|---------|
| `pocketbase/migrations/001_residents_households.json` | PocketBase collection schemas for both collections |
| `src/api/residents.ts` | Residents CRUD + filter functions |
| `src/api/households.ts` | Households CRUD + member count function |
| `src/features/residents/ResidentsPage.tsx` | Resident list table, search/filter, form panel |
| `src/features/households/HouseholdsPage.tsx` | Household list with expandable resident rows, form panel |

### Modify:
| File | Change |
|------|--------|
| `src/routes/index.tsx` | Add `/residents` and `/households` routes |
| `src/components/Sidebar.tsx` | Add Residents and Households nav items |

---

### Task 1: PocketBase Migration JSON

**Files:**
- Create: `pocketbase/migrations/001_residents_households.json`

**Interfaces:**
- Produces: Collection definitions that the API layer (Task 2) depends on for `residents` and `households` collection names and field names.

- [ ] **Step 1: Create migration JSON**

```json
[
  {
    "name": "residents",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "first_name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "last_name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "middle_name", "type": "text", "options": { "max": 255 } },
      { "name": "suffix", "type": "select", "options": { "values": ["\u2014", "Jr.", "Sr.", "II", "III", "IV"] } },
      { "name": "birth_date", "type": "date" },
      { "name": "age", "type": "number" },
      { "name": "gender", "type": "select", "options": { "values": ["male", "female"] } },
      { "name": "contact_number", "type": "text", "options": { "max": 20 } },
      { "name": "household_id", "type": "relation", "options": { "collectionId": "households", "maxSelect": 1 } },
      { "name": "purok", "type": "text", "options": { "max": 100 } },
      { "name": "civil_status", "type": "select", "options": { "values": ["single", "married", "widowed", "separated"] } },
      { "name": "occupation", "type": "text", "options": { "max": 255 } },
      { "name": "nationality", "type": "text", "options": { "max": 100 } },
      { "name": "is_voter", "type": "bool" },
      { "name": "is_4ps", "type": "bool" },
      { "name": "is_senior", "type": "bool" },
      { "name": "is_pwd", "type": "bool" },
      { "name": "blood_type", "type": "select", "options": { "values": ["\u2014", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] } },
      { "name": "notes", "type": "text", "options": { "max": 2000 } }
    ],
    "indexes": [
      "CREATE INDEX idx_residents_name ON residents (last_name, first_name)",
      "CREATE INDEX idx_residents_purok ON residents (purok)",
      "CREATE INDEX idx_residents_household ON residents (household_id)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "deleteRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'"
  },
  {
    "name": "households",
    "type": "base",
    "system": false,
    "schema": [
      { "name": "household_number", "type": "text", "required": true, "options": { "max": 50 } },
      { "name": "purok", "type": "text", "options": { "max": 100 } },
      { "name": "head_name", "type": "text", "required": true, "options": { "max": 255 } },
      { "name": "address", "type": "text", "options": { "max": 500 } },
      { "name": "notes", "type": "text", "options": { "max": 2000 } }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_households_number ON households (household_number)",
      "CREATE INDEX idx_households_purok ON households (purok)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "deleteRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'"
  }
]
```

- [ ] **Step 2: Create the directory if needed, then save the file**

Run: `Test-Path "D:\BARANGAYCC\barangay-system\pocketbase"` — if it doesn't exist, create `pocketbase/migrations/`.

Make sure the directory `pocketbase/migrations` exists, then write the JSON.

---

### Task 2: API Layer — Residents & Households

**Files:**
- Create: `src/api/residents.ts`
- Create: `src/api/households.ts`

**Interfaces:**
- Consumes: `getClient()` from `src/api/client.ts`, `handleApiError()` from `src/api/errorHandler.ts`
- Produces: `ApiResident`, `ApiHousehold` types and CRUD functions used by Task 3/4 pages.

- [ ] **Step 1: Create `src/api/residents.ts`**

```typescript
import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

const COLLECTION = 'residents'

export interface ResidentData {
  first_name: string
  last_name: string
  middle_name?: string
  suffix?: string
  birth_date?: string
  age?: number
  gender?: string
  contact_number?: string
  household_id?: string
  purok?: string
  civil_status?: string
  occupation?: string
  nationality?: string
  is_voter?: boolean
  is_4ps?: boolean
  is_senior?: boolean
  is_pwd?: boolean
  blood_type?: string
  notes?: string
}

export interface ApiResident extends RecordModel {
  first_name: string
  last_name: string
  middle_name: string
  suffix: string
  birth_date: string
  age: number
  gender: string
  contact_number: string
  household_id: string
  purok: string
  civil_status: string
  occupation: string
  nationality: string
  is_voter: boolean
  is_4ps: boolean
  is_senior: boolean
  is_pwd: boolean
  blood_type: string
  notes: string
  updated: string
}

export async function getResidents(params?: { household_id?: string }): Promise<ApiResident[]> {
  try {
    const query: Record<string, unknown> = { sort: '-updated' }
    if (params?.household_id) {
      query.filter = `household_id = '${params.household_id}'`
    }
    return await getClient().collection(COLLECTION).getFullList<ApiResident>(query)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getResident(id: string): Promise<ApiResident> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiResident>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createResident(data: ResidentData): Promise<ApiResident> {
  try {
    return await getClient().collection(COLLECTION).create<ApiResident>(data)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateResident(id: string, data: Partial<ResidentData>): Promise<ApiResident> {
  try {
    return await getClient().collection(COLLECTION).update<ApiResident>(id, data)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteResident(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getResidentsSummary(): Promise<{ total: number; voters: number; seniors: number; pwd: number }> {
  try {
    const all = await getClient().collection(COLLECTION).getFullList<ApiResident>({ requestKey: 'residents-summary' })
    return {
      total: all.length,
      voters: all.filter((r) => r.is_voter).length,
      seniors: all.filter((r) => r.is_senior).length,
      pwd: all.filter((r) => r.is_pwd).length,
    }
  } catch {
    return { total: 0, voters: 0, seniors: 0, pwd: 0 }
  }
}
```

- [ ] **Step 2: Create `src/api/households.ts`**

```typescript
import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

const COLLECTION = 'households'

export interface HouseholdData {
  household_number: string
  purok?: string
  head_name: string
  address?: string
  notes?: string
}

export interface ApiHousehold extends RecordModel {
  household_number: string
  purok: string
  head_name: string
  address: string
  notes: string
  updated: string
}

export async function getHouseholds(): Promise<ApiHousehold[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiHousehold>({ sort: 'household_number' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getHousehold(id: string): Promise<ApiHousehold> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiHousehold>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createHousehold(data: HouseholdData): Promise<ApiHousehold> {
  try {
    return await getClient().collection(COLLECTION).create<ApiHousehold>(data)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateHousehold(id: string, data: Partial<HouseholdData>): Promise<ApiHousehold> {
  try {
    return await getClient().collection(COLLECTION).update<ApiHousehold>(id, data)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteHousehold(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1` — Expect clean output.

---

### Task 3: Residents Page

**Files:**
- Create: `src/features/residents/ResidentsPage.tsx`

**Interfaces:**
- Consumes: `ApiResident`, `ResidentData`, `getResidents`, `createResident`, `updateResident`, `deleteResident` from `src/api/residents.ts`

- [ ] **Step 1: Create the Residents page component**

The page follows the RecordsPage pattern exactly:

- State variables: `residents[]`, `loading`, `search`, `purokFilter`, `tagFilter`, form fields, `editingId`, `deletingId`, `panelOpen`, `error`
- `useEffect` on mount: `getResidents().then(setResidents)`
- Filtered list: `useMemo` to filter by search (name), purok, and tags (voter/4ps/senior/pwd)
- Table columns: Name (first + last), Purok, Age, Civil Status, Tags (small badges), Actions (edit/delete)
- Form panel fields: all resident fields organized in sections
- DO NOT re-create the statusConfig from RecordsPage. Instead use inline tag badge styling for resident tags.

Key differences from RecordsPage:
- Age is auto-computed from `birth_date` when birth_date changes
- Tags are boolean toggles rendered as badges in table
- Purok filter reads from localStorage system_settings or uses a hardcoded fallback set

Implementation outline:

```typescript
// Age calculation helper
function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const bd = new Date(birthDate)
  let age = today.getFullYear() - bd.getFullYear()
  const m = today.getMonth() - bd.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--
  return Math.max(0, age)
}
```

The filter bar: search input + purok dropdown + tag filter checkboxes. The tag filter is a multiselect using buttons/toggles.

For now, purok options come from a simple hardcoded set: `['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7']`.

Form panel fields in order:
1. First Name* | Last Name* (side by side grid)
2. Middle Name | Suffix (side by side)
3. Birth Date | Age (auto, read-only)
4. Gender | Contact Number
5. Purok | Civil Status
6. Household (text input for now — simplified) | Occupation
7. Nationality | Blood Type
8. Tags row: Voter | 4Ps | Senior | PWD (as toggle buttons)
9. Notes (full width textarea)

- [ ] **Step 2: Update `src/features/residents/index.ts`**

```typescript
export { default as ResidentsPage } from './ResidentsPage'
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1`

---

### Task 4: Households Page

**Files:**
- Create: `src/features/households/HouseholdsPage.tsx`

**Interfaces:**
- Consumes: `ApiHousehold`, `HouseholdData`, API functions from `src/api/households.ts`, `getResidents` from `src/api/residents.ts`

- [ ] **Step 1: Create the Households page component**

State variables: `households[]`, `residentsMap` (keyed by household_id), `loading`, `search`, `expandedId` (for expandable row), form fields, `editingId`, `deletingId`, `panelOpen`, `error`.

On mount: fetch both `getHouseholds()` and `getResidents()`. Build a `Map<string, ApiResident[]>` keyed by `household_id`.

Table columns: Household #, Purok, Head, Members Count (# of residents in that household from the map), Actions.

Expandable row: clicking a row toggles `expandedId`. An extra `<tr>` renders below with a nested table showing the residents in that household (name, age, tags) or "No members" text.

Form fields: Household Number*, Purok, Head Name*, Address, Notes.

- [ ] **Step 2: Update `src/features/households/index.ts`**

```typescript
export { default as HouseholdsPage } from './HouseholdsPage'
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1`

---

### Task 5: Routes

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Add import and routes for residents and households**

```typescript
import { ResidentsPage } from '@/features/residents'
import { HouseholdsPage } from '@/features/households'
```

Add these routes inside the `<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>` block, after the settings route:

```typescript
<Route
  path="residents"
  element={
    <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
      <ResidentsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="households"
  element={
    <ProtectedRoute roles={['admin', 'staff']}>
      <HouseholdsPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1`

---

### Task 6: Sidebar Navigation

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add new nav groups and icons**

Import new icons at the top:
```typescript
import {
  Users,
  Home,
  // existing icons...
} from 'lucide-react'
```

Update `navGroups`:
```typescript
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff', 'viewer'] },
    ],
  },
  {
    label: 'Residents',
    items: [
      { to: '/residents', label: 'Resident Profiles', icon: Users, roles: ['admin', 'staff', 'viewer'] },
      { to: '/households', label: 'Households', icon: Home, roles: ['admin', 'staff'] },
    ],
  },
  {
    label: 'Records',
    items: [
      { to: '/records', label: 'Blotter Records', icon: FileText, roles: ['admin', 'staff', 'viewer'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/settings', label: 'System Settings', icon: Settings, roles: ['admin'] },
    ],
  },
]
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build 2>&1`

---

## Self-Review Checklist

After writing the plan, verify:
1. **Spec coverage** — Does every requirement from the spec have a corresponding task?
   - Resident Profiles (Task 3)
   - Household Mapping (Task 4)
   - Migration JSON (Task 1)
   - API layer (Task 2)
   - Routes (Task 5)
   - Sidebar (Task 6)
2. **Placeholder scan** — No "TBD", "TODO", "implement later" in the plan
3. **Type consistency** — Field names match between migration JSON, API types, and page components
4. **Scope check** — Group A is 2 features, well-scoped for a single plan
