import React, { useCallback, useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useStore } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { loginPath } from "../routes/route";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopBar from "../components/AdminTopBar";
import { createLogoutHandler } from "../services/LogoutService";

// Helper to get page heading based on route
const getAdminPageHeading = (pathname: string): string => {
  if (pathname.includes("/admin/project-details")) return "Project Dashboard";
  if (pathname.includes("/admin/inward/")) return "Inward Transaction Details";
  if (pathname.includes("/admin/outward/")) return "Outward Transaction Details";
  if (pathname.includes("/admin/transfer/")) return "Transfer Transaction Details";
  if (pathname.includes("/admin/inventory")) return "Inventory Management";
  if (pathname.includes("/admin/allocated-materials")) return "Allocated Materials";
  if (pathname.includes("/admin/projects")) return "Project Management";
  if (pathname.includes("/admin/users")) return "User Management";
  if (pathname.includes("/admin/vehicles")) return "Vehicle Dashboard";
  return "Admin";
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  const { instance } = useMsal();
  const { name, email, role } = useSelector((state: any) => state.auth);
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
    <div className="min-h-screen bg-white">
      <AdminSidebar 
        onLogout={handleLogout}
        userName={name || email}
        userRole={role}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-16" : "ml-56"}`}>
        <AdminTopBar
          userName={name || email}
          userRole={role}
          pageHeading={pageHeading}
        />
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
