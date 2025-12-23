package com.vebops.store.dto;

import java.util.List;

/**
 * DTO for inward history list view.
 * Lighter version without all fields.
 */
public record InwardHistoryDto(
        String id,
        String projectId,
        String projectName,
        String code,
        String date,
        String deliveryDate,
        String invoiceNo,
        String supplierName,
        String type,
        boolean validated,
        int items,
        List<InwardLineDto> lines) {
}
