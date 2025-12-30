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
import { BiSupport } from "react-icons/bi";


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
  const [supportEmail, setSupportEmail] = useState<string>("");

  useEffect(() => {
    // Fetch public config
    fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/auth/public-config`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load config");
      })
      .then((data) => {
        if (data.supportEmail) setSupportEmail(data.supportEmail);
      })
      .catch((err) => console.error("Config load error:", err));
  }, []);

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
      if (accounts.length > 0) {
        // Just clear active account, removeAccount is not available on interface
        instance.setActiveAccount(null);
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

        const canAccessAdmin =
          userSession.role === "ADMIN" || (userSession.permissions || []).includes("ADMIN_ACCESS");

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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=2070&auto=format&fit=crop')",
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Main Card - Compact Design */}
      <div className="relative z-10 w-full max-w-[900px] h-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side - Login Form */}
        <div className="w-full md:w-[45%] p-8 flex flex-col justify-between bg-white relative">

          {/* Header */}
          <div className="flex items-center gap-2">
            <img
              src="/posana-logo.svg"
              alt="Posana"
              className="h-6 w-auto"
            />
          </div>

          {/* Center Content */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                Welcome back
              </h1>
              <p className="text-gray-500 text-xs leading-relaxed">
                Sign in to your corporate sustainability dashboard.
              </p>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-xs font-semibold text-red-900">Authentication Failed</h3>
                  <p className="text-[10px] text-red-700 mt-0.5">{loginError}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={isLoading || inProgress !== "none"}
              className="group relative w-full flex items-center justify-between bg-[#107c10] hover:bg-[#0b5c0b] text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-1.5 rounded group-hover:bg-white/20 transition-colors">
                  <img src="/microsoft.svg" alt="Microsoft" className="w-4 h-4 block" />
                </div>
                <span className="font-semibold text-sm">
                  {isLoading || inProgress !== "none" ? "Signing in..." : "Login with Microsoft"}
                </span>
              </div>
              <svg className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            {/* Support Box */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="bg-blue-100 p-2 rounded text-blue-600">
                <BiSupport />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-xs">Having trouble?</p>
                {supportEmail ? (
                  <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-700 text-xs font-semibold hover:underline">
                    Contact IT Support
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">Contact IT Support</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-auto pt-6 border-t border-gray-100">
            <p>© 2024 Posana</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            </div>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden md:block w-[55%] relative">
          <img
            src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=2070&auto=format&fit=crop"
            alt="Sustainability"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 text-white shadow-lg">
              <h2 className="text-white/80 text-xl font-bold mb-2 leading-tight">
                Energy for a sustainable tomorrow.
              </h2>
              <p className="text-white/80 text-xs leading-relaxed font-light">
                Securely manage your renewable assets with real-time analytics.
                Join us in powering global change through innovation.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}