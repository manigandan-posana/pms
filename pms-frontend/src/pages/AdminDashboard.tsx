import React, { useCallback, useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useStore } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { loginPath } from "../routes/route";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopBar from "../components/AdminTopBar";
import { createLogoutHandler } from "../services/LogoutService";
import { Box } from "@mui/material";

// Helper to get page heading based on route
const getAdminPageHeading = (pathname: string): string => {
  if (pathname.includes("/admin/project-details")) return "Project Dashboard";
  if (pathname.includes("/admin/inward/")) return "Inward Transaction Details";
  if (pathname.includes("/admin/outward/")) return "Outward Transaction Details";
  if (pathname.includes("/admin/transfer/")) return "Transfer Transaction Details";
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AdminSidebar
        onLogout={handleLogout}
        userName={name || email}
        userRole={role}
        permissions={permissions}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: 'margin-left 0.3s',
          ml: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}
      >
        <AdminTopBar
          userName={name || email}
          userRole={role}
          pageHeading={pageHeading}
        />
        <Box sx={{ p: 1, flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
