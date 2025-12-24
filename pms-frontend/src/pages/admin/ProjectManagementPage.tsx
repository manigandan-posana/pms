import React, { useEffect } from 'react';
import { Box, Stack, Typography, Paper, Chip, Alert } from '@mui/material';
import AdminDataTable from '../../components/AdminDataTable';
import AdminFormModal from '../../components/AdminFormModal';
import { useCRUD } from '../../hooks/useCRUD';

export interface Project {
  id: string | number;
  code: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  budget: number;
  manager?: string;
}

// Mock API functions - Replace with actual API calls
const mockProjectAPI = {
  fetchAll: async (): Promise<Project[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            code: 'PRJ001',
            name: 'Website Redesign',
            description: 'Redesign the company website',
            status: 'ACTIVE',
            startDate: '2024-01-01',
            budget: 50000,
            manager: 'John Doe',
          },
          {
            id: 2,
            code: 'PRJ002',
            name: 'Mobile App',
            description: 'Develop mobile application',
            status: 'ACTIVE',
            startDate: '2024-02-01',
            budget: 100000,
            manager: 'Jane Smith',
          },
        ]);
      }, 1000);
    });
  },

  create: async (data: Partial<Project>): Promise<Project> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          ...data,
          status: 'ACTIVE',
          startDate: new Date().toISOString().split('T')[0],
        } as Project);
      }, 500);
    });
  },

  update: async (id: string | number, data: Partial<Project>): Promise<Project> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id, ...data } as Project);
      }, 500);
    });
  },

  delete: async (_id: string | number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },
};

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'ON_HOLD': return 'warning';
    case 'COMPLETED': return 'info';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

export const ProjectManagementPageV3: React.FC = () => {
  const crud = useCRUD<Project>({
    onFetch: mockProjectAPI.fetchAll,
    onCreate: mockProjectAPI.create,
    onUpdate: mockProjectAPI.update,
    onDelete: mockProjectAPI.delete,
    successMessage: {
      create: 'Project created successfully',
      update: 'Project updated successfully',
      delete: 'Project deleted successfully',
    },
  });

  useEffect(() => {
    crud.fetchData();
  }, []);

  const columns = [
    {
      field: 'code',
      header: 'Project Code',
      sortable: true,
      filterable: true,
      width: '12%',
      body: (row: Project) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {row.code}
        </Typography>
      ),
    },
    {
      field: 'name',
      header: 'Project Name',
      sortable: true,
      filterable: true,
      width: '20%',
      body: (row: Project) => (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {row.name}
        </Typography>
      ),
    },
    {
      field: 'description',
      header: 'Description',
      sortable: false,
      filterable: true,
      width: '20%',
      body: (row: Project) => (
        <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
          {row.description}
        </Typography>
      ),
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      width: '12%',
      body: (row: Project) => (
        <Chip
          label={row.status}
          size="small"
          color={getStatusColor(row.status) as any}
          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'startDate',
      header: 'Start Date',
      sortable: true,
      width: '12%',
      body: (row: Project) => (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {new Date(row.startDate).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'budget',
      header: 'Budget',
      sortable: true,
      width: '12%',
      body: (row: Project) => (
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          ${row.budget.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'manager',
      header: 'Project Manager',
      sortable: true,
      filterable: true,
      width: '12%',
      body: (row: Project) => (
        <Typography variant="caption">{row.manager || '-'}</Typography>
      ),
    },
  ];

  const formFields = [
    {
      name: 'code',
      label: 'Project Code',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., PRJ001',
      disabled: crud.isEditing,
    },
    {
      name: 'name',
      label: 'Project Name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter project name',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      placeholder: 'Enter project description',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      required: true,
      options: statusOptions,
    },
    {
      name: 'startDate',
      label: 'Start Date',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'endDate',
      label: 'End Date (Optional)',
      type: 'date' as const,
    },
    {
      name: 'budget',
      label: 'Budget ($)',
      type: 'number' as const,
      required: true,
      placeholder: '0.00',
    },
    {
      name: 'manager',
      label: 'Project Manager',
      type: 'text' as const,
      placeholder: 'Manager name',
    },
  ];

  const handleEdit = (project: Project) => {
    crud.openEditModal(project);
  };

  const handleDelete = (project: Project) => {
    if (
      window.confirm(
        `Are you sure you want to delete project "${project.name}"? This action cannot be undone.`
      )
    ) {
      crud.delete(project.id);
    }
  };

  const handleSave = async () => {
    const dataToSave = crud.formData;

    if (!dataToSave.name?.trim() || !dataToSave.code?.trim()) {
      return;
    }

    try {
      await crud.save(dataToSave);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {crud.error && (
        <Alert severity="error" sx={{ fontSize: '0.75rem', py: 0.5 }}>
          {crud.error}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <AdminDataTable
          data={crud.data}
          columns={columns}
          title="Project Management"
          loading={crud.loading}
          totalRecords={crud.data.length}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={crud.openCreateModal}
        />
      </Paper>

      <AdminFormModal
        visible={crud.modalOpen}
        title={crud.isEditing ? 'Edit Project' : 'Create New Project'}
        fields={formFields}
        data={crud.formData as any}
        onDataChange={crud.updateFormData}
        onSubmit={handleSave}
        onHide={crud.closeModal}
        loading={crud.loading}
        submitLabel={crud.isEditing ? 'Update' : 'Create'}
      />
    </Box>
  );
};

export default ProjectManagementPageV3;
