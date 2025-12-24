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
} from "react-icons/fa";

// Constants
const DRAWER_WIDTH = 200;
const COLLAPSED_WIDTH = 56;

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
];

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
  boxShadow: '2px 0 8px 0 rgba(0,0,0,0.05)',
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
  boxShadow: '2px 0 8px 0 rgba(0,0,0,0.05)',
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

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  onLogout,
  collapsed: collapsedProp,
  onToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = typeof collapsedProp === "boolean";
  const collapsed = isControlled ? (collapsedProp as boolean) : internalCollapsed;
  const open = !collapsed;

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
        {ADMIN_MENU.map(({ label, to, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);

          return (
            <ListItem key={to} disablePadding sx={{ display: 'block', mb: 0.25 }}>
              <Tooltip title={!open ? label : ""} placement="right">
                <ListItemButton
                  component={NavLink}
                  to={to}
                  sx={{
                    minHeight: 36,
                    justifyContent: open ? 'initial' : 'center',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 0.75,
                    bgcolor: isActive ? 'rgba(10, 115, 38, 0.08)' : 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      bgcolor: isActive ? 'rgba(10, 115, 38, 0.12)' : 'action.hover',
                      color: isActive ? 'primary.main' : 'text.primary',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 1.5 : 'auto',
                      justifyContent: 'center',
                      color: 'inherit',
                      fontSize: 16
                    }}
                  >
                    <Icon size={16} />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontSize: '0.75rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                    sx={{ opacity: open ? 1 : 0 }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip title={!open ? "Logout" : ""} placement="right">
            <ListItemButton
              onClick={onLogout}
              sx={{
                minHeight: 36,
                justifyContent: open ? 'initial' : 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: 0.75,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 1.5 : 'auto',
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                <FaSignOutAlt size={16} />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 500 }}
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
