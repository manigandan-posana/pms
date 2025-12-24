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
      width: 150,
      body: (row) => (
        <span className="font-mono font-semibold text-slate-700">
          {row.code || "—"}
        </span>
      )
    },
    { field: 'projectName', header: 'Project', body: (row) => row.projectName || "—" },
    { field: 'issueTo', header: 'Issue To', body: (row) => row.issueTo || "—" },
    {
      field: 'date',
      header: 'Date',
      width: 100,
      body: (row) => row.date ? new Date(row.date).toLocaleDateString() : "—"
    },
    {
      field: 'status',
      header: 'Status',
      width: 110,
      body: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${row.status === 'CLOSED'
          ? 'bg-slate-100 text-slate-600'
          : 'bg-emerald-100 text-emerald-700'
          }`}>
          {row.status || 'OPEN'}
        </span>
      )
    },
    {
      field: 'items',
      header: 'Items',
      width: 80,
      align: 'right',
      body: (row) => <span className="font-semibold text-slate-600">{row.items || 0}</span>
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs font-bold text-slate-800">Outward History</h1>
            <p className="text-slate-500">Manage and view outward material issues</p>
          </div>
          <CustomButton
            startIcon={<FiPlus />}
            onClick={() => navigate('/workspace/outward/create')}
            className="shadow-sm"
          >
            Create Outward
          </CustomButton>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
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
            emptyMessage="No outward history found"
          />
        </div>
      </div>
    </div>
  );
};

export default OutwardPage;
