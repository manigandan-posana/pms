import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSearch, FiCheckCircle, FiCircle, FiSave, FiX } from "react-icons/fi";

import CustomButton from "../../widgets/CustomButton";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";

import {
  refreshInventoryCodes,
  submitOutward,
} from "../../store/slices/workspaceSlice";
import {
  clearOutwardSelections,
  setOutwardField,
  setOutwardModalLine,
  setOutwardModalValues,
  setOutwardSaving,
  setOutwardSelectedLine,
} from "../../store/slices/workspaceUiSlice";
import type { RootState, AppDispatch } from "../../store/store";

// ---------- Types ---------- //

export interface WorkspaceCodesState {
  outward?: string | null;
  [key: string]: string | null | undefined;
}

export interface ProjectSummary {
  id: string | number;
  code: string;
  name: string;
}

export interface BomLine {
  id?: string | number | null;
  materialId?: string | number | null;
  code?: string | null;
  name?: string | null;
  unit?: string | null;
  balanceQty?: number | null;
  allocatedQty?: number | null;
  qty?: number | null;
  [key: string]: unknown;
}

export interface AvailableMaterial extends BomLine {
  materialId: string;
  inStockQty: number;
}

interface WorkspaceStateSlice {
  codes: WorkspaceCodesState;
  assignedProjects: ProjectSummary[];
  bomByProject?: Record<string, BomLine[] | undefined>;
}

export interface OutwardSelectedLineValues {
  issueQty: number | string;
}

export interface OutwardModalValues {
  issueQty: string;
}

export interface OutwardUiState {
  projectId: string;
  issueTo: string;
  status: string;
  date: string;
  closeDate: string;
  saving: boolean;
  selectedLines: Record<string, OutwardSelectedLineValues>;
  modalLine: AvailableMaterial | null;
  modalValues: OutwardModalValues;
}

interface AuthStateSlice {
  token: string | null;
}

// -------- Issue Quantity Modal -------- //

interface IssueModalProps {
  line: AvailableMaterial | null;
  values: OutwardModalValues;
  onChange: (values: OutwardModalValues) => void;
  onSave: () => void;
  onClose: () => void;
}

const IssueModal: React.FC<IssueModalProps> = ({
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
        In stock: <span className="font-semibold text-slate-700">{line.inStockQty ?? line.balanceQty ?? line.allocatedQty ?? line.qty ?? 0}</span>
      </div>
      <div className="grid gap-2">
        <CustomTextField
          label="Issue Qty *"
          type="number"
          value={values.issueQty}
          onChange={(e) => onChange({ issueQty: e.target.value })}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Save to include this material in outward.
      </p>
    </CustomModal>
  );
};

// -------- Create Page Component -------- //

const OutwardCreatePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { codes, assignedProjects, bomByProject } = useSelector<
    RootState,
    WorkspaceStateSlice
  >((state) => state.workspace as unknown as WorkspaceStateSlice);

  const { token } = useSelector<RootState, AuthStateSlice>(
    (state) => state.auth as AuthStateSlice
  );

  const outwardUi = useSelector<RootState, OutwardUiState>(
    (state) => state.workspaceUi.outward as unknown as OutwardUiState
  );

  const {
    projectId,
    issueTo,
    status,
    date,
    closeDate,
    selectedLines,
    saving,
    modalLine,
    modalValues,
  } = outwardUi;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);

  // Ensure status is always OPEN for new outwards
  React.useEffect(() => {
    if (status !== "OPEN") {
      dispatch(setOutwardField({ field: "status", value: "OPEN" }));
    }
  }, [status, dispatch]);

  // Default project selection - select first project if none selected
  React.useEffect(() => {
    if (!projectId && assignedProjects.length > 0) {
      dispatch(
        setOutwardField({
          field: "projectId",
          value: String(assignedProjects[0].id),
        })
      );
    }
  }, [assignedProjects, dispatch, projectId]);

  // Clear selections when project changes
  React.useEffect(() => {
    dispatch(clearOutwardSelections());
  }, [dispatch, projectId]);

  // Get selected project's BOM
  const selectedProjectBom = useMemo(
    () => (projectId ? bomByProject?.[projectId] || [] : []),
    [projectId, bomByProject]
  );

  // Convert to available materials with in-stock quantity
  const availableMaterials = useMemo<AvailableMaterial[]>(() => {
    return selectedProjectBom
      .map((bomLine) => ({
        ...bomLine,
        materialId: String(bomLine.materialId),
        inStockQty: bomLine.balanceQty ?? bomLine.allocatedQty ?? bomLine.qty ?? 0,
      }))
      .filter((m) => m.inStockQty > 0);
  }, [selectedProjectBom]);

  // Filter by search
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return availableMaterials;
    const lowerQuery = searchQuery.toLowerCase();
    return availableMaterials.filter(
      (m) =>
        m.code?.toLowerCase().includes(lowerQuery) ||
        m.name?.toLowerCase().includes(lowerQuery)
    );
  }, [availableMaterials, searchQuery]);

  // Build table rows with selection state
  const tableRows = useMemo(() => {
    return filteredMaterials.map((m) => {
      const sel = selectedLines[m.materialId];
      return {
        ...m,
        _selected: Boolean(sel),
        _issueQty: sel ? Number(sel.issueQty || 0) : 0,
      };
    });
  }, [filteredMaterials, selectedLines]);

  const selectedLineCount = useMemo(
    () => Object.keys(selectedLines).length,
    [selectedLines]
  );

  const handleCheckboxClick = (e: React.MouseEvent, line: AvailableMaterial): void => {
    e.stopPropagation(); // Prevent opening modal
    const materialKey = String(line.materialId);
    const existing = selectedLines[materialKey];

    if (existing) {
      // Deselect by setting quantity to 0
      dispatch(
        setOutwardSelectedLine({
          materialId: materialKey,
          issueQty: 0,
        })
      );
    } else {
      // Select by opening modal
      openModalForLine(line);
    }
  };

  const openModalForLine = (line: AvailableMaterial) => {
    const existing = selectedLines[line.materialId];
    dispatch(setOutwardModalLine(line));
    dispatch(
      setOutwardModalValues({
        issueQty: existing ? String(existing.issueQty) : "0",
      })
    );
  };

  const handleModalSave = () => {
    if (!modalLine) return;
    const issueQty = Number(modalValues.issueQty) || 0;
    if (issueQty <= 0) {
      dispatch(setOutwardModalLine(null));
      return;
    }
    dispatch(
      setOutwardSelectedLine({
        materialId: modalLine.materialId,
        issueQty: issueQty,
      })
    );
    dispatch(setOutwardModalLine(null));
  };

  const handleModalClose = () => {
    dispatch(setOutwardModalLine(null));
  };

  const handleSaveOutward = async () => {
    const selectedLinesArray = Object.entries(selectedLines).map(
      ([materialId, vals]) => ({
        materialId: Number(materialId),
        issueQty: Number(vals.issueQty) || 0,
      })
    );

    if (!projectId || !issueTo || selectedLinesArray.length === 0) {
      toast.error("Select project, issue to, and at least one material.");
      return;
    }

    dispatch(setOutwardSaving(true));
    try {
      await dispatch(
        submitOutward({
          code: codes.outward,
          projectId: String(projectId),
          issueTo,
          status: "OPEN",
          date,
          closeDate: null,
          lines: selectedLinesArray,
        })
      ).unwrap();

      toast.success("Outward created successfully");

      dispatch(refreshInventoryCodes(token || ""));
      dispatch(setOutwardField({ field: "issueTo", value: "" }));
      dispatch(clearOutwardSelections());
      navigate('/workspace/outward');
    } catch (err) {
      // Error already handled by thunk
    } finally {
      dispatch(setOutwardSaving(false));
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
      field: "inStockQty",
      header: "In Stock",
      align: "right",
      width: "100px",
      body: (row) => <span className="font-medium text-slate-600">{row.inStockQty ?? 0}</span>
    },
    {
      field: "_issueQty",
      header: "Issue Qty",
      align: "right",
      width: "100px",
      body: (row) => <span className="font-bold text-emerald-600">{row._issueQty || "—"}</span>
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <CustomButton
            variant="text"
            onClick={() => navigate('/workspace/outward')}
            className="text-slate-500 hover:text-slate-700"
            size="small"
          >
            <FiArrowLeft size={20} />
          </CustomButton>
          <div>
            <h1 className="text-xs font-bold text-slate-800">New Outward Detail</h1>
            <p className="text-slate-500 text-xs">Issue materials from stock</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 mr-2">
            {selectedLineCount} items selected
          </div>
          <CustomButton
            onClick={handleSaveOutward}
            disabled={saving || selectedLineCount === 0}
            loading={saving}
            startIcon={<FiSave />}
            className="px-6"
          >
            Create Outward
          </CustomButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Project and Details Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xs font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Issue Details</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <CustomSelect
              label="Project *"
              value={projectId}
              options={assignedProjects.map((p) => ({
                label: `${p.code} \u2014 ${p.name}`,
                value: String(p.id),
              }))}
              onChange={(e) =>
                dispatch(
                  setOutwardField({
                    field: "projectId",
                    value: String(e.target.value),
                  })
                )
              }
            />
            <CustomTextField
              label="Issue To *"
              value={issueTo}
              onChange={(e) =>
                dispatch(
                  setOutwardField({
                    field: "issueTo",
                    value: e.target.value,
                  })
                )
              }
            />
            <CustomTextField
              label="Issue Date"
              type="date"
              value={date}
              onChange={(e) =>
                dispatch(
                  setOutwardField({
                    field: "date",
                    value: e.target.value,
                  })
                )
              }
              InputLabelProps={{ shrink: true }}
            />
            <div className="col-span-full flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <label className="text-xs font-medium text-slate-700">Status:</label>
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">OPEN</span>
              <span className="text-xs text-slate-500 italic">New outwards are always created as OPEN and can be closed later</span>
            </div>
          </div>
        </div>

        {/* Material Table */}
        {projectId && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-800">Select Issue Materials</h2>
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
              emptyMessage="No available materials found in this project."
            />
          </div>
        )}
      </div>

      {/* Issue Quantity Modal */}
      <IssueModal
        line={modalLine}
        values={modalValues}
        onChange={(vals) => dispatch(setOutwardModalValues(vals))}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default OutwardCreatePage;
