import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Dropdown } from "primereact/dropdown";
import type { RootState } from "../store/store";
import { setSelectedProject } from "../store/slices/workspaceSlice";

interface Project {
  id: string;
  name?: string;
  code?: string;
  [key: string]: any;
}

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

  const handleProjectChange = (e: { value: string }) => {
    dispatch(setSelectedProject(e.value));
  };

  const selectedProject = projects.find((p: Project) => p.id === selectedProjectId);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Project
      </span>
      <Dropdown
        value={selectedProjectId}
        options={projects}
        onChange={handleProjectChange}
        optionLabel="name"
        optionValue="id"
        placeholder="Select Project"
        className="project-dropdown"
        panelClassName="project-dropdown-panel"
        disabled={projects.length === 0}
      />
    </div>
  );
};

export default ProjectSelector;
