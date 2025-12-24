import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import { getTransferById } from "../../store/slices/inventorySlice";
import toast from "react-hot-toast";
import { FiArrowLeft, FiArrowRight, FiSearch, FiRepeat } from "react-icons/fi";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";
import { Box, Stack, Typography, Paper, Grid, Chip, CircularProgress } from "@mui/material";

interface TransferLine {
  id: number;
  materialId?: string | null;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  transferQty: number;
}

interface TransferDetail {
  id: number;
  code: string;
  fromProjectName?: string;
  fromSite?: string;
  toProjectName?: string;
  toSite?: string;
  date?: string;
  remarks?: string;
  lines: TransferLine[];
}

interface AuthStateSlice {
  token: string | null;
}

const AdminTransferDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useSelector<RootState, AuthStateSlice>((state) => state.auth as AuthStateSlice);
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (id && token) {
      loadTransferDetail();
    }
  }, [id, token, searchQuery]);

  const loadTransferDetail = async () => {
    if (!id || !token) return;
    setLoading(true);
    try {
      const data = await dispatch(getTransferById({ id: Number(id), search: searchQuery.trim() || undefined })).unwrap();
      if (!data) {
        toast.error('No record data received');
        navigate('/admin/transfer');
        return;
      }
      setRecord(data);
    } catch (error: any) {
      console.error('Failed to load transfer detail:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to load transfer details';
      toast.error(errorMsg);
      navigate('/admin/transfer');
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
          <Typography variant="caption">Loading transfer details...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!record) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No record found</Typography>
          <CustomButton onClick={() => navigate('/admin/transfer')} startIcon={<FiArrowLeft size={14} />}>
            Back to Transfers
          </CustomButton>
        </Paper>
      </Box>
    );
  }

  const columns: ColumnDef<TransferLine>[] = [
    { field: 'code', header: 'Code', width: 120, body: (row) => <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.code || '—'}</Typography> },
    { field: 'name', header: 'Material Name', body: (row) => row.name || '—' },
    { field: 'unit', header: 'Unit', width: 60, align: 'center', body: (row) => row.unit || '—' },
    { field: 'transferQty', header: 'Transfer Qty', width: 100, align: 'right', body: (row) => <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'secondary.main' }}>{row.transferQty?.toLocaleString() || 0}</Typography> }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', px: 1.5, py: 1, position: 'sticky', top: 0, zIndex: 10 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <CustomButton variant="text" onClick={() => navigate('/admin/transfer')} sx={{ minWidth: 'auto', p: 0.5 }}>
              <FiArrowLeft size={16} />
            </CustomButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Transfer Details</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'secondary.main', fontWeight: 600 }}>{record.code}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: { xs: 'none', sm: 'flex' } }}>
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{record.fromProjectName || 'Unknown'}</Typography>
            <FiArrowRight size={12} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>{record.toProjectName || 'Unknown'}</Typography>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <Stack spacing={1}>
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{ p: 0.5, bgcolor: 'secondary.lighter', color: 'secondary.main', borderRadius: 1 }}>
                <FiRepeat size={16} />
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>Transfer Information</Typography>
            </Stack>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Code</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem' }}>{record.code}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{record.date || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>From Project</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.fromProjectName || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>To Project</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{record.toProjectName || '—'}</Typography>
              </Grid>
              {record.remarks && (
                <Grid item xs={12} >
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
                <CustomTextField placeholder="Search materials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} startAdornment={<FiSearch size={14} style={{ color: '#9ca3af' }} />} size="small" />
              </Box>
            </Stack>
            <CustomTable data={filteredLines} columns={columns} pagination rows={10} emptyMessage="No materials found in this transfer." />
          </Paper>
        </Stack>
      </Box>
    </Box >
  );
};

export default AdminTransferDetailPage;
