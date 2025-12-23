import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import { getTransferById } from "../../store/slices/inventorySlice";
import toast from "react-hot-toast";
import { FiArrowLeft, FiArrowRight, FiSearch, FiRepeat } from "react-icons/fi";
import type { RootState } from "../../store/store";

import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";

// -------- Types -------- //

interface TransferLine {
  id: number;
  materialId?: string | null;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  transferQty: number;
}

interface TransferDetail {
  id: number;
  code: string;
  fromProjectName?: string;
  fromSite?: string;
  toProjectName?: string;
  toSite?: string;
  date?: string;
  remarks?: string;
  lines: TransferLine[];
}

interface AuthStateSlice {
  token: string | null;
}

// -------- Page Component -------- //

const TransferDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useSelector<RootState, AuthStateSlice>((state) => state.auth as AuthStateSlice);
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination and search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load transfer detail
  useEffect(() => {
    if (id && token) {
      loadTransferDetail();
    }
  }, [id, token, searchQuery]);

  const loadTransferDetail = async () => {
    if (!id || !token) return;

    setLoading(true);
    try {
      const data = await dispatch(getTransferById({ id: Number(id), search: searchQuery.trim() || undefined })).unwrap();

      if (!data) {
        toast.error('No record data received');
        navigate('/workspace/transfer');
        return;
      }

      setRecord(data);
    } catch (error: any) {
      console.error('Failed to load transfer detail:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to load transfer details';
      toast.error(errorMsg);
      navigate('/workspace/transfer');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = record?.lines ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-500 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
          Loading transfer details...
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 mb-4">No record found</p>
          <CustomButton
            onClick={() => navigate('/workspace/transfer')}
            startIcon={<FiArrowLeft />}
          >
            Back to Transfers
          </CustomButton>
        </div>
      </div>
    );
  }

  const columns: ColumnDef<TransferLine>[] = [
    {
      field: 'code',
      header: 'Code',
      width: '150px',
      body: (row) => <span className="font-mono text-slate-700 font-semibold">{row.code || '—'}</span>
    },
    {
      field: 'name',
      header: 'Material Name',
      body: (row) => <span className="text-slate-800">{row.name || '—'}</span>
    },
    {
      field: 'unit',
      header: 'Unit',
      width: '80px',
      align: 'center',
      body: (row) => <span className="text-slate-500">{row.unit || '—'}</span>
    },
    {
      field: 'transferQty',
      header: 'Transfer Qty',
      width: '150px',
      align: 'right',
      body: (row) => <span className="font-mono font-bold text-purple-600">{row.transferQty?.toLocaleString() || 0}</span>
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Inventory Navigation Tabs */}
      <div className="px-6 pt-6">
      </div>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CustomButton
              variant="text"
              onClick={() => navigate('/workspace/transfer')}
              className="!p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
              <FiArrowLeft size={20} />
            </CustomButton>
            <div>
              <h1 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                Transfer Details
                <span className="text-slate-400 font-normal">|</span>
                <span className="font-mono text-xs text-purple-600">{record.code}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              {record.fromProjectName || 'Unknown'}
              {record.fromSite && <span className="text-slate-400 font-normal">({record.fromSite})</span>}
            </span>
            <FiArrowRight className="text-slate-400" />
            <span className="flex items-center gap-1 font-medium text-slate-700">
              {record.toProjectName || 'Unknown'}
              {record.toSite && <span className="text-slate-400 font-normal">({record.toSite})</span>}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <FiRepeat size={20} />
              </div>
              <h3 className="text-xs font-bold text-slate-800">Transfer Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Code</span>
                <span className="font-mono font-semibold text-slate-800">{record.code}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Date</span>
                <span className="font-medium text-slate-800">{record.date || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">From Project</span>
                <span className="font-medium text-slate-800">{record.fromProjectName || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">To Project</span>
                <span className="font-medium text-slate-800">{record.toProjectName || '—'}</span>
              </div>
              {record.remarks && (
                <div className="col-span-1 md:col-span-4 mt-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Remarks</span>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700">
                    {record.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Materials Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Materials
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {filteredLines.length}
                </span>
              </h3>

              <div className="w-full sm:w-72">
                <CustomTextField
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startAdornment={<FiSearch className="text-slate-400" />}
                  size="small"
                />
              </div>
            </div>

            <CustomTable
              data={filteredLines}
              columns={columns}
              pagination
              rows={10}
              emptyMessage="No materials found in this transfer."
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default TransferDetailPage;
