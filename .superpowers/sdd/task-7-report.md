# Task 7: Routes + Sidebar

## What I implemented

### `src/routes/index.tsx`
- Updated import to include `VisitorLogPage` alongside `ActivityPage`
- Changed `path="activity-log"` → `path="logs/activity"` with roles `['admin', 'staff']`
- Added new route for `path="logs/visitors"` with roles `['admin', 'staff']`

### `src/components/Sidebar.tsx`
- Removed `Activity` from lucide-react imports, added `ClipboardCheck` and `DoorOpen`
- Removed old "Activity Log" item from Administration group
- Added new "Logs" group after "Records" with Activity Log and Visitor Log items

## Build result
**SUCCESS** — `npm run build` passed cleanly (tsc + vite).

## Files changed
- `src/routes/index.tsx`
- `src/components/Sidebar.tsx`
