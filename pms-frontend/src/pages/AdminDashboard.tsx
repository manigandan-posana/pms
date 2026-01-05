import React, { useCallback, useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useStore } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { loginPath } from "../routes/route";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopBar from "../components/AdminTopBar";
import { createLogoutHandler } from "../services/LogoutService";
import { Box } from "@mui/material";

// Constants for sidebar
const DRAWER_WIDTH = 200;
const COLLAPSED_WIDTH = 56;

// Helper to get page heading based on route
const getAdminPageHeading = (pathname: string): string => {
  if (pathname.includes("/admin/project-details")) return "Project Dashboard";
  if (pathname.includes("/admin/inward/")) return "Inward Transaction Details";
  if (pathname.includes("/admin/outward/")) return "Outward Transaction Details";
  if (pathname.includes("/admin/transfer/")) return "Transfer Transaction Details";
  if (pathname.includes("/admin/contractors/")) return "Contractor Details";
  return "Admin";
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  const { instance } = useMsal();
  const { name, email, role, permissions } = useSelector((state: any) => state.auth);
  const [collapsed, setCollapsed] = useState(false);

  const pageHeading = useMemo(() => getAdminPageHeading(location.pathname), [location.pathname]);

  const handleLogout = useCallback(async () => {
    const logout = createLogoutHandler(instance, store, navigate, {
      redirectTo: loginPath,
      useRedirect: true,
    });
    await logout();
  }, [instance, navigate, store]);

  // Check if current page is master console or contractor details
  const isMasterConsole = location.pathname.includes('/admin/master-console');
  const isContractorDetails = location.pathname.includes('/admin/contractors/');
  const hideSidebar = isMasterConsole || isContractorDetails;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {!hideSidebar && (
        <AdminSidebar
          onLogout={handleLogout}
          userName={name || email}
          userRole={role}
          permissions={permissions}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: 'margin-left 0.3s',
          ml: hideSidebar ? 0 : (collapsed ? `${COLLAPSED_WIDTH}px` : `${DRAWER_WIDTH}px`),
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <AdminTopBar
          userName={name || email}
          userRole={role}
          pageHeading={pageHeading}
          showWorkspaceToggle={hideSidebar}
        />
        <Box sx={{ p: 1, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
