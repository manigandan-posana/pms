
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
  styled
} from "@mui/material";
import type { CSSObject, Theme } from "@mui/material";

import {
  FiBox,
  FiBarChart2,
  FiTruck,
  FiSettings,
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

// Styled components for better performance than inline SX
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'open',
})<{ active?: boolean; open?: boolean; component?: React.ElementType; to?: string }>(({ theme, active, open }) => ({
  minHeight: 48,
  justifyContent: open ? 'initial' : 'center',
  paddingLeft: theme.spacing(2.5),
  paddingRight: theme.spacing(2.5),
  borderRadius: theme.spacing(1),
  backgroundColor: active ? 'rgba(10, 115, 38, 0.08)' : 'transparent',
  color: active ? '#0a7326' : '#475569',
  transition: 'all 0.2s',
  marginBottom: 4,
  '&:hover': {
    backgroundColor: active ? 'rgba(10, 115, 38, 0.12)' : '#f8fafc',
    color: active ? '#0a7326' : '#1e293b',
  },
}));

const StyledListItemIcon = styled(ListItemIcon, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'open',
})<{ active?: boolean; open?: boolean }>(({ theme, open }) => ({
  minWidth: 0,
  marginRight: open ? theme.spacing(2) : 'auto',
  justifyContent: 'center',
  color: 'inherit',
  fontSize: 20,
}));

// Memoized Sidebar Item Component to prevent unnecessary re-renders
const SidebarItem = React.memo(({ item, open, isActive }: { item: NavItem; open: boolean; isActive: boolean }) => {
  const Icon = item.icon;
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <Tooltip title={!open ? item.label : ""} placement="right">
        <StyledListItemButton
          component={NavLink}
          to={item.path}
          active={isActive}
          open={open}
        >
          <StyledListItemIcon active={isActive} open={open}>
            <Icon size={20} />
          </StyledListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              fontFamily: '"Google Sans", "Roboto", sans-serif'
            }}
            sx={{ opacity: open ? 1 : 0 }}
          />
        </StyledListItemButton>
      </Tooltip>
    </ListItem>
  );
});

SidebarItem.displayName = 'SidebarItem';

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  userRole,
  userName: _userName,
  onLogout,
  onOpenAdmin,
  pageHeading = "Inventory",
  showProjectSelector = false,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  const isAdmin = userRole === "ADMIN";
  const open = !collapsed;

  const navItems: NavItem[] = useMemo(() => {
    // Always show Dashboard for all users
    return [
      { id: "dashboard", label: "Dashboard", icon: FiBarChart2, path: "/workspace/dashboard" },
      { id: "inventory", label: "Inventory", icon: FiBox, path: "/workspace/inventory" },
      { id: "vehicles", label: "Vehicles", icon: FiTruck, path: "/workspace/vehicles" },
    ];
  }, []);

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
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              open={open}
              isActive={location.pathname.startsWith(item.path)}
            />
          ))}
        </List>

        <Box sx={{ p: 1.5, borderTop: '1px solid #f1f5f9' }}>
          {onOpenAdmin && !isAdmin && (
            <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <Tooltip title={!open ? "Admin" : ""} placement="right">
                <StyledListItemButton
                  onClick={onOpenAdmin}
                  open={open}
                >
                  <StyledListItemIcon open={open}>
                    <FiSettings size={18} />
                  </StyledListItemIcon>
                  <ListItemText primary="Admin" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} sx={{ opacity: open ? 1 : 0 }} />
                </StyledListItemButton>
              </Tooltip>
            </ListItem>
          )}

          {onLogout && (
            <ListItem disablePadding sx={{ display: 'block' }}>
              <Tooltip title={!open ? "Logout" : ""} placement="right">
                <StyledListItemButton
                  onClick={onLogout}
                  open={open}
                  sx={{
                    color: '#ef4444',
                    '&:hover': { backgroundColor: '#fef2f2', color: '#ef4444' }, // Override default hover
                  }}
                >
                  <StyledListItemIcon open={open}>
                    <FaSignOutAlt size={18} />
                  </StyledListItemIcon>
                  <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} sx={{ opacity: open ? 1 : 0 }} />
                </StyledListItemButton>
              </Tooltip>
            </ListItem>
          )}
        </Box>
      </StyledDrawer>

      {/* Main content */}
      <main
        className="transition-[margin-left] duration-300"
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
