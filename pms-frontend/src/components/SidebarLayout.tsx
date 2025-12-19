import React, { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiBox,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiRepeat,
  FiShoppingCart,
  FiSettings,
  FiUsers,
  FiFile,
  FiBarChart2,
  FiChevronDown,
  FiLogOut,
  FiTruck,
} from "react-icons/fi";
import {
  FaBars,
  FaChevronLeft,
} from "react-icons/fa";
import AdminTopBar from "./AdminTopBar";
import NavigationTabs from "./NavigationTabs";

interface NavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  path?: string;
  children?: NavItem[];
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  pageHeading?: string;
  showProjectSelector?: boolean;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  userRole,
  userName: _userName,
  onLogout,
  onOpenAdmin,
  pageHeading = "Inventory",
  showProjectSelector = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const location = useLocation();

  const isAdmin = userRole === "ADMIN";

  const navItems: NavItem[] = useMemo(() => {
    const baseItems: NavItem[] = [
      { id: "inventory", label: "Inventory", icon: FiBox, path: "/workspace/inventory" },
      { id: "vehicles", label: "Vehicles", icon: FiTruck, path: "/workspace/vehicles" },
    ];

    const adminItems: NavItem[] = [
      { id: "dashboard", label: "Project Operations", icon: FiBarChart2, path: "/admin/project-details" },
      { id: "materials", label: "Materials", icon: FiBox, path: "/admin/materials" },
      { id: "projects", label: "Projects", icon: FiFile, path: "/admin/projects" },
      { 
        id: "allocations", 
        label: "Allocations", 
        icon: FiRepeat,
        children: [
          { id: "allocations-manage", label: "Manage", path: "/admin/allocations" },
          { id: "allocated-materials", label: "Allocated Materials", path: "/admin/allocated-materials" },
        ],
      },
      { id: "users", label: "Users", icon: FiUsers, path: "/admin/users" },
      { id: "history", label: "History", icon: FiFile, path: "/admin/history" },
    ];

    if (isAdmin) {
      return adminItems;
    }

    if (userRole === "CEO" || userRole === "COO") {
      return [
        { id: "dashboard", label: "Dashboard", icon: FiBarChart2, path: "/workspace/dashboard" },
        {
          id: "history",
          label: "History",
          icon: FiFile,
          children: [
            { id: "inward-history", label: "Inwards", path: "/workspace/inward/history" },
            { id: "outward-history", label: "Outwards", path: "/workspace/outward/history" },
          ],
        },
      ];
    }

    if (userRole === "PROCUREMENT_MANAGER") {
      return [
        { id: "dashboard", label: "Dashboard", icon: FiBarChart2, path: "/workspace/pm-dashboard" },
        {
          id: "history",
          label: "History",
          icon: FiFile,
          children: [
            { id: "inward-history", label: "Inwards", path: "/workspace/inward/history" },
            { id: "outward-history", label: "Outwards", path: "/workspace/outward/history" },
          ],
        },
      ];
    }

    return baseItems;
  }, [userRole, isAdmin]);

  const toggleMenu = (id: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMenus(newExpanded);
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = isActive(item.path) || (hasChildren && item.children?.some(c => isActive(c.path)));
    const Icon = item.icon;

    return (
      <div key={item.id}>
        {hasChildren ? (
          <button
            onClick={() => toggleMenu(item.id)}
            className={`w-full flex items-center justify-between px-4 py-2 my-1 text-[10px] font-medium rounded-none transition ${
              isItemActive
                ? "bg-[#0A7326] text-white"
                : "text-slate-700 hover:bg-[#0A7326]/10"
            } ${collapsed ? "px-3" : ""}`}
          >
            <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-3"}`}>
              {Icon && <Icon size={18} />}
              {!collapsed && <span>{item.label}</span>}
            </div>
            {!collapsed && (
              <FiChevronDown
                size={14}
                className={`transform transition ${expandedMenus.has(item.id) ? "rotate-180" : ""}`}
              />
            )}
          </button>
        ) : (
          <NavLink
            to={item.path || "#"}
            className={({ isActive: isLinkActive }) => {
              const baseClass = "flex items-center gap-3 px-4 py-2 my-1 transition-colors rounded-none text-[10px] font-medium";
              const activeClass = isLinkActive ? "bg-[#0A7326] text-white" : "text-slate-700 hover:bg-[#0A7326]/10";
              const collapsedClass = collapsed ? "justify-center px-3" : "justify-start";
              return `${baseClass} ${activeClass} ${collapsedClass}`;
            }}
          >
            {Icon && <Icon size={18} />}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        )}

        {hasChildren && expandedMenus.has(item.id) && !collapsed && (
          <div className="ml-3 mt-0 space-y-0">
            {item.children?.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col bg-white transition-all duration-300 z-20 ${collapsed ? "w-16" : "w-56"} shadow-lg border border-slate-200`}
      >
        {/* Logo and collapse toggle */}
        <div className="flex items-center justify-between px-3 py-2">
          <NavLink 
            to={navItems[0]?.path || "/"} 
            className="flex items-center gap-2"
          >
            <img src="/posana-logo.svg" alt="Logo" className="h-6 w-auto" />
          </NavLink>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-[var(--primary)] hover:text-[var(--primary)]/70"
            >
              {collapsed ? <FaBars size={16} /> : <FaChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map(item => renderNavItem(item))}
        </nav>

        {/* Admin button and Logout (kept at bottom) */}
        <div className="px-3 py-2 text-slate-700 mt-auto space-y-1">
          {onOpenAdmin && !isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className={`w-full flex items-center gap-2 rounded-none px-3 py-2 text-[10px] font-medium text-[#0A7326] hover:bg-[#0A7326]/10 transition ${collapsed ? "justify-center" : ""}`}
            >
              <FiSettings size={16} />
              {!collapsed && <span>Admin</span>}
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`w-full flex items-center gap-2 rounded-none px-3 py-2 text-[10px] font-medium text-[#0A7326] hover:bg-[#0A7326]/10 transition ${collapsed ? "justify-center" : ""}`}
            >
              <FiLogOut size={16} />
              {!collapsed && <span>Logout</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main content with margin for sidebar */}
      <main className={`transition-all duration-300 ${collapsed ? "ml-16" : "ml-56"}`}>
        <AdminTopBar 
          userName={_userName} 
          userRole={userRole}
          pageHeading={pageHeading}
          showProjectSelector={showProjectSelector}
        />
        <div className="min-h-screen p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
