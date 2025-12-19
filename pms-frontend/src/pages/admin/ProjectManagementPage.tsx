import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFilter, FiX } from "react-icons/fi";

import {
  clearProjectError,
  createProject,
  deleteProject,
  searchProjects,
  updateProject,
} from "../../store/slices/adminProjectsSlice";
import type { RootState, AppDispatch } from "../../store/store";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";

// ---- Types ----

type LoadingStatus = "idle" | "loading" | "succeeded" | "failed";

export interface Project {
  id: number | string;
  code: string;
  name: string;
}

interface AdminProjectsAvailableFilters {
  prefixes: string[];
}

interface AdminProjectsState {
  items: Project[];
  totalItems: number;
  totalPages: number;
  status: LoadingStatus;
  availableFilters: AdminProjectsAvailableFilters;
  error: string | null;
}

interface ProjectFormFields {
  code: string;
  name: string;
}

type ModalMode = "create" | "edit";

interface ProjectModalState {
  open: boolean;
  mode: ModalMode;
  projectId: number | string | null;
  fields: ProjectFormFields;
  saving: boolean;
}

interface ProjectFilters {
  prefixes: string[];
  allocation: string;
}

interface ProjectManagementPageProps {
  onRequestReload?: () => void;
}

// ---- Helpers ----

const emptyProject: ProjectFormFields = { code: "", name: "" };

const createEmptyModal = (): ProjectModalState => ({
  open: false,
  mode: "create",
  projectId: null,
  fields: { ...emptyProject },
  saving: false,
});

// ---- Main Component ----

const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({
  onRequestReload,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const token = useSelector((state: RootState) => state.auth.token);

  const {
    items: projects,
    totalItems,
    status,
    availableFilters,
    error,
  } = useSelector<RootState, AdminProjectsState>(
    (state) => state.adminProjects as AdminProjectsState
  );

  const loading = status === "loading";

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<ProjectFilters>({
    prefixes: [],
    allocation: "",
  });
  const [modalState, setModalState] = useState<ProjectModalState>(createEmptyModal);

  const loadProjects = useCallback(async () => {
    if (!token) return;
    await dispatch(
      searchProjects({
        token,
        query: {
          page: page + 1,
          size: pageSize,
          search,
          startsWith: filters.prefixes,
          allocation: filters.allocation,
        },
      })
    );
  }, [dispatch, filters.allocation, filters.prefixes, page, pageSize, search, token]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearProjectError());
    }
  }, [dispatch, error]);

  const closeModal = () => setModalState(createEmptyModal());

  const openCreateProject = () => {
    setModalState({ ...createEmptyModal(), open: true });
  };

  const openEditProject = (project: Project) => {
    setModalState({
      open: true,
      mode: "edit",
      projectId: project.id,
      fields: { code: project.code || "", name: project.name || "" },
      saving: false,
    });
  };

  const handleFieldChange = (field: keyof ProjectFormFields, value: string) => {
    setModalState((prev) => ({
      ...prev,
      fields: { ...prev.fields, [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!token) return;
    const payload = {
      code: modalState.fields.code?.trim() || undefined,
      name: modalState.fields.name?.trim() || "",
    };
    if (!payload.name) {
      toast.error("Project name is required");
      return;
    }
    setModalState((prev) => ({ ...prev, saving: true }));
    try {
      if (modalState.mode === "edit" && modalState.projectId != null) {
        await dispatch(
          updateProject({ projectId: String(modalState.projectId), payload })
        ).unwrap();
        toast.success("Project updated");
      } else {
        await dispatch(createProject(payload)).unwrap();
        toast.success("Project created");
      }
      closeModal();
      await loadProjects();
      onRequestReload?.();
    } catch (err: unknown) {
      setModalState((prev) => ({ ...prev, saving: false }));
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unable to save project";
      toast.error(message);
    }
  };

  const handleDelete = async (projectId: number | string | null | undefined) => {
    if (!token || projectId == null) return;
    const confirmDelete =
      typeof window === "undefined"
        ? true
        : window.confirm("Delete this project?");
    if (!confirmDelete) return;
    try {
      await dispatch(deleteProject(projectId)).unwrap();
      toast.success("Project removed");
      await loadProjects();
      onRequestReload?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unable to delete project";
      toast.error(message);
    }
  };

  const columns: ColumnDef<Project>[] = [
    {
      field: 'code',
      header: 'Code',
      width: '150px',
      body: (row) => <span className="font-mono font-bold text-slate-700">{row.code || '—'}</span>
    },
    {
      field: 'name',
      header: 'Project Name',
      body: (row) => <span className="font-medium text-slate-800">{row.name || '—'}</span>
    },
    {
      field: 'id',
      header: 'Actions',
      width: '100px',
      align: 'right',
      body: (row) => (
        <div className="flex justify-end gap-2">
          <CustomButton
            variant="text"
            size="small"
            onClick={() => openEditProject(row)}
            className="text-slate-500 hover:text-blue-600 p-1 min-w-0"
            title="Edit"
          >
            <FiEdit2 size={16} />
          </CustomButton>
          <CustomButton
            variant="text"
            size="small"
            onClick={() => handleDelete(row.id)}
            className="text-slate-500 hover:text-red-600 p-1 min-w-0"
            title="Delete"
          >
            <FiTrash2 size={16} />
          </CustomButton>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* Header & Controls */}
        <div className="flex flex-col gap-4 sticky top-0 bg-slate-50 z-10 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xs font-bold text-slate-800">Projects</h1>
              <p className="text-slate-500">Manage company projects and codes</p>
            </div>
            <CustomButton
              startIcon={<FiPlus />}
              onClick={openCreateProject}
              className="shadow-sm"
            >
              Create Project
            </CustomButton>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <CustomTextField
                placeholder="Search projects..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                size="small"
                InputProps={{
                  startAdornment: <FiSearch className="text-slate-400 mr-2" />
                }}
              />
            </div>
            <CustomButton
              variant={filtersOpen ? "outlined" : "text"}
              onClick={() => setFiltersOpen(!filtersOpen)}
              size="small"
              startIcon={filtersOpen ? <FiX /> : <FiFilter />}
              className="text-slate-600"
            >
              {filtersOpen ? "Close Filters" : "Filters"}
            </CustomButton>
          </div>

          {filtersOpen && (
            <div className="grid gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:grid-cols-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <CustomSelect
                label="Code Starts With"
                multiple
                value={filters.prefixes}
                options={availableFilters.prefixes.map((p) => ({ label: p, value: p }))}
                onChange={(val: any) => {
                  setFilters((prev) => ({ ...prev, prefixes: Array.isArray(val) ? val : [] }));
                  setPage(0);
                }}
              />
              <CustomSelect
                label="Allocation"
                value={filters.allocation}
                options={[
                  { label: 'Any', value: '' },
                  { label: 'Allocated', value: 'ALLOCATED' },
                  { label: 'Unallocated', value: 'UNALLOCATED' }
                ]}
                onChange={(val: any) => {
                  setFilters((prev) => ({ ...prev, allocation: val }));
                  setPage(0);
                }}
              />
              <div className="md:col-start-3 flex justify-end">
                <CustomButton
                  variant="text"
                  size="small"
                  onClick={() => { setFilters({ prefixes: [], allocation: '' }); setSearch(''); setPage(0); }}
                  className="text-xs text-slate-500"
                >
                  Reset All Filters
                </CustomButton>
              </div>
            </div>
          )}
        </div>

        {/* Projects table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <CustomTable
            data={projects}
            columns={columns}
            loading={loading}
            pagination
            rows={pageSize}
            page={page}
            totalRecords={totalItems}
            onPageChange={(p, rows) => {
              setPage(p);
              setPageSize(rows);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            emptyMessage="No projects found matching your criteria"
          />
        </div>

        {/* Add / Edit modal */}
        <CustomModal
          open={modalState.open}
          title={modalState.mode === "edit" ? "Edit Project" : "Create Project"}
          onClose={closeModal}
          footer={
            <div className="flex justify-end gap-2">
              <CustomButton variant="text" onClick={closeModal}>Cancel</CustomButton>
              <CustomButton
                onClick={handleSubmit}
                loading={modalState.saving}
                disabled={modalState.saving}
              >
                {modalState.saving ? 'Saving...' : 'Save'}
              </CustomButton>
            </div>
          }
        >
          <div className="grid gap-4 py-2">
            <CustomTextField
              label="Code (auto-generated if empty)"
              value={modalState.fields.code}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              placeholder="Leave empty for auto-generation"
            />
            <CustomTextField
              label="Project Name *"
              value={modalState.fields.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="New Project"
            />
          </div>
        </CustomModal>
      </div>
    </div>
  );
};

export default ProjectManagementPage;
