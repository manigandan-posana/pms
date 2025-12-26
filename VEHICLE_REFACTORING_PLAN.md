# Vehicle Management Refactoring Plan

## Current State
- **Single File:** `VehicleManagementPage.tsx` (1319 lines)
- **Contains:** Vehicles, Fuel Entries, Daily Logs, Suppliers all in one file
- **Problem:** Hard to maintain, navigate, and extend

## Target Structure (Following Inventory Pattern)

### Main Container
```
VehicleManagementPage.tsx (NEW)
├── Uses CustomTabs
├── Contains 4 tabs:
│   ├── Vehicle Directory
│   ├── Fuel Management
│   ├── Daily Logs
│   └── Suppliers
```

### Individual Components

#### 1. VehicleDirectoryPage.tsx
**Purpose:** Manage fleet vehicles
- List all vehicles with filters
- Add new vehicle
- Update vehicle status (Active/Inactive/Planned)
- Delete vehicle
- View vehicle details (navigate to VehicleDetailsPage)
- Show metrics: Total vehicles, Active, Fuel cost, Running KM

#### 2. FuelManagementPage.tsx
**Purpose:** Manage fuel entries
- View modes: Current (OPEN) / History (CLOSED)
- Filter by: Fuel Type, Vehicle, Supplier, Date Range
- Add fuel entry
- Close fuel entry
- Refill fuel entry
- Show metrics: Total quantity, Total cost, Total distance, Avg mileage

#### 3. DailyLogPage.tsx
**Purpose:** Manage daily vehicle logs
- List today's logs
- Filter by vehicle, status
- Create daily log
- Close daily log
- Show metrics: Total logs, Open logs, Total distance

#### 4. SupplierManagementPage.tsx
**Purpose:** Manage fuel suppliers
- List all suppliers
- Add new supplier
- Edit supplier details
- Delete supplier
- Show supplier statistics

## File Structure

```
src/pages/workspace/
├── VehicleManagementPage.tsx       (Main container with tabs)
├── VehicleDirectoryPage.tsx        (Vehicles list & management)
├── FuelManagementPage.tsx          (Fuel entries)
├── DailyLogPage.tsx                (Daily logs)
├── SupplierManagementPage.tsx      (Suppliers)
└── VehicleDetailsPage.tsx          (Existing - no changes)
```

## Shared Logic

### Redux (No changes needed)
- `vehicleSlice.ts` - Already well structured
- All thunks and reducers work as-is

### Types (No changes needed)
- `vehicle.ts` - All types already defined

### Widgets (Reuse existing)
- CustomTable
- CustomButton
- CustomModal
- CustomTextField
- CustomSelect
- CustomDateInput
- CustomTabs

## Implementation Steps

### Step 1: Create VehicleManagementPage (Container)
- Simple page with CustomTabs
- 4 tabs routing to sub-pages
- Similar to InventoryPage.tsx

### Step 2: Extract VehicleDirectoryPage
- Move vehicle CRUD operations
- Vehicle table with columns
- Add/Edit/Delete dialogs
- Status management

### Step 3: Extract FuelManagementPage
- Move fuel entry logic
- View modes (Current/History)
- Filters and search
- Add/Close/Refill operations
- Summary metrics

### Step 4: Extract DailyLogPage
- Move daily log logic
- Create/Close operations
- Validation logic
- Today's logs view

### Step 5: Extract SupplierManagementPage
- Move supplier CRUD
- Simple table
- Add/Delete operations

### Step 6: Update Routes
- Update WorkspaceLayout routing
- Ensure navigation works

## Benefits

### Maintainability
- ✅ Each file < 500 lines
- ✅ Single responsibility
- ✅ Easy to find code
- ✅ Easy to test

### Performance
- ✅ Lazy loading possible
- ✅ Only load active tab
- ✅ Smaller bundle chunks

### Developer Experience
- ✅ Clear file structure
- ✅ Easy to navigate
- ✅ Parallel development possible
- ✅ Less merge conflicts

### User Experience
- ✅ Faster initial load
- ✅ Better organization
- ✅ Consistent with inventory pattern
- ✅ Intuitive navigation

## Migration Strategy

### Phase 1: Create New Files (Non-breaking)
- Create all new component files
- Copy relevant code
- Test individually

### Phase 2: Update Container
- Update VehicleManagementPage to use tabs
- Route to new components

### Phase 3: Update Routes
- Update WorkspaceLayout
- Test navigation

### Phase 4: Cleanup
- Remove old VehicleManagementPage backup
- Update imports
- Verify all functionality

## Testing Checklist

- [ ] All vehicle operations work
- [ ] All fuel operations work
- [ ] All daily log operations work
- [ ] All supplier operations work
- [ ] Navigation between tabs works
- [ ] Data refreshes correctly
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Redux state updates properly
- [ ] All modals/dialogs work

## Estimated Impact

### Files Created: 4
- VehicleDirectoryPage.tsx (~400 lines)
- FuelManagementPage.tsx (~500 lines)
- DailyLogPage.tsx (~350 lines)
- SupplierManagementPage.tsx (~250 lines)

### Files Modified: 2
- VehicleManagementPage.tsx (reduced to ~100 lines)
- WorkspaceLayout.tsx (routing updates)

### Files Unchanged: 3
- vehicleSlice.ts
- vehicle.ts
- VehicleDetailsPage.tsx

### Total Lines: ~1600 (from 1319 in one file)
- Better organized
- More maintainable
- Follows established patterns
