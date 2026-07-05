### Task 3: Residents Page

**Files:**
- Create: `src/features/residents/ResidentsPage.tsx`

**Interfaces:**
- Consumes: `ApiResident`, `ResidentData`, `getResidents`, `createResident`, `updateResident`, `deleteResident` from `src/api/residents.ts`

- [ ] **Step 1: Create the Residents page component**

The page follows the RecordsPage pattern exactly (read `src/features/records/RecordsPage.tsx` as reference):

- State variables: `residents[]`, `loading`, `search`, `purokFilter`, `tagFilter`, form fields, `editingId`, `deletingId`, `panelOpen`, `error`
- `useEffect` on mount: `getResidents().then(setResidents)`
- Filtered list: `useMemo` to filter by search (name), purok, and tags (voter/4ps/senior/pwd)
- Table columns: Name (first + last), Purok, Age, Civil Status, Tags (small badges), Actions (edit/delete)
- Form panel fields: all resident fields organized in sections
- DO NOT re-create the statusConfig from RecordsPage. Instead use inline tag badge styling for resident tags.

Key differences from RecordsPage:
- Age is auto-computed from `birth_date` when birth_date changes
- Tags are boolean toggles rendered as badges in table
- Purok filter uses a hardcoded fallback: `['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7']`

Age calculation helper:
```typescript
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

The filter bar: search input + purok dropdown + tag filter buttons/toggles.

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

Use the same layout pattern as RecordsPage: `PageHeader`, `Card` with `CardContent`, table with `overflow-x-auto`, slide-over panel / bottom drawer (`max-md:flex-col max-md:justify-end`), `ConfirmDialog` for delete.

Role gating: use `hasRole('admin', 'staff')` for create/edit/delete buttons.

- [ ] **Step 2: Update `src/features/residents/index.ts`**

```typescript
export { default as ResidentsPage } from './ResidentsPage'
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1`
