# Duplicate Files Analysis and Cleanup Plan

## Date: 2025-12-27

## Frontend Duplicate Files Identified

### 1. **Admin Pages with Version Suffixes (UNUSED)**

#### MaterialAllocationsPageV2.tsx
- **Location**: `e:\PMS\pms-frontend\src\pages\admin\MaterialAllocationsPageV2.tsx`
- **Status**: NOT imported in routes
- **Used Version**: `MaterialAllocationsPage.tsx` (imported in InventoryPage.tsx)
- **Action**: DELETE

#### MaterialDirectoryPageV2.tsx
- **Location**: `e:\PMS\pms-frontend\src\pages\admin\MaterialDirectoryPageV2.tsx`
- **Status**: NOT imported in routes
- **Used Version**: `MaterialDirectoryPage.tsx` (imported in routes)
- **Action**: DELETE

#### ProjectManagementPageV3.tsx
- **Location**: `e:\PMS\pms-frontend\src\pages\admin\ProjectManagementPageV3.tsx`
- **Status**: NOT imported in routes
- **Used Version**: `ProjectManagementPage.tsx` (imported in routes)
- **Action**: DELETE

#### UserManagementPageV2.tsx
- **Location**: `e:\PMS\pms-frontend\src\pages\admin\UserManagementPageV2.tsx`
- **Status**: NOT imported anywhere
- **Used Version**: `UserManagementPage.tsx` (imported in routes)
- **Action**: DELETE

### 2. **Obsolete Top-Level Pages (UNUSED)**

#### UserWorkspace.tsx
- **Location**: `e:\PMS\pms-frontend\src\pages\UserWorkspace.tsx`
- **Status**: NOT imported in routes or App.tsx
- **Replaced By**: WorkspaceLayout.tsx and individual workspace pages
- **Action**: DELETE

#### UsersPage.tsx
- **Location**: `e:\PMS\pms-frontend\src\pages\UsersPage.tsx`
- **Status**: NOT imported in routes
- **Replaced By**: `admin/UserManagementPage.tsx`
- **Action**: DELETE

### 3. **Old Vehicle Management Page (UNUSED)**

#### VehicleManagementPage.tsx
- **Location**: `e:\PMS\pms-frontend\src\pages\workspace\VehicleManagementPage.tsx`
- **Size**: 57,905 bytes (very large)
- **Status**: NOT imported in routes
- **Used Version**: `VehicleManagementPageNew.tsx` (imported in routes)
- **Action**: DELETE

### 4. **Duplicate user-workspace Directory (UNUSED)**

#### Entire Directory: user-workspace
- **Location**: `e:\PMS\pms-frontend\src\pages\user-workspace\`
- **Contains**: 14 files (BomTab.tsx, InwardTab.tsx, OutwardTab.tsx, etc.)
- **Status**: NOT imported anywhere in the codebase
- **Replaced By**: workspace directory pages
- **Action**: DELETE ENTIRE DIRECTORY

Files in this directory:
- AllocationModal.tsx
- BomTab.tsx
- DecisionModal.tsx
- InwardDetailModal.tsx
- InwardTab.tsx
- MasterPage.tsx
- MaterialMovementModal.tsx
- ModalShell.tsx
- OutwardTab.tsx
- RequestModal.tsx
- SectionHeader.tsx
- TransferTab.tsx
- WorkspaceHeader.tsx
- WorkspaceTabs.tsx

### 5. **Duplicate MasterPage (UNUSED)**

#### workspace/MasterPage.tsx
- **Location**: `e:\PMS\pms-frontend\src\pages\workspace\MasterPage.tsx`
- **Size**: 3,077 bytes
- **Status**: NOT imported in routes
- **Note**: There's a MasterPage in user-workspace too (both unused)
- **Action**: DELETE

## Backend Analysis

After analyzing the backend, **NO duplicate files were found**. All controllers, services, repositories, and DTOs are unique and actively used.

## Summary of Files to Delete

### Frontend Files (10 files + 1 directory):

1. ✅ `e:\PMS\pms-frontend\src\pages\admin\MaterialAllocationsPageV2.tsx`
2. ✅ `e:\PMS\pms-frontend\src\pages\admin\MaterialDirectoryPageV2.tsx`
3. ✅ `e:\PMS\pms-frontend\src\pages\admin\ProjectManagementPageV3.tsx`
4. ✅ `e:\PMS\pms-frontend\src\pages\admin\UserManagementPageV2.tsx`
5. ✅ `e:\PMS\pms-frontend\src\pages\UserWorkspace.tsx`
6. ✅ `e:\PMS\pms-frontend\src\pages\UsersPage.tsx`
7. ✅ `e:\PMS\pms-frontend\src\pages\workspace\VehicleManagementPage.tsx`
8. ✅ `e:\PMS\pms-frontend\src\pages\workspace\MasterPage.tsx`
9. ✅ `e:\PMS\pms-frontend\src\pages\user-workspace\` (ENTIRE DIRECTORY - 14 files)

### Backend Files:
- **NONE** - No duplicates found

## Impact Analysis

### Zero Impact - Safe to Delete:
- All identified files are NOT imported in:
  - routes/route.ts
  - App.tsx
  - Any other active component
- No breaking changes will occur
- Application functionality will remain 100% intact

## Space Savings

Estimated space saved: ~150 KB of source code
- Reduces code complexity
- Improves build times
- Easier codebase navigation
- Cleaner project structure
