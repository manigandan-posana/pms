import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Stack,
  Button
} from "@mui/material";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { FiCommand } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import ProjectSelector from "./ProjectSelector";

interface AdminTopBarProps {
  userName?: string | null;
  userRole?: string | null;
  pageHeading?: string;
  showProjectSelector?: boolean;
  showWorkspaceToggle?: boolean;
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({
  userName,
  userRole,
  pageHeading = "Inventory",
  showProjectSelector = false,
  showWorkspaceToggle = false
}) => {
  const navigate = useNavigate();

  const initials = (userName || "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: 1,
        borderColor: 'divider',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ minHeight: '48px !important', px: 1.5, display: 'flex', justifyContent: 'space-between' }}>
        {/* Left: Page Heading */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'text.primary',
            }}
          >
            {pageHeading}
          </Typography>
        </Box>

        {/* Right: Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          {showWorkspaceToggle && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/workspace/dashboard')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Switch to Workspace
            </Button>
          )}
          {showProjectSelector && (
            <Box sx={{ minWidth: 160, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
              {userRole === 'ADMIN' && (
                <Button
                  variant="text"
                  color="primary"
                  component={NavLink}
                  to="/admin/master-console"
                  startIcon={<FiCommand />}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Master Console
                </Button>
              )}
              <ProjectSelector />
            </Box>
          )}

          

          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem', color: 'text.primary', lineHeight: 1.2 }}>
                {userName || "—"}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1 }}>
                {userRole || "—"}
              </Typography>
            </Box>

            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: 'rgba(10, 115, 38, 0.1)',
                color: 'primary.main',
                fontSize: '0.7rem',
                fontWeight: 600
              }}
            >
              {initials || <FaUserCircle />}
            </Avatar>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default AdminTopBar;
