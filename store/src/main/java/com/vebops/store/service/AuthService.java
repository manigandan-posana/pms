package com.vebops.store.service;

import com.vebops.store.dto.LoginRequest;
import com.vebops.store.dto.LoginResponse;
import com.vebops.store.dto.UserDto;
import com.vebops.store.exception.BadRequestException;
import com.vebops.store.exception.UnauthorizedException;
import com.vebops.store.model.Role;
import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.UserRepository;
import com.vebops.store.security.AzureAdJwtValidator;
import com.vebops.store.security.AzureAdUserService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AzureAdJwtValidator azureAdJwtValidator;
    private final AzureAdUserService azureAdUserService;

    public AuthService(
            UserRepository userRepository, 
            PasswordEncoder passwordEncoder, 
            TokenService tokenService,
            AzureAdJwtValidator azureAdJwtValidator,
            AzureAdUserService azureAdUserService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.azureAdJwtValidator = azureAdJwtValidator;
        this.azureAdUserService = azureAdUserService;
    }

    // Legacy email/password login is no longer used now that Microsoft
    // authentication is the sole mechanism. This method is retained only
    // to avoid breaking callers but will always reject credentials.
    public LoginResponse login(LoginRequest request) {
        throw new BadRequestException("Username/password login is disabled. Please sign in with Microsoft.");
    }

    public void logout(String token) {
        if (token != null) {
            tokenService.revoke(token);
        }
    }

    public UserAccount requireUser(String token) {
        if (token == null || token.isBlank()) {
            // Try to get user from request attributes (set by Azure AD filter)
            return getUserFromRequest();
        }
        
        // First try Azure AD token validation
        AzureAdJwtValidator.AzureAdTokenClaims claims = azureAdJwtValidator.validateToken(token);
        if (claims != null) {
            UserAccount user = azureAdUserService.getOrCreateUser(claims);
            if (user != null) {
                storeRequestUser(user);
                return user;
            }

            // Valid Microsoft token but user is not registered in the database
            String email = claims.email() != null ? claims.email() : "your account";
            throw new UnauthorizedException(
                "Account not registered. Please contact an administrator to enable access for " + email
            );
        }
        
        // Fallback to internal JWT token
        Long userId = tokenService.resolveUserId(token);
        if (userId == null) {
            throw new UnauthorizedException("Invalid token");
        }
        UserAccount resolvedUser = userRepository
            .findById(userId)
            .orElseThrow(() -> new UnauthorizedException("User not found for token"));
        storeRequestUser(resolvedUser);
        return resolvedUser;
    }

    /**
     * Gets the authenticated user from the current request context.
     * Used when the Azure AD filter has already validated the token.
     */
    private UserAccount getUserFromRequest() {
        try {
            ServletRequestAttributes attributes = 
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                
                // Check if Azure token was valid but user not in database
                Boolean azureUserNotInDb = (Boolean) request.getAttribute("azureUserNotInDb");
                if (Boolean.TRUE.equals(azureUserNotInDb)) {
                    String email = (String) request.getAttribute("azureEmail");
                    throw new UnauthorizedException(
                        "Account not registered. Please contact administrator to register: " + 
                        (email != null ? email : "your email")
                    );
                }
                
                Long userId = (Long) request.getAttribute("userId");
                if (userId != null) {
                    return userRepository.findById(userId)
                        .orElseThrow(() -> new UnauthorizedException("User not found"));
                }
            }
        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            // Fall through to throw generic exception
        }
        throw new UnauthorizedException("Missing authentication token");
    }

    public UserAccount requireRole(String token, Role... roles) {
        UserAccount user = requireUser(token);
        if (roles == null || roles.length == 0) {
            return user;
        }
        Role userRole = user.getRole();
        for (Role role : roles) {
            if (role == userRole) {
                return user;
            }
        }
        throw new UnauthorizedException("You do not have permission to perform this action");
    }

    /**
     * Gets a user by their ID.
     * Used by controllers that use AuthUtils to get the full user object.
     */
    public UserAccount getUserById(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("User ID is required");
        }
        return userRepository
            .findById(userId)
            .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    public UserDto toUserDto(UserAccount user) {
        return new UserDto(
            String.valueOf(user.getId()),
            user.getName(),
            user.getEmail(),
            user.getRole().name(),
            user.getAccessType().name(),
            user
                .getProjects()
                .stream()
                .map(p ->
                    new com.vebops.store.dto.ProjectDto(
                        String.valueOf(p.getId()),
                        p.getCode(),
                        p.getName(),
                        p.getProjectManager()
                    )
                )
                .collect(Collectors.toList()),
            user.getPermissions().stream().map(Enum::name).toList()
        );
    }

    private void storeRequestUser(UserAccount user) {
        try {
            ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                request.setAttribute("userId", user.getId());
                request.setAttribute("userEmail", user.getEmail());
                request.setAttribute("userRole", user.getRole().name());
                request.setAttribute("userPermissions", Collections.unmodifiableSet(user.getPermissions()));
            }
        } catch (Exception ignored) {
            // Best-effort cache; authorization flows will still fall back to database lookups
        }
    }
}
