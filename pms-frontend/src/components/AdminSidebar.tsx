import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaLayerGroup,
  FaClipboardList,
  FaCheckCircle,
  FaProjectDiagram,
  FaUsers,
  FaSignOutAlt,
  FaBars,  
  FaChevronLeft,
} from "react-icons/fa";

/*
 * AdminSidebar renders navigation for the admin console. It provides
 * links to the various administrative modules and a logout action.
 * The sidebar is collapsible. When collapsed, only icons are shown.
 * The onLogout function is supplied by the parent component to handle
 * logging out of the application.
 */

export interface AdminSidebarProps {
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MenuItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number }>;
}

const ADMIN_MENU: MenuItem[] = [
  { label: "Project Operations", to: "/admin/project-details", icon: FaProjectDiagram },
  { label: "Material Directory", to: "/admin/materials", icon: FaLayerGroup },
  { label: "Material Allocations", to: "/admin/allocations", icon: FaClipboardList },
  { label: "Allocated Materials", to: "/admin/allocated", icon: FaCheckCircle },
  { label: "Project Management", to: "/admin/projects", icon: FaProjectDiagram },
  { label: "User Management", to: "/admin/users", icon: FaUsers },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLogout, collapsed: collapsedProp, onToggleCollapse }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = typeof collapsedProp === "boolean";
  const collapsed = isControlled ? (collapsedProp as boolean) : internalCollapsed;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col bg-white transition-all duration-300 z-20 ${collapsed ? "w-16" : "w-56"} shadow-lg border border-slate-200`}
    >
      {/* Logo and collapse toggle */}
      <div className="flex items-center justify-between px-3 py-2">
          <NavLink to="/admin/materials" className="flex items-center gap-2">
          <img src="/posana-logo.svg" alt="Logo" className="h-6 w-auto" />
        </NavLink>
        <div className="flex items-center gap-2">
          {/* no user name or role displayed in sidebar header per preference */}
          <button
            type="button"
            onClick={() => {
              if (isControlled) {
                onToggleCollapse && onToggleCollapse();
              } else {
                setInternalCollapsed((s) => !s);
              }
            }}
            className="text-[var(--primary)] hover:text-[var(--primary)]/70"
          >
            {collapsed ? <FaBars size={16} /> : <FaChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-2">
        {ADMIN_MENU.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-4 py-2 my-1 transition-colors rounded-none",
                collapsed ? "justify-center" : "justify-start",
                isActive
                  ? "bg-[#0A7326] text-white"
                  : "text-slate-700 hover:bg-[#0A7326]/10",
              ].join(" ")
            }
          >
            <Icon size={18} />
            {!collapsed && (
              <span className="text-[10px] font-medium">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout (kept at bottom) */}
      <div className="px-3 py-2 text-slate-700 mt-auto">
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-none px-3 py-2 text-[10px] font-medium text-[#0A7326] hover:bg-[#0A7326]/10"
        >
          <FaSignOutAlt size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
