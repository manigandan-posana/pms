# Backend Outward Refactoring Plan - Remove Status

## Overview
Remove all status-related functionality from the backend to match the frontend changes.

---

## Files to Modify

### 1. **OutwardStatus.java** (Enum)
**Action:** ❌ **DELETE THIS FILE**
- This enum is no longer needed

### 2. **OutwardRecord.java** (Entity)
**Changes:**
- ❌ Remove `status` field (line 40-42)
- ❌ Remove `closeDate` field (line 44)
- ❌ Remove `getStatus()` method (lines 107-109)
- ❌ Remove `setStatus()` method (lines 111-113)
- ❌ Remove `getCloseDate()` method (lines 115-117)
- ❌ Remove `setCloseDate()` method (lines 119-121)
- ❌ Remove `@Enumerated` import (line 6)
- ❌ Remove `EnumType` import (line 7)

### 3. **OutwardController.java** (Controller)
**Changes:**
- ❌ Remove `closeOutward` endpoint (lines 226-267)
- ❌ Remove `OutwardStatus` import (line 9)
- ❌ Update `convertToDto` method to remove status and closeDate (lines 290-291)

### 4. **OutwardRegisterDto.java** (DTO)
**Changes:**
- ❌ Remove `status` field
- ❌ Remove `closeDate` field
- ❌ Update constructor
- ❌ Remove getters for status and closeDate

### 5. **Database Migration**
**Action:** Create migration to remove columns
- ❌ Remove `status` column from `outward_records` table
- ❌ Remove `close_date` column from `outward_records` table

---

## Detailed Changes

### OutwardRecord.java

**Remove these lines:**
```java
// Line 6-7: Remove imports
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

// Lines 40-42: Remove status field
@Enumerated(EnumType.STRING)
@Column(nullable = false)
private OutwardStatus status = OutwardStatus.OPEN;

// Line 44: Remove closeDate field
private LocalDate closeDate;

// Lines 107-113: Remove status getter/setter
public OutwardStatus getStatus() {
    return status;
}

public void setStatus(OutwardStatus status) {
    this.status = status;
}

// Lines 115-121: Remove closeDate getter/setter
public LocalDate getCloseDate() {
    return closeDate;
}

public void setCloseDate(LocalDate closeDate) {
    this.closeDate = closeDate;
}
```

**After cleanup, the entity should have:**
```java
package com.vebops.store.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "outward_records")
public class OutwardRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    private LocalDate date;
    private String issueTo;
    private String remarks;
    private String vehicleNo;
    private LocalDate entryDate;
    
    @Column(nullable = false)
    private boolean validated = false;

    @OneToMany(mappedBy = "record", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OutwardLine> lines = new ArrayList<>();

    // Getters and Setters (without status and closeDate)
    ...
}
```

---

### OutwardController.java

**Remove:**
```java
// Line 9: Remove import
import com.vebops.store.model.OutwardStatus;

// Lines 226-267: Remove entire closeOutward method
@PostMapping("/{id}/close")
public ResponseEntity<?> closeOutward(@PathVariable Long id) {
    ...
}
```

**Update convertToDto method:**
```java
// Lines 269-295
private OutwardRegisterDto convertToDto(OutwardRecord record, List<OutwardLine> recordLines) {
    List<OutwardLineDto> lines = new ArrayList<>();
    for (OutwardLine line : recordLines) {
        Material material = line.getMaterial();
        lines.add(new OutwardLineDto(
                line.getId() != null ? String.valueOf(line.getId()) : null,
                material != null && material.getId() != null ? String.valueOf(material.getId()) : null,
                material != null ? material.getCode() : null,
                material != null ? material.getName() : null,
                material != null ? material.getUnit() : null,
                line.getIssueQty()));
    }

    Project project = record.getProject();
    return new OutwardRegisterDto(
            record.getId() != null ? String.valueOf(record.getId()) : null,
            project != null && project.getId() != null ? String.valueOf(project.getId()) : null,
            project != null ? project.getName() : null,
            record.getCode(),
            record.getDate() != null ? DATE_FMT.format(record.getDate()) : null,
            record.getIssueTo(),
            // REMOVE: record.getStatus() != null ? record.getStatus().name() : null,
            // REMOVE: record.getCloseDate() != null ? DATE_FMT.format(record.getCloseDate()) : null,
            record.isValidated(),
            lines.size(),
            lines);
}
```

---

### OutwardRegisterDto.java

**Need to check and update constructor to remove status and closeDate parameters**

---

### Database Migration

**Create SQL migration file:**
```sql
-- Migration: Remove status and closeDate from outward_records
-- File: V{version}__remove_outward_status.sql

ALTER TABLE outward_records DROP COLUMN IF EXISTS status;
ALTER TABLE outward_records DROP COLUMN IF EXISTS close_date;
```

---

## Implementation Order

1. ✅ Create database migration
2. ✅ Update OutwardRecord.java (remove fields and methods)
3. ✅ Update OutwardRegisterDto.java (remove fields)
4. ✅ Update OutwardController.java (remove endpoint and update DTO conversion)
5. ✅ Delete OutwardStatus.java
6. ✅ Test all endpoints
7. ✅ Run migration on database

---

## Testing Checklist

- [ ] Can fetch outward list (GET /api/outwards/project/{projectId})
- [ ] Can fetch outward details (GET /api/outwards/{id})
- [ ] Can update outward (PUT /api/outwards/{id})
- [ ] Can validate outward (POST /api/outwards/{id}/validate)
- [ ] closeOutward endpoint returns 404 (removed)
- [ ] No status field in response
- [ ] No closeDate field in response
- [ ] Database migration runs successfully
- [ ] No compilation errors

---

## Impact Analysis

### Endpoints Removed:
- ❌ `POST /api/outwards/{id}/close` - No longer available

### Endpoints Modified:
- ✅ `GET /api/outwards/project/{projectId}` - Response no longer includes status/closeDate
- ✅ `GET /api/outwards/{id}` - Response no longer includes status/closeDate
- ✅ `PUT /api/outwards/{id}` - Response no longer includes status/closeDate
- ✅ `POST /api/outwards/{id}/validate` - Response no longer includes status/closeDate

### Database Changes:
- ❌ `outward_records.status` column removed
- ❌ `outward_records.close_date` column removed

---

Ready to implement!
