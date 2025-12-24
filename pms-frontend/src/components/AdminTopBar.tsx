import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Stack
} from "@mui/material";
import { FaBell, FaUserCircle } from "react-icons/fa";
import ProjectSelector from "./ProjectSelector";

interface AdminTopBarProps {
  userName?: string | null;
  userRole?: string | null;
  pageHeading?: string;
  showProjectSelector?: boolean;
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({
  userName,
  userRole,
  pageHeading = "Inventory",
  showProjectSelector = false
}) => {

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
          {showProjectSelector && (
            <Box sx={{ minWidth: 160, display: { xs: 'none', sm: 'block' } }}>
              <ProjectSelector />
            </Box>
          )}

          <IconButton
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <FaBell size={14} />
          </IconButton>

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
