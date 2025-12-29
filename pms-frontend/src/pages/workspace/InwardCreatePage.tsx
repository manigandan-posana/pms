import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiCheckCircle, FiCircle, FiSave } from "react-icons/fi";
import { Box, Stack, Typography, Paper, Grid } from "@mui/material";

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
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <CustomButton variant="text" onClick={onClose} size="small">Cancel</CustomButton>
          <CustomButton onClick={onSave} startIcon={<FiSave />} size="small">Save</CustomButton>
        </Stack>
      }
    >
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          <Box component="span" fontWeight={600}>{line.unit}</Box>
          {" \u00b7 "}
          Allocated: <Box component="span" fontWeight={600} color="text.primary">{line.allocatedQty ?? (line as any).qty ?? 0}</Box>
          {" \u00b7 "}
          Ordered: <Box component="span" fontWeight={600} color="text.primary">{(line as any).orderedQty ?? 0}</Box>
          {" \u00b7 Received: "}
          <Box component="span" fontWeight={600} color="text.primary">{(line as any).receivedQty ?? 0}</Box>
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField
            label="Ordered Qty"
            type="number"
            value={values.orderedQty}
            onChange={(e) => onChange({ ...values, orderedQty: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CustomTextField
            label="Received Qty *"
            type="number"
            value={values.receivedQty}
            onChange={(e) => onChange({ ...values, receivedQty: e.target.value })}
            required
            autoFocus
          />
        </Grid>
      </Grid>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Save to include this material. Leave empty to deselect.
      </Typography>
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

  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [
      {
        field: "_selected",
        header: "",
        width: "50px",
        align: "center",
        body: (row) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              p: 1
            }}
            onClick={(e) => handleCheckboxClick(e, row)}
          >
            {row._selected ? (
              <FiCheckCircle className="text-emerald-600" size={18} />
            ) : (
              <FiCircle className="text-slate-300" size={18} />
            )}
          </Box>
        )
      },
      {
        field: "code",
        header: "Code",
        sortable: true,
        width: "120px",
        body: (row) => <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.primary' }}>{row.code || "—"}</Typography>
      },
      {
        field: "name",
        header: "Material",
        sortable: true,
        body: (row) => <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
      },
      {
        field: "unit",
        header: "Unit",
        width: "80px",
        body: (row) => <Typography variant="caption" color="text.secondary">{row.unit || "—"}</Typography>
      },
    ];

    

    cols.push({
      field: "_receivedQty",
      header: "Received",
      align: "right",
      width: "120px",
      body: (row) => (
        <Typography
          variant="body2"
          fontWeight={700}
          color="primary.main"
        >
          {row._receivedQty || "—"}
        </Typography>
      )
    });

    return cols;
  }, [handleCheckboxClick]);

  const handleSubmit = async () => {
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
      dispatch(refreshInventoryCodes());
      dispatch(setInwardField({ field: "invoiceNo", value: "" }));
      dispatch(setInwardField({ field: "invoiceDate", value: "" }));
      dispatch(setInwardField({ field: "deliveryDate", value: "" }));
      dispatch(setInwardField({ field: "vehicleNo", value: "" }));
      dispatch(setInwardField({ field: "supplierName", value: "" }));
      dispatch(setInwardField({ field: "remarks", value: "" }));
      dispatch(clearInwardSelections());
      navigate('/workspace/inventory/inwards');
    } catch (err) {
      // Error already handled by thunk
    } finally {
      dispatch(setInwardSaving(false));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <CustomButton
            variant="text"
            onClick={() => navigate('/workspace/inventory/inwards')}
            sx={{ minWidth: 40, p: 1, color: 'text.secondary' }}
          >
            <FiArrowLeft size={20} />
          </CustomButton>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Create Inward Entry
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Record new material arrival
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {selectedLineCount} items selected
          </Typography>
          <CustomButton
            onClick={handleSubmit}
            disabled={saving || selectedLineCount === 0}
            loading={saving}
            startIcon={<FiSave />}
            sx={{ px: 3 }}
          >
            Save Inward
          </CustomButton>
        </Stack>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Box sx={{ maxWidth: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Form Section */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
              Entry Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <CustomSelect
                  label="Project *"
                  value={projectId}
                  options={assignedProjects.map((p) => ({ label: `${p.code} — ${p.name}`, value: String(p.id) }))}
                  onChange={(value) => dispatch(setInwardField({ field: 'projectId', value: String(value) }))}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <CustomTextField
                  label="Invoice No."
                  value={invoiceNo}
                  onChange={(e) => dispatch(setInwardField({ field: 'invoiceNo', value: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CustomTextField
                  label="Invoice Date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => dispatch(setInwardField({ field: 'invoiceDate', value: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CustomTextField
                  label="Delivery Date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => dispatch(setInwardField({ field: 'deliveryDate', value: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CustomTextField
                  label="Vehicle No."
                  value={vehicleNo}
                  onChange={(e) => dispatch(setInwardField({ field: 'vehicleNo', value: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <CustomTextField
                  label="Supplier Name"
                  value={supplierName}
                  onChange={(e) => dispatch(setInwardField({ field: 'supplierName', value: e.target.value }))}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <CustomTextField
                  label="Remarks"
                  value={remarks}
                  onChange={(e) => dispatch(setInwardField({ field: 'remarks', value: e.target.value }))}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Materials Section */}
          {projectId && (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  Allocated Materials
                </Typography>
              </Box>

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
            </Paper>
          )}
        </Box>
      </Box>

      {/* Quantity Modal */}
      <QuantityModal
        line={modalLine}
        values={modalValues}
        onChange={(values) => dispatch(setInwardModalValues(values))}
        onSave={saveModalLine}
        onClose={() => dispatch(setInwardModalLine(null))}
      />
    </Box >
  );
};

export default InwardCreatePage;
