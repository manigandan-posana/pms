import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Box, Stack, Typography, Paper, CircularProgress } from "@mui/material";
import ProjectAllocationManager from "../../components/ProjectAllocationManager";
import {
  clearAllocationError,
  loadAllocationData,
} from "../../store/slices/adminAllocationsSlice";
import type { RootState, AppDispatch } from "../../store/store";
import { type WorkspaceState } from "../../store/slices/workspaceSlice";

interface MaterialAllocationsPageProps {
  onRequestReload?: () => void;
}

const MaterialAllocationsPage: React.FC<MaterialAllocationsPageProps> = ({
  onRequestReload,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const token = useSelector((state: RootState) => state.auth.token);
  const { projects, materials, status, error } = useSelector(
    (state: RootState) => state.adminAllocations
  );
  const { selectedProjectId } = useSelector<RootState, WorkspaceState>((state) => state.workspace as WorkspaceState);

  useEffect(() => {
    if (token) {
      dispatch(loadAllocationData());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAllocationError());
    }
  }, [dispatch, error]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          Allocation Manager
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          Assign materials to projects in bulk
        </Typography>
      </Box>

      {/* Content */}
      {status === "loading" ? (
        <Paper sx={{ p: 3, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stack spacing={1} alignItems="center">
            <CircularProgress size={32} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Loading allocation data...
            </Typography>
          </Stack>
        </Paper>
      ) : (
        <ProjectAllocationManager
          token={token}
          projects={projects as any}
          materials={materials as any}
          onProjectBomUpdate={onRequestReload}
          selectedProjectId={selectedProjectId || undefined}
          allowProjectSelection={false}
          showAllocationTable={false}
          showMultiAllocator={true}
        />
      )}
    </Box>
  );
};

export default MaterialAllocationsPage;
