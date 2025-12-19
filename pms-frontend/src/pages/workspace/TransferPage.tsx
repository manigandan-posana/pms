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

  // Load history when filters change
  useEffect(() => {
    loadHistory();
  }, [historyFilters, historyPage, historyPageSize, debouncedSearch, token]);

  const handleRowClick = (record: TransferHistoryRecord) => {
    if (record && (record as any).id) {
      navigate(`/workspace/transfer/detail/${(record as any).id}`);
    }
  };

  const dispatch = useAppDispatch();

  const loadHistory = async () => {
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
      const data = Array.isArray(response?.items) ? response.items : Array.isArray(response?.data) ? response.data : Array.isArray(response?.content) ? response.content : [];
      setHistoryRecords(data);
      setHistoryTotalRecords(response?.totalItems || response?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load transfer history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const columns: ColumnDef<TransferHistoryRecord>[] = [
    {
      field: 'code',
      header: 'Code',
      width: 150,
      body: (row) => (
        <span className="font-mono font-semibold text-slate-700">
          {row.code || "—"}
        </span>
      )
    },
    { field: 'fromProject', header: 'From Project', body: (row) => row.fromProjectName || row.fromProject || "—" },
    { field: 'toProject', header: 'To Project', body: (row) => row.toProjectName || row.toProject || "—" },
    {
      field: 'date',
      header: 'Date',
      width: 120,
      body: (row) => row.date ? new Date(row.date).toLocaleDateString() : "—"
    },
    {
      field: 'items',
      header: 'Items',
      width: 100,
      align: 'right',
      body: (row) => {
        const itemCount = row.items ?? (row as any).itemCount ?? (row as any).numberOfItems ?? (row as any).totalItems ?? 0;
        return <span className="font-semibold text-slate-600">{itemCount}</span>;
      }
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs font-bold text-slate-800">Transfer History</h1>
            <p className="text-slate-500">Manage and view material transfers</p>
          </div>
          <CustomButton
            startIcon={<FiPlus />}
            onClick={() => navigate('/workspace/transfer/create')}
            className="shadow-sm"
          >
            Create Transfer
          </CustomButton>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
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
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default TransferPage;
