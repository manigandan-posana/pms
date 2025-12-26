# 📋 BOM Return Items Implementation Plan

## 🎯 **Objective:**
Add a "Returned" column to the BOM (Bill of Materials) to track return items separately from regular supply items.

## 📊 **Current Behavior:**
- All inward records (both SUPPLY and RETURN types) are counted in `orderedQty` and `receivedQty`
- Return items reduce the `utilizedQty` but are also counted as received
- This inflates the received count when items are returned

## ✅ **Desired Behavior:**
- **SUPPLY inwards:** Count in `orderedQty` and `receivedQty`
- **RETURN inwards:** Count in new `returnedQty` field (NOT in ordered/received)
- BOM should show: Allocated, Ordered, Received, **Returned**, Utilized, Balance

## 🔧 **Implementation Steps:**

### **Backend Changes:**

#### 1. **BomLineDto.java** - Add returnedQty field
```java
public record BomLineDto(
    String id,
    String projectId,
    String materialId,
    String code,
    String name,
    String partNo,
    String lineType,
    String unit,
    String category,
    double allocatedQty,
    double requiredQty,
    double orderedQty,
    double receivedQty,
    double returnedQty,  // NEW
    double utilizedQty,
    double balanceQty
) {}
```

#### 2. **InwardLineRepository.java** - Add query for return items
```java
@Query(
    "select coalesce(sum(line.receivedQty), 0) " +
    "from InwardLine line " +
    "where line.record.project.id = :projectId " +
    "and line.material.id = :materialId " +
    "and line.record.type = 'RETURN'"
)
Double sumReturnedQtyByProjectAndMaterial(
    @Param("projectId") Long projectId,
    @Param("materialId") Long materialId
);
```

#### 3. **Update existing queries** - Exclude RETURN type
```java
// Update sumOrderedQtyByProjectAndMaterial
@Query(
    "select coalesce(sum(line.orderedQty), 0) " +
    "from InwardLine line " +
    "where line.record.project.id = :projectId " +
    "and line.material.id = :materialId " +
    "and line.record.type = 'SUPPLY'"  // NEW: Only SUPPLY
)

// Update sumReceivedQtyByProjectAndMaterial
@Query(
    "select coalesce(sum(line.receivedQty), 0) " +
    "from InwardLine line " +
    "where line.record.project.id = :projectId " +
    "and line.material.id = :materialId " +
    "and line.record.type = 'SUPPLY'"  // NEW: Only SUPPLY
)
```

#### 4. **AppDataService.java** - Update DTO creation
```java
private ProjectMaterialTotals computeProjectMaterialTotals(Long projectId, Long materialId) {
    double orderedQty = safeDouble(
        inwardLineRepository.sumOrderedQtyByProjectAndMaterial(projectId, materialId));
    double receivedQty = safeDouble(
        inwardLineRepository.sumReceivedQtyByProjectAndMaterial(projectId, materialId));
    double returnedQty = safeDouble(  // NEW
        inwardLineRepository.sumReturnedQtyByProjectAndMaterial(projectId, materialId));
    double issuedQty = safeDouble(
        outwardLineRepository.sumIssuedQtyByProjectAndMaterial(projectId, materialId));
    double balanceQty = Math.max(0d, receivedQty - issuedQty);
    return new ProjectMaterialTotals(orderedQty, receivedQty, returnedQty, issuedQty, balanceQty);
}

private record ProjectMaterialTotals(
    double orderedQty, 
    double receivedQty, 
    double returnedQty,  // NEW
    double issuedQty, 
    double balanceQty
) {}
```

### **Frontend Changes:**

#### 5. **backend.ts** - Update BomLineDto interface
```typescript
export interface BomLineDto {
  id?: string | number;
  materialId?: string | number;
  code?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  allocatedQty?: number;
  orderedQty?: number;
  receivedQty?: number;
  returnedQty?: number;  // NEW
  utilizedQty?: number;
  balanceQty?: number;
}
```

#### 6. **BOM Page** - Add Returned column
- Add "Returned" column to the BOM table
- Display `returnedQty` value
- Update column headers and sorting

## 📈 **Benefits:**
1. ✅ Accurate tracking of return items
2. ✅ Separate visibility for returns vs supplies
3. ✅ Better inventory management
4. ✅ Clearer audit trail

## 🔍 **Testing:**
1. Create a SUPPLY inward → Check it appears in Ordered/Received
2. Create a RETURN inward → Check it appears in Returned (NOT Ordered/Received)
3. Verify balance calculation is correct
4. Check BOM table displays all columns correctly

---

**Ready to implement!** 🚀
