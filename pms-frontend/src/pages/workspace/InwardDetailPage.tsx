import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../store/hooks";
import { getInwardById, updateInward, validateInward } from "../../store/slices/inventorySlice";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSave, FiCheckCircle, FiInfo, FiSearch } from "react-icons/fi";
import type { RootState } from "../../store/store";

import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomTextField from "../../widgets/CustomTextField";

// -------- Types -------- //

interface InwardLine {
  id: number;
  materialCode?: string | null;
  materialName?: string | null;
  unit?: string | null;
  orderedQty: number;
  receivedQty: number;
}

interface InwardDetail {
  id: number;
  code: string;
  projectName?: string;
  supplierName?: string;
  invoiceNo?: string;
  entryDate?: string;
  vehicleNo?: string;
  remarks?: string;
  validated: boolean;
  lines: InwardLine[];
}

interface AuthStateSlice {
  token: string | null;
}

// -------- Page Component -------- //

const InwardDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = useSelector<RootState, AuthStateSlice>((state) => state.auth as AuthStateSlice);
  const dispatch = useAppDispatch();

  const [record, setRecord] = useState<InwardDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingLines, setEditingLines] = useState<Record<number, { orderedQty: number; receivedQty: number }>>({});

  // Pagination and search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  const buildLinePayload = useCallback(
    () =>
      Object.entries(editingLines).map(([lineId, values]) => ({
        id: Number(lineId),
        orderedQty: values.orderedQty,
        receivedQty: values.receivedQty,
      })),
    [editingLines]
  );

  const hasUnsavedChanges = useCallback(() => {
    if (!record?.lines) return false;

    return record.lines.some((line) => {
      const edits = editingLines[line.id];
      if (!edits) return false;

      return (
        edits.orderedQty !== line.orderedQty ||
        edits.receivedQty !== line.receivedQty
      );
    });
  }, [editingLines, record]);

  // Load inward detail
  useEffect(() => {
    if (id && token) {
      loadInwardDetail();
    }
  }, [id, token]);

  const loadInwardDetail = async () => {
    if (!id || !token) return;

    setLoading(true);
    try {
      const data = await dispatch(getInwardById(Number(id))).unwrap();

      if (!data) {
        toast.error('No record data received');
        navigate('/workspace/inward');
        return;
      }

      setRecord(data);

      // Initialize editing state
      const initialEdits: Record<number, { orderedQty: number; receivedQty: number }> = {};
      if (data.lines && Array.isArray(data.lines)) {
        data.lines.forEach((line: InwardLine) => {
          initialEdits[line.id] = {
            orderedQty: line.orderedQty || 0,
            receivedQty: line.receivedQty || 0,
          };
        });
      }
      setEditingLines(initialEdits);
    } catch (error: any) {
      console.error('Failed to load inward detail:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to load inward details';
      toast.error(errorMsg);
      navigate('/workspace/inward');
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
      line.materialCode?.toLowerCase().includes(lowerQuery) ||
      line.materialName?.toLowerCase().includes(lowerQuery)
    );
  }, [record?.lines, searchQuery]);

  // Save changes
  const handleSaveChanges = async () => {
    if (!record || record.validated) return;

    setSaving(true);
    try {
      const lines = buildLinePayload();

      if (!hasUnsavedChanges()) {
        toast.success('No changes to save');
      } else {
        await dispatch(updateInward({ id: record.id, payload: { lines } })).unwrap();
        toast.success('Quantities updated successfully');
      }

      // Reload to ensure sync? Or just navigate/stay? 
      // Original code navigated to list, but maybe better to stay or navigate
      navigate('/workspace/inward');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Validate and lock
  const handleValidate = async () => {
    if (!record || record.validated) return;

    setSaving(true);
    try {
      const lines = buildLinePayload();

      if (hasUnsavedChanges()) {
        await dispatch(updateInward({ id: record.id, payload: { lines } })).unwrap();
      }

      await dispatch(validateInward(record.id)).unwrap();
      toast.success('Inward record saved and validated');
      navigate('/workspace/inward');
    } catch (error) {
      console.error('Failed to validate:', error);
      toast.error('Failed to validate record');
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
            onClick={() => navigate('/workspace/inward')}
            startIcon={<FiArrowLeft />}
          >
            Back to Inwards
          </CustomButton>
        </div>
      </div>
    );
  }

  const columns: ColumnDef<InwardLine>[] = [
    {
      field: 'materialCode',
      header: 'Material Code',
      width: '150px',
      body: (row) => <span className="font-mono text-slate-700 font-semibold">{row.materialCode || '—'}</span>
    },
    {
      field: 'materialName',
      header: 'Material Name',
      body: (row) => <span className="text-slate-800">{row.materialName || '—'}</span>
    },
    {
      field: 'unit',
      header: 'Unit',
      width: '80px',
      body: (row) => <span className="text-slate-500">{row.unit || '—'}</span>
    },
    {
      field: 'orderedQty',
      header: 'Ordered Qty',
      width: '150px',
      body: (row) => {
        const currentValue = editingLines[row.id]?.orderedQty ?? row.orderedQty ?? 0;
        if (record.validated) {
          return <span className="font-mono">{currentValue}</span>;
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
                  ...prev[row.id],
                  orderedQty: val,
                }
              }));
            }}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        );
      }
    },
    {
      field: 'receivedQty',
      header: 'Received Qty',
      width: '150px',
      body: (row) => {
        const currentValue = editingLines[row.id]?.receivedQty ?? row.receivedQty ?? 0;
        if (record.validated) {
          return <span className="font-mono">{currentValue}</span>;
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
                  ...prev[row.id],
                  receivedQty: val,
                }
              }));
            }}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        );
      }
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CustomButton
              variant="text"
              onClick={() => navigate('/workspace/inward')}
              className="!p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
              <FiArrowLeft size={20} />
            </CustomButton>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Inward Details
                <span className="text-slate-400 font-normal">|</span>
                <span className="font-mono text-lg text-blue-600">{record.code}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {record.validated ? (
              <span className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 font-medium">
                <FiCheckCircle /> Validated & Locked
              </span>
            ) : (
              <>
                <CustomButton
                  variant="outlined"
                  onClick={handleSaveChanges}
                  loading={saving}
                  startIcon={<FiSave />}
                >
                  Save Draft
                </CustomButton>
                <CustomButton
                  onClick={handleValidate}
                  loading={saving}
                  startIcon={<FiCheckCircle />}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Validate & Lock
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
                <span className="text-sm text-slate-500 block mb-1">Project</span>
                <span className="font-semibold text-slate-800">{record.projectName || '—'}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-1">Supplier</span>
                <span className="font-semibold text-slate-800">{record.supplierName || '—'}</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-1">Invoice No</span>
                <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm inline-block">
                  {record.invoiceNo || '—'}
                </span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block mb-1">Entry Date</span>
                <span className="font-medium text-slate-800">
                  {record.entryDate ? new Date(record.entryDate).toLocaleDateString() : '—'}
                </span>
              </div>
              {record.vehicleNo && (
                <div>
                  <span className="text-sm text-slate-500 block mb-1">Vehicle No</span>
                  <span className="font-semibold text-slate-800">{record.vehicleNo}</span>
                </div>
              )}
              {record.remarks && (
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                  <span className="text-sm text-slate-500 block mb-1">Remarks</span>
                  <span className="text-slate-700 bg-slate-50 p-3 rounded-lg block text-sm border border-slate-100">
                    {record.remarks}
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

            {record.validated && (
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
                <FiInfo className="flex-shrink-0" />
                This record has been validated. Quantities cannot be edited.
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

export default InwardDetailPage;
