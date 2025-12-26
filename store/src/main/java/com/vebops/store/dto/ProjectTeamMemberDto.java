package com.vebops.store.dto;

public record ProjectTeamMemberDto(
        String id,
        String userId,
        String userName,
        String userEmail,
        String role
) {}
