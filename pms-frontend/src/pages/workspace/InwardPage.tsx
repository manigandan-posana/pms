import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import { searchInwardHistory } from "../../store/slices/historySlice";
import toast from "react-hot-toast";
import AdvancedHistoryFilters from "../../components/AdvancedHistoryFilters";
import type { HistoryFilters } from "../../components/AdvancedHistoryFilters";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import { FiPlus } from "react-icons/fi";
import { Box, Stack, Typography, Chip } from "@mui/material";

// -------- Types -------- //

export interface InwardHistoryLine {
  id: string | number;
  code?: string | null;
  name?: string | null;
  materialCode?: string | null;
  materialName?: string | null;
  unit?: string | null;
  orderedQty?: number | null;
  receivedQty?: number | null;
}

export interface InwardHistoryRecord {
  id?: string | number | null;
  code?: string | null;
  projectName?: string | null;
  deliveryDate?: string | null;
  date?: string | null;
  invoiceNo?: string | null;
  type?: string | null;
  supplierName?: string | null;
  vehicleNo?: string | null;
  validated?: boolean | null;
  items?: number | null;
  lines?: InwardHistoryLine[];
}

interface AuthStateSlice {
  token: string | null;
}

// -------- Page Component -------- //

const InwardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useSelector<RootState, AuthStateSlice>((state) => state.auth as AuthStateSlice);

  const [historyRecords, setHistoryRecords] = useState<InwardHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({});
  const [historyPage, setHistoryPage] = useState<number>(0);
  const [historyPageSize, setHistoryPageSize] = useState<number>(10);
  const [historyTotalRecords, setHistoryTotalRecords] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimerRef.current !== null) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setHistoryPage(0); // Reset to first page on search
      searchTimerRef.current = null;
    }, 500);

    return () => {
      if (searchTimerRef.current !== null) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [searchQuery]);

  const dispatch = useAppDispatch();

  const loadHistory = React.useCallback(async () => {
    if (!token) {
      toast.error('Token not available');
      return;
    }
    setLoadingHistory(true);
    try {
      const trimmedSearch = debouncedSearch.trim();
      const params = {
        page: historyPage + 1,
        size: historyPageSize,
        ...historyFilters,
        ...(trimmedSearch ? { search: trimmedSearch } : {}),
      };
      const response = await dispatch(searchInwardHistory(params)).unwrap();
      const data = Array.isArray(response?.content)
        ? response.content
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setHistoryRecords(data);
      setHistoryTotalRecords(response?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load inward history');
    } finally {
      setLoadingHistory(false);
    }
  }, [token, debouncedSearch, historyPage, historyPageSize, historyFilters, dispatch]);

  // Load history when filters change
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRowClick = (record: InwardHistoryRecord) => {
    if (record.id) {
      navigate(`/workspace/inward/detail/${record.id}`);
    }
  };

  const columns: ColumnDef<InwardHistoryRecord>[] = [
    {
      field: 'code',
      header: 'Code',
      width: 120,
      body: (row) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.primary' }}>
          {row.code || "—"}
        </Typography>
      )
    },
    { field: 'projectName', header: 'Project', body: (row) => row.projectName || "—" },
    { field: 'supplierName', header: 'Supplier', body: (row) => row.supplierName || "—" },
    { field: 'type', header: 'Type', body: (row) => row.type || "SUPPLY" },
    {
      field: 'date',
      header: 'Date',
      width: 90,
      body: (row) => row.date ? new Date(row.date).toLocaleDateString() : "—"
    },
    {
      field: 'validated',
      header: 'Status',
      width: 80,
      body: (row) => (
        <Chip
          label={row.validated ? 'VALIDATED' : 'DRAFT'}
          size="small"
          color={row.validated ? 'success' : 'warning'}
          sx={{
            height: 18,
            fontSize: '0.65rem',
            fontWeight: 600,
            '& .MuiChip-label': { px: 0.75, py: 0 }
          }}
        />
      )
    },
    {
      field: 'items',
      header: 'Items',
      width: 60,
      align: 'right',
      body: (row) => <Typography variant="caption" sx={{ fontWeight: 600 }}>{row.items || 0}</Typography>
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
            Inward History
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Manage and view inward material entries
          </Typography>
        </Box>
        <CustomButton
          startIcon={<FiPlus size={14} />}
          onClick={() => navigate('/workspace/inward/create')}
        >
          Create Inward
        </CustomButton>
      </Stack>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <AdvancedHistoryFilters
            filterType="inward"
            onFilterChange={(filters) => {
              setHistoryFilters(filters);
              setHistoryPage(0);
            }}
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
            }}
            isLoading={loadingHistory}
          />
        </Box>

        <CustomTable
          data={historyRecords}
          columns={columns}
          loading={loadingHistory}
          pagination
          rows={historyPageSize}
          page={historyPage}
          totalRecords={historyTotalRecords}
          onPageChange={(newInstancePage, newInstanceRows) => {
            setHistoryPage(newInstancePage);
            setHistoryPageSize(newInstanceRows);
          }}
          rowsPerPageOptions={[5, 10, 20]}
          onRowClick={handleRowClick}
          emptyMessage="No inward history found"
        />
      </Box>
    </Box>
  );
};

export default InwardPage;
