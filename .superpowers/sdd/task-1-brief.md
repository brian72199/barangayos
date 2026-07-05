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

