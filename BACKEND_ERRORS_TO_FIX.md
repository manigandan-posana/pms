# Backend Error Fixes - Complete List

## Files to Fix:

### 1. InventoryService.java
Remove all OutwardStatus references and related logic

### 2. OutwardRecordRepository.java  
Remove OutwardStatus import and methods using it

### 3. HistoryController.java
Remove getStatus() and getCloseDate() calls

### 4. AdminService.java
Remove getStatus() calls

### 5. AppDataService.java
Remove getStatus() and getCloseDate() calls

---

## Quick Fix Summary:

All these files need to remove status-related code since we removed the status field from OutwardRecord.

The errors are because these files still try to:
- Import OutwardStatus (which we deleted)
- Call getStatus() (which we removed)
- Call setStatus() (which we removed)
- Call getCloseDate() (which we removed)
- Call setCloseDate() (which we removed)

Let me fix each file...
