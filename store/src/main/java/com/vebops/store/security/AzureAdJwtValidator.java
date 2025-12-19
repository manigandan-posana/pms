package com.vebops.store.security;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.Date;
import java.util.List;

/**
 * Validates JWT tokens issued by Microsoft Azure AD.
 * Downloads public keys from Microsoft's JWKS endpoint and verifies token signatures.
 */
@Component
public class AzureAdJwtValidator {

    @Value("${azure.ad.tenant-id}")
    private String tenantId;

    @Value("${azure.ad.client-id}")
    private String clientId;

    private JWKSet jwkSet;
    private long jwkSetLastUpdated = 0;
    private static final long JWK_REFRESH_INTERVAL = 3600000; // 1 hour

    /**
     * Validates a JWT token from Microsoft Azure AD.
     *
     * @param token The JWT token string
     * @return AzureAdTokenClaims containing user information if valid, null otherwise
     */
    public AzureAdTokenClaims validateToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            
            // Verify signature
            if (!verifySignature(signedJWT)) {
                return null;
            }

            // Validate claims
            String issuer = signedJWT.getJWTClaimsSet().getIssuer();
            List<String> audience = signedJWT.getJWTClaimsSet().getAudience();
            Date expiration = signedJWT.getJWTClaimsSet().getExpirationTime();

            // Check issuer
            String expectedIssuer = "https://login.microsoftonline.com/" + tenantId + "/v2.0";
            if (!expectedIssuer.equals(issuer)) {
                return null;
            }

            // Check audience
            if (audience == null || !audience.contains(clientId)) {
                return null;
            }

            // Check expiration
            if (expiration == null || expiration.before(new Date())) {
                return null;
            }

            // Extract claims
            String email = signedJWT.getJWTClaimsSet().getStringClaim("preferred_username");
            if (email == null || email.isEmpty()) {
                email = signedJWT.getJWTClaimsSet().getStringClaim("email");
            }
            if (email == null || email.isEmpty()) {
                email = signedJWT.getJWTClaimsSet().getStringClaim("upn");
            }

            String name = signedJWT.getJWTClaimsSet().getStringClaim("name");
            
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) signedJWT.getJWTClaimsSet().getClaim("roles");

            return new AzureAdTokenClaims(email, name, roles, expiration.getTime());

        } catch (Exception e) {
            System.err.println("Token validation failed: " + e.getMessage());
            return null;
        }
    }

    /**
     * Verifies the JWT signature using Microsoft's public keys.
     */
    private boolean verifySignature(SignedJWT signedJWT) {
        try {
            // Refresh JWK set if needed
            if (jwkSet == null || System.currentTimeMillis() - jwkSetLastUpdated > JWK_REFRESH_INTERVAL) {
                String jwksUrl = "https://login.microsoftonline.com/" + tenantId + "/discovery/v2.0/keys";
                jwkSet = JWKSet.load(new URL(jwksUrl));
                jwkSetLastUpdated = System.currentTimeMillis();
            }

            // Get the key ID from the token header
            String keyId = signedJWT.getHeader().getKeyID();
            
            // Find the matching key
            JWK jwk = jwkSet.getKeyByKeyId(keyId);
            if (jwk == null) {
                return false;
            }

            // Verify signature
            RSAKey rsaKey = (RSAKey) jwk;
            JWSVerifier verifier = new RSASSAVerifier(rsaKey.toRSAPublicKey());
            return signedJWT.verify(verifier);

        } catch (Exception e) {
            System.err.println("Signature verification failed: " + e.getMessage());
            return false;
        }
    }

    /**
     * Record class to hold validated token claims.
     */
    public static record AzureAdTokenClaims(
        String email,
        String name,
        List<String> roles,
        long expirationTime
    ) {}
}
