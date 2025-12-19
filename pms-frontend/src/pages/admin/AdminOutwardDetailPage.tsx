import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiPackage, FiSearch } from "react-icons/fi";
import type { RootState } from "../../store/store";
import { useAppDispatch } from "../../store/hooks";
import { getOutwardById } from "../../store/slices/inventorySlice";

import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";

interface OutwardLine {
  id: number;
  materialCode?: string | null;
  materialName?: string | null;
  unit?: string | null;
  requestedQty: number;
  issuedQty: number;
}

interface OutwardDetail {
  id: number;
  code: string;
  projectName?: string;
  issueTo?: string;
  jobNo?: string;
  registerDate?: string;
  remarks?: string;
  status?: string;
  lines: OutwardLine[];
}

const AdminOutwardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<OutwardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (id && token) {
      loadOutwardDetail();
    }
  }, [id, token]);

  const loadOutwardDetail = async () => {
    if (!id || !token) return;

    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      toast.error('Invalid outward id');
      navigate('/admin/project-details');
      return;
    }

    setLoading(true);
    try {
      const data = await dispatch(getOutwardById(numericId)).unwrap();

      if (!data) {
        toast.error('No record data received');
        navigate('/admin/project-details');
        return;
      }

      setRecord(data);
    } catch (error: any) {
      console.error('Failed to load outward detail:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to load outward details';
      toast.error(errorMsg);
      navigate('/admin/project-details');
    } finally {
      setLoading(false);
    }
  };

  const filteredLines = useMemo(() => {
    if (!record?.lines) return [];
    if (!searchQuery.trim()) return record.lines;

    const lowerQuery = searchQuery.toLowerCase();
    return record.lines.filter(line =>
      line.materialCode?.toLowerCase().includes(lowerQuery) ||
      line.materialName?.toLowerCase().includes(lowerQuery)
    );
  }, [record?.lines, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-500 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-2"></div>
          Loading outward details...
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

  const columns: ColumnDef<OutwardLine>[] = [
    {
      field: 'materialCode',
      header: 'Code',
      width: '120px',
      sortable: true,
      body: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.materialCode}</span>
    },
    { field: 'materialName', header: 'Material Name', sortable: true },
    { field: 'unit', header: 'Unit', sortable: true, width: '80px', align: 'center' },
    {
      field: 'requestedQty',
      header: 'Requested',
      sortable: true,
      width: '100px',
      align: 'right',
      body: (row) => <span className="font-medium text-slate-600">{row.requestedQty}</span>
    },
    {
      field: 'issuedQty',
      header: 'Issued',
      sortable: true,
      width: '100px',
      align: 'right',
      body: (row) => <span className="font-bold text-red-600">{row.issuedQty}</span>
    },
    {
      field: 'id',
      header: 'Variance',
      width: '100px',
      align: 'right',
      body: (row) => {
        const variance = row.issuedQty - row.requestedQty;
        return (
          <span className={`font-semibold ${variance === 0 ? 'text-slate-400' : variance > 0 ? 'text-blue-600' : 'text-orange-500'}`}>
            {variance > 0 ? '+' : ''}{variance}
          </span>
        );
      }
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
                Outward Details
                <span className="text-slate-400 font-normal">|</span>
                <span className="font-mono text-xs text-red-600">{record.code}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${record.status === 'CLOSED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              {record.status || 'Open'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-xs">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Project</span>
                <span className="font-semibold text-slate-800">{record.projectName || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Date</span>
                <span className="font-semibold text-slate-800">{record.registerDate || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Issue To</span>
                <span className="font-semibold text-slate-800">{record.issueTo || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Job No</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">{record.jobNo || '—'}</span>
              </div>
              {record.remarks && (
                <div className="col-span-2 md:col-span-4 lg:col-span-6 mt-2 pt-2 border-t border-slate-100">
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
                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
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
              emptyMessage="No materials found in this record."
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminOutwardDetailPage;
