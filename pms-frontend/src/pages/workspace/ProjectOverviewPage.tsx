import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store/store';

const ProjectOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useSelector((state: RootState) => state.auth);
  const { 
    currentProject, 
    assignedProjects, 
    status, 
    error
  } = useSelector((state: RootState) => state.workspace);
  const { selectedAdminProjectId } = useSelector((state: RootState) => state.adminProjects);

  if (status === 'loading') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading project information...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Determine target project id (workspace project)
  const targetProjectId = currentProject?.id ?? (assignedProjects && assignedProjects.length > 0 ? assignedProjects[0].id : undefined);

  // Use effect to perform navigation to workspace project details
  useEffect(() => {
    if (targetProjectId) {
      navigate(`/workspace/projects/${targetProjectId}`, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetProjectId]);

  // If no projects available at all, show message
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>No Projects Available</Typography>
      <Typography variant="body1" color="text.secondary">
        You don't have access to any projects.
      </Typography>
    </Box>
  );
};

export default ProjectOverviewPage;