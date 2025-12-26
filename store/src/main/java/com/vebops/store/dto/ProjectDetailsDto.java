package com.vebops.store.dto;

import java.util.List;

public record ProjectDetailsDto(
        String id,
        String code,
        String name,
        String projectManager,
        List<ProjectTeamMemberDto> teamMembers
) {}
