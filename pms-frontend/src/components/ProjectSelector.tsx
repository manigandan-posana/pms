
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { setSelectedProject } from "../store/slices/workspaceSlice";
import CustomSelect from "../widgets/CustomSelect";

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
    <div className="flex items-center gap-2">
      <CustomSelect
        value={selectedProjectId || ''}
        options={projectOptions}
        onChange={handleProjectChange}
        label="Select Project"
        size="small"
        sx={{
          minWidth: 200,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#f8fafc',
            '& fieldset': { borderColor: '#e2e8f0' },
            '&:hover fieldset': { borderColor: '#cbd5e1' },
            '&.Mui-focused fieldset': { borderColor: '#0a7326' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#0a7326' },
          '& .MuiSelect-select': {
            py: 1,
            fontWeight: 500,
            color: '#334155'
          }
        }}
      />
    </div>
  );
};

export default ProjectSelector;
