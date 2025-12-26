# TypeScript Errors - Fix Guide

## Issues Found:

### 1. Grid Component Errors (MUI v6)
MUI v6 removed the `item` prop from Grid. Need to use Grid2 or update syntax.

### 2. CustomButton - No `icon` prop
CustomButton only accepts `label` and standard ButtonProps. Icons should be passed as `startIcon` or `endIcon`.

### 3. CustomModal - No `actions` prop  
CustomModal uses `footer` prop instead of `actions`.

## FIXES NEEDED:

### Fix 1: Update CustomButton Usage
**Change from:**
```tsx
<CustomButton label="Add" icon={<FiPlus />} onClick={...} />
```

**Change to:**
```tsx
<CustomButton label="Add" startIcon={<FiPlus />} onClick={...} />
```

### Fix 2: Update CustomModal Usage
**Change from:**
```tsx
<CustomModal
  open={open}
  onClose={onClose}
  title="Title"
  actions={<>...</>}
>
```

**Change to:**
```tsx
<CustomModal
  open={open}
  onClose={onClose}
  title="Title"
  footer={<>...</>}
>
```

### Fix 3: Fix Grid Component
**Change from:**
```tsx
<Grid item xs={12} md={3}>
```

**Change to:**
```tsx
<Grid xs={12} md={3}>
```

OR import Grid2:
```tsx
import Grid2 from '@mui/material/Unstable_Grid2';
// Then use <Grid2 xs={12} md={3}>
```

## Files to Fix:
1. VehicleDirectoryPage.tsx
2. FuelManagementPage.tsx
3. DailyLogPage.tsx
4. SupplierManagementPage.tsx
5. VehicleManagementPageNew.tsx (import errors)
