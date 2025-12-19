
import React, { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Tooltip,
  Divider,
  useTheme,
  styled
} from "@mui/material";
import type { CSSObject, Theme } from "@mui/material";

import {
  FiBox,
  FiBarChart2,
  FiFile,
  FiRepeat,
  FiUsers,
  FiTruck,
  FiSettings,
  FiLogOut
} from "react-icons/fi";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt
} from "react-icons/fa";
import AdminTopBar from "./AdminTopBar";

// Constants
const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

export interface SidebarLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  pageHeading?: string;
  showProjectSelector?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  children?: NavItem[];
}

const openedMixin = (theme: Theme): CSSObject => ({
  width: DRAWER_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#ffffff',
  borderRight: '1px solid #e2e8f0', // slate-200
  boxShadow: '4px 0 24px 0 rgba(0,0,0,0.02)',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: COLLAPSED_WIDTH,
  backgroundColor: '#ffffff',
  borderRight: '1px solid #e2e8f0',
  boxShadow: '4px 0 24px 0 rgba(0,0,0,0.02)',
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  minHeight: 64,
  ...theme.mixins.toolbar,
}));

const StyledDrawer = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: DRAWER_WIDTH,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

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
  const theme = useTheme();
  const location = useLocation();

  const isAdmin = userRole === "ADMIN";
  const open = !collapsed;

  const navItems: NavItem[] = useMemo(() => {
    const baseItems: NavItem[] = [
      { id: "inventory", label: "Inventory", icon: FiBox, path: "/workspace/inventory" },
      { id: "vehicles", label: "Vehicles", icon: FiTruck, path: "/workspace/vehicles" },
    ];

    const adminItems: NavItem[] = [
      { id: "dashboard", label: "Project Management", icon: FiBarChart2, path: "/admin/project-details" },
      { id: "materials", label: "Materials", icon: FiBox, path: "/admin/materials" },
      { id: "projects", label: "Projects", icon: FiFile, path: "/admin/projects" },
      // Flatten hierarchy for sidebar if needed, or handle recursive render. 
      // For now, let's keep it simple and flat or just top-level as AdminSidebar usually handles admin routes.
      // But SidebarLayout is for NON-ADMIN pages usually, or shared. 
      // If userRole is ADMIN, typically AdminDashboard is used. 
      // Let's assume standard Items for generic workspace.
    ];

    if (userRole === "CEO" || userRole === "COO") {
      return [
        { id: "dashboard", label: "Dashboard", icon: FiBarChart2, path: "/workspace/dashboard" },
        { id: "inwards", label: "Inwards", icon: FiFile, path: "/workspace/inward/history" },
        { id: "outwards", label: "Outwards", icon: FiFile, path: "/workspace/outward/history" },
      ];
    }

    if (userRole === "PROCUREMENT_MANAGER") {
      return [
        { id: "dashboard", label: "Dashboard", icon: FiBarChart2, path: "/workspace/pm-dashboard" },
        { id: "inwards", label: "Inwards", icon: FiFile, path: "/workspace/inward/history" },
        { id: "outwards", label: "Outwards", icon: FiFile, path: "/workspace/outward/history" },
      ];
    }

    return baseItems;
  }, [userRole, isAdmin]);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StyledDrawer variant="permanent" open={open}>
        <DrawerHeader>
          {open && (
            <Box
              component={NavLink}
              to="/"
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: 1 }}
            >
              <img src="/posana-logo.svg" alt="Logo" style={{ height: 28, width: 'auto' }} />
            </Box>
          )}
          <IconButton onClick={handleToggle} size="small" sx={{ color: 'text.secondary', ml: open ? 0 : 'auto', mr: open ? 0 : 'auto' }}>
            {open ? <FaChevronLeft size={16} /> : <FaChevronRight size={16} />}
          </IconButton>
        </DrawerHeader>

        <Divider sx={{ borderColor: '#f1f5f9' }} />

        <List sx={{ px: 1.5, py: 2, flexGrow: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <ListItem key={item.id} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                <Tooltip title={!open ? item.label : ""} placement="right">
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                      borderRadius: 2,
                      backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent', // blue-600
                      color: isActive ? '#2563eb' : '#475569',
                      '&:hover': {
                        backgroundColor: isActive ? 'rgba(37, 99, 235, 0.12)' : '#f8fafc',
                        color: isActive ? '#2563eb' : '#1e293b',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                        fontSize: 20
                      }}
                    >
                      <Icon size={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 500,
                        fontFamily: '"Google Sans", "Roboto", sans-serif'
                      }}
                      sx={{ opacity: open ? 1 : 0 }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ p: 1.5, borderTop: '1px solid #f1f5f9' }}>
          {onOpenAdmin && !isAdmin && (
            <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <Tooltip title={!open ? "Admin" : ""} placement="right">
                <ListItemButton
                  onClick={onOpenAdmin}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    color: '#475569',
                    '&:hover': { backgroundColor: '#f8fafc', color: '#1e293b' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                    <FiSettings size={18} />
                  </ListItemIcon>
                  <ListItemText primary="Admin" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} sx={{ opacity: open ? 1 : 0 }} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )}

          {onLogout && (
            <ListItem disablePadding sx={{ display: 'block' }}>
              <Tooltip title={!open ? "Logout" : ""} placement="right">
                <ListItemButton
                  onClick={onLogout}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    color: '#ef4444',
                    '&:hover': { backgroundColor: '#fef2f2' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                    <FaSignOutAlt size={18} />
                  </ListItemIcon>
                  <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} sx={{ opacity: open ? 1 : 0 }} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          )}
        </Box>
      </StyledDrawer>

      {/* Main content */}
      <main
        className="transition-all duration-300"
        style={{ marginLeft: collapsed ? 72 : 240 }}
      >
        <AdminTopBar
          userName={_userName}
          userRole={userRole}
          pageHeading={pageHeading}
          showProjectSelector={showProjectSelector}
        />
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
