import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiRefreshCw, FiPlus, FiBriefcase, FiUsers } from "react-icons/fi";

import { Get as apiGet, Post as apiPost } from "../../utils/apiService";
import { getErrorMessage } from "../../utils/errorHandler";
import { ColumnDef } from "../../widgets/CustomTable";
import CustomTable from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";

interface ProjectAssignment {
  id: string | number;
  projectName: string;
  assignedTo: string;
  role: "PROJECT_HEAD" | "PROJECT_MANAGER";
  startDate: string;
  status: "ACTIVE" | "INACTIVE";
}

interface ResourceAllocation {
  id: string | number;
  projectName: string;
  resourceName: string;
  quantity: number;
  allocatedBy: string;
  allocationDate: string;
}

interface PaginatedResponse<T> {
  items?: T[];
  content?: T[];
  totalPages?: number;
  totalElements?: number;
}

const ProjectManagerDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [resources, setResources] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    projectId: "",
    userId: "",
    role: "PROJECT_MANAGER",
  });

  useEffect(() => {
    loadAssignments();
    loadResources();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await apiGet<PaginatedResponse<ProjectAssignment>>(
        "/api/projects/assignments"
      );
      const items = response?.items || response?.content || [];
      setAssignments(Array.isArray(items) ? items : []);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to load project assignments");
      toast.error(errorMsg);
      // Fallback for demo if API fails
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    setResourceLoading(true);
    try {
      const response = await apiGet<PaginatedResponse<ResourceAllocation>>(
        "/api/projects/resources"
      );
      const items = response?.items || response?.content || [];
      setResources(Array.isArray(items) ? items : []);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to load resource allocations");
      toast.error(errorMsg);
      setResources([]);
    } finally {
      setResourceLoading(false);
    }
  };

  const handleAssignProject = async () => {
    if (!assignmentForm.projectId || !assignmentForm.userId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await apiPost("/api/projects/assign", assignmentForm);
      toast.success("Project assigned successfully");
      setShowAssignmentDialog(false);
      setAssignmentForm({
        projectId: "",
        userId: "",
        role: "PROJECT_MANAGER",
      });
      loadAssignments();
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to assign project");
      toast.error(errorMsg);
    }
  };

  const assignmentColumns: ColumnDef<ProjectAssignment>[] = [
    { field: "projectName", header: "Project", sortable: true },
    { field: "assignedTo", header: "Assigned To", sortable: true },
    { field: "role", header: "Role", sortable: true, body: (row) => row.role.replace("_", " ") },
    { field: "startDate", header: "Start Date", sortable: true },
    {
      field: "status", header: "Status", sortable: true, body: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {row.status}
        </span>
      )
    },
  ];

  const resourceColumns: ColumnDef<ResourceAllocation>[] = [
    { field: "projectName", header: "Project", sortable: true },
    { field: "resourceName", header: "Resource", sortable: true },
    { field: "quantity", header: "Quantity", align: "right", sortable: true, body: (row) => <span className="font-mono font-bold text-slate-700">{row.quantity}</span> },
    { field: "allocatedBy", header: "Allocated By", sortable: true },
    { field: "allocationDate", header: "Date", sortable: true },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xs font-bold text-slate-900">Project Manager Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage project assignments and resources</p>
        </div>
        <CustomButton
          size="small"
          variant="outlined"
          startIcon={<FiRefreshCw />}
          onClick={() => {
            loadAssignments();
            loadResources();
          }}
        >
          Refresh
        </CustomButton>
      </div>

      {/* Project Assignments */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiBriefcase /></div>
            <h2 className="text-xs font-semibold">Project Assignments</h2>
          </div>
          <CustomButton
            startIcon={<FiPlus />}
            size="small"
            onClick={() => setShowAssignmentDialog(true)}
          >
            New Assignment
          </CustomButton>
        </div>
        <CustomTable
          data={assignments}
          columns={assignmentColumns}
          loading={loading}
          pagination
          rows={10}
          emptyMessage="No assignments found"
        />
      </div>

      {/* Resource Allocations */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 text-slate-800 mb-4">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><FiUsers /></div>
          <h2 className="text-xs font-semibold">Resource Allocations</h2>
        </div>
        <CustomTable
          data={resources}
          columns={resourceColumns}
          loading={resourceLoading}
          pagination
          rows={10}
          emptyMessage="No resource allocations found"
        />
      </div>

      {/* Assignment Dialog */}
      <CustomModal
        open={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        title="Assign Project"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" onClick={() => setShowAssignmentDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAssignProject}>Assign</CustomButton>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <CustomTextField
            label="Project ID"
            value={assignmentForm.projectId}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, projectId: e.target.value })}
            placeholder="Enter project ID"
          />
          <CustomTextField
            label="User ID"
            value={assignmentForm.userId}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, userId: e.target.value })}
            placeholder="Enter user ID"
          />
        </div>
      </CustomModal>
    </div>
  );
};

export default ProjectManagerDashboard;
