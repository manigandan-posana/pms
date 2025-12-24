
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { setSelectedProject } from "../store/slices/workspaceSlice";
import CustomSelect from "../widgets/CustomSelect";
import { Box } from "@mui/material";

const ProjectSelector: React.FC = () => {
  const dispatch = useDispatch();
  const { assignedProjects, selectedProjectId } = useSelector(
    (state: RootState) => state.workspace
  );

  const projects = Array.isArray(assignedProjects) ? assignedProjects : [];

  // Auto-select first project if none selected
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      dispatch(setSelectedProject(projects[0].id));
    }
  }, [selectedProjectId, projects, dispatch]);

  const handleProjectChange = (newValue: any) => {
    const value = newValue.target ? newValue.target.value : newValue;
    dispatch(setSelectedProject(value));
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name || `Project ${p.id}`,
  }));

  return (
    <Box>
      <CustomSelect
        value={selectedProjectId || ''}
        options={projectOptions}
        onChange={handleProjectChange}
        label="Select Project"
        size="small"
        sx={{
          minWidth: 160,
          '& .MuiOutlinedInput-root': {
            bgcolor: 'grey.50',
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: 'grey.400' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
          '& .MuiSelect-select': {
            py: 0.75,
            fontWeight: 500,
            fontSize: '0.75rem'
          }
        }}
      />
    </Box>
  );
};

export default ProjectSelector;
