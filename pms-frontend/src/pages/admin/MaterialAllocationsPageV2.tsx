import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, Paper, Button } from "@mui/material";
import { FiInfo, FiSettings } from "react-icons/fi";

export const MaterialAllocationsPageV2: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header */}
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          Material Allocations
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<FiSettings size={14} />}
          onClick={() => navigate("/admin/allocated-materials")}
          sx={{ minHeight: 28, fontSize: '0.75rem' }}
        >
          Manage Allocations
        </Button>
      </Stack>

      {/* Info Card */}
      <Paper sx={{ p: 1.5, borderRadius: 1, bgcolor: 'primary.lighter' }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Box sx={{ p: 0.5, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
            <FiInfo size={16} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 0.5, color: 'primary.dark' }}>
              Material Allocation Management
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'primary.dark', display: 'block', mb: 1 }}>
              Allocate materials to projects by defining required quantities for each material in your Bill of Materials (BOM).
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'primary.dark' }}>
                • Click <Box component="span" sx={{ fontWeight: 600 }}>Manage Allocations</Box> above to view and manage all material allocations
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'primary.dark' }}>
                • Use <Box component="span" sx={{ fontWeight: 600 }}>Project Management</Box> page to allocate materials to specific projects
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'primary.dark' }}>
                • Use <Box component="span" sx={{ fontWeight: 600 }}>Material Directory</Box> page to view material details and availability
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default MaterialAllocationsPageV2;
