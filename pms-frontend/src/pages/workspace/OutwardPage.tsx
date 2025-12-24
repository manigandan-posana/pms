import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { searchOutwardHistory } from "../../store/slices/historySlice";
import toast from "react-hot-toast";
import AdvancedHistoryFilters from "../../components/AdvancedHistoryFilters";
import type { HistoryFilters } from "../../components/AdvancedHistoryFilters";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import { FiPlus } from "react-icons/fi";
import { Box, Stack, Typography, Chip } from "@mui/material";

// ---------- Types ---------- //

export interface OutwardHistoryLine {
  id: string | number;
  materialCode?: string | null;
  code?: string | null;
  materialName?: string | null;
  name?: string | null;
  unit?: string | null;
  issueQty?: number | null;
  [key: string]: unknown;
}

export interface OutwardHistoryRecord {
  id?: string | number | null;
  code?: string | null;
  projectName?: string | null;
  issueTo?: string | null;
  status?: string | null;
  validated?: boolean | null;
  date?: string | null;
  items?: number | null;
  lines?: OutwardHistoryLine[];
  [key: string]: unknown;
}

interface AuthStateSlice {
  token: string | null;
}

// -------- Page Component -------- //

const OutwardPage: React.FC = () => {
  const navigate = useNavigate();

  const { token } = useSelector<RootState, AuthStateSlice>(
    (state) => state.auth as AuthStateSlice
  );

  const [historyRecords, setHistoryRecords] = useState<OutwardHistoryRecord[]>([]);
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
      setHistoryPage(0);
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
      const response = await dispatch(searchOutwardHistory(params)).unwrap();
      const data = Array.isArray(response?.content)
        ? response.content
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setHistoryRecords(data);
      setHistoryTotalRecords(response?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load outward history');
    } finally {
      setLoadingHistory(false);
    }
  }, [token, debouncedSearch, historyPage, historyPageSize, historyFilters, dispatch]);

  // Load history when filters change
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRowClick = (record: OutwardHistoryRecord) => {
    if (record.id) {
      navigate(`/workspace/outward/detail/${record.id}`);
    }
  };

  const columns: ColumnDef<OutwardHistoryRecord>[] = [
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
    { field: 'issueTo', header: 'Issue To', body: (row) => row.issueTo || "—" },
    {
      field: 'date',
      header: 'Date',
      width: 90,
      body: (row) => row.date ? new Date(row.date).toLocaleDateString() : "—"
    },
    {
      field: 'status',
      header: 'Status',
      width: 80,
      body: (row) => (
        <Chip
          label={row.status || 'OPEN'}
          size="small"
          color={row.status === 'CLOSED' ? 'default' : 'success'}
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
            Outward History
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Manage and view outward material issues
          </Typography>
        </Box>
        <CustomButton
          startIcon={<FiPlus size={14} />}
          onClick={() => navigate('/workspace/outward/create')}
        >
          Create Outward
        </CustomButton>
      </Stack>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <AdvancedHistoryFilters
            filterType="outward"
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
          onPageChange={(p, rows) => {
            setHistoryPage(p);
            setHistoryPageSize(rows);
          }}
          rowsPerPageOptions={[5, 10, 20]}
          onRowClick={handleRowClick}
          emptyMessage="No outward history found"
        />
      </Box>
    </Box>
  );
};

export default OutwardPage;
