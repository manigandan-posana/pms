
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
const DRAWER_WIDTH = 200;
const COLLAPSED_WIDTH = 56;

export interface SidebarLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  canAccessAdmin?: boolean;
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
  borderRight: '1px solid',
  borderColor: 'divider',
  boxShadow: '2px 0 8px 0 rgba(0,0,0,0.02)',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: COLLAPSED_WIDTH,
  backgroundColor: '#ffffff',
  borderRight: '1px solid',
  borderColor: 'divider',
  boxShadow: '2px 0 8px 0 rgba(0,0,0,0.02)',
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  minHeight: 48,
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

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'open',
})<{ active?: boolean; open?: boolean; component?: React.ElementType; to?: string }>(({ theme, active, open }) => ({
  minHeight: 36,
  justifyContent: open ? 'initial' : 'center',
  px: 1.5,
  py: 0.5,
  borderRadius: theme.spacing(0.75),
  backgroundColor: active ? 'rgba(10, 115, 38, 0.08)' : 'transparent',
  color: active ? '#0a7326' : theme.palette.text.secondary,
  transition: 'all 0.2s',
  mb: 0.25,
  '&:hover': {
    backgroundColor: active ? 'rgba(10, 115, 38, 0.12)' : theme.palette.action.hover,
    color: active ? '#0a7326' : theme.palette.text.primary,
  },
}));

const StyledListItemIcon = styled(ListItemIcon, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'open',
})<{ active?: boolean; open?: boolean }>(({ theme, open }) => ({
  minWidth: 0,
  marginRight: open ? theme.spacing(1.5) : 'auto',
  justifyContent: 'center',
  color: 'inherit',
  fontSize: 16,
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
            <Icon size={16} />
          </StyledListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.75rem',
              fontWeight: isActive ? 600 : 500,
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
  canAccessAdmin = false,
  pageHeading = "Inventory",
  showProjectSelector = false,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  const open = !collapsed;

  const navItems: NavItem[] = useMemo(() => {
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <StyledDrawer variant="permanent" open={open}>
        <DrawerHeader>
          {open && (
            <Box
              component={NavLink}
              to="/"
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: 0.5 }}
            >
              <img src="/posana-logo.svg" alt="Logo" style={{ height: 24, width: 'auto' }} />
            </Box>
          )}
          <IconButton onClick={handleToggle} size="small" sx={{ color: 'text.secondary' }}>
            {open ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
          </IconButton>
        </DrawerHeader>

        <Divider />

        <List sx={{ px: 1, py: 1, flexGrow: 1 }}>
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              open={open}
              isActive={location.pathname.startsWith(item.path)}
            />
          ))}
        </List>

        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          {onOpenAdmin && canAccessAdmin && (
            <ListItem disablePadding sx={{ display: 'block', mb: 0.25 }}>
              <Tooltip title={!open ? "Admin" : ""} placement="right">
                <StyledListItemButton
                  onClick={onOpenAdmin}
                  open={open}
                >
                  <StyledListItemIcon open={open}>
                    <FiSettings size={16} />
                  </StyledListItemIcon>
                  <ListItemText primary="Admin" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 500 }} sx={{ opacity: open ? 1 : 0 }} />
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
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.lighter', color: 'error.main' },
                  }}
                >
                  <StyledListItemIcon open={open}>
                    <FaSignOutAlt size={16} />
                  </StyledListItemIcon>
                  <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 500 }} sx={{ opacity: open ? 1 : 0 }} />
                </StyledListItemButton>
              </Tooltip>
            </ListItem>
          )}
        </Box>
      </StyledDrawer>

      {/* Main content */}
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
          userName={_userName}
          userRole={userRole}
          pageHeading={pageHeading}
          showProjectSelector={showProjectSelector}
        />
        <Box sx={{ p: 1, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
export default SidebarLayout;
