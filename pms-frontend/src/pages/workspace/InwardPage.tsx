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
import InventoryNavigationTabs from "../../components/InventoryNavigationTabs";

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

  // Load history when filters change
  useEffect(() => {
    loadHistory();
  }, [historyFilters, historyPage, historyPageSize, debouncedSearch, token]);

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
        page: historyPage + 1,
        size: historyPageSize,
        ...historyFilters,
        ...(trimmedSearch ? { search: trimmedSearch } : {}),
      };
      const response = await dispatch(searchInwardHistory(params)).unwrap();
      const data = Array.isArray(response?.items) ? response.items : Array.isArray(response?.data) ? response.data : Array.isArray(response?.content) ? response.content : [];
      setHistoryRecords(data);
      setHistoryTotalRecords(response?.totalItems || response?.totalElements || 0);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load inward history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRowClick = (record: InwardHistoryRecord) => {
    if (record.id) {
      navigate(`/workspace/inward/detail/${record.id}`);
    }
  };

  const columns: ColumnDef<InwardHistoryRecord>[] = [
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
    { field: 'supplierName', header: 'Supplier', body: (row) => row.supplierName || "—" },
    { field: 'invoiceNo', header: 'Invoice No', body: (row) => row.invoiceNo || "—" },
    {
      field: 'date',
      header: 'Date',
      width: 100,
      body: (row) => row.date ? new Date(row.date).toLocaleDateString() : "—"
    },
    {
      field: 'validated',
      header: 'Status',
      width: 100,
      body: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${row.validated
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
          }`}>
          {row.validated ? 'VALIDATED' : 'DRAFT'}
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
        <InventoryNavigationTabs />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs font-bold text-slate-800">Inward History</h1>
            <p className="text-slate-500">Manage and view inward material entries</p>
          </div>
          <CustomButton
            startIcon={<FiPlus />}
            onClick={() => navigate('/workspace/inward/create')}
            className="shadow-sm"
          >
            Create Inward
          </CustomButton>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
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
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default InwardPage;
