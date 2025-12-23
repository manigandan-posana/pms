import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowDown, FiArrowUp, FiRefreshCw, FiSearch, FiArrowRight, FiArrowLeft } from "react-icons/fi";

import { Get as apiGet } from "../../utils/apiService";
import type { RootState, AppDispatch } from "../../store/store";
import { setSelectedAdminProject } from "../../store/slices/adminProjectsSlice";
import CustomTable, { ColumnDef } from "../../widgets/CustomTable";
import CustomTabs from "../../widgets/CustomTabs";
import CustomSelect from "../../widgets/CustomSelect";
import CustomTextField from "../../widgets/CustomTextField";
import CustomButton from "../../widgets/CustomButton";
import CustomDateInput from "../../widgets/CustomDateInput";

// ---- Types ---- //

interface Project {
  id: number | string;
  name: string;
  code?: string;
}

interface InwardHistoryRecord {
  id?: number | string;
  code: string;
  date: string;
  invoiceNo?: string | null;
  supplierName?: string | null;
  items?: number;
  [key: string]: unknown;
}

interface OutwardHistoryRecord {
  id?: number | string;
  code: string;
  date: string;
  issueTo?: string | null;
  items?: number;
  status?: string;
  [key: string]: unknown;
}

interface TransferHistoryRecord {
  id?: number | string;
  code: string;
  fromProjectName?: string | null;
  toProjectName?: string | null;
  date?: string | null;
  items?: number;
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

// ---- Component ---- //

const AdminHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  const { selectedAdminProjectId } = useSelector((state: RootState) => state.adminProjects);

  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);

  // Inward state
  const [inwardRecords, setInwardRecords] = useState<InwardHistoryRecord[]>([]);
  const [inwardLoading, setInwardLoading] = useState(false);
  const [inwardSearch, setInwardSearch] = useState("");
  const [inwardPage, setInwardPage] = useState(0);
  const [inwardPageSize, setInwardPageSize] = useState(10);
  const [inwardTotal, setInwardTotal] = useState(0);
  const [inwardDateFrom, setInwardDateFrom] = useState<Date | null>(null);
  const [inwardDateTo, setInwardDateTo] = useState<Date | null>(null);

  // Outward state
  const [outwardRecords, setOutwardRecords] = useState<OutwardHistoryRecord[]>([]);
  const [outwardLoading, setOutwardLoading] = useState(false);
  const [outwardSearch, setOutwardSearch] = useState("");
  const [outwardPage, setOutwardPage] = useState(0);
  const [outwardPageSize, setOutwardPageSize] = useState(10);
  const [outwardTotal, setOutwardTotal] = useState(0);
  const [outwardDateFrom, setOutwardDateFrom] = useState<Date | null>(null);
  const [outwardDateTo, setOutwardDateTo] = useState<Date | null>(null);

  // Transfer state
  const [transferRecords, setTransferRecords] = useState<TransferHistoryRecord[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferPage, setTransferPage] = useState(0);
  const [transferPageSize, setTransferPageSize] = useState(10);
  const [transferTotal, setTransferTotal] = useState(0);
  const [transferDateFrom, setTransferDateFrom] = useState<Date | null>(null);
  const [transferDateTo, setTransferDateTo] = useState<Date | null>(null);


  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [token]);

  // Load data when tab or filters change
  useEffect(() => {
    if (activeTab === 0) loadInwards();
  }, [activeTab, inwardPage, inwardPageSize, inwardSearch, selectedAdminProjectId, inwardDateFrom, inwardDateTo]);

  useEffect(() => {
    if (activeTab === 1) loadOutwards();
  }, [activeTab, outwardPage, outwardPageSize, outwardSearch, selectedAdminProjectId, outwardDateFrom, outwardDateTo]);

  useEffect(() => {
    if (activeTab === 2) loadTransfers();
  }, [activeTab, transferPage, transferPageSize, transferSearch, selectedAdminProjectId, transferDateFrom, transferDateTo]);

  const loadProjects = async () => {
    if (!token) return;
    try {
      const response = await apiGet<any>("/admin/projects", { limit: 1000 }); // Assuming /admin/projects exists
      const data = response?.content || response || [];
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      // Fallback or silent fail if endpoint differs
      // toast.error("Failed to load projects");
    }
  };

  const loadInwards = async () => {
    if (!token) return;
    setInwardLoading(true);
    try {
      const params: any = {
        page: inwardPage + 1,
        size: inwardPageSize,
        search: inwardSearch.trim() || undefined,
        projectId: selectedAdminProjectId || undefined,
        fromDate: inwardDateFrom ? inwardDateFrom.toISOString().split('T')[0] : undefined,
        toDate: inwardDateTo ? inwardDateTo.toISOString().split('T')[0] : undefined,
      };

      const response = await apiGet<PaginatedResponse<InwardHistoryRecord>>("/history/inwards", params);
      const data = response?.content || [];
      setInwardRecords(data);
      setInwardTotal(response?.totalElements || 0);
    } catch (error) {
      console.error("Failed to load inward history:", error);
      toast.error("Failed to load inward history");
    } finally {
      setInwardLoading(false);
    }
  };

  const loadOutwards = async () => {
    if (!token) return;
    setOutwardLoading(true);
    try {
      const params: any = {
        page: outwardPage + 1,
        size: outwardPageSize,
        search: outwardSearch.trim() || undefined,
        projectId: selectedAdminProjectId || undefined,
        fromDate: outwardDateFrom ? outwardDateFrom.toISOString().split('T')[0] : undefined,
        toDate: outwardDateTo ? outwardDateTo.toISOString().split('T')[0] : undefined,
      };
      const response = await apiGet<PaginatedResponse<OutwardHistoryRecord>>("/history/outwards", params);
      const data = response?.content || [];
      setOutwardRecords(data);
      setOutwardTotal(response?.totalElements || 0);
    } catch (error) {
      console.error("Failed to load outward history:", error);
      toast.error("Failed to load outward history");
    } finally {
      setOutwardLoading(false);
    }
  };

  const loadTransfers = async () => {
    if (!token) return;
    setTransferLoading(true);
    try {
      const params: any = {
        page: transferPage + 1,
        size: transferPageSize,
        search: transferSearch.trim() || undefined,
        projectId: selectedAdminProjectId || undefined,
        fromDate: transferDateFrom ? transferDateFrom.toISOString().split('T')[0] : undefined,
        toDate: transferDateTo ? transferDateTo.toISOString().split('T')[0] : undefined,
      };
      const response = await apiGet<PaginatedResponse<TransferHistoryRecord>>("/history/transfers", params);
      const data = response?.content || [];
      setTransferRecords(data);
      setTransferTotal(response?.totalElements || 0);
    } catch (error) {
      console.error("Failed to load transfer history:", error);
      toast.error("Failed to load transfer history");
    } finally {
      setTransferLoading(false);
    }
  };

  const projectOptions = useMemo(() => {
    return [
      { label: "All Projects", value: "" },
      ...projects.map((p) => ({
        label: `${p.code || ""} - ${p.name}`.trim(),
        value: p.id,
      })),
    ];
  }, [projects]);


  // Columns
  const inwardColumns: ColumnDef<InwardHistoryRecord>[] = [
    { field: "code", header: "Inward Code", sortable: true, body: (row) => <span className="font-mono text-blue-600 font-medium">{row.code}</span> },
    { field: "date", header: "Date", sortable: true, body: (row) => new Date(row.date).toLocaleDateString() },
    { field: "supplierName", header: "Supplier", sortable: true, body: (row) => row.supplierName || '—' },
    { field: "invoiceNo", header: "Invoice No", sortable: true, body: (row) => row.invoiceNo || '—' },
    { field: "items", header: "Items", align: "center", body: (row) => <span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-bold">{row.items || 0}</span> },
  ];

  const outwardColumns: ColumnDef<OutwardHistoryRecord>[] = [
    { field: "code", header: "Outward Code", sortable: true, body: (row) => <span className="font-mono text-green-600 font-medium">{row.code}</span> },
    { field: "date", header: "Date", sortable: true, body: (row) => new Date(row.date).toLocaleDateString() },
    { field: "issueTo", header: "Issued To", sortable: true, body: (row) => row.issueTo || '—' },
    {
      field: "status", header: "Status", sortable: true, body: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {row.status || 'OPEN'}
        </span>
      )
    },
    { field: "items", header: "Items", align: "center", body: (row) => <span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-bold">{row.items || 0}</span> },
  ];

  const transferColumns: ColumnDef<TransferHistoryRecord>[] = [
    { field: "code", header: "Transfer Code", sortable: true, body: (row) => <span className="font-mono text-purple-600 font-medium">{row.code}</span> },
    { field: "date", header: "Date", sortable: true, body: (row) => row.date ? new Date(row.date).toLocaleDateString() : '—' },
    {
      field: "fromProjectName", header: "From Project", sortable: true, body: (row) => (
        <div className="flex items-center gap-1 text-slate-700">
          <FiArrowLeft className="text-red-400" /> {row.fromProjectName || '—'}
        </div>
      )
    },
    {
      field: "toProjectName", header: "To Project", sortable: true, body: (row) => (
        <div className="flex items-center gap-1 text-slate-700">
          <FiArrowRight className="text-green-400" /> {row.toProjectName || '—'}
        </div>
      )
    },
    { field: "items", header: "Items", align: "center", body: (row) => <span className="bg-slate-100 px-2 py-1 rounded-full text-xs font-bold">{row.items || 0}</span> },
  ];

  const renderFilters = (
    search: string, setSearch: (s: string) => void,
    dateFrom: Date | null, setDateFrom: (d: Date | null) => void,
    dateTo: Date | null, setDateTo: (d: Date | null) => void,
    placeholder: string
  ) => (
    <div className="flex flex-wrap gap-4 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex-1 min-w-[200px]">
        <CustomTextField
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<FiSearch className="text-slate-400" />}
        />
      </div>
      <div className="w-40">
        <CustomDateInput value={dateFrom} onChange={(e) => setDateFrom(e.value as Date)} placeholder="From Date" />
      </div>
      <div className="w-40">
        <CustomDateInput value={dateTo} onChange={(e) => setDateTo(e.value as Date)} placeholder="To Date" />
      </div>
      <div className="flex items-end">
        <CustomButton variant="outlined" onClick={() => { setSearch(""); setDateFrom(null); setDateTo(null); }}>Clear</CustomButton>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xs font-bold text-slate-900">Transaction History</h1>
            <p className="text-slate-500 text-xs">View and analyze all inventory transactions across projects</p>
          </div>

          <div className="w-full md:w-72 bg-white p-1 rounded-lg shadow-sm border border-slate-200">
            <CustomSelect
              label="Filter by Project"
              value={selectedAdminProjectId || ""}
              onChange={(v) => {
                dispatch(setSelectedAdminProject(v));
                setInwardPage(0);
                setOutwardPage(0);
                setTransferPage(0);
              }}
              options={projectOptions}
              placeholder="All Projects"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Inwards</div>
              <div className="text-xs font-bold text-slate-800">{inwardTotal}</div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><FiArrowDown size={24} /></div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Total Outwards</div>
              <div className="text-xs font-bold text-slate-800">{outwardTotal}</div>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-full"><FiArrowUp size={24} /></div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Total Transfers</div>
              <div className="text-xs font-bold text-slate-800">{transferTotal}</div>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-full"><FiRefreshCw size={24} /></div>
          </div>
        </div>

        {/* Tabs and Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <CustomTabs
            activeIndex={activeTab}
            onTabChange={(index) => setActiveTab(index)}
            tabs={[
              {
                label: "Inwards",
                content: (
                  <div className="p-4">
                    {renderFilters(inwardSearch, setInwardSearch, inwardDateFrom, setInwardDateFrom, inwardDateTo, setInwardDateTo, "Search code, supplier...")}
                    <CustomTable
                      data={inwardRecords}
                      columns={inwardColumns}
                      loading={inwardLoading}
                      pagination
                      rows={inwardPageSize}
                      page={inwardPage}
                      totalRecords={inwardTotal}
                      onPageChange={(p, r) => { setInwardPage(p); setInwardPageSize(r); }}
                      emptyMessage="No inward records found"
                      onRowClick={(row) => navigate(`/workspace/inward/detail/${row.id}`)}
                    />
                  </div>
                )
              },
              {
                label: "Outwards",
                content: (
                  <div className="p-4">
                    {renderFilters(outwardSearch, setOutwardSearch, outwardDateFrom, setOutwardDateFrom, outwardDateTo, setOutwardDateTo, "Search code, issued to...")}
                    <CustomTable
                      data={outwardRecords}
                      columns={outwardColumns}
                      loading={outwardLoading}
                      pagination
                      rows={outwardPageSize}
                      page={outwardPage}
                      totalRecords={outwardTotal}
                      onPageChange={(p, r) => { setOutwardPage(p); setOutwardPageSize(r); }}
                      emptyMessage="No outward records found"
                      onRowClick={(row) => navigate(`/workspace/outward/detail/${row.id}`)}
                    />
                  </div>
                )
              },
              {
                label: "Transfers",
                content: (
                  <div className="p-4">
                    {renderFilters(transferSearch, setTransferSearch, transferDateFrom, setTransferDateFrom, transferDateTo, setTransferDateTo, "Search code...")}
                    <CustomTable
                      data={transferRecords}
                      columns={transferColumns}
                      loading={transferLoading}
                      pagination
                      rows={transferPageSize}
                      page={transferPage}
                      totalRecords={transferTotal}
                      onPageChange={(p, r) => { setTransferPage(p); setTransferPageSize(r); }}
                      emptyMessage="No transfer records found"
                      onRowClick={(row) => navigate(`/workspace/transfer/detail/${row.id}`)}
                    />
                  </div>
                )
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminHistoryPage;
