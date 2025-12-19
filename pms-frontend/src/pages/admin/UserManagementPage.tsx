import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFilter, FiX } from "react-icons/fi";

import {
  clearUserError,
  createUser,
  deleteUser,
  loadUserProjects,
  searchUsers,
  updateUser,
} from "../../store/slices/adminUsersSlice";
import type { RootState, AppDispatch } from "../../store/store";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";

// -------- Types --------

export type UserRole =
  | "ADMIN"
  | "CEO"
  | "COO"
  | "PROCUREMENT_MANAGER"
  | "PROJECT_HEAD"
  | "PROJECT_MANAGER"
  | "USER";

export type AccessType = "ALL" | "PROJECTS";

type LoadingStatus = "idle" | "loading" | "succeeded" | "failed";

export interface Project {
  id: number | string;
  code: string;
  name: string;
}

export interface UserProjectRef extends Project { }

export interface User {
  id: number | string;
  name: string;
  email?: string | null;
  role: UserRole;
  accessType: AccessType;
  projects?: UserProjectRef[];
}

interface AdminUsersAvailableFilters {
  roles: UserRole[];
  accessTypes: AccessType[];
  projects: (number | string)[];
}

interface AdminUsersState {
  items: User[];
  projects: Project[];
  totalItems: number;
  totalPages: number;
  availableFilters: AdminUsersAvailableFilters;
  status: LoadingStatus;
  error: string | null;
}

interface UserFilters {
  roles: UserRole[];
  accessTypes: AccessType[];
  projectIds: string[];
}

type ModalMode = "create" | "edit";

interface UserModalFields {
  name: string;
  email: string;
  role: UserRole;
  accessType: AccessType;
  projectIds: string[];
}

interface UserModalState {
  open: boolean;
  mode: ModalMode;
  userId: number | string | null;
  saving: boolean;
  fields: UserModalFields;
}

interface UserManagementPageProps {
  onRequestReload?: () => void;
}

interface RoleOption {
  value: UserRole;
  label: string;
}

interface AccessOption {
  value: AccessType;
  label: string;
}

interface ProjectFilterOption {
  value: string;
  label: string;
}

// -------- Constants --------

const roleOptions: RoleOption[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "CEO", label: "CEO" },
  { value: "COO", label: "COO" },
  { value: "PROCUREMENT_MANAGER", label: "Procurement Manager" },
  { value: "PROJECT_HEAD", label: "Project Head" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "USER", label: "User" },
];

const accessOptions: AccessOption[] = [
  { value: "ALL", label: "All Projects" },
  { value: "PROJECTS", label: "Specific Projects" },
];

const elevatedRoles: Set<UserRole> = new Set([
  "ADMIN",
  "CEO",
  "COO",
  "PROCUREMENT_MANAGER",
  "PROJECT_HEAD",
  "PROJECT_MANAGER",
]);

const projectScopedRoles: Set<UserRole> = new Set([
  "PROJECT_MANAGER",
  "USER",
]);

const createEmptyModal = (): UserModalState => ({
  open: false,
  mode: "create",
  userId: null,
  saving: false,
  fields: {
    name: "",
    email: "",
    role: "USER",
    accessType: "PROJECTS",
    projectIds: [],
  },
});

// -------- Main component --------

const UserManagementPage: React.FC<UserManagementPageProps> = ({
  onRequestReload,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const token = useSelector((state: RootState) => state.auth.token);

  const {
    items: users,
    projects,
    totalItems,
    availableFilters,
    status,
    error,
  } = useSelector<RootState, AdminUsersState>(
    (state) => state.adminUsers as AdminUsersState
  );

  const loading = status === "loading";

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<UserFilters>({
    roles: [],
    accessTypes: [],
    projectIds: [],
  });
  const [modalState, setModalState] = useState<UserModalState>(createEmptyModal);

  // ---- Data loading ----

  const loadUsers = useCallback(async () => {
    if (!token) return;
    await dispatch(
      searchUsers({
        token,
        query: {
          page: page + 1,
          size: pageSize,
          search,
          role: filters.roles,
          accessType: filters.accessTypes,
          projectId: filters.projectIds,
        },
      })
    );
  }, [dispatch, filters.accessTypes, filters.projectIds, filters.roles, page, pageSize, search, token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (token) {
      dispatch(loadUserProjects(token));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUserError());
    }
  }, [dispatch, error]);

  // ---- Modal helpers ----

  const closeModal = () => setModalState(createEmptyModal());

  const openCreateUser = () => {
    setModalState({ ...createEmptyModal(), open: true });
  };

  const openEditUser = (user: User) => {
    setModalState({
      open: true,
      mode: "edit",
      userId: user.id,
      saving: false,
      fields: {
        name: user.name || "",
        email: user.email || "",
        role: user.role || "USER",
        accessType:
          user.accessType ||
          (elevatedRoles.has(user.role) ? "ALL" : "PROJECTS"),
        projectIds: (user.projects || []).map((project) => String(project.id)),
      },
    });
  };

  const handleFieldChange = <K extends keyof UserModalFields>(
    field: K,
    value: UserModalFields[K]
  ) => {
    setModalState((prev) => ({
      ...prev,
      fields: { ...prev.fields, [field]: value },
    }));
  };

  const handleRoleChange = (value: UserRole) => {
    setModalState((prev) => {
      const nextAccess: AccessType = elevatedRoles.has(value)
        ? "ALL"
        : prev.fields.accessType || "PROJECTS";
      const nextProjects: string[] = projectScopedRoles.has(value)
        ? prev.fields.projectIds
        : [];
      return {
        ...prev,
        fields: {
          ...prev.fields,
          role: value,
          accessType: nextAccess,
          projectIds: nextProjects,
        },
      };
    });
  };

  const requiresProjects = projectScopedRoles.has(modalState.fields.role);
  const accessLocked = elevatedRoles.has(modalState.fields.role);

  // ---- Submit / delete ----

  interface UserPayload {
    name: string;
    email: string;
    role: UserRole;
    accessType: AccessType;
    projectIds: string[];
  }

  const handleSubmit = async () => {
    if (!token) return;

    const rawName = modalState.fields.name.trim();
    const rawEmail = modalState.fields.email.trim();

    if (!rawName) {
      toast.error("Name is required");
      return;
    }
    if (!rawEmail) {
      toast.error("Email is required for Microsoft authentication");
      return;
    }
    if (
      requiresProjects &&
      (!modalState.fields.projectIds ||
        modalState.fields.projectIds.length === 0)
    ) {
      toast.error("Select at least one project");
      return;
    }

    const payload: UserPayload = {
      name: rawName,
      email: rawEmail,
      role: modalState.fields.role,
      accessType: modalState.fields.accessType,
      projectIds: modalState.fields.projectIds,
    };

    setModalState((prev) => ({ ...prev, saving: true }));
    try {
      if (modalState.mode === "edit" && modalState.userId != null) {
        await dispatch(
          updateUser({
            token,
            userId: String(modalState.userId),
            payload,
          })
        ).unwrap();
        toast.success("User updated");
      } else {
        await dispatch(createUser(payload)).unwrap();
        toast.success("User created");
      }
      closeModal();
      await loadUsers();
      onRequestReload?.();
    } catch (err: unknown) {
      setModalState((prev) => ({ ...prev, saving: false }));
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unable to save user";
      toast.error(message);
    }
  };

  const handleDelete = async (userId: number | string | null | undefined) => {
    if (!token || userId == null) return;
    const confirmDelete =
      typeof window === "undefined"
        ? true
        : window.confirm("Delete this user?");
    if (!confirmDelete) return;
    try {
      await dispatch(deleteUser({ token, userId: String(userId) })).unwrap();
      toast.success("User removed");
      await loadUsers();
      onRequestReload?.();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unable to delete user";
      toast.error(message);
    }
  };

  // ---- Filter options ----

  const filterRoleOptions = useMemo<UserRole[]>(
    () =>
      availableFilters.roles.length
        ? availableFilters.roles
        : roleOptions.map((r) => r.value),
    [availableFilters.roles]
  );

  const filterAccessOptions = useMemo<AccessType[]>(
    () =>
      availableFilters.accessTypes.length
        ? availableFilters.accessTypes
        : accessOptions.map((option) => option.value),
    [availableFilters.accessTypes]
  );

  const projectFilterOptions = useMemo<ProjectFilterOption[]>(
    () =>
      availableFilters.projects.length
        ? availableFilters.projects.map((value) => {
          const lookup = projects.find(
            (project) => String(project.id) === String(value)
          );
          return {
            value: String(value),
            label: lookup
              ? `${lookup.code} - ${lookup.name}`
              : String(value),
          };
        })
        : projects.map((project) => ({
          value: String(project.id),
          label: `${project.code} - ${project.name}`,
        })),
    [availableFilters.projects, projects]
  );

  // ---- Table Columns ----

  const columns: ColumnDef<User>[] = [
    { field: 'name', header: 'Name', sortable: true, body: (row) => <span className="font-semibold text-slate-800">{row.name}</span> },
    { field: 'email', header: 'Email', sortable: true, body: (row) => <span className="text-slate-600">{row.email || '—'}</span> },
    { field: 'role', header: 'Role', sortable: true, body: (row) => <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{roleOptions.find(r => r.value === row.role)?.label || row.role}</span> },
    { field: 'accessType', header: 'Access', width: '120px', body: (row) => <span className="text-xs text-slate-500">{row.accessType}</span> },
    {
      field: 'projects',
      header: 'Projects',
      body: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.projects || []).slice(0, 3).map(p => (
            <span key={p.id} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-100">
              {p.code}
            </span>
          ))}
          {(row.projects || []).length > 3 && (
            <span className="text-[10px] text-slate-400">+{row.projects!.length - 3} more</span>
          )}
          {(!row.projects || row.projects.length === 0) && <span className="text-slate-400">—</span>}
        </div>
      )
    },
    {
      field: 'id', // Actions
      header: 'Actions',
      width: '100px',
      align: 'right',
      body: (row) => (
        <div className="flex justify-end gap-2">
          <CustomButton
            variant="text"
            size="small"
            onClick={() => openEditUser(row)}
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
              <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
              <p className="text-slate-500">Manage system users, roles, and project assignments</p>
            </div>
            <CustomButton
              startIcon={<FiPlus />}
              onClick={openCreateUser}
              className="shadow-sm"
            >
              Add User
            </CustomButton>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <CustomTextField
                placeholder="Search users..."
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
              variant={filtersOpen ? "secondary" : "text"}
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
                label="Roles"
                multiple
                value={filters.roles}
                options={filterRoleOptions.map((r) => ({ label: roleOptions.find(opt => opt.value === r)?.label || r, value: r }))}
                onChange={(val: any) => {
                  setFilters((prev) => ({ ...prev, roles: Array.isArray(val) ? val : [] }));
                  setPage(0);
                }}
              />
              <CustomSelect
                label="Access Type"
                multiple
                value={filters.accessTypes}
                options={filterAccessOptions.map((a) => ({ label: accessOptions.find(opt => opt.value === a)?.label || a, value: a }))}
                onChange={(val: any) => {
                  setFilters((prev) => ({ ...prev, accessTypes: Array.isArray(val) ? val : [] }));
                  setPage(0);
                }}
              />
              <CustomSelect
                label="Projects"
                multiple
                value={filters.projectIds}
                options={projectFilterOptions}
                onChange={(val: any) => {
                  setFilters((prev) => ({ ...prev, projectIds: Array.isArray(val) ? val : [] }));
                  setPage(0);
                }}
              />
              <div className="md:col-span-3 flex justify-end">
                <CustomButton
                  variant="text"
                  size="small"
                  onClick={() => { setFilters({ roles: [], accessTypes: [], projectIds: [] }); setSearch(''); setPage(0); }}
                  className="text-sm text-slate-500"
                >
                  Reset All Filters
                </CustomButton>
              </div>
            </div>
          )}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <CustomTable
            data={users}
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
            emptyMessage="No users found matching your criteria"
          />
        </div>

        {/* Add / Edit modal */}
        <CustomModal
          open={modalState.open}
          title={modalState.mode === "edit" ? "Edit User" : "Add User"}
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
              label="Name *"
              value={modalState.fields.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Jane Doe"
            />

            <div>
              <CustomTextField
                label="Email (Microsoft) *"
                value={modalState.fields.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="user@example.com"
              />
              <p className="text-xs text-slate-400 mt-1">User must login with this Microsoft email</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <CustomSelect
                label="Role"
                value={modalState.fields.role}
                options={roleOptions.map(r => ({ label: r.label, value: r.value }))}
                onChange={(val: any) => handleRoleChange(val as UserRole)}
              />

              <div>
                <CustomSelect
                  label="Access"
                  value={modalState.fields.accessType}
                  options={accessOptions.map(a => ({ label: a.label, value: a.value }))}
                  onChange={(val: any) => handleFieldChange('accessType', val as AccessType)}
                  disabled={accessLocked}
                />
                {accessLocked && <p className="text-xs text-slate-400 mt-1">Access is fixed for elevated roles</p>}
              </div>
            </div>

            {requiresProjects && (
              <div>
                <CustomSelect
                  label="Assigned Projects"
                  multiple
                  value={modalState.fields.projectIds}
                  options={projects.map(p => ({ label: `${p.code} — ${p.name}`, value: String(p.id) }))}
                  onChange={(val: any) => handleFieldChange('projectIds', Array.isArray(val) ? val as string[] : [])}
                />
                <p className="text-xs text-slate-400 mt-1">Select projects this user can access</p>
              </div>
            )}
          </div>
        </CustomModal>
      </div>
    </div>
  );
};

export default UserManagementPage;
