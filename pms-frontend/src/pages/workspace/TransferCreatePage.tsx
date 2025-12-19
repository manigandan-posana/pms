import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSearch, FiCheckCircle, FiCircle, FiSave, FiX } from "react-icons/fi";
import InventoryNavigationTabs from "../../components/InventoryNavigationTabs";

import CustomButton from "../../widgets/CustomButton";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";

import {
  refreshInventoryCodes,
  submitTransfer,
} from "../../store/slices/workspaceSlice";
import type { TransferRequest } from "../../types/backend";
import {
  clearTransferSelections,
  setTransferField,
  setTransferModalLine,
  setTransferModalValues,
  setTransferSaving,
  setTransferSelectedLine,
} from "../../store/slices/workspaceUiSlice";
import type { RootState } from "../../store/store";

// ---- Domain types ---------------------------------------------------------

export interface Project {
  id: string | number;
  code: string;
  name: string;
  [key: string]: unknown;
}

export interface BomLine {
  id?: string | number;
  materialId?: string | number;
  code?: string;
  name?: string;
  unit?: string;
  balanceQty?: number;
  allocatedQty?: number;
  qty?: number;
  [key: string]: unknown;
}

export interface TransferMaterialLine extends BomLine {
  materialId: string;
  availableQty: number;
}

export interface CodesState {
  transfer?: string;
  [key: string]: unknown;
}

export interface WorkspaceStateShape {
  codes: CodesState;
  assignedProjects: Project[];
  bomByProject?: Record<string, BomLine[]> | Record<number, BomLine[]> | any;
  projects?: Project[];
  [key: string]: unknown;
}

export interface AuthStateShape {
  token?: string;
  [key: string]: unknown;
}

export interface TransferModalValues {
  transferQty: string;
}

export interface TransferSelectedLineValues {
  transferQty: number;
}

export type TransferSelectedLinesMap = Record<
  string,
  TransferSelectedLineValues
>;

export interface TransferUiState {
  fromProject: string;
  toProject: string;
  fromSite: string;
  toSite: string;
  remarks: string;
  saving: boolean;
  selectedLines: TransferSelectedLinesMap;
  modalLine: TransferMaterialLine | null;
  modalValues: TransferModalValues;
}

// ---- TransferModal component ----------------------------------------------

interface TransferModalProps {
  line: TransferMaterialLine | null;
  values: TransferModalValues;
  onChange: (values: TransferModalValues) => void;
  onSave: () => void;
  onClose: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({
  line,
  values,
  onChange,
  onSave,
  onClose,
}) => {
  if (!line) return null;
  return (
    <CustomModal
      title={`${line.code} — ${line.name}`}
      open={Boolean(line)}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <CustomButton variant="text" onClick={onClose} size="small">Cancel</CustomButton>
          <CustomButton onClick={onSave} size="small" startIcon={<FiSave />}>Save</CustomButton>
        </div>
      }
    >
      <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded border border-slate-100">
        <span className="font-semibold">{line.unit}</span>
        {" \u00b7 "}
        In stock: <span className="font-semibold text-slate-700">{line.availableQty ?? line.allocatedQty ?? line.qty ?? 0}</span>
      </div>
      <div className="grid gap-2">
        <CustomTextField
          label="Transfer Qty *"
          type="number"
          value={values.transferQty}
          onChange={(e) => onChange({ transferQty: e.target.value })}
          required
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Save to include this material in transfer.
      </p>
    </CustomModal>
  );
};

// ---- Create Page Component ------------------------------------------------

const TransferCreatePage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { codes, assignedProjects, bomByProject, projects } =
    useSelector<RootState, WorkspaceStateShape>(
      (state) =>
        state.workspace as unknown as WorkspaceStateShape
    );

  const { token } = useSelector<RootState, AuthStateShape>(
    (state) => state.auth as unknown as AuthStateShape
  );

  const {
    fromProject,
    toProject,
    fromSite,
    toSite,
    remarks,
    saving,
    selectedLines,
    modalLine,
    modalValues,
  } = useSelector<RootState, TransferUiState>(
    (state) =>
      state.workspaceUi.transfer as unknown as TransferUiState
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  // Default project selection - select first project as FROM project if none selected
  React.useEffect(() => {
    if (!fromProject && assignedProjects.length > 0) {
      dispatch(
        setTransferField({
          field: "fromProject",
          value: String(assignedProjects[0].id),
        })
      );
    }
  }, [assignedProjects, dispatch, fromProject]);

  // Clear selections when FROM project changes
  React.useEffect(() => {
    dispatch(clearTransferSelections());
  }, [dispatch, fromProject]);

  // Clear TO project if it becomes equal to FROM project
  React.useEffect(() => {
    if (fromProject && toProject && fromProject === toProject) {
      dispatch(
        setTransferField({
          field: "toProject",
          value: "",
        })
      );
    }
  }, [dispatch, fromProject, toProject]);

  const fromProjects = useMemo(
    () => assignedProjects || [],
    [assignedProjects]
  );

  const toProjects = useMemo(
    () =>
      (projects || assignedProjects || []).filter(
        (p) => String(p.id) !== String(fromProject)
      ),
    [projects, assignedProjects, fromProject]
  );

  const fromProjectBom = useMemo(
    () => (fromProject ? bomByProject?.[fromProject] || [] : []),
    [fromProject, bomByProject]
  );

  const allocatedMaterials = useMemo<TransferMaterialLine[]>(() => {
    return fromProjectBom
      .map((bomLine: BomLine) => ({
        ...bomLine,
        materialId: String(bomLine.materialId),
        availableQty:
          bomLine.balanceQty ?? bomLine.allocatedQty ?? bomLine.qty ?? 0,
      }))
      .filter((m: any) => m.availableQty > 0);
  }, [fromProjectBom]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return allocatedMaterials;
    const lowerQuery = searchQuery.toLowerCase();
    return allocatedMaterials.filter(
      (m) =>
        m.code?.toLowerCase().includes(lowerQuery) ||
        m.name?.toLowerCase().includes(lowerQuery)
    );
  }, [allocatedMaterials, searchQuery]);

  const tableRows = useMemo(() => {
    return filteredMaterials.map((m) => {
      const sel = selectedLines[m.materialId];
      return {
        ...m,
        _selected: Boolean(sel),
        _transferQty: sel ? Number(sel.transferQty || 0) : 0,
      };
    });
  }, [filteredMaterials, selectedLines]);

  const selectedLineCount = useMemo(
    () => Object.keys(selectedLines).length,
    [selectedLines]
  );

  const handleCheckboxClick = (e: React.MouseEvent, line: TransferMaterialLine): void => {
    e.stopPropagation(); // Prevent opening modal
    const materialKey = String(line.materialId);
    const existing = selectedLines[materialKey];

    if (existing) {
      // Deselect by setting quantity to 0
      dispatch(
        setTransferSelectedLine({
          materialId: materialKey,
          transferQty: 0,
        })
      );
    } else {
      // Select by opening modal
      openModalForLine(line);
    }
  };

  const openModalForLine = (line: TransferMaterialLine) => {
    const existing = selectedLines[line.materialId];
    dispatch(setTransferModalLine(line));
    dispatch(
      setTransferModalValues({
        transferQty: existing ? String(existing.transferQty) : "0",
      })
    );
  };

  const handleModalSave = () => {
    if (!modalLine) return;
    const transferQty = Number(modalValues.transferQty) || 0;
    if (transferQty <= 0) {
      dispatch(setTransferModalLine(null));
      return;
    }
    dispatch(
      setTransferSelectedLine({
        materialId: modalLine.materialId,
        transferQty: transferQty,
      })
    );
    dispatch(setTransferModalLine(null));
  };

  const handleModalClose = () => {
    dispatch(setTransferModalLine(null));
  };

  const handleSaveTransfer = async () => {
    const selectedLinesArray = Object.entries(selectedLines).map(
      ([materialId, vals]) => ({
        materialId: Number(materialId),
        transferQty: Number(vals.transferQty) || 0,
      })
    );

    if (!fromProject || !toProject || selectedLinesArray.length === 0) {
      toast.error("Select from project, to project, and at least one material.");
      return;
    }

    dispatch(setTransferSaving(true));
    try {
      const payload: TransferRequest = {
        code: codes.transfer,
        fromProjectId: Number(fromProject),
        toProjectId: Number(toProject),
        fromSite: fromSite || null,
        toSite: toSite || null,
        remarks: remarks || null,
        lines: selectedLinesArray,
      };
      await (dispatch as any)(submitTransfer(payload)).unwrap();
      toast.success("Transfer saved successfully");
      (dispatch as any)(refreshInventoryCodes(token || ""));
      dispatch(clearTransferSelections());

      // Navigate back to history
      navigate('/workspace/transfer');
    } catch (err) {
      // Error already handled by thunk
    } finally {
      dispatch(setTransferSaving(false));
    }
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
      field: "availableQty",
      header: "In Stock",
      align: "right",
      width: "100px",
      body: (row) => <span className="font-medium text-slate-600">{row.availableQty ?? 0}</span>
    },
    {
      field: "_transferQty",
      header: "Transfer Qty",
      align: "right",
      width: "100px",
      body: (row) => <span className="font-bold text-emerald-600">{row._transferQty || "—"}</span>
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Inventory Navigation Tabs */}
      <div className="px-6 pt-6">
        <InventoryNavigationTabs />
      </div>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <CustomButton
            variant="text"
            onClick={() => navigate('/workspace/transfer')}
            className="text-slate-500 hover:text-slate-700"
            size="small"
          >
            <FiArrowLeft size={20} />
          </CustomButton>
          <div>
            <h1 className="text-xs font-bold text-slate-800">New Transfer</h1>
            <p className="text-slate-500 text-xs">Transfer materials between projects</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 mr-2">
            {selectedLineCount} items selected
          </div>
          <CustomButton
            onClick={handleSaveTransfer}
            disabled={saving || selectedLineCount === 0}
            loading={saving}
            startIcon={<FiSave />}
            className="px-6"
          >
            Save Transfer
          </CustomButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Transfer Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h2 className="text-xs font-bold text-slate-800">Transfer Details</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            <CustomSelect
              label="From Project *"
              value={fromProject}
              options={fromProjects.map((p) => ({
                label: `${p.code} \u2014 ${p.name}`,
                value: String(p.id),
              }))}
              onChange={(value) =>
                dispatch(
                  setTransferField({
                    field: "fromProject",
                    value: String(value),
                  })
                )
              }
            />
            <CustomTextField
              label="From Site"
              value={fromSite}
              onChange={(e) =>
                dispatch(
                  setTransferField({
                    field: "fromSite",
                    value: e.target.value,
                  })
                )
              }
            />
            <CustomSelect
              label="To Project *"
              value={toProject}
              options={toProjects.map((p) => ({
                label: `${p.code} \u2014 ${p.name}`,
                value: String(p.id),
              }))}
              onChange={(value) =>
                dispatch(
                  setTransferField({
                    field: "toProject",
                    value: String(value),
                  })
                )
              }
            />
            <CustomTextField
              label="To Site"
              value={toSite}
              onChange={(e) =>
                dispatch(
                  setTransferField({
                    field: "toSite",
                    value: e.target.value,
                  })
                )
              }
            />
            <CustomTextField
              label="Remarks"
              value={remarks}
              onChange={(e) =>
                dispatch(
                  setTransferField({
                    field: "remarks",
                    value: e.target.value,
                  })
                )
              }
            />
          </div>
        </div>

        {/* Material Table */}
        {fromProject && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-800">Select Materials to Transfer</h2>
              <div className="w-60">
                <CustomTextField
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => {
                    setPage(0);
                    setSearchQuery(e.target.value);
                  }}
                  size="small"
                />
              </div>
            </div>

            <CustomTable
              data={tableRows}
              columns={columns}
              pagination
              rows={rows}
              page={page}
              onPageChange={(p, r) => { setPage(p); setRows(r); }}
              onRowClick={(row) => openModalForLine(row)}
              emptyMessage="No available materials found in the source project."
            />
          </div>
        )}
      </div>

      {/* Transfer Quantity Modal */}
      <TransferModal
        line={modalLine}
        values={modalValues}
        onChange={(vals) => dispatch(setTransferModalValues(vals))}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default TransferCreatePage;
