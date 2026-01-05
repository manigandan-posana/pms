# Project-Wise Supplier and Contractor Management

## Overview
This document explains how suppliers, contractors, and labours are managed across projects in the PMS system.

## Key Concepts

### 1. Common Resources (Master Resources)
- **Created by**: Admin in Master Console
- **Scope**: Available to all projects
- **Identification**: Resources with empty `projects` array
- **Use Case**: Resources that should be available system-wide

### 2. Project-Specific Resources
- **Created by**: Project Manager or Store Manager in workspace
- **Scope**: Initially linked only to the creating project
- **Behavior**: Automatically becomes "common" (selectable by all projects) once created, but only appears in the specific project's view unless explicitly assigned to other projects

## Suppliers

### Admin Creates Supplier (Master Console)
```
1. Admin opens Master Console → Supplier Management
2. Clicks "Add Supplier"
3. Fills supplier details WITHOUT selecting projects
4. Supplier is created with empty projects array → Common supplier
5. All projects can now use this supplier
```

### Project Manager Creates Supplier (Workspace)
```
1. PM selects Project A
2. Opens Supplier Management
3. Clicks "Add Supplier"
4. Fills supplier details
5. Supplier is automatically linked to Project A
6. Other projects can also use this supplier through bulk assignment
```

### Data Structure
```typescript
interface Supplier {
  id: number;
  code: string;  // SUP-YYYYMMDD-XXXX
  supplierName: string;
  supplierType: "FUEL" | "MATERIALS";
  projects: Project[];  // Empty = common, Non-empty = specific projects
  // ... other fields
}
```

## Contractors

### Admin Creates Contractor (Master Console)
```
1. Admin opens Master Console → Contractor Management
2. Clicks "New Contractor"
3. Fills contractor details WITHOUT selecting projects
4. Contractor is created with empty projects array → Common contractor
5. All projects can now use this contractor
```

### Project Manager Creates Contractor (Workspace)
```
1. PM selects Project A
2. Opens Contractor Management
3. Clicks "New Contractor"
4. Fills contractor details
5. Contractor is automatically linked to Project A
6. Other projects can use this contractor through bulk assignment
```

### Data Structure
```typescript
interface Contractor {
  id: number;
  code: string;  // CTR-{id}
  name: string;
  type: "Work" | "Labour";
  projects: Project[];  // Empty = common, Non-empty = specific projects
  // ... other fields
}
```

## Labours (Project-Specific Management)

### Key Feature: Project-Specific Labour Count
**Same contractor can have different labour counts in different projects.**

#### Example Scenario:
```
Contractor "ABC Construction" (CTR-100):
- Master/Common: 20 labours total
- Project A: 10 labours (subset of the 20)
- Project B: 15 labours (different subset of the 20)
- Project C: 5 labours (another subset)
```

### How It Works

#### 1. Creating Labours
```
1. Navigate to Contractor Details (CTR-100)
2. Click "Add Labour"
3. Fill labour details
4. Select projects where this labour will work
5. Labour is created and linked to specified projects
```

#### 2. Assigning Labours to Projects
```
1. Navigate to Contractor Details (CTR-100)
2. Select a specific project (e.g., Project A)
3. View only the labours assigned to Project A
4. Use "Manage Project Labours" to add/remove labours for this project
```

### Data Structure
```typescript
interface Labour {
  id: number;
  code: string;  // LAB-{id}
  name: string;
  contractorId: number;
  projects: Project[];  // Which projects this labour works on
  // ... other fields
}
```

### API Endpoints for Project-Specific Labour Management

#### Get Labours for Contractor (All Projects)
```
GET /api/contractors/{code}/labours
Returns: All labours under this contractor
```

#### Get Labours for Contractor in Specific Project
```
GET /api/contractors/{code}/labours?projectId={projectId}
Returns: Only labours assigned to the specified project
```

#### Update Project-Specific Labours
```
PUT /api/contractors/{code}/projects/{projectId}/labours
Body: ["LAB-1", "LAB-2", "LAB-5"]
Effect: Updates which labours are assigned to this project
```

## Backend Implementation

### Database Schema
```sql
-- Many-to-Many relationship tables
CREATE TABLE supplier_projects (
  supplier_id BIGINT,
  project_id BIGINT,
  PRIMARY KEY (supplier_id, project_id)
);

CREATE TABLE contractor_projects (
  contractor_id BIGINT,
  project_id BIGINT,
  PRIMARY KEY (contractor_id, project_id)
);

CREATE TABLE labour_projects (
  labour_id BIGINT,
  project_id BIGINT,
  PRIMARY KEY (labour_id, project_id)
);
```

### Service Logic

#### Creating Common Resources (Admin)
```java
// When projectIds is null or empty
if (projectIds == null || projectIds.isEmpty()) {
    // Resource is "common" - accessible to all projects
    resource.setProjects(new HashSet<>());
}
```

#### Creating Project-Specific Resources (PM/Store)
```java
// When projectIds contains the current project
if (projectIds != null && !projectIds.isEmpty()) {
    List<Project> projects = projectRepository.findAllById(projectIds);
    resource.setProjects(new HashSet<>(projects));
}
```

#### Querying Resources
```java
// Get all resources (common + all project-specific)
List<Resource> allResources = repository.findAll();

// Get resources for specific project (common + project-specific)
List<Resource> projectResources = repository.findByProjectsId(projectId);
```

## Frontend Implementation

### Admin Mode (Master Console)
```typescript
// Allow creating without project selection
const projectIds = isAdminMode ? [] : [selectedProjectId];

// Show project tags for each resource
{resource.projects?.length === 0 ? (
  <Chip label="Common" color="success" />
) : (
  resource.projects.map(p => <Chip label={p.name} />)
)}
```

### Workspace Mode
```typescript
// Automatically link to current project
const projectIds = selectedProjectId ? [selectedProjectId] : [];

// Filter to show only relevant resources
const resources = await Get(`/resources?projectId=${selectedProjectId}`);
```

## Bulk Assignment

### Purpose
Assign existing common or project-specific resources to additional projects.

### Usage
```
1. Admin selects multiple suppliers/contractors
2. Clicks "Bulk Assign Projects"
3. Selects target projects
4. Resources are linked to selected projects
```

### API
```
POST /api/suppliers/bulk-assign
Body: {
  ids: [1, 2, 3],
  projectIds: [10, 20]
}

POST /api/contractors/bulk-assign
Body: {
  ids: [1, 2, 3],
  projectIds: [10, 20]
}
```

## Summary

### Decision Tree for Creating Resources

```
Is user Admin in Master Console?
├─ YES → Create with empty projects = Common resource
└─ NO (Project Manager/Store in Workspace)
   └─ Create with current projectId = Project-specific resource

Can other projects use this resource?
└─ YES, through:
   ├─ Direct selection (if common)
   └─ Bulk assignment (if admin assigns it)
```

### Labour Assignment Logic

```
For Contractor X with 20 labours:
├─ Project A wants 10 labours
│  └─ Admin/PM assigns 10 specific labours to Project A
├─ Project B wants 15 labours
│  └─ Admin/PM assigns 15 specific labours to Project B
└─ Labours can overlap or be different between projects
```

## Benefits

1. **Flexibility**: Resources can be common or project-specific
2. **Control**: Admin has full control over resource availability
3. **Efficiency**: No duplication - same resource, different project assignments
4. **Scalability**: Easy to add resources to new projects
5. **Labour Optimization**: Contractors can allocate labours efficiently across projects
