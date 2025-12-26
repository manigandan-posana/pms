import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Box, Stack, Typography, Paper, Chip, Alert } from "@mui/material";
import {
  createUser,
  deleteUser,
  loadUserProjects,
  searchUsers,
  updateUser,
} from "../../store/slices/adminUsersSlice";
import type { RootState, AppDispatch } from "../../store/store";
import AdminDataTable from "../../components/AdminDataTable";
import AdminFormModal from "../../components/AdminFormModal";

export type UserRole = "ADMIN" | "USER_PLUS" | "USER";
export type AccessType = "ALL" | "PROJECTS";

interface User {
  id: number | string;
  name?: string;
  email?: string | null;
  role?: UserRole;
  accessType?: AccessType;
  projects?: { id: string | number; name: string; code?: string }[];
  permissions?: string[];
  [key: string]: any;
}

const roleOptions = [
  { label: "Admin", value: "ADMIN" },
  { label: "User Plus", value: "USER_PLUS" },
  { label: "User", value: "USER" },
];

const permissionOptions = [
  { label: "Admin Dashboard", value: "ADMIN_ACCESS" },
  { label: "User Management", value: "USER_MANAGEMENT" },
  { label: "Project Management", value: "PROJECT_MANAGEMENT" },
  { label: "Material Management", value: "MATERIAL_MANAGEMENT" },
  { label: "Material Allocation", value: "MATERIAL_ALLOCATION" },
  { label: "Allocated Materials", value: "ALLOCATED_MATERIALS_VIEW" },
  { label: "Inventory Operations", value: "INVENTORY_OPERATIONS" },
  { label: "Vehicle Management", value: "VEHICLE_MANAGEMENT" },
];

const accessTypeOptions = [
  { label: "All Projects", value: "ALL" },
  { label: "Specific Projects", value: "PROJECTS" },
];

export const UserManagementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);

  const { items: users, totalItems, status, error, projects: availableProjects } = useSelector(
    (state: RootState) => state.adminUsers as any
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "USER" as UserRole,
    accessType: "PROJECTS" as AccessType,
    projectIds: [] as (string | number)[],
    permissions: [] as string[],
  });

  const loading = status === "loading";

  useEffect(() => {
    if (token) {
      dispatch(searchUsers({ search: "", page: 1, size: 50 }));
      dispatch(loadUserProjects());
    }
  }, [token, dispatch]);

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => {
      if (field === "role") {
        const nextRole = value as UserRole;
        const defaultPermissions =
          nextRole === "ADMIN"
            ? permissionOptions.map((p) => p.value)
            : nextRole === "USER"
              ? []
              : prev.permissions;
        const nextAccess = nextRole === "ADMIN" ? "ALL" : prev.accessType;
        return { ...prev, role: nextRole, permissions: defaultPermissions, accessType: nextAccess };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "USER",
      accessType: "PROJECTS",
      projectIds: [],
      permissions: [],
    });
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "USER",
      accessType: user.accessType || "PROJECTS",
      projectIds: user.projects ? user.projects.map(p => String(p.id)) : [],
      permissions: user.permissions || [],
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`
      )
    ) {
      if (token) {
        try {
          await dispatch(deleteUser(String(user.id))).unwrap();
          toast.success("User deleted successfully");
          dispatch(searchUsers({ search: "", page: 1, size: 50 }));
        } catch (err: any) {
          toast.error(err || "Failed to delete user");
        }
      }
    }
  };

  const handleSaveUser = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter user name");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter email");
      return;
    }

    if (!token) return;

    const projectIds =
      formData.accessType === "PROJECTS"
        ? (Array.isArray(formData.projectIds) ? formData.projectIds : [])
          .map((id: string | number) => Number(id))
        : [];

    if (editingUser) {
      try {
        await dispatch(
          updateUser({
            userId: String(editingUser.id),
            payload: {
              name: formData.name,
              email: formData.email,
              role: formData.role,
              accessType: formData.accessType,
              projectIds,
              permissions: formData.permissions,
            },
          })
        ).unwrap();
        toast.success("User updated successfully");
        setModalVisible(false);
        dispatch(searchUsers({ search: "", page: 1, size: 50 }));
      } catch (err: any) {
        toast.error(err || "Failed to update user");
      }
    } else {
      try {
        await dispatch(
          createUser({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            accessType: formData.accessType,
            projectIds,
            permissions: formData.permissions,
          })
        ).unwrap();
        toast.success("User created successfully");
        setModalVisible(false);
        dispatch(searchUsers({ search: "", page: 1, size: 50 }));
      } catch (err: any) {
        toast.error(err || "Failed to create user");
      }
    }
  };

  const columns = [
    {
      field: "name",
      header: "Name",
      sortable: true,
      filterable: true,
      width: "20%",
    },
    {
      field: "email",
      header: "Email",
      sortable: true,
      filterable: true,
      width: "25%",
    },
    {
      field: "role",
      header: "Role",
      sortable: true,
      filterable: true,
      width: "18%",
      body: (row: User) => (
        <Chip
          label={row.role}
          size="small"
          color={row.role === "ADMIN" ? "error" : row.role === "USER_PLUS" ? "warning" : "primary"}
          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
        />
      ),
    },
    {
      field: "accessType",
      header: "Access",
      sortable: true,
      width: "15%",
      body: (row: User) => (
        <Typography
          variant="caption"
          sx={{
            color: row.accessType === "ALL" ? "success.main" : "info.main",
            fontWeight: 500
          }}
        >
          {row.accessType === "ALL" ? "All Projects" : "Specific"}
        </Typography>
      ),
    },
    {
      field: "permissions",
      header: "Permissions",
      sortable: false,
      width: "20%",
      body: (row: User) => (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {(row.permissions && row.permissions.length)
            ? row.permissions.join(', ')
            : 'Workspace Only'}
        </Typography>
      ),
    },
    {
      field: "projects",
      header: "Project Count",
      sortable: false,
      width: "12%",
      body: (row: User) => (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {(row.projects || []).length}
        </Typography>
      ),
    },
  ];

  const formFields = [
    {
      name: "name",
      label: "User Name",
      type: "text" as const,
      required: true,
      placeholder: "Enter full name",
    },
    {
      name: "email",
      label: "Email",
      type: "email" as const,
      required: true,
      placeholder: "user@example.com",
    },
    {
      name: "role",
      label: "Role",
      type: "select" as const,
      required: true,
      options: roleOptions,
    },
    {
      name: "accessType",
      label: "Access Type",
      type: "select" as const,
      required: true,
      options: accessTypeOptions,
    },
    {
      name: "permissions",
      label: "Permissions (User Plus only)",
      type: "select" as const,
      multiple: true,
      options: permissionOptions,
      disabled: formData.role === "USER",
      helperText: formData.role === "ADMIN" ? "Admins automatically receive all permissions." : undefined,
    },
    {
      name: "projectIds",
      label: "Select Projects (only if Specific Projects)",
      type: "select" as const,
      multiple: true,
      options: (availableProjects || []).map((p: any) => ({
        label: `${p.code ? p.code + ' - ' : ''}${p.name}`,
        value: String(p.id)
      })),
      disabled: formData.accessType === "ALL",
      required: formData.accessType === "PROJECTS", // Require selection if specific
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {error && (
        <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0.5 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <AdminDataTable<User>
          data={users}
          columns={columns as any}
          title="User Management"
          loading={loading}
          totalRecords={totalItems}
          onEdit={(row) => handleEditUser(row as User)}
          onDelete={(row) => handleDeleteUser(row as User)}
          onAdd={handleAddUser}
        />
      </Paper>

      <AdminFormModal
        visible={modalVisible}
        title={editingUser ? "Edit User" : "Create New User"}
        fields={formFields}
        data={formData}
        onDataChange={handleFormChange}
        onSubmit={handleSaveUser}
        onHide={() => setModalVisible(false)}
        loading={loading}
        submitLabel={editingUser ? "Update" : "Create"}
      />
    </Box>
  );
};

export default UserManagementPage;
