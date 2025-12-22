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
];

const openedMixin = (theme: Theme): CSSObject => ({
  width: DRAWER_WIDTH,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#ffffff', // White sidebar
  borderRight: '1px solid #e0e0e0',
  boxShadow: '2px 0 8px 0 rgba(0,0,0,0.05)',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: COLLAPSED_WIDTH,
  backgroundColor: '#ffffff', // White sidebar
  borderRight: '1px solid #e0e0e0',
  boxShadow: '2px 0 8px 0 rgba(0,0,0,0.05)',
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
        <IconButton onClick={handleToggle} size="small" sx={{ color: '#666666', ml: open ? 0 : 'auto', mr: open ? 0 : 'auto' }}>
          {open ? <FaChevronLeft size={16} /> : <FaChevronRight size={16} />}
        </IconButton>
      </DrawerHeader>

      <Divider sx={{ borderColor: '#e0e0e0' }} />

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
                    backgroundColor: isActive ? '#e8f5e9' : 'transparent',
                    color: isActive ? '#0a7326' : '#333333',
                    '&:hover': {
                      backgroundColor: isActive ? '#e8f5e9' : '#f5f5f5',
                      color: isActive ? '#0a7326' : '#333333',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 'auto',
                      justifyContent: 'center',
                      color: isActive ? '#0a7326' : '#666666',
                      fontSize: 20
                    }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
                      fontFamily: '"Google Sans", "Roboto", sans-serif',
                      color: isActive ? '#0a7326' : '#333333'
                    }}
                    sx={{ opacity: open ? 1 : 0 }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 1.5, borderTop: '1px solid #e0e0e0' }}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <Tooltip title={!open ? "Logout" : ""} placement="right">
            <ListItemButton
              onClick={onLogout}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: 2,
                color: '#d32f2f',
                '&:hover': {
                  backgroundColor: '#ffebee',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: '#d32f2f',
                }}
              >
                <FaSignOutAlt size={18} />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontSize: '14px', fontWeight: 500, color: '#d32f2f' }}
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
