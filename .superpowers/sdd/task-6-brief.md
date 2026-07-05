### Task 6: Sidebar Navigation

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add new nav groups and icons**

Add `Users` and `Home` to the lucide-react imports:
```typescript
import {
  LayoutDashboard,
  FileText,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Users,
  Home,
} from 'lucide-react'
```

Update `navGroups` to include the new Resident and Household items:
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
