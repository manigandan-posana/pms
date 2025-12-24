import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import ProjectAllocationManager from "../../components/ProjectAllocationManager";
import {
  clearAllocationError,
  loadAllocationData,
} from "../../store/slices/adminAllocationsSlice";
import type { RootState, AppDispatch } from "../../store/store";

interface AllocatedMaterialsPageProps {
  onRequestReload?: () => void;
}

const AllocatedMaterialsPage: React.FC<AllocatedMaterialsPageProps> = ({
  onRequestReload,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const token = useSelector((state: RootState) => state.auth.token);
  const { projects, materials, status, error } = useSelector(
    (state: RootState) => state.adminAllocations
  );

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
          Allocated Materials
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          View and manage existing project allocations
        </Typography>
      </Box>

      {/* Content */}
      {status === "loading" ? (
        <Stack spacing={1} alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={32} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Loading allocations...
          </Typography>
        </Stack>
      ) : (
        <ProjectAllocationManager
          token={token}
          projects={projects as any}
          materials={materials as any}
          onProjectBomUpdate={onRequestReload}
          showMultiAllocator={false}
          showAllocationTable
        />
      )}
    </Box>
  );
};

export default AllocatedMaterialsPage;
