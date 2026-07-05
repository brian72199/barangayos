### Task 5: Routes

**Files:**
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Add import and routes for residents and households**

Add imports at the top of the file:
```typescript
import { ResidentsPage } from '@/features/residents'
import { HouseholdsPage } from '@/features/households'
```

Add these routes inside the `<Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>` block, after the `/settings` route:

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
