package com.vebops.store.dto;

import java.util.List;

public record OutwardRegisterDto(
    String id,
    String projectId,
    String projectName,
    String code,
    String date,
    String issueTo,
    String status,
    String closeDate,
    boolean validated,
    int items,
    List<OutwardLineDto> lines
) {}
