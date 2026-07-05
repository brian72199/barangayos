# Fix Report

## Issues Fixed

### I1 — PocketBase filter quoting in `src/api/activity.ts`
- Changed line 43 from double quotes to single quotes: `collection = "${collection}"` → `collection = '${collection}'`
- PocketBase requires single quotes for string filter values; double quotes are for identifiers.

### I2 — Missing stat cards in `src/pages/Dashboard.tsx`
- Added `Escalated` and `Dismissed` stat cards to the `statCards` array (lines 44-45)
- Icons `ArrowUpCircle` and `XCircle` were already imported
- Updated grid layout from `lg:grid-cols-4` to `lg:grid-cols-3 xl:grid-cols-6` to accommodate 6 cards

### I4 — Dashboard error handling inconsistency in `src/pages/Dashboard.tsx`
- Changed line 36 from `.catch(console.error)` to `.catch(() => setRecentRecords([]))`
- Now consistent with the stats fetch pattern which falls back to empty state on error

## Build Result

`npm run build` passed successfully (TypeScript + Vite):
- 1880 modules transformed
- No errors or warnings

## Files Changed

| File | Lines Changed |
|------|--------------|
| `src/api/activity.ts` | 1 (filter quoting) |
| `src/pages/Dashboard.tsx` | 3 (stat cards + grid + error handling) |

## Commit

`0e304c6` — fix: PocketBase filter quoting in activity.ts, missing stat cards and error handling in Dashboard
