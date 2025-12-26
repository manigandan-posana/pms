import React, { useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { bootstrapWorkspace, clearWorkspaceError } from "../../store/slices/workspaceSlice";
import type { RootState, AppDispatch } from "../../store/store";
import GlobalLoader from "../../components/GlobalLoader";
import SidebarLayout from "../../components/SidebarLayout";

export interface WorkspaceUser {
  id?: string | number;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

interface WorkspaceStateShape {
  status: string;
  error?: string | null;
  [key: string]: unknown;
}

interface WorkspaceLayoutProps {
  token?: string | null;
  currentUser?: WorkspaceUser | null;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  canAccessAdmin?: boolean;
}

// Helper to get page heading based on route
const getPageHeading = (pathname: string): string => {
  if (pathname.includes("/workspace/inventory")) return "Inventory Management";
  if (pathname.includes("/workspace/bom")) return "Bill of Materials";
  if (pathname.includes("/workspace/inward/create")) return "Create Inward";
  if (pathname.includes("/workspace/inward/detail")) return "Inward Details";
  if (pathname.includes("/workspace/inward")) return "Inward Register";
  if (pathname.includes("/workspace/outward/create")) return "Create Outward";
  if (pathname.includes("/workspace/outward/detail")) return "Outward Details";
  if (pathname.includes("/workspace/outward")) return "Outward Register";
  if (pathname.includes("/workspace/transfer/create")) return "Create Transfer";
  if (pathname.includes("/workspace/transfer/detail")) return "Transfer Details";
  if (pathname.includes("/workspace/transfer")) return "Transfer Register";
  if (pathname.includes("/workspace/materials")) return "Material Directory";
  if (pathname.includes("/workspace/vehicles/directory")) return "Vehicle Directory";
  if (pathname.includes("/workspace/vehicles/fuel")) return "Fuel Management";
  if (pathname.includes("/workspace/vehicles/daily-log")) return "Daily Logs";
  if (pathname.includes("/workspace/vehicles/suppliers") || pathname.includes("/workspace/suppliers")) return "Supplier Management";
  if (pathname.includes("/workspace/vehicles/details")) return "Vehicle Details";
  if (pathname.includes("/workspace/vehicles")) return "Vehicle Management";
  return "Workspace";
};

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  token: tokenProp,
  currentUser,
  onLogout,
  onOpenAdmin,
  canAccessAdmin,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const authToken = useSelector(
    (state: RootState) => state.auth.accessToken || state.auth.idToken
  );
  const { permissions } = useSelector((state: RootState) => state.auth);
  const token = tokenProp || authToken;

  const pageHeading = useMemo(() => getPageHeading(location.pathname), [location.pathname]);

  const { status, error } = useSelector<RootState, WorkspaceStateShape>(
    (state) => state.workspace as unknown as WorkspaceStateShape
  );

  // Only bootstrap workspace on initial mount or when token changes, not on every navigation
  useEffect(() => {
    if (!token) return;
    // bootstrapWorkspace thunk does not take an argument; call without params
    dispatch(bootstrapWorkspace());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWorkspaceError());
    }
  }, [dispatch, error]);

  useEffect(() => {
    if (location.pathname === "/workspace" || location.pathname === "/workspace/") {
      navigate("/workspace/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <SidebarLayout
      userRole={currentUser?.role as string}
      userName={currentUser?.name as string}
      onLogout={onLogout}
      onOpenAdmin={canAccessAdmin ? onOpenAdmin : undefined}
      pageHeading={pageHeading}
      showProjectSelector={true}
      permissions={permissions}
    >
      {status === "loading" && <GlobalLoader />}
      <Outlet />
    </SidebarLayout>
  );
};

export default WorkspaceLayout;
