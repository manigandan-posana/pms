package com.vebops.store.dto;

import java.util.List;

public record MaterialMovementDto(
    List<InwardHistoryDto> inwards,
    List<OutwardRegisterDto> outwards
) {}
