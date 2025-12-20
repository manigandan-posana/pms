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
  if (pathname.includes("/workspace/vehicles")) return "Vehicle Management";
  return "Workspace";
};

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  token: tokenProp,
  currentUser,
  onLogout,
  onOpenAdmin,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const authToken = useSelector(
    (state: RootState) => state.auth.accessToken || state.auth.idToken
  );
  const token = tokenProp || authToken;

  const pageHeading = useMemo(() => getPageHeading(location.pathname), [location.pathname]);

  const { status, error } = useSelector<RootState, WorkspaceStateShape>(
    (state) => state.workspace as unknown as WorkspaceStateShape
  );

  useEffect(() => {
    if (!token) return;
    dispatch(bootstrapWorkspace(token));
  }, [dispatch, token]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearWorkspaceError());
    }
  }, [dispatch, error]);

  useEffect(() => {
    if (location.pathname === "/workspace" || location.pathname === "/workspace/") {
      navigate("/workspace/inventory", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <SidebarLayout
      userRole={currentUser?.role as string}
      userName={currentUser?.name as string}
      onLogout={onLogout}
      onOpenAdmin={onOpenAdmin}
      pageHeading={pageHeading}
      showProjectSelector={true}
    >
      {status === "loading" && <GlobalLoader />}
      <Outlet />
    </SidebarLayout>
  );
};

export default WorkspaceLayout;
