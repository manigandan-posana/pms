import { useMsal } from "@azure/msal-react";
import {
  type AuthenticationResult,
  InteractionRequiredAuthError,
} from "@azure/msal-browser";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { jwtDecode } from "../../utils/jwtDecode";
import { setUser } from "../../store/slices/authSlice";
import { workspacePath } from "../../routes/route";

/*
 * Login page with Microsoft authentication.
 * After Microsoft login, validates user exists in database with proper role.
 * Only allows login if user is in database with a valid role.
 * Uses redirect flow to avoid popup/CORS issues.
 */
export default function Login() {
  const { instance, inProgress } = useMsal();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const scopes = useMemo(
    () => [
      "openid",
      "profile",
      "email",
      "offline_access",
      `${import.meta.env.VITE_CLIENT_ID}/.default`,
    ],
    []
  );

  const resetUserState = useCallback(async () => {
    try {
      // Clear all MSAL accounts so a previous sign-in cannot silently resume
      const accounts = instance.getAllAccounts();
      for (const account of accounts) {
        try {
          await instance.removeAccount(account);
        } catch (logoutError) {
          console.error("Failed to remove cached account:", logoutError);
        }
      }
      instance.setActiveAccount(null);
    } catch (logoutError) {
      console.error("MSAL cleanup failed:", logoutError);
    }

    // Clear all storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Reset Redux state
    dispatch(
      setUser({
        name: null,
        email: null,
        idToken: null,
        accessToken: null,
        roles: [],
        role: null,
      })
    );
    
    // Clear login error
    setLoginError(null);
  }, [dispatch, instance]);

  const completeLogin = useCallback(
    async (authResult: AuthenticationResult) => {
      try {
        console.log("Starting completeLogin process");
        const { account, idToken, accessToken: graphToken, expiresOn } = authResult;

        if (!account) {
          throw new Error("No Microsoft account returned from login response");
        }

        console.log("Microsoft account:", account.username);

        const bearerToken = idToken ?? graphToken;
        if (!bearerToken) {
          throw new Error("No token returned from Microsoft login");
        }

        // Prefer the expiry timestamp supplied by MSAL; fall back to the JWT claim.
        const expiryTime = expiresOn
          ? expiresOn.getTime()
          : (() => {
              const decoded: { exp?: number } = jwtDecode(bearerToken);
              return (decoded.exp ?? 0) * 1000;
            })();

        sessionStorage.setItem("msal.accessToken", bearerToken);
        if (expiryTime) {
          sessionStorage.setItem("msal.tokenExpiry", expiryTime.toString());
        }

        console.log("Validating user session with backend");
        // DO NOT store token in Redux yet - validate first
        // This prevents App.tsx from showing "Loading workspace..." for unregistered users

        console.log("Validating user in database...");
        // Validate user exists in database and get actual role
        let userSession;
        try {
          // Call session API with explicit Authorization header (bypass Redux)
          const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/auth/session`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.status === 401) {
            console.log("User not registered in database");
            const errorMsg = `Your Microsoft account (${account.username}) is not registered in the system. Please contact an administrator to enable access.`;
            setLoginError(errorMsg);
            await resetUserState();
            throw new Error(errorMsg);
          }
          
          if (!response.ok) {
            throw new Error(`Session validation failed: ${response.statusText}`);
          }
          
          userSession = await response.json();
          console.log("User session retrieved:", userSession);
        } catch (sessionError: any) {
          // If it's our custom error (401), just re-throw
          if (sessionError.message?.includes('not registered')) {
            throw sessionError;
          }
          // For network/other errors, provide generic message
          const errorMsg = `Failed to validate user session: ${sessionError.message || 'Unknown error'}`;
          setLoginError(errorMsg);
          await resetUserState();
          throw new Error(errorMsg);
        }

        if (!userSession.role) {
          await resetUserState();
          throw new Error("User has no registered role in the system");
        }

        console.log("User role:", userSession.role);

        // Determine landing page based on database role
        const target = `${workspacePath}/dashboard`;
        if (userSession.role !== "USER" && userSession.role !== "USER_PLUS" && userSession.role !== "ADMIN") {
          throw new Error("User does not have a supported role");
        }

        // Update Redux first so routing guards immediately see the
        // correct role (especially for ADMIN users). This prevents the
        // app from redirecting to the user dashboard before the role is
        // known.
        dispatch(
          setUser({
            name: userSession.name,
            email: userSession.email,
            idToken,
            accessToken: bearerToken,
            roles: [userSession.role],
            role: userSession.role,
            permissions: userSession.permissions || [],
          })
        );

        console.log("Navigating to:", target);
        navigate(target, { replace: true, state: null });
      } catch (error) {
        console.error("Error in completeLogin:", error);
        throw error; // Re-throw to be handled by caller
      }
    },
    [dispatch, navigate]
  );

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setLoginError(null); // Clear any previous errors
    try {
      // Use loginRedirect instead of loginPopup to avoid COOP policy issues
      await instance.loginRedirect({ scopes });
      // The redirect will handle the login, so we don't call completeLogin here
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error instanceof Error
        ? error.message
        : "Failed to login with Microsoft. Please try again.";
      setLoginError(errorMsg);
      toast.error(errorMsg);
      await resetUserState();
      setIsLoading(false);
    }
  };

  // Handle redirect response after Microsoft login
  // This effect runs only once on mount to handle the redirect callback
  useEffect(() => {
    let mounted = true;

    const handleRedirect = async () => {
      // Skip if already processing
      if (isProcessingRedirect) return;
      
      setIsProcessingRedirect(true);
      setIsLoading(true);

      try {
        // Handle redirect response
        const redirectResponse = await instance.handleRedirectPromise();
        
        if (redirectResponse) {
          // User just logged in via redirect
          console.log("Processing redirect response from Microsoft login");
          if (mounted) {
            await completeLogin(redirectResponse);
          }
          return;
        }

        // No redirect response, check for existing session
        const activeAccount =
          instance.getActiveAccount() || instance.getAllAccounts()[0];
        if (!activeAccount) {
          console.log("No active account found");
          if (mounted) {
            setIsLoading(false);
            setIsProcessingRedirect(false);
          }
          return;
        }

        console.log("Active account found, attempting silent token acquisition");
        // Try silent token acquisition
        const silentResult = await instance.acquireTokenSilent({
          scopes,
          account: activeAccount,
        });
        if (mounted) {
          await completeLogin(silentResult);
        }
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          // Ignore; the user will initiate interactive login
          console.log("Interaction required - user needs to login manually");
          if (mounted) {
            setIsLoading(false);
            setIsProcessingRedirect(false);
          }
          return;
        }
        console.error("Authentication error:", error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : "Session expired. Please sign in again.";
          // Set error state so it's displayed instead of loading screen
          setLoginError(errorMessage);
          toast.error(errorMessage);
          await resetUserState();
          setIsLoading(false);
          setIsProcessingRedirect(false);
        }
      }
    };

    void handleRedirect();

    return () => {
      mounted = false;
    };
    // Only run once on mount - don't include isProcessingRedirect in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeLogin, instance, resetUserState, scopes]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <img
          src="/posana-logo.svg"
          alt="posana logo"
          className="mx-auto mb-6 h-12 w-auto"
        />
        <h2 className="text-center text-xs font-medium mb-8">
          Sign in to your account
        </h2>
        
        {loginError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-red-900 mb-1">Authentication Error</h3>
                <p className="text-xs text-red-700">{loginError}</p>
              </div>
            </div>
          </div>
        )}
        
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={isLoading || inProgress !== "none"}
          className="w-full rounded-lg bg-green-600 py-3 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading || inProgress !== "none" ? "Authenticating..." : "Login with Microsoft"}
        </button>
      </div>
    </div>
  );
}