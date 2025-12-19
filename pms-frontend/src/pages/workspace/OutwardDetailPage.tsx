import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import { getOutwardById, updateOutward, closeOutward } from "../../store/slices/inventorySlice";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiLock, FiInfo, FiSearch } from "react-icons/fi";
import type { RootState } from "../../store/store";

import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";

// -------- Types -------- //

interface OutwardLine {
  id: number;
  materialId?: string | null;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  issueQty: number;
}

interface OutwardDetail {
  id: number;
  code: string;
  projectName?: string;
  issueTo?: string;
  date?: string;
  status?: string;
  closeDate?: string;
  validated: boolean;
  lines: OutwardLine[];
}

interface AuthStateSlice {
  token: string | null;
}

// -------- Page Component -------- //

const OutwardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useSelector<RootState, AuthStateSlice>((state) => state.auth as AuthStateSlice);
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<OutwardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingLines, setEditingLines] = useState<Record<number, { issueQty: number }>>({});

  // Pagination and search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load outward detail
  useEffect(() => {
    if (id && token) {
      loadOutwardDetail();
    }
  }, [id, token]);

  const loadOutwardDetail = async () => {
    if (!id || !token) return;

    setLoading(true);
    try {
      const data = await dispatch(getOutwardById(Number(id))).unwrap();

      if (!data) {
        toast.error('No record data received');
        navigate('/workspace/outward');
        return;
      }

      setRecord(data);

      // Initialize editing state
      const initialEdits: Record<number, { issueQty: number }> = {};
      if (data.lines && Array.isArray(data.lines)) {
        data.lines.forEach((line: OutwardLine) => {
          initialEdits[line.id] = {
            issueQty: line.issueQty || 0,
          };
        });
      }
      setEditingLines(initialEdits);
    } catch (error: any) {
      console.error('Failed to load outward detail:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to load outward details';
      toast.error(errorMsg);
      navigate('/workspace/outward');
    } finally {
      setLoading(false);
    }
  };

  // Filter lines based on search
  const filteredLines = useMemo(() => {
    if (!record?.lines) return [];
    if (!searchQuery.trim()) return record.lines;

    const lowerQuery = searchQuery.toLowerCase();
    return record.lines.filter(line =>
      line.code?.toLowerCase().includes(lowerQuery) ||
      line.name?.toLowerCase().includes(lowerQuery)
    );
  }, [record?.lines, searchQuery]);

  // Save changes
  const handleSaveChanges = async () => {
    if (!record || record.validated) return;

    setSaving(true);
    try {
      const lines = Object.entries(editingLines).map(([lineId, values]) => ({
        id: Number(lineId),
        issueQty: values.issueQty,
      }));

      await dispatch(updateOutward({ id: record.id, payload: { lines } })).unwrap();
      toast.success('Quantities updated successfully');
      navigate('/workspace/outward');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Close outward - save quantities first, then close
  const handleClose = async () => {
    if (!record || record.status === 'CLOSED') return;

    setSaving(true);
    try {
      // First, save any quantity changes
      const lines = Object.entries(editingLines).map(([lineId, values]) => ({
        id: Number(lineId),
        issueQty: values.issueQty,
      }));

      await dispatch(updateOutward({ id: record.id, payload: { lines } })).unwrap();

      // Then close the outward
      await dispatch(closeOutward(record.id)).unwrap();
      toast.success('Quantities saved and outward closed successfully');
      navigate('/workspace/outward');
    } catch (error) {
      console.error('Failed to close:', error);
      toast.error('Failed to close record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-500 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          Loading details...
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
            onClick={() => navigate('/workspace/outward')}
            startIcon={<FiArrowLeft />}
          >
            Back to Outwards
          </CustomButton>
        </div>
      </div>
    );
  }

  const columns: ColumnDef<OutwardLine>[] = [
    {
      field: 'code',
      header: 'Material Code',
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
      body: (row) => <span className="text-slate-500">{row.unit || '—'}</span>
    },
    {
      field: 'issueQty',
      header: 'Issue Qty',
      width: '150px',
      align: 'right',
      body: (row) => {
        const currentValue = editingLines[row.id]?.issueQty ?? row.issueQty ?? 0;
        if (record.status === 'CLOSED') {
          return <span className="font-mono font-bold text-slate-700">{currentValue}</span>;
        }
        return (
          <input
            type="number"
            min="0"
            step="any"
            value={currentValue}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setEditingLines(prev => ({
                ...prev,
                [row.id]: {
                  issueQty: val,
                }
              }));
            }}
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right"
          />
        );
      }
    },
  ];


  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CustomButton
              variant="text"
              onClick={() => navigate('/workspace/outward')}
              className="!p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
              <FiArrowLeft size={20} />
            </CustomButton>
            <div>
              <h1 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                Outward Details
                <span className="text-slate-400 font-normal">|</span>
                <span className="font-mono text-xs text-blue-600">{record.code}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {record.status === 'CLOSED' ? (
              <span className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg border border-slate-200 font-medium cursor-not-allowed">
                <FiLock /> Closed
              </span>
            ) : (
              <>
                <CustomButton
                  variant="outlined"
                  onClick={handleSaveChanges}
                  loading={saving}
                  startIcon={<FiSave />}
                >
                  Save Changes
                </CustomButton>
                <CustomButton
                  onClick={handleClose}
                  loading={saving}
                  startIcon={<FiLock />}
                  variant="contained"
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  Close Record
                </CustomButton>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Record Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Project</span>
                <span className="font-semibold text-slate-800">{record.projectName || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Issue To</span>
                <span className="font-semibold text-slate-800">{record.issueTo || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Date</span>
                <span className="font-medium text-slate-800">
                  {record.date ? new Date(record.date).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase inline-block ${record.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-600'}`}>
                  {record.status || 'OPEN'}
                </span>
              </div>
              {record.closeDate && (
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Close Date</span>
                  <span className="font-medium text-slate-800">
                    {new Date(record.closeDate).toLocaleDateString()}
                  </span>
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

            {record.status === 'CLOSED' && (
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center gap-2 text-xs text-slate-600">
                <FiInfo className="flex-shrink-0" />
                This record is closed. Quantities cannot be edited.
              </div>
            )}

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

export default OutwardDetailPage;
