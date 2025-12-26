import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import { getOutwardById } from "../../store/slices/inventorySlice";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSearch } from "react-icons/fi";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";
import { Box, Stack, Typography, Paper, Grid, Chip, CircularProgress } from "@mui/material";

// -------- Types -------- //

interface OutwardLine {
  id: number;
  materialId?: string | null;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  issueQty: number;
}

interface OutwardDetail {
  id: number;
  code: string;
  projectName?: string;
  issueTo?: string;
  date?: string;
  validated: boolean;
  lines: OutwardLine[];
}

interface AuthStateSlice {
  token: string | null;
}

// -------- Page Component -------- //

const OutwardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useSelector<RootState, AuthStateSlice>((state) => state.auth as AuthStateSlice);
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<OutwardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load outward detail
  useEffect(() => {
    if (id && token) {
      loadOutwardDetail();
    }
  }, [id, token, searchQuery]);

  const loadOutwardDetail = async () => {
    if (!id || !token) return;

    setLoading(true);
    try {
      const data = await dispatch(getOutwardById({ id: Number(id), search: searchQuery.trim() || undefined })).unwrap();

      if (!data) {
        toast.error('No record data received');
        navigate('/workspace/inventory/outwards');
        return;
      }

      setRecord(data);
    } catch (error: any) {
      console.error('Failed to load outward detail:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to load outward details';
      toast.error(errorMsg);
      navigate('/workspace/inventory/outwards');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = record?.lines ?? [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Stack spacing={1} alignItems="center">
          <CircularProgress size={32} />
          <Typography variant="caption" color="text.secondary">Loading details...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!record) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No record found</Typography>
          <CustomButton
            onClick={() => navigate('/workspace/inventory/outwards')}
            startIcon={<FiArrowLeft size={14} />}
          >
            Back to Outwards
          </CustomButton>
        </Paper>
      </Box>
    );
  }

  const columns: ColumnDef<OutwardLine>[] = [
    {
      field: 'code',
      header: 'Material Code',
      width: 120,
      body: (row) => <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.code || '—'}</Typography>
    },
    {
      field: 'name',
      header: 'Material Name',
      body: (row) => row.name || '—'
    },
    {
      field: 'unit',
      header: 'Unit',
      width: 60,
      body: (row) => row.unit || '—'
    },
    {
      field: 'issueQty',
      header: 'Issue Qty',
      width: 120,
      align: 'right',
      body: (row) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {row.issueQty ?? 0}
        </Typography>
      )
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', px: 1.5, py: 1, position: 'sticky', top: 0, zIndex: 10 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CustomButton
            variant="text"
            onClick={() => navigate('/workspace/inventory/outwards')}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <FiArrowLeft size={16} />
          </CustomButton>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Outward Details
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                {record.code}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <Stack spacing={1}>
          {/* Info Card */}
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block' }}>
              Record Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Project</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.projectName || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Issue To</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.issueTo || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {record.date ? new Date(record.date).toLocaleDateString() : '—'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Materials Section */}
          <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Materials</Typography>
                <Chip label={filteredLines.length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Stack>

              <Box sx={{ width: { xs: '100%', sm: 240 } }}>
                <CustomTextField
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startAdornment={<FiSearch size={14} style={{ color: '#9ca3af' }} />}
                  size="small"
                />
              </Box>
            </Stack>

            <CustomTable
              data={filteredLines}
              columns={columns}
              pagination
              rows={10}
              emptyMessage="No materials found in this record."
            />
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
};

export default OutwardDetailPage;
