package com.vebops.store.service;

import com.vebops.store.model.AccessType;
import com.vebops.store.model.Role;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    @Value("${app.bootstrap.admin-email:admin@example.com}")
    private String adminEmail;

    private final PasswordEncoder passwordEncoder;

    @Value("${azure.ad.admin-email}")
    private String azureAdminEmail;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Ensure Azure AD admin user exists for Microsoft authentication
        ensureAzureAdAdminExists();
    }

    private void ensureAzureAdAdminExists() {
        if (azureAdminEmail == null || azureAdminEmail.isEmpty()) {
            return;
        }

        userRepository.findByEmailIgnoreCase(azureAdminEmail)
            .ifPresentOrElse(
                user -> {
                    // Update existing user to ADMIN role if not already
                    if (user.getRole() != Role.ADMIN) {
                        user.setRole(Role.ADMIN);
                        user.setAccessType(AccessType.ALL);
                        userRepository.save(user);
                    }
                },
                () -> {
                    // Create Azure AD admin user
                    UserAccount azureAdmin = new UserAccount();
                    azureAdmin.setName("Gopinath S");
                    azureAdmin.setEmail(azureAdminEmail);
                    // Placeholder password (not used for Azure AD auth)
                    azureAdmin.setPasswordHash("$2a$10$AZURE_AD_ADMIN_NO_PASSWORD_NEEDED");
                    azureAdmin.setRole(Role.ADMIN);
                    azureAdmin.setAccessType(AccessType.ALL);
                    userRepository.save(azureAdmin);
                }
            );
    }
}
