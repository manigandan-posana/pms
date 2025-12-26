import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Box, Typography, Paper, Chip, Alert } from '@mui/material';
import AdminDataTable from '../../components/AdminDataTable';
import CustomModal from '../../widgets/CustomModal';
import CustomTextField from '../../widgets/CustomTextField';
import CustomButton from '../../widgets/CustomButton';
import type { RootState, AppDispatch } from '../../store/store';
import {
  searchProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../../store/slices/adminProjectsSlice';

interface Project {
  id: string | number;
  code?: string;
  name: string;
  projectManager?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'ON_HOLD': return 'warning';
    case 'COMPLETED': return 'info';
    case 'CANCELLED': return 'error';
    default: return 'success';
  }
};

export const ProjectManagementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: projects, totalItems, status, error } = useSelector(
    (state: RootState) => state.adminProjects
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [saving, setSaving] = useState(false);

  const loading = status === 'loading';

  useEffect(() => {
    dispatch(searchProjects({ page: 1, size: 100 }));
  }, [dispatch]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectManager('');
    setModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectManager(project.projectManager || '');
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingProject(null);
    setProjectName('');
    setProjectManager('');
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingProject) {
        await dispatch(
          updateProject({
            projectId: editingProject.id,
            payload: { name: projectName.trim(), projectManager: projectManager.trim() },
          })
        ).unwrap();
        toast.success('Project updated successfully');
      } else {
        await dispatch(
          createProject({ name: projectName.trim(), projectManager: projectManager.trim() })
        ).unwrap();
        toast.success('Project created successfully');
      }
      handleClose();
      dispatch(searchProjects({ page: 1, size: 100 }));
    } catch (err: any) {
      toast.error(err || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (
      window.confirm(
        `Are you sure you want to delete project "${project.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await dispatch(deleteProject(project.id)).unwrap();
        toast.success('Project deleted successfully');
        dispatch(searchProjects({ page: 1, size: 100 }));
      } catch (err: any) {
        toast.error(err || 'Failed to delete project');
      }
    }
  };

  const columns = [
    {
      field: 'code',
      header: 'Project Code',
      sortable: true,
      filterable: true,
      width: '20%',
      body: (row: Project) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {row.code || '—'}
        </Typography>
      ),
    },
    {
      field: 'name',
      header: 'Project Name',
      sortable: true,
      filterable: true,
      width: '50%',
      body: (row: Project) => (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {row.name}
        </Typography>
      ),
    },
    {
      field: 'projectManager',
      header: 'Project Manager',
      sortable: true,
      filterable: true,
      width: '30%',
      body: (row: Project) => (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {row.projectManager || '—'}
        </Typography>
      ),
    },
    {
      field: 'status',
      header: 'Status',
      sortable: true,
      width: '20%',
      body: () => (
        <Chip
          label="ACTIVE"
          size="small"
          color={getStatusColor('ACTIVE') as any}
          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
        />
      ),
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
        <AdminDataTable<Project>
          data={projects as Project[]}
          columns={columns as any}
          title="Project Management"
          loading={loading}
          totalRecords={totalItems}
          onEdit={(row) => handleOpenEdit(row as Project)}
          onDelete={(row) => handleDelete(row as Project)}
          onAdd={handleOpenCreate}
        />
      </Paper>

      <CustomModal
        open={modalOpen}
        onClose={handleClose}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
        maxWidth="xs"
        footer={
          <div className="flex gap-2 justify-end">
            <CustomButton variant="outlined" onClick={handleClose} disabled={saving}>
              Cancel
            </CustomButton>
            <CustomButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingProject ? 'Update' : 'Create'}
            </CustomButton>
          </div>
        }
      >
        <div className="pt-2">
          <CustomTextField
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
            required
            autoFocus
          />
          <CustomTextField
            label="Project Manager"
            value={projectManager}
            onChange={(e) => setProjectManager(e.target.value)}
            placeholder="Enter project manager name"
            className="mt-3"
          />
          {editingProject && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
              Project Code: {editingProject.code || 'Will be auto-generated'}
            </Typography>
          )}
        </div>
      </CustomModal>
    </Box>
  );
};

export default ProjectManagementPage;
