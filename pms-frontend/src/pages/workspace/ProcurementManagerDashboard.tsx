import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiShoppingCart, FiRefreshCw } from "react-icons/fi";

import { Get as apiGet } from "../../utils/apiService";
import { getErrorMessage } from "../../utils/errorHandler";
import CustomTable, { ColumnDef } from "../../widgets/CustomTable";
import CustomSelect from "../../widgets/CustomSelect";
import CustomButton from "../../widgets/CustomButton";

interface ProcurementRequest {
  id: string | number;
  projectName: string | null;
  materialName: string | null;
  capturedRequiredQty: number;
  requestedIncrease: number;
  proposedRequiredQty: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string | null;
  requestedAt: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
}

interface PaginatedResponse<T> {
  items?: T[];
  content?: T[];
  totalPages?: number;
  totalElements?: number;
  totalItems?: number;
  number?: number;
  page?: number;
}

const ProcurementManagerDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchRequests();
  }, [page, rows]);

  useEffect(() => {
    if (statusFilter) {
      setFilteredRequests(requests.filter(r => r.status === statusFilter));
    } else {
      setFilteredRequests(requests);
    }
  }, [statusFilter, requests]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await apiGet<PaginatedResponse<ProcurementRequest>>(
        "/procurement/requests",
        { page: page + 1, size: rows }
      );
      const fetched = response.items || response.content || [];
      setRequests(fetched);
      setFilteredRequests(fetched); // Initial sync
      setTotalRecords(
        response.totalItems ?? response.totalElements ?? fetched.length
      );
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to load procurement requests");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  const dateTemplate = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  };

  const columns: ColumnDef<ProcurementRequest>[] = [
    { field: "projectName", header: "Project", sortable: true, style: { minWidth: "150px" } },
    { field: "materialName", header: "Material", sortable: true, style: { minWidth: "150px" } },
    { field: "capturedRequiredQty", header: "Current", sortable: true, align: "center", body: (row) => row.capturedRequiredQty },
    { field: "requestedIncrease", header: "Increase", sortable: true, align: "center", body: (row) => <span className="font-bold text-slate-700">+{row.requestedIncrease}</span> },
    {
      field: "status", header: "Status", sortable: true, body: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
            row.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
          }`}>
          {row.status}
        </span>
      )
    },
    { field: "proposedRequiredQty", header: "Proposed", sortable: true, align: "center", body: (row) => row.proposedRequiredQty },
    { field: "requestedBy", header: "Requester", sortable: true },
    { field: "requestedAt", header: "Created", sortable: true, body: (row) => dateTemplate(row.requestedAt) },
    { field: "resolvedBy", header: "Resolved By", body: (row) => row.resolvedBy || '-' },
    { field: "resolvedAt", header: "Resolved", body: (row) => dateTemplate(row.resolvedAt) },
    { field: "resolutionNote", header: "Note", body: (row) => <span className="text-slate-500 italic text-xs">{row.resolutionNote || '-'}</span> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Procurement Manager Dashboard</h1>
          <p className="text-slate-600 mt-1">View all procurement requests from all projects (read-only)</p>
        </div>
        <div className="w-full md:w-auto flex gap-3">
          <div className="w-48">
            <CustomSelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={statusOptions}
              placeholder="Filter Status"
              size="small"
            />
          </div>
          <CustomButton onClick={fetchRequests} variant="outlined" size="small" className="h-[38px] w-[38px] p-0 flex items-center justify-center">
            <FiRefreshCw />
          </CustomButton>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 text-slate-800 mb-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiShoppingCart /></div>
          <h2 className="text-xl font-semibold">Procurement Requests</h2>
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full ml-2">{totalRecords}</span>
        </div>
        <CustomTable
          data={filteredRequests}
          columns={columns}
          loading={loading}
          pagination
          rows={rows}
          page={page}
          totalRecords={totalRecords}
          onPageChange={(p, r) => { setPage(p); setRows(r); }}
          emptyMessage="No procurement requests found"
        />
      </div>
    </div>
  );
};

export default ProcurementManagerDashboard;
