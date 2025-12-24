import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { searchTransferHistory } from "../../store/slices/historySlice";
import toast from "react-hot-toast";
import AdvancedHistoryFilters from "../../components/AdvancedHistoryFilters";
import type { HistoryFilters } from "../../components/AdvancedHistoryFilters";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import { FiPlus } from "react-icons/fi";
import { Box, Stack, Typography } from "@mui/material";

// ---- Domain types ---------------------------------------------------------

export interface TransferHistoryRecord {
  code: string;
  fromProject?: string | null;
  fromProjectName?: string | null;
  fromSite?: string | null;
  toProject?: string | null;
  toProjectName?: string | null;
  toSite?: string | null;
  status?: string | null;
  remarks?: string | null;
  date?: string | number | Date | null;
  items?: number | null;
  [key: string]: unknown;
}

interface AuthStateShape {
  token?: string;
  [key: string]: unknown;
}

// ---- Page Component -------------------------------------------------------

const TransferPage: React.FC = () => {
  const navigate = useNavigate();

  const { token } = useSelector<RootState, AuthStateShape>(
    (state) => state.auth as unknown as AuthStateShape
  );

  // History state
  const [historyRecords, setHistoryRecords] = useState<TransferHistoryRecord[]>([]);
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
        page: historyPage + 1, // Convert 0-based to 1-based
        size: historyPageSize,
        ...historyFilters,
        ...(trimmedSearch ? { search: trimmedSearch } : {}),
      };
      const response = await dispatch(searchTransferHistory(params)).unwrap();
      const data = Array.isArray(response?.content)
        ? response.content
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setHistoryRecords(data);
      setHistoryTotalRecords(response?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load transfer history');
    } finally {
      setLoadingHistory(false);
    }
  }, [token, debouncedSearch, historyPage, historyPageSize, historyFilters, dispatch]);

  // Load history when filters change
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRowClick = (record: TransferHistoryRecord) => {
    if (record && (record as any).id) {
      navigate(`/workspace/transfer/detail/${(record as any).id}`);
    }
  };

  const columns: ColumnDef<TransferHistoryRecord>[] = [
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
    { field: 'fromProject', header: 'From Project', body: (row) => row.fromProjectName || row.fromProject || "—" },
    { field: 'toProject', header: 'To Project', body: (row) => row.toProjectName || row.toProject || "—" },
    {
      field: 'date',
      header: 'Date',
      width: 100,
      body: (row) => row.date ? new Date(row.date).toLocaleDateString() : "—"
    },
    {
      field: 'items',
      header: 'Items',
      width: 80,
      align: 'right',
      body: (row) => {
        const itemCount = row.items ?? (row as any).itemCount ?? (row as any).numberOfItems ?? (row as any).totalItems ?? 0;
        return <Typography variant="caption" sx={{ fontWeight: 600 }}>{itemCount}</Typography>;
      }
    }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
            Transfer History
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Manage and view material transfers
          </Typography>
        </Box>
        <CustomButton
          startIcon={<FiPlus size={14} />}
          onClick={() => navigate('/workspace/transfer/create')}
        >
          Create Transfer
        </CustomButton>
      </Stack>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <AdvancedHistoryFilters
            filterType="transfer"
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
          emptyMessage="No history records found"
        />
      </Box>
    </Box>
  );
};

export default TransferPage;
