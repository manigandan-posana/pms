import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import { getOutwardById, updateOutward, closeOutward } from "../../store/slices/inventorySlice";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiLock, FiInfo, FiSearch } from "react-icons/fi";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";
import { Box, Stack, Typography, Paper, Grid, Chip, CircularProgress, Alert, TextField } from "@mui/material";

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
  status?: string;
  closeDate?: string;
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
  const [saving, setSaving] = useState(false);
  const [editingLines, setEditingLines] = useState<Record<number, { issueQty: number }>>({});
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

      // Initialize editing state
      const initialEdits: Record<number, { issueQty: number }> = {};
      if (data.lines && Array.isArray(data.lines)) {
        data.lines.forEach((line: OutwardLine) => {
          initialEdits[line.id] = {
            issueQty: line.issueQty || 0,
          };
        });
      }
      setEditingLines(initialEdits);
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

  // Save changes
  const handleSaveChanges = async () => {
    if (!record || record.validated) return;

    setSaving(true);
    try {
      const lines = Object.entries(editingLines).map(([lineId, values]) => ({
        id: Number(lineId),
        issueQty: values.issueQty,
      }));

      await dispatch(updateOutward({ id: record.id, payload: { lines } })).unwrap();
      toast.success('Quantities updated successfully');
      navigate('/workspace/inventory/outwards');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Close outward - save quantities first, then close
  const handleClose = async () => {
    if (!record || record.status === 'CLOSED') return;

    setSaving(true);
    try {
      // First, save any quantity changes
      const lines = Object.entries(editingLines).map(([lineId, values]) => ({
        id: Number(lineId),
        issueQty: values.issueQty,
      }));

      await dispatch(updateOutward({ id: record.id, payload: { lines } })).unwrap();

      // Then close the outward
      await dispatch(closeOutward(record.id)).unwrap();
      toast.success('Quantities saved and outward closed successfully');
      navigate('/workspace/inventory/outwards');
    } catch (error) {
      console.error('Failed to close:', error);
      toast.error('Failed to close record');
    } finally {
      setSaving(false);
    }
  };

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
      body: (row) => {
        const currentValue = editingLines[row.id]?.issueQty ?? row.issueQty ?? 0;
        if (record.status === 'CLOSED') {
          return <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{currentValue}</Typography>;
        }
        return (
          <TextField
            type="number"
            size="small"
            value={currentValue}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setEditingLines(prev => ({
                ...prev,
                [row.id]: {
                  issueQty: val,
                }
              }));
            }}
            sx={{
              '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5, px: 0.75, textAlign: 'right' },
              '& .MuiOutlinedInput-root': { minHeight: 28 }
            }}
          />
        );
      }
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', px: 1.5, py: 1, position: 'sticky', top: 0, zIndex: 10 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
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

          <Stack direction="row" spacing={0.5}>
            {record.status === 'CLOSED' ? (
              <Chip
                icon={<FiLock size={14} />}
                label="Closed"
                size="small"
                sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'grey.200', color: 'text.secondary' }}
              />
            ) : (
              <>
                <CustomButton
                  variant="outlined"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  startIcon={<FiSave size={14} />}
                >
                  Save Changes
                </CustomButton>
                <CustomButton
                  onClick={handleClose}
                  disabled={saving}
                  startIcon={<FiLock size={14} />}
                  color="error"
                >
                  Close Record
                </CustomButton>
              </>
            )}
          </Stack>
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
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Project</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.projectName || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Issue To</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.issueTo || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {record.date ? new Date(record.date).toLocaleDateString() : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Status</Typography>
                <Chip
                  label={record.status || 'OPEN'}
                  size="small"
                  color={record.status === 'CLOSED' ? 'default' : 'primary'}
                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                />
              </Grid>
              {record.closeDate && (
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Close Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                    {new Date(record.closeDate).toLocaleDateString()}
                  </Typography>
                </Grid>
              )}
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

            {record.status === 'CLOSED' && (
              <Alert severity="info" sx={{ borderRadius: 0, fontSize: '0.7rem', py: 0.5 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <FiInfo size={12} />
                  <Typography variant="caption">This record is closed. Quantities cannot be edited.</Typography>
                </Stack>
              </Alert>
            )}

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
