# Barangay System — Group A: Resident Profiles & Household Mapping

## Overall Architecture

### Route Plan
Flat top-level routes for clarity:

| Route | Feature | Roles |
|---|---|---|
| `/` | Dashboard | all |
| `/residents` | Resident Profiles | all |
| `/households` | Household Mapping | admin, staff |
| `/documents` | Document Request & Queue | admin, staff |
| `/documents/release` | Document Release Counter | admin, staff |
| `/records` | Blotter Cases (extended) | admin, staff, viewer |
| `/logs/activity` | Activity Log | admin, staff |
| `/logs/visitors` | Visitor Log | admin, staff |
| `/assets` | Asset Inventory | admin |
| `/calendar` | Calendar of Activities | all |
| `/agenda` | Agenda & Minutes | admin, staff |
| `/reports` | Reports Dashboard | admin, staff |

All feature routes are nested inside `<Layout />` under `<ProtectedRoute role>`.

### Sidebar Navigation
New sidebar nav groups replacing the current minimal setup:

- **Overview** → Dashboard
- **Residents** → Resident Profiles, Households
- **Documents** → Document Queue, Document Release
- **Records** → Blotter Cases
- **Logs** → Activity Log, Visitor Log
- **Planning** → Calendar, Agenda & Minutes
- **Administration** → Assets, System Settings
- **Reports** → Reports Dashboard

Each nav item checks `hasRole(...)` — viewers see only Dashboard, Residents (read-only), Blotter (read-only), Calendar.

### Page Pattern
Every feature page follows the `RecordsPage` pattern:
1. `PageHeader` with title/subtitle + action button
2. Card with table listing (overflow-x-auto on mobile)
3. Slide-over panel / bottom drawer for create/edit forms
4. `ConfirmDialog` for deletes
5. Skeleton loading on fetch
6. Error state display

### API Pattern
Each feature gets its own file in `src/api/`:
- `src/api/residents.ts`
- `src/api/households.ts`
- etc.

Each exports: `getAll()`, `getById(id)`, `create(data)`, `update(id, data)`, `delete(id)`. Uses PocketBase SDK via `getClient()`.

PocketBase collection schemas are saved as JSON migration files in `pocketbase/migrations/`.

---

## Group A: Resident Profiles & Household Mapping

### PocketBase Collections

#### Collection: `residents`
| Field | Type | Rules |
|---|---|---|
| first_name | text | required |
| last_name | text | required |
| middle_name | text | |
| suffix | select | — / Jr. / Sr. / II / III / IV |
| birth_date | date | |
| age | number | computed on save |
| gender | select | male / female |
| contact_number | text | |
| household_id | relation → households | optional |
| purok | select | from system_settings purokOptions |
| civil_status | select | single / married / widowed / separated |
| occupation | text | |
| nationality | text | default "Filipino" |
| is_voter | bool | default false |
| is_4ps | bool | default false |
| is_senior | bool | default false |
| is_pwd | bool | default false |
| blood_type | select | A+ / A- / B+ / B- / AB+ / AB- / O+ / O- |
| notes | text | |

**Indexes**: `(last_name, first_name)`, `purok`, `household_id`

---

#### Collection: `households`
| Field | Type | Rules |
|---|---|---|
| household_number | text | required, unique |
| purok | select | from system_settings purokOptions |
| head_name | text | required |
| address | text | |
| notes | text | |

**Indexes**: `household_number`, `purok`

---

### API Layer

#### `src/api/residents.ts`
```typescript
interface ResidentData {
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

interface ApiResident extends RecordModel, ResidentData {}

export async function getResidents(): Promise<ApiResident[]>
export async function getResident(id: string): Promise<ApiResident>
export async function createResident(data: ResidentData): Promise<ApiResident>
export async function updateResident(id: string, data: Partial<ResidentData>): Promise<ApiResident>
export async function deleteResident(id: string): Promise<boolean>
export async function getResidentCount(): Promise<number>
```

#### `src/api/households.ts`
```typescript
interface HouseholdData {
  household_number: string
  purok?: string
  head_name: string
  address?: string
  notes?: string
}

interface ApiHousehold extends RecordModel, HouseholdData {}

export async function getHouseholds(): Promise<ApiHousehold[]>
export async function getHousehold(id: string): Promise<ApiHousehold>
export async function createHousehold(data: HouseholdData): Promise<ApiHousehold>
export async function updateHousehold(id: string, data: Partial<HouseholdData>): Promise<ApiHousehold>
export async function deleteHousehold(id: string): Promise<boolean>
export async function getMembersCount(householdId: string): Promise<number>
```

---

### UI Components

#### Resident Profiles Page (`/residents`)
- **List**: Table with columns Name, Purok, Age, Civil Status, Tags (voter/4ps/senior/pwd badges), Actions (edit/delete)
- **Search/Filter**: Text search by name, filter by purok dropdown, filter by tags
- **Form fields** (in slide-over panel):
  - Personal Info section: First, Middle, Last Name, Suffix, Birth Date, Age (auto-calc), Gender
  - Contact section: Contact Number
  - Address section: Household (dropdown searchable), Purok (dropdown)
  - Demographics section: Civil Status, Occupation, Nationality
  - Tags section: Checkbox toggles for Voter, 4Ps, Senior, PWD
  - Medical section: Blood Type
  - Notes: Textarea
- **Empty state**: "No residents yet. Add your first resident."
- **Member count badge**: Shows household member count on household name

#### Households Page (`/households`)
- **List**: Table with columns Household #, Purok, Head, Members Count, Actions
- **Search/Filter**: Text search, purok filter
- **Form fields**: Household Number, Purok, Head Name, Address, Notes
- **Expandable row** or separate section showing member residents list
- **Empty state**: "No households yet."

### Default Values
- Nationality: "Filipino"
- Suffix: " — "
- Blood Type: " — "

These are set as defaults in the form, not sent to the API if unchanged.

---

### PocketBase Migration JSON

To be saved as `pocketbase/migrations/001_residents_households.json`:

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
      { "name": "suffix", "type": "select", "options": { "values": ["—", "Jr.", "Sr.", "II", "III", "IV"] } },
      { "name": "birth_date", "type": "date" },
      { "name": "age", "type": "number" },
      { "name": "gender", "type": "select", "options": { "values": ["male", "female"] } },
      { "name": "contact_number", "type": "text", "options": { "max": 20 } },
      { "name": "household_id", "type": "relation", "options": { "collectionId": "", "maxSelect": 1 } },
      { "name": "purok", "type": "text", "options": { "max": 100 } },
      { "name": "civil_status", "type": "select", "options": { "values": ["single", "married", "widowed", "separated"] } },
      { "name": "occupation", "type": "text", "options": { "max": 255 } },
      { "name": "nationality", "type": "text", "options": { "max": 100 } },
      { "name": "is_voter", "type": "bool" },
      { "name": "is_4ps", "type": "bool" },
      { "name": "is_senior", "type": "bool" },
      { "name": "is_pwd", "type": "bool" },
      { "name": "blood_type", "type": "select", "options": { "values": ["—", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] } },
      { "name": "notes", "type": "text", "options": { "max": 2000 } }
    ],
    "indexes": ["CREATE INDEX idx_residents_name ON residents (last_name, first_name)", "CREATE INDEX idx_residents_purok ON residents (purok)", "CREATE INDEX idx_residents_household ON residents (household_id)"],
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
    "indexes": ["CREATE UNIQUE INDEX idx_households_number ON households (household_number)", "CREATE INDEX idx_households_purok ON households (purok)"],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "updateRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'",
    "deleteRule": "@request.auth.role = 'admin' || @request.auth.role = 'staff'"
  }
]
```

---

### Implementation Order within Group A
1. Create PocketBase migration JSON
2. Create `src/api/residents.ts`
3. Create `src/api/households.ts`
4. Create `src/features/residents/ResidentsPage.tsx`
5. Create `src/features/households/HouseholdsPage.tsx`
6. Update `src/routes/index.tsx` with new routes
7. Update `src/components/Sidebar.tsx` with new nav groups
8. Verify build passes
