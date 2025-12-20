package com.vebops.store.dto;

import java.util.List;

/**
 * Aggregated activity snapshot for a single project spanning inwards,
 * outwards, and transfers.
 */
public record ProjectActivityDto(
    Long projectId,
    String projectCode,
    String projectName,
    int inwardCount,
    int outwardCount,
    int transferCount,
    List<ProjectActivityEntryDto> recentInwards,
    List<ProjectActivityEntryDto> recentOutwards,
    List<ProjectActivityEntryDto> recentTransfers
) { }
