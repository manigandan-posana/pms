import { loginPath } from "../routes/route";

/*
 * MSAL configuration for Microsoft Entra ID authentication.  This file
 * mirrors the settings used in the Glia application and reads the
 * client ID and tenant ID from your Vite environment variables.  The
 * redirect URI points back to the origin of the current site so that
 * interactive login flows return to the application after a
 * successful sign‑in.  The postLogoutRedirectUri is set to the
 * application's root path (login screen) to ensure a smooth logout
 * experience.
 */

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin,
    // After logout, redirect back to the login page
    postLogoutRedirectUri: `${window.location.origin}${loginPath}`,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // Store tokens in session storage to avoid persisting across browser sessions
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};