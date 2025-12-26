package com.vebops.store.dto;

import com.vebops.store.model.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record ProjectTeamAssignmentRequest(@NotNull Long userId, @NotNull ProjectRole role) {}
