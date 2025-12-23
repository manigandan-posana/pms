package com.vebops.store.dto;

import java.util.List;
import java.util.Map;

public record PaginatedResponse<T>(
    List<T> content,
    long totalElements,
    int totalPages,
    int size,
    int number,
    boolean hasNext,
    boolean hasPrevious,
    Map<String, List<String>> filters
) {}
