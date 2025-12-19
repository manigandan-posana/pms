import React, { useState } from "react";
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
import type { Theme, CSSObject } from "@mui/material";
import {
  FaLayerGroup,
  FaProjectDiagram,
  FaUsers,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCar,
} from "react-icons/fa";

// Constants
const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72; // Slightly wider for better icon centering

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
  { label: "Project Management", to: "/admin/project-details", icon: FaProjectDiagram },
  { label: "Inventory", to: "/admin/inventory", icon: FaLayerGroup },
  { label: "User Management", to: "/admin/users", icon: FaUsers },
  { label: "Vehicle Dashboard", to: "/admin/vehicles/dashboard", icon: FaCar },
];

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
  minHeight: 64, // Standard toolbar height
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

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onLogout,
  collapsed: collapsedProp,
  onToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = typeof collapsedProp === "boolean";
  const collapsed = isControlled ? (collapsedProp as boolean) : internalCollapsed;
  const open = !collapsed;

  const theme = useTheme();
  const location = useLocation();

  const handleToggle = () => {
    if (isControlled) {
      onToggleCollapse && onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  return (
    <StyledDrawer variant="permanent" open={open}>
      <DrawerHeader>
        {open && (
          <Box
            component={NavLink}
            to="/admin/inventory"
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
        {ADMIN_MENU.map(({ label, to, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);

          return (
            <ListItem key={to} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <Tooltip title={!open ? label : ""} placement="right">
                <ListItemButton
                  component={NavLink}
                  to={to}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                    color: isActive ? '#2563eb' : '#475569', // blue-600 or slate-600
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
                    primary={label}
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
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip title={!open ? "Logout" : ""} placement="right">
            <ListItemButton
              onClick={onLogout}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: 2,
                color: '#ef4444', // red-500
                '&:hover': {
                  backgroundColor: '#fef2f2', // red-50
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                <FaSignOutAlt size={18} />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </Box>
    </StyledDrawer>
  );
};

export default AdminSidebar;
