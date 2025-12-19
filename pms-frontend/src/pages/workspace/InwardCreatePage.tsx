import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSearch, FiCheckCircle, FiCircle, FiSave, FiX } from "react-icons/fi";

import CustomButton from "../../widgets/CustomButton";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";

import { refreshInventoryCodes, submitInward } from "../../store/slices/workspaceSlice";
import {
  clearInwardSelections,
  setInwardField,
  setInwardModalLine,
  setInwardModalValues,
  setInwardSaving,
  setInwardSelectedLine,
} from "../../store/slices/workspaceUiSlice";
import type { RootState, AppDispatch } from "../../store/store";

// -------- Types -------- //

interface WorkspaceCodesState {
  inward?: string | null;
  [key: string]: string | null | undefined;
}

export interface WorkspaceProject {
  id: string | number;
  code: string;
  name: string;
}

export interface ProjectBomLine {
  id?: string | number | null;
  materialId?: string | number | null;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  allocatedQty?: number | null;
  qty?: number | null;
  orderedQty?: number | null;
  receivedQty?: number | null;
  [key: string]: unknown;
}

export type AllocatedMaterial = ProjectBomLine & {
  materialId: string;
};

export interface InwardModalValues {
  orderedQty: string;
  receivedQty: string;
}

export interface InwardSelectedLineValues {
  orderedQty: number | string;
  receivedQty: number | string;
}

export interface InwardUiState {
  projectId: string;
  invoiceNo: string;
  invoiceDate: string;
  deliveryDate: string;
  vehicleNo: string;
  supplierName: string;
  remarks: string;
  saving: boolean;
  selectedLines: Record<string, InwardSelectedLineValues>;
  modalLine: AllocatedMaterial | null;
  modalValues: InwardModalValues;
}

interface WorkspaceStateSlice {
  codes: WorkspaceCodesState;
  assignedProjects: WorkspaceProject[];
  bomByProject: Record<string, ProjectBomLine[] | undefined>;
}

interface AuthStateSlice {
  token: string | null;
}

// -------- Quantity Modal -------- //

interface QuantityModalProps {
  line: AllocatedMaterial | null;
  values: InwardModalValues;
  onChange: (values: InwardModalValues) => void;
  onSave: () => void;
  onClose: () => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({ line, values, onChange, onSave, onClose }) => {
  if (!line) return null;
  return (
    <CustomModal
      title={`${line.code} — ${line.name}`}
      open={Boolean(line)}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <CustomButton variant="text" onClick={onClose}>Cancel</CustomButton>
          <CustomButton onClick={onSave} startIcon={<FiSave />}>Save</CustomButton>
        </div>
      }
    >
      <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded border border-slate-100">
        <span className="font-semibold text-slate-700">{line.unit}</span>
        {" \u00b7 "}
        Allocated: <span className="font-semibold text-slate-700">{line.allocatedQty ?? (line as any).qty ?? 0}</span>
        {" \u00b7 "}
        Ordered: <span className="font-semibold text-slate-700">{(line as any).orderedQty ?? 0}</span>
        {" \u00b7 "}
        Received: <span className="font-semibold text-slate-700">{(line as any).receivedQty ?? 0}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CustomTextField
          label="Ordered Qty"
          type="number"
          value={values.orderedQty}
          onChange={(e) => onChange({ ...values, orderedQty: e.target.value })}
        />
        <CustomTextField
          label="Received Qty *"
          type="number"
          value={values.receivedQty}
          onChange={(e) => onChange({ ...values, receivedQty: e.target.value })}
          required
        />
      </div>
      <p className="mt-3 text-xs text-slate-400">Save to include this material. Leave empty to deselect.</p>
    </CustomModal>
  );
};

// -------- Page Component -------- //

const InwardCreatePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { codes, assignedProjects, bomByProject } = useSelector<RootState, WorkspaceStateSlice>(
    (state) => state.workspace as unknown as WorkspaceStateSlice
  );

  const { token } = useSelector<RootState, AuthStateSlice>((state) => state.auth as AuthStateSlice);

  const inwardUi = useSelector<RootState, InwardUiState>(
    (state) => state.workspaceUi.inward as unknown as InwardUiState
  );

  const {
    projectId,
    invoiceNo,
    invoiceDate,
    deliveryDate,
    vehicleNo,
    supplierName,
    remarks,
    saving,
    selectedLines,
    modalLine,
    modalValues,
  } = inwardUi;

  const allocatedMaterials: AllocatedMaterial[] = useMemo(() => {
    if (!projectId) return [];
    const bomLines = bomByProject?.[projectId] ?? [];
    return bomLines.map((line) => ({
      ...line,
      materialId: String(line.materialId ?? line.id ?? ""),
    })) as AllocatedMaterial[];
  }, [bomByProject, projectId]);

  // Pagination state for materials table
  const [page, setPage] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);

  const tableRows = useMemo(
    () =>
      allocatedMaterials.map((line) => {
        const key = String(line.materialId);
        const selected = selectedLines[key];

        return {
          ...line,
          _selected: !!selected,
          _orderedQty: selected ? Number((selected as any).orderedQty || 0) : 0,
          _receivedQty: selected ? Number((selected as any).receivedQty || 0) : 0,
        };
      }),
    [allocatedMaterials, selectedLines]
  );

  const selectedLineCount = useMemo(
    () => Object.keys(selectedLines).length,
    [selectedLines]
  );

  // Clear selections when project changes
  useEffect(() => {
    dispatch(clearInwardSelections());
  }, [dispatch, projectId]);

  // Default project selection
  useEffect(() => {
    if (!projectId && assignedProjects.length > 0) {
      dispatch(
        setInwardField({
          field: "projectId",
          value: String(assignedProjects[0].id),
        })
      );
    }
  }, [assignedProjects, dispatch, projectId]);

  const handleCheckboxClick = (e: React.MouseEvent, line: AllocatedMaterial): void => {
    e.stopPropagation(); // Prevent opening modal
    const materialKey = String(line.materialId);
    const existing = selectedLines[materialKey];

    if (existing) {
      // Deselect by setting quantities to 0
      dispatch(
        setInwardSelectedLine({
          materialId: materialKey,
          orderedQty: 0,
          receivedQty: 0,
        })
      );
    } else {
      // Select by opening modal
      openModalForLine(line);
    }
  };

  const openModalForLine = (line: AllocatedMaterial): void => {
    const materialKey = String(line.materialId);
    const existing = selectedLines[materialKey];

    dispatch(setInwardModalLine(line));
    dispatch(
      setInwardModalValues({
        orderedQty: existing ? String(existing.orderedQty ?? "") : "",
        receivedQty: existing ? String(existing.receivedQty ?? "") : "",
      })
    );
  };

  const saveModalLine = (): void => {
    if (!modalLine) return;

    const materialKey = String(modalLine.materialId);
    const ordered = Number(modalValues.orderedQty || 0);
    const received = Number(modalValues.receivedQty || 0);

    dispatch(
      setInwardSelectedLine({
        materialId: materialKey,
        orderedQty: ordered,
        receivedQty: received,
      })
    );
    dispatch(setInwardModalLine(null));
  };

  const columns: ColumnDef<any>[] = [
    {
      field: "_selected",
      header: "",
      width: "50px",
      align: "center",
      body: (row) => (
        <div
          className="flex items-center justify-center cursor-pointer p-2"
          onClick={(e) => handleCheckboxClick(e, row)}
        >
          {row._selected ? (
            <FiCheckCircle className="text-emerald-600 text-xs" />
          ) : (
            <FiCircle className="text-slate-300 text-xs" />
          )}
        </div>
      )
    },
    { field: "code", header: "Code", sortable: true, width: "120px", body: (row) => <span className="font-mono font-semibold text-slate-700">{row.code || "—"}</span> },
    { field: "name", header: "Material", sortable: true, body: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { field: "unit", header: "Unit", width: "80px", body: (row) => <span className="text-slate-500">{row.unit || "—"}</span> },
    {
      field: "_orderedQty",
      header: "Ordered",
      align: "right",
      width: "100px",
      body: (row) => <span className="font-medium text-slate-600">{row._orderedQty || "—"}</span>
    },
    {
      field: "_receivedQty",
      header: "Received",
      align: "right",
      width: "100px",
      body: (row) => <span className="font-bold text-emerald-600">{row._receivedQty || "—"}</span>
    },
  ];

  const handleSubmit = async () => {
    if (!token) return;
    const selectedLinesArray = Object.entries(selectedLines)
      .map(([lineMaterialId, values]: [string, InwardSelectedLineValues]) => ({
        materialId: String(lineMaterialId),
        orderedQty: Number(values.orderedQty || 0),
        receivedQty: Number(values.receivedQty || 0),
      }))
      .filter((line) => line.receivedQty > 0 || line.orderedQty > 0);

    if (!projectId || selectedLinesArray.length === 0) {
      toast.error("Select a project and choose at least one material.");
      return;
    }

    dispatch(setInwardSaving(true));
    try {
      await dispatch(
        submitInward({
          code: codes.inward,
          projectId: String(projectId),
          type: "SUPPLY",
          invoiceNo: invoiceNo || null,
          invoiceDate: invoiceDate || null,
          deliveryDate: deliveryDate || null,
          vehicleNo: vehicleNo || null,
          remarks: remarks || null,
          supplierName: supplierName || null,
          lines: selectedLinesArray,
        })
      ).unwrap();

      toast.success("Inward saved successfully");
      dispatch(refreshInventoryCodes(token));
      dispatch(setInwardField({ field: "invoiceNo", value: "" }));
      dispatch(setInwardField({ field: "invoiceDate", value: "" }));
      dispatch(setInwardField({ field: "deliveryDate", value: "" }));
      dispatch(setInwardField({ field: "vehicleNo", value: "" }));
      dispatch(setInwardField({ field: "supplierName", value: "" }));
      dispatch(setInwardField({ field: "remarks", value: "" }));
      dispatch(clearInwardSelections());
      navigate('/workspace/inward');
    } catch (err) {
      // Error already handled by thunk
    } finally {
      dispatch(setInwardSaving(false));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <CustomButton
            variant="text"
            onClick={() => navigate('/workspace/inward')}
            className="text-slate-500 hover:text-slate-700"
            size="small"
          >
            <FiArrowLeft size={20} />
          </CustomButton>
          <div>
            <h1 className="text-xs font-bold text-slate-800">Create Inward Entry</h1>
            <p className="text-slate-500 text-xs">Record new material arrival</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 mr-2">
            {selectedLineCount} items selected
          </div>
          <CustomButton
            onClick={handleSubmit}
            disabled={saving || selectedLineCount === 0}
            loading={saving}
            startIcon={<FiSave />}
            className="px-6"
          >
            Save Inward
          </CustomButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xs font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Entry Details</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CustomSelect
              label="Project *"
              value={projectId}
              options={assignedProjects.map((p) => ({ label: `${p.code} — ${p.name}`, value: String(p.id) }))}
              onChange={(e) => dispatch(setInwardField({ field: 'projectId', value: String(e.target.value) }))}
              placeholder="Select project"
            />
            <CustomTextField
              label="Invoice No."
              value={invoiceNo}
              onChange={(e) => dispatch(setInwardField({ field: 'invoiceNo', value: e.target.value }))}
            />
            <CustomTextField
              label="Invoice Date"
              type="date"
              value={invoiceDate}
              onChange={(e) => dispatch(setInwardField({ field: 'invoiceDate', value: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <CustomTextField
              label="Delivery Date"
              type="date"
              value={deliveryDate}
              onChange={(e) => dispatch(setInwardField({ field: 'deliveryDate', value: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <CustomTextField
              label="Vehicle No."
              value={vehicleNo}
              onChange={(e) => dispatch(setInwardField({ field: 'vehicleNo', value: e.target.value }))}
            />
            <CustomTextField
              label="Supplier Name"
              value={supplierName}
              onChange={(e) => dispatch(setInwardField({ field: 'supplierName', value: e.target.value }))}
            />
            <div className="lg:col-span-3">
              <CustomTextField
                label="Remarks"
                value={remarks}
                onChange={(e) => dispatch(setInwardField({ field: 'remarks', value: e.target.value }))}
                multiline
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Materials Section */}
        {projectId && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-800">Allocated Materials</h2>
              {/* Search could be added here if needed */}
            </div>

            <CustomTable
              data={tableRows}
              columns={columns}
              pagination
              rows={rows}
              page={page}
              onPageChange={(p, r) => { setPage(p); setRows(r); }}
              onRowClick={(row) => openModalForLine(row)}
              emptyMessage="No allocated materials found for this project."
            />
          </div>
        )}
      </div>

      {/* Quantity Modal */}
      <QuantityModal
        line={modalLine}
        values={modalValues}
        onChange={(values) => dispatch(setInwardModalValues(values))}
        onSave={saveModalLine}
        onClose={() => dispatch(setInwardModalLine(null))}
      />
    </div>
  );
};

export default InwardCreatePage;
