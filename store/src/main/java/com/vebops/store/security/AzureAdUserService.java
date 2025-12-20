package com.vebops.store.security;

import com.vebops.store.model.AccessType;
import com.vebops.store.model.Role;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Azure AD user provisioning and role assignment.
 */
@Service
public class AzureAdUserService {

    private final UserRepository userRepository;
    
    @Value("${azure.ad.admin-email}")
    private String adminEmail;

    public AzureAdUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Gets an existing user based on Azure AD token claims.
     * Only allows login for users that exist in the database.
     * Admin email can auto-create if it doesn't exist.
     */
    @Transactional
    public UserAccount getOrCreateUser(AzureAdJwtValidator.AzureAdTokenClaims claims) {
        String email = claims.email();
        if (email == null || email.isEmpty()) {
            return null;
        }

        // Check if user exists
        return userRepository.findByEmailIgnoreCase(email)
                .map(existingUser -> {
                    // Update role if admin email
                    if (adminEmail.equalsIgnoreCase(email) && existingUser.getRole() != Role.ADMIN) {
                        existingUser.setRole(Role.ADMIN);
                        existingUser.setAccessType(AccessType.ALL);
                        return userRepository.save(existingUser);
                    }
                    return existingUser;
                })
                .orElseGet(() -> {
                    // Only auto-create if it's the admin email
                    if (adminEmail.equalsIgnoreCase(email)) {
                        return createAdminUser(claims);
                    }
                    // Return null for non-admin users not in database
                    return null;
                });
    }

    /**
     * Creates admin user only (for auto-provisioning admin email)
     */
    private UserAccount createAdminUser(AzureAdJwtValidator.AzureAdTokenClaims claims) {
        UserAccount user = new UserAccount();
        user.setEmail(claims.email());
        user.setName(claims.name() != null ? claims.name() : "Administrator");
        user.setPasswordHash("$2a$10$AZURE_AD_ADMIN_NO_PASSWORD_NEEDED");
        user.setRole(Role.ADMIN);
        user.setAccessType(AccessType.ALL);
        return userRepository.save(user);
    }

    /**
     * Creates a new user with determined role (used by admin to create users)
     */
    private UserAccount createNewUser(AzureAdJwtValidator.AzureAdTokenClaims claims) {
        UserAccount user = new UserAccount();
        user.setEmail(claims.email());
        user.setName(claims.name() != null ? claims.name() : claims.email());
        user.setPasswordHash("$2a$10$AZURE_AD_USER_NO_PASSWORD_NEEDED");
        Role role = determineRole(claims);
        user.setRole(role);
        user.setAccessType(role == Role.ADMIN ? AccessType.ALL : AccessType.PROJECTS);
        return userRepository.save(user);
    }

    /**
     * Determines the user's role based on their email or Azure AD role claims.
     */
    private Role determineRole(AzureAdJwtValidator.AzureAdTokenClaims claims) {
        // Check if user is the admin
        if (adminEmail.equalsIgnoreCase(claims.email())) {
            return Role.ADMIN;
        }

        // Check Azure AD roles from token
        if (claims.roles() != null) {
            for (String role : claims.roles()) {
                switch (role.toUpperCase()) {
                    case "ADMIN":
                    case "ADMINISTRATOR":
                        return Role.ADMIN;
                    case "USER":
                        return Role.USER;
                }
            }
        }

        // Default to USER role
        return Role.USER;
    }

    /**
     * Updates an existing user's role if it has changed in Azure AD.
     */
    @Transactional
    public void updateUserRole(UserAccount user, AzureAdJwtValidator.AzureAdTokenClaims claims) {
        Role newRole = determineRole(claims);
        if (user.getRole() != newRole) {
            user.setRole(newRole);
            userRepository.save(user);
        }
    }
}
