/**
 * Centralized logout service that handles all logout logic:
 * - Clears backend sessions
 * - Clears MSAL accounts and sessions
 * - Clears Redux state
 * - Clears storage
 * - Redirects to login
 * 
 * Use this service for any logout operations to ensure consistency.
 */

import { loginPath } from "../routes/route";
import { logout as logoutAction } from "../store/slices/authSlice";

export interface LogoutOptions {
  redirectTo?: string;
  useRedirect?: boolean;
}

/**
 * Performs complete logout across all systems
 * 
 * @param config Configuration including MSAL instance, Redux store, and navigation
 * @param options Logout options
 * 
 * @example
 * const logoutService = new LogoutService(msalInstance, store, navigate);
 * await logoutService.logout();
 */
export class LogoutService {
  private msalInstance: any;
  private store: any;
  private navigate: any;

  constructor(msalInstance: any, store: any, navigate: any) {
    this.msalInstance = msalInstance;
    this.store = store;
    this.navigate = navigate;
  }

  /**
   * Performs a complete logout
   */
  async logout(options: LogoutOptions = {}): Promise<void> {
    const { redirectTo = loginPath, useRedirect = true } = options;
    const resolvedRedirect = this.resolveRedirectUri(redirectTo);

    try {
      console.log("Starting logout process...");

      // Step 1: Clear all storage FIRST to prevent any cached data access
      this.clearStorage();

      // Step 2: Clear Redux state to immediately update UI
      this.clearReduxState();

      // Step 3: Call backend logout endpoint (best effort)
      await this.callBackendLogout().catch(err => {
        console.warn("Backend logout failed (continuing):", err);
      });

      // Step 4: Clear MSAL state - don't use redirect
      await this.clearMsalState(resolvedRedirect, false);

      // Step 5: Clear storage AGAIN to ensure nothing was re-written
      this.clearStorage();

      console.log("Logout completed, redirecting to:", resolvedRedirect);
      
      // Step 6: Force immediate redirect with hard navigation
      // This ensures all JavaScript state is cleared
      window.location.replace(resolvedRedirect);

    } catch (error) {
      console.error("Error during logout:", error);
      // Still clear storage and redirect even if something fails
      this.clearStorage();
      window.location.replace(resolvedRedirect);
    }
  }

  /**
   * Call backend logout endpoint to clear server-side sessions
   */
  private async callBackendLogout(): Promise<void> {
    try {
      const state = this.store.getState();
      const token = state?.auth?.accessToken || state?.auth?.idToken;

      if (!token) {
        console.warn("No token available for backend logout");
        return;
      }

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(`Backend logout returned status ${response.status}`);
      }
    } catch (error) {
      console.error("Backend logout failed (continuing with client-side logout):", error);
      // Don't throw - continue with client-side logout
    }
  }

  /**
   * Clear Redux authentication state
   */
  private clearReduxState(): void {
    try {
      this.store.dispatch(logoutAction());
      console.log("Redux state cleared");
    } catch (error) {
      console.error("Failed to clear Redux state:", error);
    }
  }

  /**
   * Clear all MSAL accounts and sessions
   */
  private async clearMsalState(postLogoutRedirectUri: string, useRedirect: boolean): Promise<boolean> {
    let handledRedirect = false;
    try {
      // Capture the active account before clearing so the logout redirect can
      // invalidate the server-side session for that account as well.
      const activeAccount =
        typeof this.msalInstance?.getActiveAccount === "function"
          ? this.msalInstance.getActiveAccount()
          : undefined;

      // Remove all accounts from MSAL cache
      let allAccounts: any[] = [];
      try {
        allAccounts = this.msalInstance.getAllAccounts();
        console.log(`Removing ${allAccounts.length} MSAL accounts`);

        for (const account of allAccounts) {
          try {
            await this.msalInstance.removeAccount(account);
          } catch (error) {
            console.error("Failed to remove account:", error);
          }
        }
      } catch (error) {
        console.error("Failed to get accounts:", error);
      }

      // Clear active account
      try {
        this.msalInstance.setActiveAccount(null);
      } catch (error) {
        console.error("Failed to clear active account:", error);
      }

      // Sign the user out of the Microsoft session so future visits don't silently reauthenticate
      if (useRedirect && typeof this.msalInstance?.logoutRedirect === "function") {
        // This will redirect to Microsoft logout and then back to postLogoutRedirectUri
        await this.msalInstance.logoutRedirect({
          postLogoutRedirectUri,
          account: activeAccount ?? allAccounts[0],
        });
        handledRedirect = true;
      }
      console.log("MSAL state cleared");
    } catch (error) {
      console.error("Failed to clear MSAL state:", error);
    }

    return handledRedirect;
  }

  /**
   * Clear all browser storage - enhanced version
   */
  private clearStorage(): void {
    try {
      // Clear all sessionStorage items
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove session key ${key}:`, e);
        }
      });
      sessionStorage.clear();

      // Clear all localStorage items
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove local key ${key}:`, e);
        }
      });
      localStorage.clear();

      // Clear any Redux persist data specifically
      try {
        localStorage.removeItem('persist:root');
        localStorage.removeItem('persist:auth');
      } catch (e) {
        console.warn('Failed to remove persist keys:', e);
      }

      console.log("Storage cleared completely");
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }

  /**
   * Redirect user after logout
   */
  /**
   * Normalize redirect URIs so callers can pass relative or absolute values
   */
  private resolveRedirectUri(target: string): string {
    if (!target) {
      return `${window.location.origin}${loginPath}`;
    }

    const trimmed = target.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    // Ensure a leading slash for relative paths
    const relative = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${window.location.origin}${relative}`;
  }
}

/**
 * Helper function to create a logout function
 * Useful for use in event handlers and callbacks
 */
export function createLogoutHandler(
  msalInstance: any,
  store: any,
  navigate: any,
  options?: LogoutOptions
): () => Promise<void> {
  const logoutService = new LogoutService(msalInstance, store, navigate);
  return async () => {
    await logoutService.logout(options);
  };
}
