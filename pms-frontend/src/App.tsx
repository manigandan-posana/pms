/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useEffect, useState } from "react";
import { useSelector, useStore } from "react-redux";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import WorkspaceLayout from "./pages/workspace/WorkspaceLayout";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  adminBasePath,
  adminDashboardPath,
  adminMaterialsPath,
  ceoDashboardPath,
  ceoDashboardRoute,
  projectHeadDashboardPath,
  projectHeadDashboardRoute,
  projectManagerDashboardPath,
  projectManagerDashboardRoute,
  loginPath,
  procurementManagerDashboardPath,
  procurementManagerDashboardRoute,
  workspacePath,
  workspaceRoutes,
  adminRoutes,
} from "./routes/route";
import RouteComponent from "./RouteComponent";
import { useMsal } from "@azure/msal-react";
import { useAutoLogout } from "./hooks/useAutoLogout";
import { createLogoutHandler } from "./services/LogoutService";

// ---------- Guards ----------

function RequireAuth({ isAuthenticated }: { isAuthenticated: boolean }) {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function RequireAdmin({ canAccessAdmin }: { canAccessAdmin: boolean }) {
  const location = useLocation();
  if (!canAccessAdmin) {
    return <Navigate to={workspacePath} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

function RequireNonAdmin({ canAccessAdmin }: { canAccessAdmin: boolean }) {
  const location = useLocation();
  if (canAccessAdmin) {
    return <Navigate to={adminMaterialsPath} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

// ---------- Main App ----------

export default function App() {
  const { instance } = useMsal();
  const store = useStore();
  const navigate = useNavigate();
  const { accessToken, idToken, role, name, email } = useSelector(
    (state: any) => state.auth
  );
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Automatically log the user out when their token expires
  useAutoLogout();

  const isAuthenticated = Boolean(accessToken);
  const location = useLocation();

  // Immediately redirect to login if user is not authenticated and trying to access protected routes
  // Also check on every render to ensure storage is clear after logout
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== loginPath) {
      // Clear any remaining state and redirect to login
      sessionStorage.clear();
      localStorage.clear();
      // Force clear Redux persist
      localStorage.removeItem('persist:root');
      localStorage.removeItem('persist:auth');
      navigate(loginPath, { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // Additional safety check on mount to prevent stale dashboard access after logout
  useEffect(() => {
    const checkStorageConsistency = () => {
      const hasToken = Boolean(accessToken || idToken);
      const hasStorageToken = sessionStorage.getItem('msal.accessToken') || 
                             localStorage.getItem('persist:root');
      
      // If we have no tokens but storage exists, clear it
      if (!hasToken && hasStorageToken) {
        console.warn('Detected inconsistent storage state, clearing...');
        sessionStorage.clear();
        localStorage.clear();
        localStorage.removeItem('persist:root');
        localStorage.removeItem('persist:auth');
        if (location.pathname !== loginPath) {
          window.location.replace(loginPath);
        }
      }
    };

    checkStorageConsistency();
  }, [accessToken, idToken, location.pathname]);

  // Set a timeout for the loading state to prevent indefinite loading
  useEffect(() => {
    if (isAuthenticated && !role) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
        // If still loading after 10 seconds, clear state and redirect to login
        sessionStorage.clear();
        localStorage.clear();
        navigate(loginPath, { replace: true });
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isAuthenticated, role, navigate]);
  const canAccessAdmin = role === "ADMIN";
  const isProcurementManager = role === "PROCUREMENT_MANAGER";
  const isCEOOrCOO = role === "CEO" || role === "COO";
  const isProjectHead = role === "PROJECT_HEAD";
  const isProjectManager = role === "PROJECT_MANAGER";

  // Compute default route without hooks to avoid hook-order issues with early returns
  const defaultProtectedRoute = canAccessAdmin
    ? adminDashboardPath
    : isProcurementManager
    ? procurementManagerDashboardPath
    : isCEOOrCOO
    ? ceoDashboardPath
    : isProjectHead
    ? projectHeadDashboardPath
    : isProjectManager
    ? projectManagerDashboardPath
    : workspacePath;

  // Centralized logout handler that clears backend session, MSAL cache, Redux, and storage
  const logoutUser = useMemo(
    () =>
      createLogoutHandler(instance, store, navigate, {
        redirectTo: loginPath,
        useRedirect: true,
      }),
    [instance, navigate, store]
  );

  // If the user isn't authenticated and MSAL isn't processing a redirect,
  // show the login page. During redirect processing, continue showing login
  // page while MSAL handles the callback.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <Login />
        <Toaster position="bottom-center" />
      </div>
    );
  }

  // While we have a token but no resolved role from the backend
  // session endpoint yet, show a lightweight loading state instead
  // of routing to the default user workspace and then redirecting.
  // If loading takes too long, redirect to login to show any errors
  if (isAuthenticated && !role) {
    if (loadingTimeout) {
      // Timeout reached, redirect to login
      return (
        <div className="min-h-screen bg-white">
          <Login />
          <Toaster position="bottom-center" />
        </div>
      );
    }
    return (
      <>
        <Toaster />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p className="text-sm text-slate-600">Loading your workspace...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Protected routes */}
        <Route element={<RequireAuth isAuthenticated={isAuthenticated} />}> 
          {/* Workspace layout with nested routes - only for non-admin users */}
          <Route element={<RequireNonAdmin canAccessAdmin={canAccessAdmin} />}>
            <Route
              path={workspacePath}
              element={
                <WorkspaceLayout
                  token={accessToken || idToken}
                  currentUser={
                    name || email
                      ? {
                          id: "user",
                          name: name || email,
                          role: role,
                        }
                      : null
                  }
                  onLogout={logoutUser}
                />
              }
            >
              {workspaceRoutes.map(({ path, component: Component }) => (
                <Route
                  key={path}
                  path={path}
                  element={<RouteComponent component={Component} />}
                />
              ))}
            </Route>
          </Route>

          {/* Admin routes (only for the ADMIN role) */}
          <Route element={<RequireAdmin canAccessAdmin={canAccessAdmin} />}>
            <Route path={adminBasePath} element={<AdminDashboard />}>
              {adminRoutes.map(({ path, component: Component }) => (
                <Route
                  key={path}
                  path={path}
                  element={<RouteComponent component={Component} />}
                />
              ))}
            </Route>
          </Route>

          {/* Role-specific dashboards - only for non-admin users */}
          <Route element={<RequireNonAdmin canAccessAdmin={canAccessAdmin} />}>
            {/* Procurement manager dashboard (single component) */}
            <Route
              path={procurementManagerDashboardPath}
              element={
                <RouteComponent
                  component={procurementManagerDashboardRoute.component}
                />
              }
            />

            {/* CEO / COO dashboard (single component) */}
            <Route
              path={ceoDashboardPath}
              element={<RouteComponent component={ceoDashboardRoute.component} />}
            />

            {/* Project Head dashboard (single component) */}
            <Route
              path={projectHeadDashboardPath}
              element={
                <RouteComponent
                  component={projectHeadDashboardRoute.component}
                />
              }
            />

            {/* Project Manager dashboard (single component) */}
            <Route
              path={projectManagerDashboardPath}
              element={
                <RouteComponent
                  component={projectManagerDashboardRoute.component}
                />
              }
            />
          </Route>

          {/* Catch‑all redirect for unknown paths inside the protected area */}
          <Route
            path="*"
            element={<Navigate to={defaultProtectedRoute} replace />}
          />
        </Route>
      </Routes>
      {/* Global toast container */}
      <Toaster position="bottom-center" />
    </div>
  );
}