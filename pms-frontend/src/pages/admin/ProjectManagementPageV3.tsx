import React, { useEffect } from 'react';
import AdminDataTable from '../../components/AdminDataTable';
import AdminFormModal from '../../components/AdminFormModal';
import { useCRUD } from '../../hooks/useCRUD';
import { Message } from 'primereact/message';

// Example: Project Management Page using useCRUD hook

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
    // Simulated API call
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

export const ProjectManagementPageV3: React.FC = () => {
  // const [selectedProjectId] = useState<string>("");
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

  // Load data on mount
  useEffect(() => {
    crud.fetchData();
  }, []);

  // Table columns
  const columns = [
    {
      field: 'code',
      header: 'Project Code',
      sortable: true,
      filterable: true,
      width: '12%',
      body: (row: Project) => (
        <span className="font-mono font-semibold text-xs">{row.code}</span>
      ),
    },
    {
      field: 'name',
      header: 'Project Name',
      sortable: true,
      filterable: true,
      width: '20%',
      body: (row: Project) => <span className="font-medium">{row.name}</span>,
    },
    {
      field: 'description',
      header: 'Description',
      sortable: false,
      filterable: true,
      width: '20%',
      body: (row: Project) => (
        <span className="text-xs text-gray-600 truncate">{row.description}</span>
      ),
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      width: '12%',
      body: (row: Project) => (
        <span
          className={`
            px-3 py-1 rounded text-xs font-semibold text-white
            ${
              row.status === 'ACTIVE'
                ? 'bg-green-500'
                : row.status === 'ON_HOLD'
                  ? 'bg-yellow-500'
                  : row.status === 'COMPLETED'
                    ? 'bg-blue-500'
                    : 'bg-red-500'
            }
          `}
        >
          {row.status}
        </span>
      ),
    },
    {
      field: 'startDate',
      header: 'Start Date',
      sortable: true,
      width: '12%',
      body: (row: Project) => (
        <span className="text-xs text-gray-600">
          {new Date(row.startDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      field: 'budget',
      header: 'Budget',
      sortable: true,
      width: '12%',
      body: (row: Project) => (
        <span className="font-semibold">${row.budget.toLocaleString()}</span>
      ),
    },
    {
      field: 'manager',
      header: 'Project Manager',
      sortable: true,
      filterable: true,
      width: '12%',
      body: (row: Project) => (
        <span className="text-xs">{row.manager || '-'}</span>
      ),
    },
  ];

  // Form fields
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

  // Handle edit
  const handleEdit = (project: Project) => {
    crud.openEditModal(project);
  };

  // Handle delete
  const handleDelete = (project: Project) => {
    if (
      window.confirm(
        `Are you sure you want to delete project "${project.name}"? This action cannot be undone.`
      )
    ) {
      crud.delete(project.id);
    }
  };

  // Handle save
  const handleSave = async () => {
    const dataToSave = crud.formData;

    // Validation
    if (!dataToSave.name?.trim()) {
      return;
    }
    if (!dataToSave.code?.trim()) {
      return;
    }

    try {
      await crud.save(dataToSave);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {crud.error && (
        <Message severity="error" text={crud.error} className="mb-4" />
      )}

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
    </div>
  );
};

export default ProjectManagementPageV3;
