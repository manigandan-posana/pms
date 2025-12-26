package com.vebops.store.util;

import com.vebops.store.exception.ForbiddenException;
import com.vebops.store.exception.UnauthorizedException;
import com.vebops.store.model.Permission;
import com.vebops.store.model.Role;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Set;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility class for authentication and authorization.
 * Works with request attributes set by AzureAdAuthenticationFilter.
 */
public class AuthUtils {

    /**
     * Gets the authenticated user from request attributes.
     * Throws UnauthorizedException if no authenticated user.
     */
    public static Long requireUserId() {
        HttpServletRequest request = getCurrentRequest();
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Authentication required");
        }
        return userId;
    }

    /**
     * Gets the authenticated user's email from request attributes.
     */
    public static String getUserEmail() {
        HttpServletRequest request = getCurrentRequest();
        return (String) request.getAttribute("userEmail");
    }

    /**
     * Gets the authenticated user's role from request attributes.
     */
    public static String getUserRole() {
        HttpServletRequest request = getCurrentRequest();
        return (String) request.getAttribute("userRole");
    }

    /**
     * Requires the authenticated user to have ADMIN role.
     * Throws ForbiddenException if not admin.
     */
    public static void requireAdmin() {
        String role = getUserRole();
        if (role == null || !role.equals(Role.ADMIN.name())) {
            throw new ForbiddenException("Admin access required");
        }
    }

    /**
     * Requires either ADMIN role or at least one of the provided permissions.
     */
    public static void requireAdminOrPermission(Permission... required) {
        String role = getUserRole();
        if (Role.ADMIN.name().equals(role)) {
            return;
        }
        if (required == null || required.length == 0) {
            throw new ForbiddenException("Insufficient permissions");
        }
        HttpServletRequest request = getCurrentRequest();
        @SuppressWarnings("unchecked")
        Set<Permission> permissions = (Set<Permission>) request.getAttribute("userPermissions");
        if (permissions == null) {
            throw new UnauthorizedException("Authentication required");
        }
        for (Permission permission : required) {
            if (permissions.contains(permission)) {
                return;
            }
        }
        throw new ForbiddenException("Insufficient permissions");
    }

    /**
     * Requires the authenticated user to have one of the specified roles.
     */
    public static void requireAnyRole(Role... allowedRoles) {
        String roleStr = getUserRole();
        if (roleStr == null) {
            throw new UnauthorizedException("Authentication required");
        }
        
        Role userRole;
        try {
            userRole = Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            throw new UnauthorizedException("Invalid role");
        }
        
        for (Role allowed : allowedRoles) {
            if (userRole == allowed) {
                return;
            }
        }
        
        throw new ForbiddenException("Insufficient permissions");
    }

    private static HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            throw new UnauthorizedException("No request context");
        }
        return attributes.getRequest();
    }
}
