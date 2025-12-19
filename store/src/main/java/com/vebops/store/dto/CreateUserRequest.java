package com.vebops.store.dto;

import java.util.List;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request to create a new user.
 * Email is required for Microsoft authentication.
 * Password is optional and only used for legacy authentication if needed.
 */
public record CreateUserRequest(
    @NotBlank(message = "Name is required") @Size(max = 120, message = "Name is too long") String name,
    @Email(message = "A valid email is required") @NotBlank(message = "Email is required") String email,
    @Size(min = 6, max = 64, message = "Password must be between 6 and 64 characters") String password,
    @NotBlank(message = "Role is required") String role,
    @NotBlank(message = "Access type is required") String accessType,
    List<String> projectIds
) {}
