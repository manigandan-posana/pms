import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiArrowLeft, FiCheckCircle, FiCircle, FiSave } from "react-icons/fi";
import { Box, Stack, Typography, Paper, Grid } from "@mui/material";

import CustomButton from "../../widgets/CustomButton";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";
import { Get } from "../../utils/apiService";

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
  onSave: (qty?: string) => void;
  onClose: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({
  line,
  values, // We will treat this as initial value provider
  onChange, // Deprecated in favor of local state, but kept for signature if needed or we remove it
  onSave,
  onClose,
}) => {
  // Use empty string as default so the input appears empty when user opens modal
  const [localQty, setLocalQty] = React.useState<string>(values.transferQty ?? "");

  // Sync with prop when modal opens/line changes
  React.useEffect(() => {
    setLocalQty(values.transferQty ?? "");
  }, [values.transferQty, line]);

  if (!line) return null;

  const handleSave = () => {
    // Update the parent's values before saving
    onChange({ transferQty: localQty });
    // Small delay to allow state propagation or just pass value to onSave if we refactored parent
    // But since parent uses modalValues from Redux for onSave, we need to dispatch update.
    // Actually, safer to pass value to onSave directly.
    onSave(localQty);
  };

  return (
    <CustomModal
      title={`${line.code} — ${line.name}`}
      open={Boolean(line)}
      onClose={onClose}
      footer={
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <CustomButton variant="text" onClick={onClose} size="small">Cancel</CustomButton>
          <CustomButton onClick={handleSave} size="small" startIcon={<FiSave />}>Save</CustomButton>
        </Stack>
      }
    >
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          <Box component="span" fontWeight={600}>{line.unit}</Box>
          {" \u00b7 "}
          In stock: <Box component="span" fontWeight={600} color="text.primary">{line.availableQty ?? line.allocatedQty ?? line.qty ?? 0}</Box>
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <CustomTextField
            label="Transfer Qty *"
            type="number"
            value={localQty}
            onChange={(e) => setLocalQty(e.target.value)}
            required
            autoFocus
          />
        </Grid>
      </Grid>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Enter quantity to transfer.
      </Typography>
    </CustomModal >
  );
};

// ---- Create Page Component ------------------------------------------------

const TransferCreatePage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { codes, assignedProjects, projects } =
    useSelector<RootState, WorkspaceStateShape>(
      (state) =>
        state.workspace as unknown as WorkspaceStateShape
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
  const [allocatedMaterials, setAllocatedMaterials] = useState<TransferMaterialLine[]>([]);

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

  useEffect(() => {
    const loadMaterials = async () => {
      if (!fromProject) {
        setAllocatedMaterials([]);
        return;
      }
      const response = await Get<TransferMaterialLine[]>(`/app/projects/${fromProject}/bom`, {
        search: searchQuery.trim() || undefined,
        inStockOnly: true,
      });
      const content = Array.isArray(response) ? response : [];
      setAllocatedMaterials(
        content.map((bomLine) => ({
          ...bomLine,
          materialId: String(bomLine.materialId),
          availableQty: bomLine.balanceQty ?? bomLine.allocatedQty ?? bomLine.qty ?? 0,
        }))
      );
    };
    loadMaterials();
  }, [fromProject, searchQuery]);

  const tableRows = useMemo(() => {
    return allocatedMaterials.map((m) => {
      const sel = selectedLines[m.materialId];
      return {
        ...m,
        _selected: Boolean(sel),
        _transferQty: sel ? Number(sel.transferQty || 0) : 0,
      };
    });
  }, [allocatedMaterials, selectedLines]);

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
        // default to empty string so input is empty like inward/outward
        transferQty: existing ? String(existing.transferQty) : "",
      })
    );
  };

  const handleModalSave = (qty?: string) => {
    if (!modalLine) return;
    // Use passed qty if available, otherwise fallback to modal values.
    // Allow empty string so input can be left blank; parsedQty will be 0 in that case
    const raw = qty !== undefined ? qty : modalValues.transferQty;
    const parsed = raw === "" ? 0 : Number(raw || 0);

    // Always update selection state in the store; reducer will delete entry when qty <= 0
    dispatch(
      setTransferSelectedLine({
        materialId: modalLine.materialId,
        transferQty: parsed,
      })
    );
    // Close modal
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
      (dispatch as any)(refreshInventoryCodes());
      dispatch(clearTransferSelections());

      // Navigate back to history
      navigate('/workspace/inventory/transfers');
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
    {
      field: "availableQty",
      header: "In Stock",
      align: "right",
      width: "100px",
      body: (row) => <Typography variant="body2" color="text.secondary" fontWeight={500}>{row.availableQty ?? 0}</Typography>
    },
    {
      field: "_transferQty",
      header: "Transfer Qty",
      align: "right",
      width: "120px",
      body: (row) => (
        <Typography
          variant="body2"
          fontWeight={700}
          color="primary.main"
        >
          {row._transferQty || "—"}
        </Typography>
      )
    },
  ];

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
            onClick={() => navigate('/workspace/inventory/transfers')}
            sx={{ minWidth: 40, p: 1, color: 'text.secondary' }}
          >
            <FiArrowLeft size={20} />
          </CustomButton>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              New Transfer
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Transfer materials between projects
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {selectedLineCount} items selected
          </Typography>
          <CustomButton
            onClick={handleSaveTransfer}
            disabled={saving || selectedLineCount === 0}
            loading={saving}
            startIcon={<FiSave />}
            sx={{ px: 3 }}
          >
            Save Transfer
          </CustomButton>
        </Stack>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Box sx={{ maxWidth: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Transfer Form */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
              Transfer Details
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
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
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
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
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
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
              </Grid>
              <Grid size={{ xs: 12, md: 4, lg: 2.4 }}>
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
              </Grid>
              <Grid size={{ xs: 12, md: 8, lg: 2.4 }}>
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
              </Grid>
            </Grid>
          </Paper>

          {/* Material Table */}
          {fromProject && (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  Select Materials to Transfer
                </Typography>
                <Box sx={{ width: 240 }}>
                  <CustomTextField
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(e) => {
                      setPage(0);
                      setSearchQuery(e.target.value);
                    }}
                    size="small"
                  />
                </Box>
              </Box>

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
            </Paper>
          )}
        </Box>
      </Box>

      {/* Transfer Quantity Modal */}
      <TransferModal
        line={modalLine}
        values={modalValues}
        onChange={(vals) => dispatch(setTransferModalValues(vals))}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />
    </Box>
  );
};

export default TransferCreatePage;
