import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiRefreshCw, FiClipboard, FiList } from "react-icons/fi";

import { Get as apiGet } from "../../utils/apiService";
import { getErrorMessage } from "../../utils/errorHandler";
import { ColumnDef } from "../../widgets/CustomTable";
import CustomTable from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";

interface ProjectTask {
  id: string | number;
  projectName: string;
  taskName: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  assignedTo: string | null;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface ProjectOverview {
  id: string | number;
  code: string;
  name: string;
  status: string;
  materialsAllocated: number;
  materialsReceived: number;
  progress: number;
}

interface PaginatedResponse<T> {
  items?: T[];
  content?: T[];
  totalPages?: number;
  totalElements?: number;
}

const ProjectHeadDashboard: React.FC = () => {
  const [projects, setProjects] = useState<ProjectOverview[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await apiGet<PaginatedResponse<ProjectOverview>>(
        "/api/projects/my-projects"
      );
      const items = response?.items || response?.content || [];
      setProjects(Array.isArray(items) ? items : []);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to load projects");
      toast.error(errorMsg);
      // Fallback
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    setTaskLoading(true);
    try {
      const response = await apiGet<PaginatedResponse<ProjectTask>>(
        "/api/projects/tasks"
      );
      const items = response?.items || response?.content || [];
      setTasks(Array.isArray(items) ? items : []);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to load tasks");
      toast.error(errorMsg);
      setTasks([]);
    } finally {
      setTaskLoading(false);
    }
  };

  const projectColumns: ColumnDef<ProjectOverview>[] = [
    { field: "code", header: "Code", sortable: true, style: { minWidth: "100px" }, body: (row) => <span className="font-mono text-slate-700">{row.code}</span> },
    { field: "name", header: "Project Name", sortable: true },
    { field: "status", header: "Status", sortable: true },
    { field: "materialsAllocated", header: "Allocated", align: "right" },
    { field: "materialsReceived", header: "Received", align: "right" },
    {
      field: "progress", header: "Progress", body: (row) => (
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1"><span>{row.progress}%</span></div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${row.progress}%` }}></div>
          </div>
        </div>
      )
    },
  ];

  const taskColumns: ColumnDef<ProjectTask>[] = [
    { field: "projectName", header: "Project", sortable: true },
    { field: "taskName", header: "Task", sortable: true },
    { field: "assignedTo", header: "Assigned To", sortable: true, body: (row) => row.assignedTo || '—' },
    { field: "dueDate", header: "Due Date", sortable: true, body: (row) => row.dueDate || '—' },
    {
      field: "priority", header: "Priority", sortable: true, body: (row) => {
        const colors = { LOW: 'bg-blue-100 text-blue-800', MEDIUM: 'bg-amber-100 text-amber-800', HIGH: 'bg-red-100 text-red-800' };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[row.priority] || 'bg-slate-100'}`}>{row.priority}</span>;
      }
    },
    {
      field: "status", header: "Status", sortable: true, body: (row) => {
        const colors = { PENDING: 'bg-slate-100 text-slate-600', IN_PROGRESS: 'bg-blue-50 text-blue-600', COMPLETED: 'bg-green-100 text-green-700' };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[row.status] || ''}`}>{row.status.replace("_", " ")}</span>;
      }
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xs font-bold text-slate-900">Project Head Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage and monitor your assigned projects</p>
        </div>
        <CustomButton
          variant="outlined"
          startIcon={<FiRefreshCw />}
          onClick={() => {
            loadProjects();
            loadTasks();
          }}
        >
          Refresh
        </CustomButton>
      </div>

      {/* Projects Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 text-slate-800 mb-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiClipboard /></div>
          <h2 className="text-xs font-semibold">Assigned Projects</h2>
        </div>
        <CustomTable
          data={projects}
          columns={projectColumns}
          loading={loading}
          pagination
          rows={10}
          emptyMessage="No assigned projects found"
        />
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 text-slate-800 mb-4">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FiList /></div>
          <h2 className="text-xs font-semibold">Project Tasks</h2>
        </div>
        <CustomTable
          data={tasks}
          columns={taskColumns}
          loading={taskLoading}
          pagination
          rows={10}
          emptyMessage="No tasks found"
        />
      </div>
    </div>
  );
};

export default ProjectHeadDashboard;
