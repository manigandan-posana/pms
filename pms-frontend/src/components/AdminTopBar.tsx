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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e2e8f0',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: 2, display: 'flex', justifyContent: 'space-between' }}>
        {/* Left: Page Heading */}
        <Box display="flex" alignItems="center" gap={2}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: '14px',
              color: '#333333',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {pageHeading}
          </Typography>
        </Box>

        {/* Right: Actions */}
        <Stack direction="row" spacing={2} alignItems="center">
          {showProjectSelector && (
            <Box sx={{ minWidth: 200 }}>
              <ProjectSelector />
            </Box>
          )}

          <IconButton
            size="small"
            sx={{
              color: '#666666',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <FaBell size={18} />
          </IconButton>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '12px', color: '#333333', lineHeight: 1.2 }}>
                {userName || "—"}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '10px', color: '#999999', lineHeight: 1 }}>
                {userRole || "—"}
              </Typography>
            </Box>

            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: 'rgba(10, 115, 38, 0.1)', // brand-green light
                color: '#0a7326',
                fontSize: 13,
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
