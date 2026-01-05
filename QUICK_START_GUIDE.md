# Quick Start Guide: Project-Wise Resource Management

## What's Been Fixed?

### ✅ Admin Can Now Create Suppliers & Contractors
Previously, admin couldn't create suppliers/contractors in Master Console because the system required project selection. This has been fixed.

### ✅ Project-Wise Management Implemented
- Resources can be "common" (available to all) or project-specific
- Once created for a project, resources become available system-wide
- Labour assignments are project-specific

## How to Use

### For Admin (Master Console)

#### Creating Common Suppliers
1. Open **Master Console** → **Supplier Management** tab
2. Click **"Add Supplier"** button
3. Fill in the details:
   - Supplier Name: `ABC Materials Ltd`
   - Type: `MATERIALS`
   - Contact Person, Phone, Email, etc.
4. **Don't select any projects**
5. Click **"Add Supplier"**
6. ✓ Supplier is created as "Common" - available to all projects

#### Creating Common Contractors
1. Open **Master Console** → **Contractor Management** tab
2. Click **"New Contractor"** button
3. Fill in the details:
   - Name: `XYZ Construction`
   - Type: `Work`
   - Mobile, Email, PAN, etc.
4. **Don't assign to any projects**
5. Click **"Create Contractor"**
6. ✓ Contractor is created as "Common" - available to all projects

#### Viewing Project Assignments
In admin view, you'll see:
- `[Common]` badge → Resource available to all projects
- `[Project A] [Project B]` badges → Resource assigned to specific projects

#### Bulk Assignment
1. Select multiple suppliers/contractors (checkboxes)
2. Click **"Bulk Assign Projects"** button
3. Select target projects
4. Click **"Assign"**
5. ✓ Resources are now linked to those projects

### For Project Manager/Store (Workspace)

#### Creating Project-Specific Suppliers
1. Select your project from dropdown (e.g., "Phoenix Tower")
2. Go to **Supplier Management**
3. Click **"Add Supplier"**
4. Fill in the details
5. Click **"Add Supplier"**
6. ✓ Supplier is automatically linked to your current project
7. ✓ Other project managers can also see this supplier

#### Creating Project-Specific Contractors
1. Select your project from dropdown (e.g., "Alpha Complex")
2. Go to **Contractor Management**
3. Click **"New Contractor"**
4. Fill in the details
5. Click **"Create Contractor"**
6. ✓ Contractor is automatically linked to your current project
7. ✓ Other project managers can also see this contractor

### Labour Management (Project-Specific)

#### Scenario: Different Labour Count Per Project

**Example:**
Contractor "ABC Construction" has 20 labours total, but:
- Project A needs only 10 labours
- Project B needs 15 labours
- Project C needs 5 labours

#### How to Manage:

**Step 1: Add All Labours to Contractor**
1. Go to Contractor Details → **"ABC Construction"**
2. Click **"Add Labour"** tab
3. Add all 20 labours with their details

**Step 2: Assign Labours to Project A**
1. In Contractor Details, select **"Project A"** from dropdown
2. Click **"Manage Project Labours"**
3. Check 10 specific labours that should work on Project A
4. Click **"Save"**
5. ✓ Project A can now use only these 10 labours

**Step 3: Assign Labours to Project B**
1. In Contractor Details, select **"Project B"** from dropdown
2. Click **"Manage Project Labours"**
3. Check 15 specific labours (can be different from Project A)
4. Click **"Save"**
5. ✓ Project B can now use these 15 labours

**Viewing Labour Assignments:**
- When PM of Project A views this contractor → Sees only 10 labours
- When PM of Project B views this contractor → Sees only 15 labours
- When Admin views this contractor → Sees all 20 labours

## Visual Flow Diagrams

### Supplier/Contractor Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     WHO IS CREATING?                        │
└──────────────────┬────────────────────┬─────────────────────┘
                   │                    │
           ┌───────▼────────┐   ┌──────▼──────────┐
           │     ADMIN      │   │ PROJECT MANAGER │
           │ Master Console │   │   Workspace     │
           └───────┬────────┘   └──────┬──────────┘
                   │                    │
          ┌────────▼─────────┐ ┌───────▼─────────┐
          │ Projects = []    │ │ Projects = [A]  │
          │ (Empty Array)    │ │ (Current Proj)  │
          └────────┬─────────┘ └───────┬─────────┘
                   │                    │
          ┌────────▼─────────┐ ┌───────▼─────────┐
          │ Common Resource  │ │Project-Specific │
          │ All can access   │ │All can access*  │
          └──────────────────┘ └─────────────────┘

* But initially shows only in creating project's workspace view
```

### Labour Assignment Flow

```
Contractor: ABC Construction (20 Labours Total)
├── Project A
│   ├── LAB-1 ✓
│   ├── LAB-2 ✓
│   ├── LAB-3 ✓
│   ├── LAB-4
│   ├── LAB-5 ✓
│   └── ... (10 total)
│
├── Project B
│   ├── LAB-1 ✓ (same as Project A)
│   ├── LAB-4 ✓ (different from Project A)
│   ├── LAB-6 ✓
│   ├── LAB-7 ✓
│   └── ... (15 total)
│
└── Master/Admin View
    └── All 20 labours visible
```

## Common Scenarios

### Scenario 1: New Project Setup
```
Admin creates:
- Common materials suppliers
- Common fuel suppliers
- Common contractors for civil work
- Common contractors for electrical work

Then PM can:
- Use all common resources
- Create additional project-specific resources if needed
```

### Scenario 2: Specialized Contractor
```
PM of Project X creates:
- "Specialized Welding Co." for unique project requirements

Result:
- Contractor is linked to Project X
- Other PMs can also use this contractor (shows in their list)
- Admin can see it's used by Project X
```

### Scenario 3: Multi-Project Contractor
```
Admin assigns "Universal Builders" to:
- Project A (with 10 labours)
- Project B (with 15 labours)
- Project C (with 8 labours)

Each project:
- Sees only their assigned labours
- Can track utilization independently
- Has separate labour records
```

## API Quick Reference

### Suppliers
```http
# Create common supplier (admin)
POST /api/suppliers
{
  "supplierName": "ABC Ltd",
  "supplierType": "MATERIALS",
  "projectIds": []  // Empty = common
}

# Create project-specific supplier (PM)
POST /api/suppliers
{
  "supplierName": "XYZ Ltd",
  "supplierType": "FUEL",
  "projectIds": [1]  // Link to project 1
}

# Get suppliers for project
GET /api/suppliers/project/1

# Bulk assign to projects
POST /api/suppliers/bulk-assign
{
  "ids": [1, 2, 3],
  "projectIds": [1, 2]
}
```

### Contractors
```http
# Create common contractor (admin)
POST /api/contractors
{
  "name": "ABC Construction",
  "type": "Work",
  "projectIds": []  // Empty = common
}

# Create project-specific contractor (PM)
POST /api/contractors
{
  "name": "XYZ Builders",
  "type": "Labour",
  "projectIds": [1]  // Link to project 1
}

# Get contractors for project (with project info)
GET /api/contractors?projectId=1&includeProjects=true

# Get all contractors (admin view with project info)
GET /api/contractors?includeProjects=true
```

### Labours (Project-Specific)
```http
# Get all labours for contractor
GET /api/contractors/CTR-100/labours

# Get labours for contractor in specific project
GET /api/contractors/CTR-100/labours?projectId=1

# Create labour and assign to projects
POST /api/contractors/CTR-100/labours
{
  "name": "John Doe",
  "dob": "1990-01-01",
  "projectIds": [1, 2]  // Assign to projects 1 and 2
}

# Update labour assignments for a project
PUT /api/contractors/CTR-100/projects/1/labours
["LAB-1", "LAB-2", "LAB-5"]  // Only these labours for project 1
```

## Benefits Summary

✅ **Flexibility**: Create resources as common or project-specific
✅ **No Duplication**: Same resource, different project assignments
✅ **Labour Optimization**: Allocate labours efficiently per project
✅ **Centralized Control**: Admin manages all resources from one place
✅ **Project Autonomy**: PMs can create resources as needed
✅ **Clear Visibility**: Easy to see which resources belong to which projects

## Troubleshooting

### Issue: "Can't create supplier without project"
**Solution**: This issue is now fixed. You can create suppliers without selecting projects in admin mode.

### Issue: "Contractor not visible in project"
**Check:**
1. Is contractor assigned to the project? (Admin → Bulk Assign)
2. Is user viewing the correct project in workspace?
3. Refresh the page

### Issue: "Labour count doesn't match"
**Check:**
1. Are you viewing the correct project?
2. Labour assignments are project-specific
3. Use "Manage Project Labours" to adjust assignments

## Need Help?

- Backend errors: Check application logs in `store/logs`
- Frontend issues: Check browser console (F12)
- API testing: Use the endpoints above with Postman/curl
- Documentation: See `PROJECT_WISE_MANAGEMENT.md` for detailed explanation
