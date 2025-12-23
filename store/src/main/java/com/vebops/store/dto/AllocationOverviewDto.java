package com.vebops.store.dto;

public record AllocationOverviewDto(
    String id,
    String projectId,
    String projectName,
    String projectCode,
    String materialId,
    String materialName,
    String materialCategory,
    double requiredQuantity,
    double allocatedQuantity,
    String unit
) {}
