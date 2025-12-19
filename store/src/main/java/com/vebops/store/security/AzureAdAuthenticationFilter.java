package com.vebops.store.security;

import com.vebops.store.model.UserAccount;
import com.vebops.store.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that intercepts requests and validates Microsoft Azure AD JWT tokens.
 * If a valid Bearer token is found, the user is looked up or auto-provisioned.
 */
@Component
public class AzureAdAuthenticationFilter extends OncePerRequestFilter {

    private final AzureAdJwtValidator jwtValidator;
    private final UserRepository userRepository;
    private final AzureAdUserService userService;

    public AzureAdAuthenticationFilter(
            AzureAdJwtValidator jwtValidator,
            UserRepository userRepository,
            AzureAdUserService userService) {
        this.jwtValidator = jwtValidator;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            AzureAdJwtValidator.AzureAdTokenClaims claims = jwtValidator.validateToken(token);
            
            if (claims != null) {
                // Token is valid, check if user exists in database
                UserAccount user = userService.getOrCreateUser(claims);
                
                if (user != null) {
                    // User exists in database - store info in request attributes
                    request.setAttribute("userId", user.getId());
                    request.setAttribute("userEmail", user.getEmail());
                    request.setAttribute("userRole", user.getRole().name());
                } else {
                    // Valid Microsoft token but user not in database
                    // Mark as unauthenticated for session endpoint to handle
                    request.setAttribute("azureTokenValid", true);
                    request.setAttribute("azureUserNotInDb", true);
                    request.setAttribute("azureEmail", claims.email());
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
