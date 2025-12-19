import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TabView, TabPanel } from "primereact/tabview";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button as PrimeButton } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Tag } from "primereact/tag";
import toast from "react-hot-toast";
import {
  FiActivity,
  FiFilter,
  FiX,
  FiArrowDown,
  FiArrowUp,
  FiRepeat,
  FiShoppingCart,
  FiBox,
} from "react-icons/fi";
import type { RootState, AppDispatch } from "../../store/store";
import { searchInwardHistory, searchOutwardHistory, searchTransferHistory } from "../../store/slices/historySlice";
import { listProcurementRequests, resolveProcurementRequest } from "../../store/slices/procurementSlice";
import { listProjects } from "../../store/slices/adminProjectsSlice";

// ========================
// Types matching backend DTOs
// ========================

interface Project {
  id: number | string;
  name: string;
  code?: string;
}

interface InwardRecord {
  id?: number | string;
  code: string;
  date: string;
  invoiceNo?: string;
  supplierName?: string;
  items?: number;
  projectName?: string;
  type?: string;
  validated?: boolean;
  remarks?: string;
}

interface OutwardRecord {
  id?: number | string;
  code: string;
  date: string;
  issueTo?: string;
  jobNo?: string;
  status?: string;
  items?: number;
  projectName?: string;
  projectId?: string;
  validated?: boolean;
  closeDate?: string;
}

interface TransferRecord {
  id?: number | string;
  code: string;
  date: string;
  fromProjectName?: string;
  fromProjectId?: string;
  toProjectName?: string;
  toProjectId?: string;
  items?: number;
  fromSite?: string;
  toSite?: string;
  remarks?: string;
}

interface ProcurementRequest {
  id?: number | string;
  materialCode?: string;
  materialName?: string;
  materialUnit?: string;
  quantity?: number;
  requesterName?: string;
  projectName?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  requestDate?: string;
}

interface ProjectStats {
  totalInwards: number;
  totalOutwards: number;
  totalTransfersIn: number;
  totalTransfersOut: number;
  totalProcurements: number;
  totalMaterials: number;
  activeTransactions: number;
  completionRate: number;
}

interface PaginatedResponse<T> {
  items?: T[];
  content?: T[];
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
}

// ========================
// Component
// ========================

const UnifiedProjectDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);

  // Project selection
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Stats calculated from paginated totals
  const [stats, setStats] = useState<ProjectStats>({
    totalInwards: 0,
    totalOutwards: 0,
    totalTransfersIn: 0,
    totalTransfersOut: 0,
    totalProcurements: 0,
    totalMaterials: 0,
    activeTransactions: 0,
    completionRate: 0,
  });

  // Paginated display data
  const [inwardRecords, setInwardRecords] = useState<InwardRecord[]>([]);
  const [inwardLoading, setInwardLoading] = useState(false);
  const [inwardSearch, setInwardSearch] = useState("");
  const [inwardPage, setInwardPage] = useState(1);
  const [inwardPageSize, setInwardPageSize] = useState(10);
  const [inwardTotal, setInwardTotal] = useState(0);
  const [inwardSupplier, setInwardSupplier] = useState("");
  const [inwardInvoice, setInwardInvoice] = useState("");
  const [inwardStartDate, setInwardStartDate] = useState<Date | null>(null);
  const [inwardEndDate, setInwardEndDate] = useState<Date | null>(null);
  const [showInwardFilters, setShowInwardFilters] = useState(false);

  const [outwardRecords, setOutwardRecords] = useState<OutwardRecord[]>([]);
  const [outwardLoading, setOutwardLoading] = useState(false);
  const [outwardSearch, setOutwardSearch] = useState("");
  const [outwardPage, setOutwardPage] = useState(1);
  const [outwardPageSize, setOutwardPageSize] = useState(10);
  const [outwardTotal, setOutwardTotal] = useState(0);
  const [outwardIssueTo, setOutwardIssueTo] = useState("");
  const [outwardJobNo, setOutwardJobNo] = useState("");
  const [outwardStartDate, setOutwardStartDate] = useState<Date | null>(null);
  const [outwardEndDate, setOutwardEndDate] = useState<Date | null>(null);
  const [showOutwardFilters, setShowOutwardFilters] = useState(false);

  const [transferRecords, setTransferRecords] = useState<TransferRecord[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [transferPage, setTransferPage] = useState(1);
  const [transferPageSize, setTransferPageSize] = useState(10);
  const [transferTotal, setTransferTotal] = useState(0);
  const [transferStartDate, setTransferStartDate] = useState<Date | null>(null);
  const [transferEndDate, setTransferEndDate] = useState<Date | null>(null);
  const [showTransferFilters, setShowTransferFilters] = useState(false);

  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [procurementLoading, setProcurementLoading] = useState(false);
  const [procurementSearch, setProcurementSearch] = useState("");
  const [procurementPage, setProcurementPage] = useState(0);
  const [procurementRows, setProcurementRows] = useState(10);

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // ========================
  // Effects
  // ========================

  useEffect(() => {
    loadProjects();
  }, [token]);

  useEffect(() => {
    if (selectedProjectId) {
      loadInwards();
      loadOutwards();
      loadTransfers();
      loadProcurements();
    } else {
      resetAllData();
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) loadInwards();
  }, [selectedProjectId, inwardPage, inwardPageSize, inwardSearch, inwardSupplier, inwardInvoice, inwardStartDate, inwardEndDate]);

  useEffect(() => {
    if (selectedProjectId) loadOutwards();
  }, [selectedProjectId, outwardPage, outwardPageSize, outwardSearch, outwardIssueTo, outwardJobNo, outwardStartDate, outwardEndDate]);

  useEffect(() => {
    if (selectedProjectId) loadTransfers();
  }, [selectedProjectId, transferPage, transferPageSize, transferSearch, transferStartDate, transferEndDate]);

  // ========================
  // Data Loading Functions
  // ========================

  const loadProjects = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await dispatch(listProjects({ limit: 1000 })).unwrap();
      const data = response?.items || response?.content || response?.data?.content || [];
      const projectList = Array.isArray(data) ? data : [];
      setProjects(projectList);
      
      // Auto-select first project if none is selected
      if (!selectedProjectId && projectList.length > 0) {
        setSelectedProjectId(Number(projectList[0].id));
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };



  const loadInwards = async () => {
    if (!selectedProjectId) return;
    setInwardLoading(true);
    try {
      const params: any = {
        projectId: selectedProjectId,
        page: inwardPage,
        size: inwardPageSize,
      };
      
      if (inwardSearch) params.search = inwardSearch;
      if (inwardSupplier) params.supplierName = inwardSupplier;
      if (inwardInvoice) params.invoiceNo = inwardInvoice;
      if (inwardStartDate) params.startDate = inwardStartDate.toISOString().split('T')[0];
      if (inwardEndDate) params.endDate = inwardEndDate.toISOString().split('T')[0];

      const response: PaginatedResponse<InwardRecord> = await dispatch(searchInwardHistory(params)).unwrap();
      const data = response?.items || response?.content || [];
      setInwardRecords(Array.isArray(data) ? data : []);
      const total = response?.totalItems || 0;
      setInwardTotal(total);
      
      // Update stats with current totals
      setStats(prev => ({ ...prev, totalInwards: total }));
    } catch (error) {
      console.error("Failed to load inwards:", error);
      toast.error("Failed to load inward records");
      setInwardRecords([]);
    } finally {
      setInwardLoading(false);
    }
  };

  const normalizeId = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") {
      const asNumber = Number(value);
      return Number.isNaN(asNumber) ? value : asNumber;
    }
    return undefined;
  };

  const loadOutwards = async () => {
    if (!selectedProjectId) return;
    setOutwardLoading(true);
    try {
      const params: any = {
        projectId: selectedProjectId,
        page: outwardPage,
        size: outwardPageSize,
      };
      
      if (outwardSearch) params.search = outwardSearch;
      if (outwardIssueTo) params.issueTo = outwardIssueTo;
      if (outwardJobNo) params.jobNo = outwardJobNo;
      if (outwardStartDate) params.startDate = outwardStartDate.toISOString().split('T')[0];
      if (outwardEndDate) params.endDate = outwardEndDate.toISOString().split('T')[0];

      const response: PaginatedResponse<OutwardRecord> = await dispatch(searchOutwardHistory(params)).unwrap();
      const data = response?.items || response?.content || [];
      const normalized = Array.isArray(data)
        ? data.map(item => ({ ...item, id: normalizeId((item as any).id ?? (item as any).code) }))
        : [];
      setOutwardRecords(normalized);
      const total = response?.totalItems || 0;
      setOutwardTotal(total);
      
      // Update stats with current totals
      const activeCount = normalized.filter((o: OutwardRecord) => o.status !== 'CLOSED').length;
      setStats(prev => ({ 
        ...prev, 
        totalOutwards: total,
        activeTransactions: activeCount,
        completionRate: total > 0 ? Math.round(((total - activeCount) / total) * 100) : 0
      }));
    } catch (error) {
      console.error("Failed to load outwards:", error);
      toast.error("Failed to load outward records");
      setOutwardRecords([]);
    } finally {
      setOutwardLoading(false);
    }
  };

  const loadTransfers = async () => {
    if (!selectedProjectId) return;
    setTransferLoading(true);
    try {
      const params: any = {
        projectId: selectedProjectId,
        page: transferPage,
        size: transferPageSize,
      };
      
      if (transferSearch) params.search = transferSearch;
      if (transferStartDate) params.startDate = transferStartDate.toISOString().split('T')[0];
      if (transferEndDate) params.endDate = transferEndDate.toISOString().split('T')[0];

      const response: PaginatedResponse<TransferRecord> = await dispatch(searchTransferHistory(params)).unwrap();
      const data = response?.items || response?.content || [];
      const normalized = Array.isArray(data)
        ? data.map(item => ({ ...item, id: normalizeId((item as any).id ?? (item as any).code) }))
        : [];
      setTransferRecords(normalized);
      const total = response?.totalItems || 0;
      setTransferTotal(total);
      
      // Count transfers IN and OUT from current data
      const transfersIn = data.filter((t: TransferRecord) => 
        t.toProjectId && Number(t.toProjectId) === Number(selectedProjectId)
      ).length;
      const transfersOut = data.filter((t: TransferRecord) => 
        t.fromProjectId && Number(t.fromProjectId) === Number(selectedProjectId)
      ).length;
      
      setStats(prev => ({ 
        ...prev, 
        totalTransfersIn: transfersIn,
        totalTransfersOut: transfersOut
      }));
    } catch (error) {
      console.error("Failed to load transfers:", error);
      toast.error("Failed to load transfer records");
      setTransferRecords([]);
    } finally {
      setTransferLoading(false);
    }
  };

  const loadProcurements = async () => {
    if (!selectedProjectId) return;
    setProcurementLoading(true);
    try {
      const response = await dispatch(listProcurementRequests({
        projectId: selectedProjectId,
        page: 1,
        size: 10000,
      })).unwrap();
      const data = response?.items || response?.content || [];
      setProcurementRequests(Array.isArray(data) ? data : []);
      
      // Update procurement count in stats
      setStats(prev => ({ ...prev, totalProcurements: data.length }));
    } catch (error) {
      console.error("Failed to load procurements:", error);
      toast.error("Failed to load procurement requests");
      setProcurementRequests([]);
    } finally {
      setProcurementLoading(false);
    }
  };

  const resetAllData = () => {
    setInwardRecords([]);
    setOutwardRecords([]);
    setTransferRecords([]);
    setProcurementRequests([]);
    setInwardPage(1);
    setOutwardPage(1);
    setTransferPage(1);
    clearAllFilters();
    setStats({
      totalInwards: 0,
      totalOutwards: 0,
      totalTransfersIn: 0,
      totalTransfersOut: 0,
      totalProcurements: 0,
      totalMaterials: 0,
      activeTransactions: 0,
      completionRate: 0,
    });
  };

  const clearAllFilters = () => {
    setInwardSearch("");
    setInwardSupplier("");
    setInwardInvoice("");
    setInwardStartDate(null);
    setInwardEndDate(null);
    setOutwardSearch("");
    setOutwardIssueTo("");
    setOutwardJobNo("");
    setOutwardStartDate(null);
    setOutwardEndDate(null);
    setTransferSearch("");
    setTransferStartDate(null);
    setTransferEndDate(null);
    setProcurementSearch("");
  };

  // ========================
  // Computed Values
  // ========================

  const selectedProject = useMemo(() => {
    if (!selectedProjectId || !projects.length) return null;
    return projects.find(p => Number(p.id) === Number(selectedProjectId));
  }, [projects, selectedProjectId]);

  const projectOptions = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    return projects.map((p) => ({
      label: `${p.code || p.name} - ${p.name}`,
      value: Number(p.id),
    }));
  }, [projects]);

  const filteredProcurements = useMemo(() => {
    if (!procurementSearch.trim()) return procurementRequests;
    const query = procurementSearch.toLowerCase();
    return procurementRequests.filter(r =>
      r.materialCode?.toLowerCase().includes(query) ||
      r.materialName?.toLowerCase().includes(query) ||
      r.requesterName?.toLowerCase().includes(query)
    );
  }, [procurementRequests, procurementSearch]);


  // ========================
  // Row Click Handlers
  // ========================

  const handleInwardRowClick = (rowData: InwardRecord) => {
    const id = rowData.id ?? rowData.code;
    if (!id) {
      toast.error("Unable to open inward – missing record id");
      return;
    }
    navigate(`/admin/inward/${id}`);
  };

  const handleOutwardRowClick = (rowData: OutwardRecord) => {
    const id = rowData.id ?? rowData.code;
    if (!id) {
      toast.error("Unable to open outward – missing record id");
      return;
    }
    navigate(`/admin/outward/${id}`);
  };

  const handleTransferRowClick = (rowData: TransferRecord) => {
    const id = rowData.id ?? rowData.code;
    if (!id) {
      toast.error("Unable to open transfer – missing record id");
      return;
    }
    navigate(`/admin/transfer/${id}`);
  };

  // ========================
  // Template Functions (Fixed NaN warnings)
  // ========================

  const codeTemplate = (rowData: any) => (
    <span className="font-mono text-[10px] font-semibold text-blue-700">{rowData.code || ''}</span>
  );

  const statusTemplate = (rowData: OutwardRecord) => {
    const severity = rowData.status === 'CLOSED' ? 'success' : 'info';
    return <Tag value={rowData.status || 'OPEN'} severity={severity} style={{ fontSize: '9px', padding: '2px 6px' }} />;
  };

  const validatedTemplate = (rowData: InwardRecord | OutwardRecord) => {
    return rowData.validated ? (
      <Tag value="Yes" severity="success" style={{ fontSize: '9px', padding: '2px 6px' }} />
    ) : (
      <Tag value="No" severity="warning" style={{ fontSize: '9px', padding: '2px 6px' }} />
    );
  };

  const procurementStatusTemplate = (rowData: ProcurementRequest) => {
    const severityMap: Record<string, any> = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'danger'
    };
    return <Tag value={rowData.status || 'PENDING'} severity={severityMap[rowData.status || 'PENDING']} style={{ fontSize: '9px', padding: '2px 6px' }} />;
  };

  // Fix NaN warnings by ensuring numbers are properly converted to strings
  const itemsTemplate = (rowData: any, color: string = 'slate') => {
    const items = typeof rowData.items === 'number' ? rowData.items : 0;
    return <span className={`font-semibold text-${color}-700`} style={{ fontSize: '10px' }}>{items}</span>;
  };

  const quantityTemplate = (rowData: ProcurementRequest) => {
    const qty = typeof rowData.quantity === 'number' ? rowData.quantity : 0;
    return <span className="font-semibold" style={{ fontSize: '10px' }}>{qty}</span>;
  };

  // ========================
  // Render
  // ========================

  return (
    <div className="min-h-screen bg-slate-50 p-2">
      <div className="max-w-full mx-auto space-y-2">
        {/* Compact Header with Project Selector */}
        <div className="flex items-center justify-between gap-2 bg-white p-2 rounded shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded">
              <FiActivity className="text-white text-xs" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-slate-900">Project Management Dashboard</h1>
              <p className="text-[9px] text-slate-600">Comprehensive analytics & transaction management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FiFilter className="text-blue-600 text-xs" />
            <label className="text-[10px] text-slate-700 font-semibold whitespace-nowrap">Project:</label>
            <Dropdown
              value={selectedProjectId}
              options={projectOptions}
              onChange={(e) => setSelectedProjectId(e.value)}
              placeholder="Select project"
              className="w-64"
              style={{ fontSize: '11px' }}
              filter
              showClear
              loading={loading}
            />
            <PrimeButton
              label="Create Project"
              icon="pi pi-plus"
              onClick={() => navigate('/admin/projects')}
              className="p-button-sm"
              style={{ fontSize: '10px', height: '32px' }}
            />
          </div>
        </div>

        {!selectedProjectId ? (
          <Card className="text-center py-8 bg-white shadow-sm border border-slate-200">
            <FiBox className="mx-auto text-xs text-slate-300 mb-2" />
            <h2 className="text-xs font-bold text-slate-700 mb-1">No Project Selected</h2>
            <p className="text-[10px] text-slate-500">Please select a project from the dropdown above</p>
          </Card>
        ) : (
          <>
            {/* Transaction Details Tabs with Project Name Above */}
            <Card className="bg-white shadow-sm p-2">
              {/* Project Name Above Tabs */}
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                <FiBox className="text-blue-600 text-xs" />
                <div>
                  <h2 className="text-xs font-bold text-slate-900">{selectedProject?.name || 'Unknown Project'}</h2>
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[9px] font-mono">
                    {selectedProject?.code || 'N/A'}
                  </span>
                </div>
              </div>
              
              <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)} style={{ fontSize: '11px' }}>
                {/* Inwards Tab */}
                <TabPanel 
                  header={
                    <div className="flex items-center gap-1" style={{ fontSize: '10px' }}>
                      <FiArrowDown className="text-green-600" />
                      <span>Inwards ({inwardTotal})</span>
                    </div>
                  }
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="p-input-icon-left flex-1 min-w-[150px]">
                        <i className="pi pi-search" style={{ fontSize: '10px' }} />
                        <InputText
                          value={inwardSearch}
                          onChange={(e) => setInwardSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full"
                          style={{ fontSize: '10px', padding: '4px 4px 4px 24px' }}
                        />
                      </span>
                      <PrimeButton
                        icon={<FiFilter style={{ fontSize: '10px' }} />}
                        label="Filters"
                        onClick={() => setShowInwardFilters(!showInwardFilters)}
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                        className="p-button-outlined"
                        badge={[inwardSupplier, inwardInvoice, inwardStartDate, inwardEndDate].filter(Boolean).length.toString() || undefined}
                      />
                      {(inwardSupplier || inwardInvoice || inwardStartDate || inwardEndDate) && (
                        <PrimeButton
                          icon={<FiX style={{ fontSize: '10px' }} />}
                          label="Clear"
                          onClick={() => {
                            setInwardSupplier("");
                            setInwardInvoice("");
                            setInwardStartDate(null);
                            setInwardEndDate(null);
                          }}
                          style={{ fontSize: '10px', padding: '4px 8px' }}
                          className="p-button-text"
                        />
                      )}
                    </div>

                    {showInwardFilters && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-2 bg-slate-50 rounded border border-slate-200">
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">Supplier</label>
                          <InputText
                            value={inwardSupplier}
                            onChange={(e) => setInwardSupplier(e.target.value)}
                            placeholder="Supplier name"
                            className="w-full"
                            style={{ fontSize: '10px', padding: '4px' }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">Invoice No</label>
                          <InputText
                            value={inwardInvoice}
                            onChange={(e) => setInwardInvoice(e.target.value)}
                            placeholder="Invoice number"
                            className="w-full"
                            style={{ fontSize: '10px', padding: '4px' }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">Start Date</label>
                          <Calendar
                            value={inwardStartDate}
                            onChange={(e) => setInwardStartDate(e.value as Date)}
                            dateFormat="yy-mm-dd"
                            placeholder="YYYY-MM-DD"
                            className="w-full"
                            inputStyle={{ fontSize: '10px', padding: '4px' }}
                            showIcon
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">End Date</label>
                          <Calendar
                            value={inwardEndDate}
                            onChange={(e) => setInwardEndDate(e.value as Date)}
                            dateFormat="yy-mm-dd"
                            placeholder="YYYY-MM-DD"
                            className="w-full"
                            inputStyle={{ fontSize: '10px', padding: '4px' }}
                            showIcon
                          />
                        </div>
                      </div>
                    )}
                    
                    <DataTable
                      value={inwardRecords}
                      loading={inwardLoading}
                      emptyMessage="No inward records found"
                      paginator
                      lazy
                      rows={inwardPageSize}
                      rowsPerPageOptions={[10, 20, 50]}
                      totalRecords={inwardTotal}
                      first={(inwardPage - 1) * inwardPageSize}
                      onPage={(e) => {
                        setInwardPage(e.page ? e.page + 1 : 1);
                        setInwardPageSize(e.rows);
                      }}
                      size="small"
                      showGridlines
                      stripedRows
                      selectionMode="single"
                      onRowClick={(e) => handleInwardRowClick(e.data as InwardRecord)}
                      rowClassName={() => "cursor-pointer hover:bg-green-50"}
                      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
                      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
                      style={{ fontSize: '10px' }}
                    >
                      <Column field="code" header="Code" sortable body={codeTemplate} style={{ width: '110px' }} />
                      <Column field="date" header="Date" sortable style={{ width: '85px', fontSize: '10px' }} />
                      <Column field="supplierName" header="Supplier" sortable style={{ fontSize: '10px' }} />
                      <Column field="invoiceNo" header="Invoice" sortable style={{ width: '95px', fontSize: '10px' }} />
                      <Column field="type" header="Type" sortable style={{ width: '80px', fontSize: '10px' }} />
                      <Column 
                        field="validated" 
                        header="Valid" 
                        sortable 
                        body={validatedTemplate}
                        style={{ width: '65px', textAlign: 'center' }}
                      />
                      <Column 
                        field="items" 
                        header="Items" 
                        sortable 
                        style={{ width: '55px', textAlign: 'center' }}
                        body={(rowData) => itemsTemplate(rowData, 'green')}
                      />
                    </DataTable>
                  </div>
                </TabPanel>

                {/* Outwards Tab */}
                <TabPanel 
                  header={
                    <div className="flex items-center gap-1" style={{ fontSize: '10px' }}>
                      <FiArrowUp className="text-red-600" />
                      <span>Outwards ({outwardTotal})</span>
                    </div>
                  }
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="p-input-icon-left flex-1 min-w-[150px]">
                        <i className="pi pi-search" style={{ fontSize: '10px' }} />
                        <InputText
                          value={outwardSearch}
                          onChange={(e) => setOutwardSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full"
                          style={{ fontSize: '10px', padding: '4px 4px 4px 24px' }}
                        />
                      </span>
                      <PrimeButton
                        icon={<FiFilter style={{ fontSize: '10px' }} />}
                        label="Filters"
                        onClick={() => setShowOutwardFilters(!showOutwardFilters)}
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                        className="p-button-outlined"
                        badge={[outwardIssueTo, outwardJobNo, outwardStartDate, outwardEndDate].filter(Boolean).length.toString() || undefined}
                      />
                      {(outwardIssueTo || outwardJobNo || outwardStartDate || outwardEndDate) && (
                        <PrimeButton
                          icon={<FiX style={{ fontSize: '10px' }} />}
                          label="Clear"
                          onClick={() => {
                            setOutwardIssueTo("");
                            setOutwardJobNo("");
                            setOutwardStartDate(null);
                            setOutwardEndDate(null);
                          }}
                          style={{ fontSize: '10px', padding: '4px 8px' }}
                          className="p-button-text"
                        />
                      )}
                    </div>

                    {showOutwardFilters && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-2 bg-slate-50 rounded border border-slate-200">
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">Issue To</label>
                          <InputText
                            value={outwardIssueTo}
                            onChange={(e) => setOutwardIssueTo(e.target.value)}
                            placeholder="Issue to"
                            className="w-full"
                            style={{ fontSize: '10px', padding: '4px' }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">Job No</label>
                          <InputText
                            value={outwardJobNo}
                            onChange={(e) => setOutwardJobNo(e.target.value)}
                            placeholder="Job number"
                            className="w-full"
                            style={{ fontSize: '10px', padding: '4px' }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">Start Date</label>
                          <Calendar
                            value={outwardStartDate}
                            onChange={(e) => setOutwardStartDate(e.value as Date)}
                            dateFormat="yy-mm-dd"
                            placeholder="YYYY-MM-DD"
                            className="w-full"
                            inputStyle={{ fontSize: '10px', padding: '4px' }}
                            showIcon
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">End Date</label>
                          <Calendar
                            value={outwardEndDate}
                            onChange={(e) => setOutwardEndDate(e.value as Date)}
                            dateFormat="yy-mm-dd"
                            placeholder="YYYY-MM-DD"
                            className="w-full"
                            inputStyle={{ fontSize: '10px', padding: '4px' }}
                            showIcon
                          />
                        </div>
                      </div>
                    )}
                    
                    <DataTable
                      value={outwardRecords}
                      loading={outwardLoading}
                      emptyMessage="No outward records found"
                      paginator
                      lazy
                      rows={outwardPageSize}
                      rowsPerPageOptions={[10, 20, 50]}
                      totalRecords={outwardTotal}
                      first={(outwardPage - 1) * outwardPageSize}
                      onPage={(e) => {
                        setOutwardPage(e.page ? e.page + 1 : 1);
                        setOutwardPageSize(e.rows);
                      }}
                      size="small"
                      showGridlines
                      stripedRows
                      selectionMode="single"
                      onRowClick={(e) => handleOutwardRowClick(e.data as OutwardRecord)}
                      rowClassName={() => "cursor-pointer hover:bg-red-50"}
                      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
                      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
                      style={{ fontSize: '10px' }}
                    >
                      <Column field="code" header="Code" sortable body={codeTemplate} style={{ width: '110px' }} />
                      <Column field="date" header="Date" sortable style={{ width: '85px', fontSize: '10px' }} />
                      <Column field="issueTo" header="Issue To" sortable style={{ fontSize: '10px' }} />
                      <Column 
                        field="status" 
                        header="Status" 
                        sortable 
                        body={statusTemplate}
                        style={{ width: '75px' }}
                      />
                      <Column field="closeDate" header="Closed" sortable style={{ width: '85px', fontSize: '10px' }} />
                      <Column 
                        field="validated" 
                        header="Valid" 
                        sortable 
                        body={validatedTemplate}
                        style={{ width: '65px', textAlign: 'center' }}
                      />
                      <Column 
                        field="items" 
                        header="Items" 
                        sortable 
                        style={{ width: '55px', textAlign: 'center' }}
                        body={(rowData) => itemsTemplate(rowData, 'red')}
                      />
                    </DataTable>
                  </div>
                </TabPanel>

                {/* Transfers Tab */}
                <TabPanel 
                  header={
                    <div className="flex items-center gap-1" style={{ fontSize: '10px' }}>
                      <FiRepeat className="text-purple-600" />
                      <span>Transfers ({transferTotal})</span>
                    </div>
                  }
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="p-input-icon-left flex-1 min-w-[150px]">
                        <i className="pi pi-search" style={{ fontSize: '10px' }} />
                        <InputText
                          value={transferSearch}
                          onChange={(e) => setTransferSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full"
                          style={{ fontSize: '10px', padding: '4px 4px 4px 24px' }}
                        />
                      </span>
                      <PrimeButton
                        icon={<FiFilter style={{ fontSize: '10px' }} />}
                        label="Filters"
                        onClick={() => setShowTransferFilters(!showTransferFilters)}
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                        className="p-button-outlined"
                        badge={[transferStartDate, transferEndDate].filter(Boolean).length.toString() || undefined}
                      />
                      {(transferStartDate || transferEndDate) && (
                        <PrimeButton
                          icon={<FiX style={{ fontSize: '10px' }} />}
                          label="Clear"
                          onClick={() => {
                            setTransferStartDate(null);
                            setTransferEndDate(null);
                          }}
                          style={{ fontSize: '10px', padding: '4px 8px' }}
                          className="p-button-text"
                        />
                      )}
                    </div>

                    {showTransferFilters && (
                      <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 rounded border border-slate-200">
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">Start Date</label>
                          <Calendar
                            value={transferStartDate}
                            onChange={(e) => setTransferStartDate(e.value as Date)}
                            dateFormat="yy-mm-dd"
                            placeholder="YYYY-MM-DD"
                            className="w-full"
                            inputStyle={{ fontSize: '10px', padding: '4px' }}
                            showIcon
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-600 mb-0.5 block">End Date</label>
                          <Calendar
                            value={transferEndDate}
                            onChange={(e) => setTransferEndDate(e.value as Date)}
                            dateFormat="yy-mm-dd"
                            placeholder="YYYY-MM-DD"
                            className="w-full"
                            inputStyle={{ fontSize: '10px', padding: '4px' }}
                            showIcon
                          />
                        </div>
                      </div>
                    )}
                    
                    <DataTable
                      value={transferRecords}
                      loading={transferLoading}
                      emptyMessage="No transfer records found"
                      paginator
                      lazy
                      rows={transferPageSize}
                      rowsPerPageOptions={[10, 20, 50]}
                      totalRecords={transferTotal}
                      first={(transferPage - 1) * transferPageSize}
                      onPage={(e) => {
                        setTransferPage(e.page ? e.page + 1 : 1);
                        setTransferPageSize(e.rows);
                      }}
                      size="small"
                      showGridlines
                      stripedRows
                      selectionMode="single"
                      onRowClick={(e) => handleTransferRowClick(e.data as TransferRecord)}
                      rowClassName={() => "cursor-pointer hover:bg-purple-50"}
                      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
                      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
                      style={{ fontSize: '10px' }}
                    >
                      <Column field="code" header="Code" sortable body={codeTemplate} style={{ width: '110px' }} />
                      <Column field="date" header="Date" sortable style={{ width: '85px', fontSize: '10px' }} />
                      <Column field="fromProjectName" header="From Project" sortable style={{ fontSize: '10px' }} />
                      <Column field="fromSite" header="From Site" sortable style={{ width: '90px', fontSize: '10px' }} />
                      <Column field="toProjectName" header="To Project" sortable style={{ fontSize: '10px' }} />
                      <Column field="toSite" header="To Site" sortable style={{ width: '90px', fontSize: '10px' }} />
                      <Column 
                        field="items" 
                        header="Items" 
                        sortable 
                        style={{ width: '55px', textAlign: 'center' }}
                        body={(rowData) => itemsTemplate(rowData, 'purple')}
                      />
                    </DataTable>
                  </div>
                </TabPanel>

                {/* Procurements Tab */}
                <TabPanel 
                  header={
                    <div className="flex items-center gap-1" style={{ fontSize: '10px' }}>
                      <FiShoppingCart className="text-orange-600" />
                      <span>Procurements ({procurementRequests.length})</span>
                    </div>
                  }
                >
                  <div className="space-y-1.5">
                    <span className="p-input-icon-left w-full">
                      <i className="pi pi-search" style={{ fontSize: '10px' }} />
                      <InputText
                        value={procurementSearch}
                        onChange={(e) => setProcurementSearch(e.target.value)}
                        placeholder="Search materials or requester..."
                        className="w-full"
                        style={{ fontSize: '10px', padding: '4px 4px 4px 24px' }}
                      />
                    </span>
                    
                    <DataTable
                      value={filteredProcurements}
                      loading={procurementLoading}
                      emptyMessage="No procurement requests found"
                      paginator
                      rows={procurementRows}
                      rowsPerPageOptions={[10, 20, 50]}
                      first={procurementPage}
                      onPage={(e) => {
                        setProcurementPage(e.first);
                        setProcurementRows(e.rows);
                      }}
                      size="small"
                      showGridlines
                      stripedRows
                      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
                      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
                      style={{ fontSize: '10px' }}
                    >
                      <Column field="materialCode" header="Code" sortable style={{ width: '100px', fontSize: '10px' }} />
                      <Column field="materialName" header="Material" sortable style={{ fontSize: '10px' }} />
                      <Column field="materialUnit" header="Unit" sortable style={{ width: '70px', fontSize: '10px' }} />
                      <Column 
                        field="quantity" 
                        header="Qty" 
                        sortable 
                        style={{ width: '70px', textAlign: 'right' }}
                        body={quantityTemplate}
                      />
                      <Column field="requesterName" header="Requester" sortable style={{ fontSize: '10px' }} />
                      <Column field="requestDate" header="Date" sortable style={{ width: '85px', fontSize: '10px' }} />
                      <Column 
                        field="status" 
                        header="Status" 
                        sortable 
                        body={procurementStatusTemplate}
                        style={{ width: '85px' }}
                      />
                      <Column field="remarks" header="Remarks" style={{ fontSize: '10px' }} />
                    </DataTable>
                  </div>
                </TabPanel>
              </TabView>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default UnifiedProjectDetailsPage;
