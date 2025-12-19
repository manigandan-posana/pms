package com.vebops.store.dto;

/**
 * Lightweight representation of a movement/transaction row used in admin
 * project activity summaries. This DTO is intentionally concise to keep
 * responses small while still providing key identifiers for display.
 */
public record ProjectActivityEntryDto(
    String id,
    String code,
    String date,
    String subject,
    String status,
    Integer lineCount,
    String direction
) { }
