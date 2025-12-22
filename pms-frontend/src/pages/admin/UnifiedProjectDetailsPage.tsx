
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiActivity,
  FiBox,
} from "react-icons/fi";
import type { RootState, AppDispatch } from "../../store/store";
import { searchInwardHistory, searchOutwardHistory, searchTransferHistory } from "../../store/slices/historySlice";
import { listProjects, setSelectedAdminProject } from "../../store/slices/adminProjectsSlice";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomTabs from "../../widgets/CustomTabs";
import CustomDropdown from "../../widgets/CustomSelect";
import CustomButton from "../../widgets/CustomButton";
import CustomLoader from "../../widgets/CustomLoader";

// ========================
// Types
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
  validated?: boolean;
}

interface TransferRecord {
  id?: number | string;
  code: string;
  date: string;
  fromProjectName?: string;
  toProjectName?: string;
  items?: number;
}

interface PaginatedResponse<T> {
  items?: T[];
  content?: T[];
  totalItems?: number;
}

// ========================
// Component
// ========================

const UnifiedProjectDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  const { selectedAdminProjectId } = useSelector((state: RootState) => state.adminProjects);

  // Project selection
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // State
  const [inwardRecords, setInwardRecords] = useState<InwardRecord[]>([]);
  const [inwardTotal, setInwardTotal] = useState(0);
  const [inwardLoading, setInwardLoading] = useState(false);

  const [outwardRecords, setOutwardRecords] = useState<OutwardRecord[]>([]);
  const [outwardTotal, setOutwardTotal] = useState(0);
  const [outwardLoading, setOutwardLoading] = useState(false);

  const [transferRecords, setTransferRecords] = useState<TransferRecord[]>([]);
  const [transferTotal, setTransferTotal] = useState(0);
  const [transferLoading, setTransferLoading] = useState(false);

  // ========================
  // Effects
  // ========================

  useEffect(() => {
    loadProjects();
  }, [token]);

  useEffect(() => {
    if (selectedAdminProjectId) {
      loadInwards();
      loadOutwards();
      loadTransfers();
    } else {
      setInwardRecords([]);
      setOutwardRecords([]);
      setTransferRecords([]);
    }
  }, [selectedAdminProjectId]);

  // ========================
  // Loaders
  // ========================

  const loadProjects = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await dispatch(listProjects({ limit: 1000 })).unwrap();
      const data = response?.items || response?.content || response?.data?.content || [];
      const list = Array.isArray(data) ? data : [];
      setProjects(list);
      if (!selectedAdminProjectId && list.length > 0) {
        dispatch(setSelectedAdminProject(String(list[0].id)));
      }
    } catch (error) {
      console.error("Failed to load projects", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadInwards = async () => {
    if (!selectedAdminProjectId) return;
    setInwardLoading(true);
    try {
      const response = await dispatch(searchInwardHistory({ projectId: Number(selectedAdminProjectId), page: 1, size: 100 })).unwrap();
      const data = response?.items || response?.content || [];
      setInwardRecords(data);
      setInwardTotal(response?.totalItems || data.length);
    } catch {
      setInwardRecords([]);
    } finally {
      setInwardLoading(false);
    }
  };

  const loadOutwards = async () => {
    if (!selectedAdminProjectId) return;
    setOutwardLoading(true);
    try {
      const response = await dispatch(searchOutwardHistory({ projectId: Number(selectedAdminProjectId), page: 1, size: 100 })).unwrap();
      const data = response?.items || response?.content || [];
      setOutwardRecords(data);
      setOutwardTotal(response?.totalItems || data.length);
    } catch {
      setOutwardRecords([]);
    } finally {
      setOutwardLoading(false);
    }
  };

  const loadTransfers = async () => {
    if (!selectedAdminProjectId) return;
    setTransferLoading(true);
    try {
      const response = await dispatch(searchTransferHistory({ projectId: Number(selectedAdminProjectId), page: 1, size: 100 })).unwrap();
      const data = response?.items || response?.content || [];
      setTransferRecords(data);
      setTransferTotal(response?.totalItems || data.length);
    } catch {
      setTransferRecords([]);
    } finally {
      setTransferLoading(false);
    }
  };

  // ========================
  // Columns
  // ========================

  const inwardColumns: ColumnDef<InwardRecord>[] = [
    { field: 'code', header: 'Code', width: '120px', body: (r) => <span className="font-mono text-blue-700 font-bold text-xs">{r.code}</span> },
    { field: 'date', header: 'Date', width: '100px', body: (r) => <span className="text-xs">{r.date}</span> },
    { field: 'supplierName', header: 'Supplier', body: (r) => <span className="text-xs text-slate-700">{r.supplierName}</span> },
    { field: 'invoiceNo', header: 'Invoice', width: '100px', body: (r) => <span className="text-xs text-slate-500">{r.invoiceNo || '—'}</span> },
    { field: 'items', header: 'Items', width: '80px', align: 'center', body: (r) => <span className="font-bold text-green-700 text-xs">{r.items || 0}</span> },
    {
      field: 'id',
      header: 'Action',
      width: '80px',
      align: 'right',
      body: (r) => (
        <CustomButton
          variant="text"
          size="small"
          className="text-blue-600 p-1 min-w-0"
          onClick={() => navigate(`/admin/inward/${r.id || r.code}`)}
        >
          View
        </CustomButton>
      )
    }
  ];

  const outwardColumns: ColumnDef<OutwardRecord>[] = [
    { field: 'code', header: 'Code', width: '120px', body: (r) => <span className="font-mono text-blue-700 font-bold text-xs">{r.code}</span> },
    { field: 'date', header: 'Date', width: '100px', body: (r) => <span className="text-xs">{r.date}</span> },
    { field: 'issueTo', header: 'Issue To', body: (r) => <span className="text-xs text-slate-700">{r.issueTo}</span> },
    {
      field: 'status',
      header: 'Status',
      width: '100px',
      body: (r) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {r.status || 'OPEN'}
        </span>
      )
    },
    { field: 'items', header: 'Items', width: '80px', align: 'center', body: (r) => <span className="font-bold text-red-700 text-xs">{r.items || 0}</span> },
    {
      field: 'id',
      header: 'Action',
      width: '80px',
      align: 'right',
      body: (r) => (
        <CustomButton
          variant="text"
          size="small"
          className="text-blue-600 p-1 min-w-0"
          onClick={() => navigate(`/admin/outward/${r.id || r.code}`)}
        >
          View
        </CustomButton>
      )
    }
  ];

  const transferColumns: ColumnDef<TransferRecord>[] = [
    { field: 'code', header: 'Code', width: '120px', body: (r) => <span className="font-mono text-blue-700 font-bold text-xs">{r.code}</span> },
    { field: 'date', header: 'Date', width: '100px', body: (r) => <span className="text-xs">{r.date}</span> },
    { field: 'fromProjectName', header: 'From', body: (r) => <span className="text-xs text-slate-600">{r.fromProjectName}</span> },
    { field: 'toProjectName', header: 'To', body: (r) => <span className="text-xs text-slate-600">{r.toProjectName}</span> },
    {
      field: 'id',
      header: 'Action',
      width: '80px',
      align: 'right',
      body: (r) => (
        <CustomButton
          variant="text"
          size="small"
          className="text-blue-600 p-1 min-w-0"
          onClick={() => navigate(`/admin/transfer/${r.id || r.code}`)}
        >
          View
        </CustomButton>
      )
    }
  ];

  const selectedProject = projects.find(p => String(p.id) === String(selectedAdminProjectId));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FiActivity size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">Project Management Dashboard</h1>
              <p className="text-xs text-slate-500">Analytics & Transactions for {selectedProject ? selectedProject.name : 'Unknown'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Project:</span>
            <div className="w-64">
              <CustomDropdown
                label=""
                value={selectedAdminProjectId || ''}
                options={projects.map(p => ({ label: `${p.code ? p.code + ' - ' : ''}${p.name}`, value: String(p.id) }))}
                onChange={(value) => dispatch(setSelectedAdminProject(value))}
              />
            </div>
            <CustomButton startIcon={<FiBox />} onClick={() => navigate('/admin/projects')}>
              Manage Projects
            </CustomButton>
          </div>
        </div>

        {!selectedAdminProjectId ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
            {loading ? <CustomLoader message="Loading projects..." /> : <span className="text-slate-400 text-sm">Select a project to view details</span>}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <CustomTabs
              tabs={[
                {
                  label: `Inwards (${inwardTotal})`,
                  content: (
                    <div className="flex flex-col gap-4">
                      <CustomTable
                        data={inwardRecords}
                        columns={inwardColumns}
                        loading={inwardLoading}
                        pagination
                        rows={10}
                        emptyMessage="No inward records found"
                      />
                    </div>
                  )
                },
                {
                  label: `Outwards (${outwardTotal})`,
                  content: (
                    <div className="flex flex-col gap-4">
                      <CustomTable
                        data={outwardRecords}
                        columns={outwardColumns}
                        loading={outwardLoading}
                        pagination
                        rows={10}
                        emptyMessage="No outward records found"
                      />
                    </div>
                  )
                },
                {
                  label: `Transfers (${transferTotal})`,
                  content: (
                    <CustomTable
                      data={transferRecords}
                      columns={transferColumns}
                      loading={transferLoading}
                      pagination
                      rows={10}
                      emptyMessage="No updated transfer records"
                    />
                  )
                }
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedProjectDetailsPage;
