### Task 4: Households Page

**Files:**
- Create: `src/features/households/HouseholdsPage.tsx`

**Interfaces:**
- Consumes: `ApiHousehold`, `HouseholdData`, `getHouseholds`, `createHousehold`, `updateHousehold`, `deleteHousehold` from `src/api/households.ts`
- Consumes: `ApiResident`, `getResidents` from `src/api/residents.ts`

- [ ] **Step 1: Create the Households page component**

State variables: `households[]`, `residentsMap` (keyed by household_id), `loading`, `search`, `expandedId` (for expandable row — string | null), form fields, `editingId`, `deletingId`, `panelOpen`, `error`.

On mount: fetch both `getHouseholds()` and `getResidents()`. Build a `Map<string, ApiResident[]>` keyed by `household_id` so you can look up members per household.

Table columns: Household #, Purok, Head Name, Members Count (# of residents in that household from the map), Actions.

Expandable row: clicking a row toggles `expandedId`. When expanded, render an extra `<tr>` below with a nested 1-cell `<td colspan={5}>` containing either a list of resident names with age/tags badges, or "No members" text.

Form fields (in slide-over panel):
- Household Number* (required)
- Purok (dropdown with Purok 1-7)
- Head Name* (required)
- Address (textarea)
- Notes (textarea)

Use the same layout pattern as RecordsPage: `PageHeader`, `Card` with `CardContent`, table with `overflow-x-auto`, slide-over panel / bottom drawer, `ConfirmDialog` for delete.

Role gating: `hasRole('admin', 'staff')` for create/edit/delete. Viewers see the list but no action buttons.

- [ ] **Step 2: Update `src/features/households/index.ts`**

```typescript
export { default as HouseholdsPage } from './HouseholdsPage'
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1`
