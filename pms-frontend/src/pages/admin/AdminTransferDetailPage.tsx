import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiPackage, FiSearch, FiArrowRight } from "react-icons/fi";
import type { RootState } from "../../store/store";
import { useAppDispatch } from "../../store/hooks";
import { getTransferById } from "../../store/slices/inventorySlice";

import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";

interface TransferLine {
  id: number;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  transferQty: number;
}

interface TransferDetail {
  id: number;
  code: string;
  fromProjectName?: string;
  toProjectName?: string;
  date?: string;
  remarks?: string;
  items?: number;
  lines: TransferLine[];
}

const AdminTransferDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (id && token) {
      loadTransferDetail();
    }
  }, [id, token, searchQuery]);

  const loadTransferDetail = async () => {
    if (!id || !token) return;

    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      toast.error('Invalid transfer id');
      navigate('/admin/project-details');
      return;
    }

    setLoading(true);
    try {
      const data = await dispatch(getTransferById({ id: numericId, search: searchQuery.trim() || undefined })).unwrap();

      if (!data) {
        toast.error('No record data received');
        navigate('/admin/project-details');
        return;
      }

      setRecord(data);
    } catch (error: any) {
      console.error('Failed to load transfer detail:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to load transfer details';
      toast.error(errorMsg);
      navigate('/admin/project-details');
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
            onClick={() => navigate('/admin/project-details')}
            startIcon={<FiArrowLeft />}
          >
            Back to Projects
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
      sortable: true,
      body: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.code}</span>
    },
    { field: 'name', header: 'Material Name', sortable: true },
    { field: 'unit', header: 'Unit', sortable: true, width: '100px', align: 'center' },
    {
      field: 'transferQty',
      header: 'Quantity',
      sortable: true,
      width: '150px',
      align: 'right',
      body: (row) => <span className="font-bold text-purple-600">{row.transferQty}</span>
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CustomButton
              variant="text"
              onClick={() => navigate('/admin/project-details')}
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
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-700">{record.fromProjectName || 'Unknown'}</span>
            <FiArrowRight className="text-slate-400" />
            <span className="font-medium text-slate-700">{record.toProjectName || 'Unknown'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">From</span>
                <span className="font-semibold text-slate-800">{record.fromProjectName || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">To</span>
                <span className="font-semibold text-slate-800">{record.toProjectName || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Date</span>
                <span className="font-semibold text-slate-800">{record.date || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Total Items</span>
                <span className="font-semibold text-slate-800">{record.lines.length}</span>
              </div>
              {record.remarks && (
                <div className="col-span-2 md:col-span-4 mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Remarks</span>
                  <p className="text-slate-700 italic">{record.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Materials Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <FiPackage size={18} />
                </div>
                <h3 className="font-bold text-slate-800">
                  Materials <span className="ml-2 text-slate-400 font-normal">({record.lines.length})</span>
                </h3>
              </div>

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

export default AdminTransferDetailPage;
