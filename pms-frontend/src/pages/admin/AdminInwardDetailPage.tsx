import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import { getInwardById, updateInward, validateInward } from "../../store/slices/inventorySlice";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiCheckCircle, FiInfo, FiSearch } from "react-icons/fi";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";
import { Box, Stack, Typography, Paper, Grid, Chip, CircularProgress, Alert, TextField } from "@mui/material";

interface InwardLine {
  id: number;
  materialCode?: string | null;
  materialName?: string | null;
  unit?: string | null;
  orderedQty: number;
  receivedQty: number;
}

interface InwardDetail {
  id: number;
  code: string;
  projectName?: string;
  supplierName?: string;
  invoiceNo?: string;
  entryDate?: string;
  vehicleNo?: string;
  remarks?: string;
  validated: boolean;
  lines: InwardLine[];
}

interface AuthStateSlice {
  token: string | null;
}

const AdminInwardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useSelector<RootState, AuthStateSlice>((state) => state.auth as AuthStateSlice);
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<InwardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingLines, setEditingLines] = useState<Record<number, { orderedQty: number; receivedQty: number }>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  const buildLinePayload = useCallback(
    () =>
      Object.entries(editingLines).map(([lineId, values]) => ({
        id: Number(lineId),
        orderedQty: values.orderedQty,
        receivedQty: values.receivedQty,
      })),
    [editingLines]
  );

  const hasUnsavedChanges = useCallback(() => {
    if (!record?.lines) return false;

    return record.lines.some((line) => {
      const edits = editingLines[line.id];
      if (!edits) return false;

      return (
        edits.orderedQty !== line.orderedQty ||
        edits.receivedQty !== line.receivedQty
      );
    });
  }, [editingLines, record]);

  useEffect(() => {
    if (id && token) {
      loadInwardDetail();
    }
  }, [id, token, searchQuery]);

  const loadInwardDetail = async () => {
    if (!id || !token) return;

    setLoading(true);
    try {
      const data = await dispatch(getInwardById({ id: Number(id), search: searchQuery.trim() || undefined })).unwrap();

      if (!data) {
        toast.error('No record data received');
        navigate('/admin/inward');
        return;
      }

      setRecord(data);

      const initialEdits: Record<number, { orderedQty: number; receivedQty: number }> = {};
      if (data.lines && Array.isArray(data.lines)) {
        data.lines.forEach((line: InwardLine) => {
          initialEdits[line.id] = {
            orderedQty: line.orderedQty || 0,
            receivedQty: line.receivedQty || 0,
          };
        });
      }
      setEditingLines(initialEdits);
    } catch (error: any) {
      console.error('Failed to load inward detail:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to load inward details';
      toast.error(errorMsg);
      navigate('/admin/inward');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = record?.lines ?? [];

  const handleSaveChanges = async () => {
    if (!record || record.validated) return;

    setSaving(true);
    try {
      const lines = buildLinePayload();

      if (!hasUnsavedChanges()) {
        toast.success('No changes to save');
      } else {
        await dispatch(updateInward({ id: record.id, payload: { lines } })).unwrap();
        toast.success('Quantities updated successfully');
      }

      navigate('/admin/inward');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!record || record.validated) return;

    setSaving(true);
    try {
      const lines = buildLinePayload();

      if (hasUnsavedChanges()) {
        await dispatch(updateInward({ id: record.id, payload: { lines } })).unwrap();
      }

      await dispatch(validateInward(record.id)).unwrap();
      toast.success('Inward record saved and validated');
      navigate('/admin/inward');
    } catch (error) {
      console.error('Failed to validate:', error);
      toast.error('Failed to validate record');
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
            onClick={() => navigate('/admin/inward')}
            startIcon={<FiArrowLeft size={14} />}
          >
            Back to Inwards
          </CustomButton>
        </Paper>
      </Box>
    );
  }

  const columns: ColumnDef<InwardLine>[] = [
    {
      field: 'materialCode',
      header: 'Material Code',
      width: 120,
      body: (row) => <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.materialCode || '—'}</Typography>
    },
    {
      field: 'materialName',
      header: 'Material Name',
      body: (row) => row.materialName || '—'
    },
    {
      field: 'unit',
      header: 'Unit',
      width: 60,
      body: (row) => row.unit || '—'
    },
    {
      field: 'orderedQty',
      header: 'Ordered Qty',
      width: 120,
      body: (row) => {
        const currentValue = editingLines[row.id]?.orderedQty ?? row.orderedQty ?? 0;
        if (record.validated) {
          return <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{currentValue}</Typography>;
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
                  ...prev[row.id],
                  orderedQty: val,
                }
              }));
            }}
            sx={{
              '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5, px: 0.75 },
              '& .MuiOutlinedInput-root': { minHeight: 28 }
            }}
          />
        );
      }
    },
    {
      field: 'receivedQty',
      header: 'Received Qty',
      width: 120,
      body: (row) => {
        const currentValue = editingLines[row.id]?.receivedQty ?? row.receivedQty ?? 0;
        if (record.validated) {
          return <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{currentValue}</Typography>;
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
                  ...prev[row.id],
                  receivedQty: val,
                }
              }));
            }}
            sx={{
              '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5, px: 0.75 },
              '& .MuiOutlinedInput-root': { minHeight: 28 }
            }}
          />
        );
      }
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', px: 1.5, py: 1, position: 'sticky', top: 0, zIndex: 10 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <CustomButton
              variant="text"
              onClick={() => navigate('/admin/inward')}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <FiArrowLeft size={16} />
            </CustomButton>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Inward Details
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                  {record.code}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            {record.validated ? (
              <Chip
                icon={<FiCheckCircle size={14} />}
                label="Validated & Locked"
                color="success"
                size="small"
                sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }}
              />
            ) : (
              <>
                <CustomButton
                  variant="outlined"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  startIcon={<FiSave size={14} />}
                >
                  Save Draft
                </CustomButton>
                <CustomButton
                  onClick={handleValidate}
                  disabled={saving}
                  startIcon={<FiCheckCircle size={14} />}
                  color="success"
                >
                  Validate & Lock
                </CustomButton>
              </>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <Stack spacing={1}>
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block' }}>
              Record Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Project</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.projectName || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Supplier</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.supplierName || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Invoice No</Typography>
                <Chip label={record.invoiceNo || '—'} size="small" sx={{ height: 20, fontSize: '0.65rem', fontFamily: 'monospace' }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Entry Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                  {record.entryDate ? new Date(record.entryDate).toLocaleDateString() : '—'}
                </Typography>
              </Grid>
              {record.vehicleNo && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Vehicle No</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.vehicleNo}</Typography>
                </Grid>
              )}
              {record.remarks && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Remarks</Typography>
                  <Typography variant="caption" sx={{ bgcolor: 'grey.50', p: 1, borderRadius: 0.5, display: 'block', border: 1, borderColor: 'divider' }}>
                    {record.remarks}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

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

            {record.validated && (
              <Alert severity="warning" sx={{ borderRadius: 0, fontSize: '0.7rem', py: 0.5 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <FiInfo size={12} />
                  <Typography variant="caption">This record has been validated. Quantities cannot be edited.</Typography>
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
    </Box >
  );
};

export default AdminInwardDetailPage;
