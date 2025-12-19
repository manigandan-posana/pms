import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiCheck, FiX, FiShoppingCart, FiArrowDown, FiArrowUp } from "react-icons/fi";

import { Get as apiGet, Post as apiPost } from "../../utils/apiService";
import { getErrorMessage } from "../../utils/errorHandler";
import CustomButton from "../../widgets/CustomButton";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomTabs from "../../widgets/CustomTabs";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";

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

interface InwardRecord {
  id?: string | number | null;
  projectName?: string | null;
  code?: string | null;
  date?: string | null;
  supplierName?: string | null;
  items?: number | null;
}

interface OutwardRecord {
  id?: string | number | null;
  projectName?: string | null;
  code?: string | null;
  date?: string | null;
  issueTo?: string | null;
  status?: string | null;
  closeDate?: string | null;
  items?: number | null;
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

const CEODashboard: React.FC = () => {
  // Procurement state
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [procurementLoading, setProcurementLoading] = useState(false);
  const [procurementTotal, setProcurementTotal] = useState(0);
  const [procurementPage, setProcurementPage] = useState(0);
  const [procurementRows, setProcurementRows] = useState(10);

  // Inward state
  const [inwardRecords, setInwardRecords] = useState<InwardRecord[]>([]);
  const [inwardLoading, setInwardLoading] = useState(false);
  const [inwardTotal, setInwardTotal] = useState(0);
  const [inwardPage, setInwardPage] = useState(0);
  const [inwardRows, setInwardRows] = useState(10);

  // Outward state
  const [outwardRecords, setOutwardRecords] = useState<OutwardRecord[]>([]);
  const [outwardLoading, setOutwardLoading] = useState(false);
  const [outwardTotal, setOutwardTotal] = useState(0);
  const [outwardPage, setOutwardPage] = useState(0);
  const [outwardRows, setOutwardRows] = useState(10);

  // Decision dialog state
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProcurementRequest | null>(null);
  const [decisionType, setDecisionType] = useState<"approve" | "reject" | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Fetch procurement requests
  const fetchProcurementRequests = async () => {
    setProcurementLoading(true);
    try {
      const response = await apiGet<PaginatedResponse<ProcurementRequest>>(
        "/procurement/requests",
        { page: procurementPage + 1, size: procurementRows }
      );
      const requests = response.items || response.content || [];
      setProcurementRequests(requests);
      setProcurementTotal(
        response.totalItems ?? response.totalElements ?? requests.length
      );
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to load procurement requests");
      toast.error(errorMsg);
    } finally {
      setProcurementLoading(false);
    }
  };

  // Fetch inward records
  const fetchInwardRecords = async () => {
    setInwardLoading(true);
    try {
      const response = await apiGet<PaginatedResponse<InwardRecord>>(
        "/history/inwards",
        { page: inwardPage + 1, size: inwardRows }
      );
      const records = response.items || response.content || [];
      setInwardRecords(records);
      setInwardTotal(
        response.totalItems ?? response.totalElements ?? records.length
      );
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to load inward records");
      toast.error(errorMsg);
    } finally {
      setInwardLoading(false);
    }
  };

  // Fetch outward records
  const fetchOutwardRecords = async () => {
    setOutwardLoading(true);
    try {
      const response = await apiGet<PaginatedResponse<OutwardRecord>>(
        "/history/outwards",
        { page: outwardPage + 1, size: outwardRows }
      );
      const records = response.items || response.content || [];
      setOutwardRecords(records);
      setOutwardTotal(
        response.totalItems ?? response.totalElements ?? records.length
      );
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, "Failed to load outward records");
      toast.error(errorMsg);
    } finally {
      setOutwardLoading(false);
    }
  };

  useEffect(() => {
    fetchProcurementRequests();
  }, [procurementPage, procurementRows]);

  useEffect(() => {
    fetchInwardRecords();
  }, [inwardPage, inwardRows]);

  useEffect(() => {
    fetchOutwardRecords();
  }, [outwardPage, outwardRows]);

  const openDecisionDialog = (request: ProcurementRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setDecisionType(type);
    setDecisionNote("");
    setShowDecisionDialog(true);
  };

  const submitDecision = async () => {
    if (!selectedRequest || !decisionType) return;

    setSubmittingDecision(true);
    try {
      await apiPost(`/procurement/requests/${selectedRequest.id}/decision`, {
        decision: decisionType.toUpperCase(),
        note: decisionNote.trim() || undefined,
      });

      toast.success(`Request ${decisionType}d successfully`);
      setShowDecisionDialog(false);
      setSelectedRequest(null);
      setDecisionType(null);
      setDecisionNote("");
      fetchProcurementRequests();
    } catch (error: any) {
      const errorMsg = getErrorMessage(error, `Failed to ${decisionType} request`);
      toast.error(errorMsg);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const dateTemplate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? dateString : parsed.toLocaleString();
  };

  const procurementColumns: ColumnDef<ProcurementRequest>[] = [
    { field: "projectName", header: "Project", sortable: true, style: { minWidth: "150px" } },
    { field: "materialName", header: "Material", sortable: true, style: { minWidth: "150px" } },
    { field: "capturedRequiredQty", header: "Current Qty", sortable: true },
    { field: "requestedIncrease", header: "Req Increase", sortable: true },
    { field: "proposedRequiredQty", header: "Proposed Qty", sortable: true },
    {
      field: "status", header: "Status", sortable: true,
      body: (row) => {
        const statusColors: Record<string, string> = {
          APPROVED: "bg-green-100 text-green-700",
          PENDING: "bg-amber-100 text-amber-700",
          REJECTED: "bg-red-100 text-red-700"
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[row.status] || "bg-slate-100 text-slate-700"}`}>
            {row.status}
          </span>
        );
      }
    },
    { field: "requestedBy", header: "Requester", sortable: true },
    { field: "requestedAt", header: "Created At", sortable: true, body: (row) => dateTemplate(row.requestedAt) },
    {
      field: "actions", header: "Actions", align: "right",
      body: (row) => {
        if (row.status !== "PENDING") return <span className="text-slate-400 text-xs">No action</span>;
        return (
          <div className="flex justify-end gap-2">
            <CustomButton size="small" className="text-green-600 hover:bg-green-50" variant="text" onClick={() => openDecisionDialog(row, "approve")} title="Approve">
              <FiCheck />
            </CustomButton>
            <CustomButton size="small" className="text-red-600 hover:bg-red-50" variant="text" onClick={() => openDecisionDialog(row, "reject")} title="Reject">
              <FiX />
            </CustomButton>
          </div>
        );
      }
    }
  ];

  const inwardColumns: ColumnDef<InwardRecord>[] = [
    { field: "projectName", header: "Project", sortable: true, style: { minWidth: "150px" } },
    { field: "code", header: "Inward Code", sortable: true },
    { field: "date", header: "Entry Date", sortable: true, body: (row) => dateTemplate(row.date) },
    { field: "supplierName", header: "Supplier", sortable: true },
    { field: "items", header: "Items", sortable: true },
  ];

  const outwardColumns: ColumnDef<OutwardRecord>[] = [
    { field: "projectName", header: "Project", sortable: true, style: { minWidth: "150px" } },
    { field: "code", header: "Outward Code", sortable: true },
    { field: "date", header: "Issue Date", sortable: true, body: (row) => dateTemplate(row.date) },
    { field: "issueTo", header: "Issue To", sortable: true },
    { field: "status", header: "Status", sortable: true },
    { field: "items", header: "Items", sortable: true },
    { field: "closeDate", header: "Closed", sortable: true, body: (row) => dateTemplate(row.closeDate) },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-xs font-bold text-slate-800">CEO/COO Dashboard</h2>
        <p className="text-slate-500 mt-1">Manage procurement requests and view all inward/outward transactions across all projects</p>
      </div>

      <CustomTabs
        tabs={[
          {
            label: "Procurement Requests",
            content: (
              <CustomTable
                data={procurementRequests}
                columns={procurementColumns}
                loading={procurementLoading}
                pagination
                rows={procurementRows}
                page={procurementPage}
                totalRecords={procurementTotal}
                onPageChange={(p, r) => { setProcurementPage(p); setProcurementRows(r); }}
                emptyMessage="No procurement requests found"
                title={
                  <div className="flex items-center gap-2 text-slate-700">
                    <FiShoppingCart /> <span>Procurement Requests</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">{procurementTotal}</span>
                  </div>
                }
              />
            )
          },
          {
            label: "Inward Records",
            content: (
              <CustomTable
                data={inwardRecords}
                columns={inwardColumns}
                loading={inwardLoading}
                pagination
                rows={inwardRows}
                page={inwardPage}
                totalRecords={inwardTotal}
                onPageChange={(p, r) => { setInwardPage(p); setInwardRows(r); }}
                emptyMessage="No inward records found"
                title={
                  <div className="flex items-center gap-2 text-slate-700">
                    <FiArrowDown /> <span>All Inward Records</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">{inwardTotal}</span>
                  </div>
                }
              />
            )
          },
          {
            label: "Outward Records",
            content: (
              <CustomTable
                data={outwardRecords}
                columns={outwardColumns}
                loading={outwardLoading}
                pagination
                rows={outwardRows}
                page={outwardPage}
                totalRecords={outwardTotal}
                onPageChange={(p, r) => { setOutwardPage(p); setOutwardRows(r); }}
                emptyMessage="No outward records found"
                title={
                  <div className="flex items-center gap-2 text-slate-700">
                    <FiArrowUp /> <span>All Outward Records</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">{outwardTotal}</span>
                  </div>
                }
              />
            )
          }
        ]}
      />

      {/* Decision Modal */}
      <CustomModal
        open={showDecisionDialog}
        onClose={() => setShowDecisionDialog(false)}
        title={`${decisionType === "approve" ? "Approve" : "Reject"} Procurement Request`}
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" onClick={() => setShowDecisionDialog(false)}>Cancel</CustomButton>
            <CustomButton
              onClick={submitDecision}
              className={decisionType === 'reject' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              disabled={submittingDecision}
            >
              {decisionType === "approve" ? "Approve" : "Reject"}
            </CustomButton>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          {selectedRequest && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">Project:</span> <span className="font-medium">{selectedRequest.projectName}</span>
                <span className="text-slate-500">Material:</span> <span className="font-medium">{selectedRequest.materialName}</span>
                <span className="text-slate-500">Current Qty:</span> <span className="font-medium">{selectedRequest.capturedRequiredQty}</span>
                <span className="text-slate-500">Req Increase:</span> <span className="font-medium">{selectedRequest.requestedIncrease}</span>
                <span className="text-slate-500">Proposed:</span> <span className="font-medium">{selectedRequest.proposedRequiredQty}</span>
                <span className="text-slate-500">Requester:</span> <span className="font-medium">{selectedRequest.requestedBy}</span>
              </div>
            </div>
          )}
          <CustomTextField
            label="Note (Optional)"
            multiline
            rows={4}
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            placeholder="Add a note for this decision..."
          />
        </div>
      </CustomModal>
    </div>
  );
};

export default CEODashboard;
