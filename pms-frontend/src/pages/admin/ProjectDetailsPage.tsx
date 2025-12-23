import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { adminProjectsApi, historyApi } from "../../api";
import type { RootState } from "../../store/store";
import { FiBox, FiArrowDown, FiArrowUp, FiRepeat, FiSearch } from "react-icons/fi";

import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomSelect from "../../widgets/CustomSelect";
import CustomTabs from "../../widgets/CustomTabs";

// ---- Types ---- //

interface Project {
  id: number | string;
  name: string;
  code?: string;
}

interface BomLine {
  id?: number | string;
  materialCode?: string;
  materialName?: string;
  materialUnit?: string;
  allocatedQty?: number;
  balanceQty?: number;
}

interface InwardRecord {
  id?: number | string;
  code: string;
  date: string;
  supplierName?: string;
  items?: number;
}

interface OutwardRecord {
  id?: number | string;
  code: string;
  date: string;
  issueTo?: string;
  status?: string;
  items?: number;
}

interface TransferRecord {
  id?: number | string;
  code: string;
  date: string;
  fromProjectName?: string;
  toProjectName?: string;
  items?: number;
}

interface ProjectStats {
  totalMaterials: number;
  totalInwards: number;
  totalOutwards: number;
  totalTransfers: number;
  totalAllocatedValue: number;
  totalBalanceValue: number;
}

// ---- Simple Bar Chart Component ----

const SimpleBarChart: React.FC<{
  data: { label: string; allocated: number; balance: number }[];
}> = ({ data }) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.allocated, d.balance)), 1);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[500px] h-[300px] flex items-end gap-4 p-4">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
            <div className="flex gap-1 items-end h-[250px] w-full justify-center">
              {/* Allocated Bar */}
              <div
                className="w-3 bg-blue-500 rounded-t transition-all hover:bg-blue-600 relative group/bar"
                style={{ height: `${(item.allocated / maxVal) * 100}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/bar:opacity-100 pointer-events-none whitespace-nowrap z-10">
                  Alloc: {item.allocated}
                </div>
              </div>
              {/* Balance Bar */}
              <div
                className="w-3 bg-emerald-400 rounded-t transition-all hover:bg-emerald-500 relative group/bar"
                style={{ height: `${(item.balance / maxVal) * 100}%` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/bar:opacity-100 pointer-events-none whitespace-nowrap z-10">
                  Bal: {item.balance}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 truncate w-full text-center rotate-[-45deg] mt-2 origin-top-left translate-x-3">
              {item.label}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-6 mt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span className="text-xs text-slate-600">Allocated Qty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
          <span className="text-xs text-slate-600">Balance Qty</span>
        </div>
      </div>
    </div>
  );
};

// ---- Component ---- //

const ProjectDetailsPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // BOM data
  const [bomLines, setBomLines] = useState<BomLine[]>([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [bomSearch, setBomSearch] = useState("");

  // Transaction history
  const [inwardRecords, setInwardRecords] = useState<InwardRecord[]>([]);
  const [outwardRecords, setOutwardRecords] = useState<OutwardRecord[]>([]);
  const [transferInRecords, setTransferInRecords] = useState<TransferRecord[]>([]);
  const [transferOutRecords, setTransferOutRecords] = useState<TransferRecord[]>([]);

  // Stats
  const [stats, setStats] = useState<ProjectStats>({
    totalMaterials: 0,
    totalInwards: 0,
    totalOutwards: 0,
    totalTransfers: 0,
    totalAllocatedValue: 0,
    totalBalanceValue: 0,
  });

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [token]);

  // Load project data when selection changes
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData();
    } else {
      resetProjectData();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await adminProjectsApi.listProjects({ limit: 1000 });
      const data = response?.data?.content || response?.content || response || [];
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!selectedProjectId) return;

    setBomLoading(true);
    try {
      await loadBOM();
      await loadTransactionHistory();
    } catch (error) {
      console.error("Failed to load project data:", error);
      toast.error("Failed to load project data");
    } finally {
      setBomLoading(false);
    }
  };

  const loadBOM = async () => {
    if (!selectedProjectId) return;

    try {
      // Fetch BOM logic
      const response = await fetch(`/api/bom/projects/${selectedProjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const lines = Array.isArray(data) ? data : data?.lines || [];
        setBomLines(lines);

        // Calculate stats
        const totalMaterials = lines.length;
        const totalAllocated = lines.reduce((sum: number, line: BomLine) => sum + (line.allocatedQty || 0), 0);
        const totalBalance = lines.reduce((sum: number, line: BomLine) => sum + (line.balanceQty || 0), 0);

        setStats(prev => ({
          ...prev,
          totalMaterials,
          totalAllocatedValue: totalAllocated,
          totalBalanceValue: totalBalance,
        }));
      }
    } catch (error) {
      console.error("Failed to load BOM:", error);
      setBomLines([]);
    }
  };

  const loadTransactionHistory = async () => {
    if (!selectedProjectId) return;

    try {
      const inwardResponse = await historyApi.searchInwardHistory({ projectId: selectedProjectId, page: 1, size: 100 });
      const inwards = inwardResponse?.content || [];
      setInwardRecords(inwards);

      const outwardResponse = await historyApi.searchOutwardHistory({ projectId: selectedProjectId, page: 1, size: 100 });
      const outwards = outwardResponse?.content || [];
      setOutwardRecords(outwards);

      const transferResponse = await historyApi.searchTransferHistory({ projectId: selectedProjectId, page: 1, size: 100 });
      const transfers = transferResponse?.content || [];

      const transfersIn = transfers.filter((t: TransferRecord) =>
        t.toProjectName && t.toProjectName.includes(selectedProject?.name || "")
      );
      const transfersOut = transfers.filter((t: TransferRecord) =>
        t.fromProjectName && t.fromProjectName.includes(selectedProject?.name || "")
      );

      setTransferInRecords(transfersIn);
      setTransferOutRecords(transfersOut);

      setStats(prev => ({
        ...prev,
        totalInwards: inwards.length,
        totalOutwards: outwards.length,
        totalTransfers: transfers.length,
      }));
    } catch (error) {
      console.error("Failed to load transaction history:", error);
    }
  };

  const resetProjectData = () => {
    setBomLines([]);
    setInwardRecords([]);
    setOutwardRecords([]);
    setTransferInRecords([]);
    setTransferOutRecords([]);
    setStats({
      totalMaterials: 0,
      totalInwards: 0,
      totalOutwards: 0,
      totalTransfers: 0,
      totalAllocatedValue: 0,
      totalBalanceValue: 0,
    });
  };

  const selectedProject = useMemo(() => {
    return projects.find(p => String(p.id) === String(selectedProjectId));
  }, [projects, selectedProjectId]);

  const filteredBomLines = useMemo(() => {
    if (!bomSearch.trim()) return bomLines;
    const query = bomSearch.toLowerCase();
    return bomLines.filter(line =>
      line.materialCode?.toLowerCase().includes(query) ||
      line.materialName?.toLowerCase().includes(query)
    );
  }, [bomLines, bomSearch]);

  // Chart data
  const chartData = useMemo(() => {
    if (!selectedProjectId || bomLines.length === 0) return [];
    return filteredBomLines.slice(0, 10).map(line => ({
      label: line.materialCode || "Unknown",
      allocated: line.allocatedQty || 0,
      balance: line.balanceQty || 0
    }));
  }, [selectedProjectId, filteredBomLines, bomLines]);

  // ---- Table Columns ----

  const bomColumns: ColumnDef<BomLine>[] = [
    { field: 'materialCode', header: 'Code', width: '150px' },
    { field: 'materialName', header: 'Material Name' },
    { field: 'materialUnit', header: 'Unit', width: '80px' },
    { field: 'allocatedQty', header: 'Allocated', align: 'right', body: (r) => <span className="font-semibold text-blue-600">{r.allocatedQty}</span> },
    { field: 'balanceQty', header: 'Balance', align: 'right', body: (r) => <span className="font-semibold text-emerald-600">{r.balanceQty}</span> },
  ];

  const inwardColumns: ColumnDef<InwardRecord>[] = [
    { field: 'code', header: 'Code' },
    { field: 'date', header: 'Date', body: (r) => r.date ? new Date(r.date).toLocaleDateString() : '—' },
    { field: 'supplierName', header: 'Supplier' },
    { field: 'items', header: 'Items', align: 'right' }
  ];

  const outwardColumns: ColumnDef<OutwardRecord>[] = [
    { field: 'code', header: 'Code' },
    { field: 'date', header: 'Date', body: (r) => r.date ? new Date(r.date).toLocaleDateString() : '—' },
    { field: 'issueTo', header: 'Issue To' },
    {
      field: 'status', header: 'Status', body: (r) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
          {r.status || 'OPEN'}
        </span>
      )
    },
    { field: 'items', header: 'Items', align: 'right' }
  ];

  const transferInColumns: ColumnDef<TransferRecord>[] = [
    { field: 'code', header: 'Code' },
    { field: 'date', header: 'Date', body: (r) => r.date ? new Date(r.date).toLocaleDateString() : '—' },
    { field: 'fromProjectName', header: 'From Project' },
    { field: 'items', header: 'Items', align: 'right' }
  ];

  const transferOutColumns: ColumnDef<TransferRecord>[] = [
    { field: 'code', header: 'Code' },
    { field: 'date', header: 'Date', body: (r) => r.date ? new Date(r.date).toLocaleDateString() : '—' },
    { field: 'toProjectName', header: 'To Project' },
    { field: 'items', header: 'Items', align: 'right' }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xs font-bold text-slate-800">Project Details</h1>
            <p className="text-slate-500">Comprehensive view of project data</p>
          </div>
          <div className="w-full md:w-80">
            <CustomSelect
              label="Select Project"
              value={selectedProjectId || ''}
              options={projects.map(p => ({ label: `${p.code} - ${p.name}`, value: String(p.id) }))}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            />
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
            <FiBox className="text-xs mb-4 opacity-50" />
            <p className="text-xs">Select a project to view details</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase">Materials</span>
                  <p className="text-xs font-bold text-slate-800">{stats.totalMaterials}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><FiBox size={20} /></div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase">Inwards</span>
                  <p className="text-xs font-bold text-slate-800">{stats.totalInwards}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><FiArrowDown size={20} /></div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase">Outwards</span>
                  <p className="text-xs font-bold text-slate-800">{stats.totalOutwards}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><FiArrowUp size={20} /></div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-600 uppercase">Transfers</span>
                  <p className="text-xs font-bold text-slate-800">{stats.totalTransfers}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><FiRepeat size={20} /></div>
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 mb-4">Material Allocations (Top 10)</h3>
                <SimpleBarChart data={chartData} />
              </div>
            )}

            {/* Tabs Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <CustomTabs tabs={[
                {
                  label: `BOM (${stats.totalMaterials})`,
                  content: (
                    <div className="flex flex-col gap-4">
                      <div className="max-w-md">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search materials..."
                            value={bomSearch}
                            onChange={(e) => setBomSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                          />
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                      <CustomTable
                        data={filteredBomLines}
                        columns={bomColumns}
                        loading={bomLoading}
                        pagination
                        rows={10}
                        emptyMessage="No materials found"
                      />
                    </div>
                  )
                },
                {
                  label: `Inwards (${stats.totalInwards})`,
                  content: <CustomTable data={inwardRecords} columns={inwardColumns} pagination rows={10} emptyMessage="No Inward History" />
                },
                {
                  label: `Outwards (${stats.totalOutwards})`,
                  content: <CustomTable data={outwardRecords} columns={outwardColumns} pagination rows={10} emptyMessage="No Outward History" />
                },
                {
                  label: `Transfers (${stats.totalTransfers})`,
                  content: (
                    <div className="flex flex-col gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-2">Incoming Transfers</h4>
                        <CustomTable data={transferInRecords} columns={transferInColumns} pagination rows={5} emptyMessage="No incoming transfers" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 mb-2">Outgoing Transfers</h4>
                        <CustomTable data={transferOutRecords} columns={transferOutColumns} pagination rows={5} emptyMessage="No outgoing transfers" />
                      </div>
                    </div>
                  )
                }
              ]} />
            </div>

          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
