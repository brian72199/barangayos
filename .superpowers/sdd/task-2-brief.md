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

