package com.vebops.store.controller;

import com.vebops.store.dto.UserDto;
import com.vebops.store.model.UserAccount;
import com.vebops.store.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String token = extractBearerToken(request);

        // Ensure the caller is authenticated; will throw if token is missing/invalid
        authService.requireUser(token);
        authService.logout(token);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session")
    public UserDto session(HttpServletRequest request) {
        String token = extractBearerToken(request);
        UserAccount user = authService.requireUser(token);
        return authService.toUserDto(user);
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }
}
