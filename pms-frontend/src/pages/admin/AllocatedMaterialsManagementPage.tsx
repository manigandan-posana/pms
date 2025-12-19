import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import toast from "react-hot-toast";
import { FiEdit2, FiTrash2, FiPlus, FiAlertTriangle } from "react-icons/fi";
import { bomApi, adminProjectsApi, materialsApi } from "../../api";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";

interface Material {
  id: number;
  name: string;
  category?: string;
  unit?: string;
}

interface Project {
  id: number;
  name: string;
  code?: string;
}

interface Allocation {
  id: number;
  projectId: number;
  projectName: string;
  projectCode?: string;
  materialId: number;
  materialName: string;
  materialCategory?: string;
  requiredQuantity: number;
  allocatedQuantity?: number;
  unit?: string;
}

const AllocatedMaterialsManagementPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  // Edit/Create Dialog State
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<Partial<Allocation>>({});

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [allocationToDelete, setAllocationToDelete] = useState<Allocation | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Load projects
      const projectsResponse = await adminProjectsApi.listProjects({ limit: 1000 });
      const projectsData = projectsResponse?.data?.content || projectsResponse?.content || projectsResponse || [];
      setProjects(projectsData);

      // Load materials
      const materialsResponse = await materialsApi.listMaterials({ limit: 1000 });
      const materialsData = materialsResponse?.data?.content || materialsResponse?.content || materialsResponse || [];
      setMaterials(materialsData);

      // Load allocations from all projects
      const allAllocations: Allocation[] = [];

      for (const project of projectsData) {
        try {
          const allocResponse = await bomApi.getProjectAllocations(project.id, { page: 1, size: 1000 });
          const allocData = allocResponse?.data?.items || allocResponse?.items || allocResponse?.data?.content || allocResponse?.content || [];

          allocData.forEach((alloc: any) => {
            allAllocations.push({
              id: alloc.id || alloc.materialId,
              projectId: project.id,
              projectName: project.name,
              projectCode: project.code,
              materialId: alloc.materialId,
              materialName: alloc.materialName || alloc.name,
              materialCategory: alloc.materialCategory || alloc.category,
              requiredQuantity: alloc.requiredQty || alloc.allocatedQty || 0,
              allocatedQuantity: alloc.allocatedQty || 0,
              unit: alloc.unit,
            });
          });
        } catch (err) {
          console.error(`Failed to load allocations for project ${project.id}:`, err);
        }
      }

      setAllocations(allAllocations);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open create dialog
  const handleCreate = () => {
    setCurrentAllocation({
      requiredQuantity: 0,
    });
    setEditMode(false);
    setShowDialog(true);
  };

  // Open edit dialog
  const handleEdit = (allocation: Allocation) => {
    setCurrentAllocation({
      id: allocation.id,
      projectId: allocation.projectId,
      materialId: allocation.materialId,
      requiredQuantity: allocation.requiredQuantity,
    });
    setEditMode(true);
    setShowDialog(true);
  };

  // Save allocation (create or update)
  const handleSave = async () => {
    if (!currentAllocation.projectId) {
      toast.error("Please select a project");
      return;
    }
    if (!currentAllocation.materialId) {
      toast.error("Please select a material");
      return;
    }
    if (!currentAllocation.requiredQuantity || currentAllocation.requiredQuantity <= 0) {
      toast.error("Please enter a valid required quantity");
      return;
    }

    try {
      if (editMode) {
        // Update existing allocation
        await bomApi.updateBomAllocation(
          currentAllocation.projectId,
          currentAllocation.materialId,
          { quantity: currentAllocation.requiredQuantity }
        );
        toast.success("Allocation updated successfully");
      } else {
        // Create new allocation
        await bomApi.createProjectAllocation(currentAllocation.projectId, {
          materialId: String(currentAllocation.materialId),
          quantity: currentAllocation.requiredQuantity,
        });
        toast.success("Allocation created successfully");
      }

      setShowDialog(false);
      loadData();
    } catch (error: any) {
      console.error("Failed to save allocation:", error);
      toast.error(error?.response?.data?.message || "Failed to save allocation");
    }
  };

  const confirmDelete = (allocation: Allocation) => {
    setAllocationToDelete(allocation);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!allocationToDelete) return;

    try {
      await bomApi.deleteProjectAllocation(allocationToDelete.projectId, allocationToDelete.materialId);
      toast.success("Allocation deleted successfully");
      loadData();
      setShowDeleteConfirm(false);
      setAllocationToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete allocation:", error);
      toast.error(error?.response?.data?.message || "Failed to delete allocation");
    }
  };

  // Filtering logic
  const filteredData = useMemo(() => {
    if (!globalFilter) return allocations;
    const lower = globalFilter.toLowerCase();
    return allocations.filter(item =>
      item.projectName.toLowerCase().includes(lower) ||
      item.materialName.toLowerCase().includes(lower) ||
      (item.projectCode && item.projectCode.toLowerCase().includes(lower))
    );
  }, [allocations, globalFilter]);

  const columns: ColumnDef<Allocation>[] = [
    {
      header: "Project",
      field: "projectName",
      body: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.projectName}</div>
          {row.projectCode && <div className="text-xs text-slate-500">{row.projectCode}</div>}
        </div>
      )
    },
    {
      header: "Material",
      field: "materialName",
      body: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.materialName}</div>
          {row.materialCategory && <div className="text-xs text-slate-500">{row.materialCategory}</div>}
        </div>
      )
    },
    {
      header: "Required Quantity",
      field: "requiredQuantity",
      body: (row) => (
        <div>
          <div className="font-semibold text-slate-900">
            {row.requiredQuantity} {row.unit || ""}
          </div>
          {row.allocatedQuantity !== undefined && (
            <div className="text-xs text-slate-500">
              Allocated: {row.allocatedQuantity}
            </div>
          )}
        </div>
      )
    },
    {
      header: "Actions",
      field: "id", // Dummy field
      width: 100,
      body: (row) => (
        <div className="flex gap-2">
          <CustomButton
            size="small"
            variant="text"
            onClick={() => handleEdit(row)}
            title="Edit"
            className="!p-1 !min-w-0 text-blue-600 hover:bg-blue-50"
          >
            <FiEdit2 size={14} />
          </CustomButton>
          <CustomButton
            size="small"
            variant="text"
            onClick={() => confirmDelete(row)}
            title="Delete"
            className="!p-1 !min-w-0 text-red-600 hover:bg-red-50"
          >
            <FiTrash2 size={14} />
          </CustomButton>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xs font-bold text-slate-900">Allocated Materials</h2>
          <p className="text-xs text-slate-600">Manage material allocations for projects</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="w-64">
            <CustomTextField
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              size="small"
              startAdornment={<span className="text-slate-400 mr-2"><FiEdit2 className="invisible" /></span>} // Hack or use proper search icon if CustomTextField supports it, or it supports startAdornment
            // Wait, CustomTextField supports startAdornment.
            />
          </div>
          <CustomButton
            startIcon={<FiPlus />}
            onClick={handleCreate}
          >
            Add Allocation
          </CustomButton>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CustomTable
          data={filteredData}
          columns={columns}
          loading={loading}
          pagination
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          emptyMessage="No allocations found"
        />
      </div>

      {/* Edit/Create Modal */}
      <CustomModal
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={editMode ? "Edit Allocation" : "Create Allocation"}
        footer={
          <>
            <CustomButton variant="outlined" onClick={() => setShowDialog(false)}>
              Cancel
            </CustomButton>
            <CustomButton onClick={handleSave}>
              Save
            </CustomButton>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <CustomSelect
            label="Project"
            value={currentAllocation.projectId}
            onChange={(val) => setCurrentAllocation({ ...currentAllocation, projectId: Number(val) })}
            options={projects.map(p => ({ label: p.name, value: p.id }))}
            disabled={editMode}
            required
          />

          <CustomSelect
            label="Material"
            value={currentAllocation.materialId}
            onChange={(val) => setCurrentAllocation({ ...currentAllocation, materialId: Number(val) })}
            options={materials.map(m => ({ label: m.name, value: m.id }))}
            disabled={editMode}
            required
          />

          <CustomTextField
            label="Required Quantity"
            type="number"
            value={currentAllocation.requiredQuantity ?? ''}
            onChange={(e) => setCurrentAllocation({ ...currentAllocation, requiredQuantity: Number(e.target.value) })}
            required
          />
        </div>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Deletion"
        footer={
          <>
            <CustomButton variant="outlined" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </CustomButton>
            <CustomButton color="error" onClick={handleDelete}>
              Delete
            </CustomButton>
          </>
        }
      >
        <div className="flex items-center gap-3 text-slate-700">
          <FiAlertTriangle className="text-red-500 text-xs flex-shrink-0" />
          <p>
            Are you sure you want to delete the allocation for <strong>{allocationToDelete?.materialName}</strong> in project <strong>{allocationToDelete?.projectName}</strong>?
          </p>
        </div>
      </CustomModal>
    </div>
  );
};

export default AllocatedMaterialsManagementPage;
