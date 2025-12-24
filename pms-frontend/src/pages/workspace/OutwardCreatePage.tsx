import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Box, Stack, Typography, Paper, Grid, Chip } from "@mui/material";
import { FiArrowLeft, FiCheckCircle, FiCircle, FiSave } from "react-icons/fi";

import CustomButton from "../../widgets/CustomButton";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";
import { Get } from "../../utils/apiService";

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
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <CustomButton variant="text" onClick={onClose} size="small">Cancel</CustomButton>
          <CustomButton onClick={onSave} size="small" startIcon={<FiSave />}>Save</CustomButton>
        </Stack>
      }
    >
      <Box sx={{ mb: 1.5, p: 1, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
          <Box component="span" sx={{ fontWeight: 600 }}>{line.unit}</Box>
          {" · "}
          In stock: <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{line.inStockQty ?? line.balanceQty ?? line.allocatedQty ?? line.qty ?? 0}</Box>
        </Typography>
      </Box>
      <CustomTextField
        label="Issue Qty *"
        type="number"
        value={values.issueQty}
        onChange={(e) => onChange({ issueQty: e.target.value })}
      />
      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary', fontSize: '0.65rem' }}>
        Save to include this material in outward.
      </Typography>
    </CustomModal>
  );
};

// -------- Create Page Component -------- //

const OutwardCreatePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { codes, assignedProjects } = useSelector<
    RootState,
    WorkspaceStateSlice
  >((state) => state.workspace as unknown as WorkspaceStateSlice);

  const outwardUi = useSelector<RootState, OutwardUiState>(
    (state) => state.workspaceUi.outward as unknown as OutwardUiState
  );

  const {
    projectId,
    issueTo,
    date,
    status,
    selectedLines,
    saving,
    modalLine,
    modalValues,
  } = outwardUi;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [availableMaterials, setAvailableMaterials] = useState<AvailableMaterial[]>([]);

  // Ensure status is always OPEN for new outwards
  React.useEffect(() => {
    if (status !== "OPEN") {
      dispatch(setOutwardField({ field: "status", value: "OPEN" }));
    }
  }, [status, dispatch]);

  // Default project selection
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

  useEffect(() => {
    const loadMaterials = async () => {
      if (!projectId) {
        setAvailableMaterials([]);
        return;
      }
      const response = await Get<AvailableMaterial[]>(`/app/projects/${projectId}/bom`, {
        search: searchQuery.trim() || undefined,
        inStockOnly: true,
      });
      const content = Array.isArray(response) ? response : [];
      setAvailableMaterials(
        content.map((bomLine) => ({
          ...bomLine,
          materialId: String(bomLine.materialId),
          inStockQty: bomLine.balanceQty ?? bomLine.allocatedQty ?? bomLine.qty ?? 0,
        }))
      );
    };
    loadMaterials();
  }, [projectId, searchQuery]);

  const tableRows = useMemo(() => {
    return availableMaterials.map((m) => {
      const sel = selectedLines[m.materialId];
      return {
        ...m,
        _selected: Boolean(sel),
        _issueQty: sel ? Number(sel.issueQty || 0) : 0,
      };
    });
  }, [availableMaterials, selectedLines]);

  const selectedLineCount = useMemo(
    () => Object.keys(selectedLines).length,
    [selectedLines]
  );

  const handleCheckboxClick = (e: React.MouseEvent, line: AvailableMaterial): void => {
    e.stopPropagation();
    const materialKey = String(line.materialId);
    const existing = selectedLines[materialKey];

    if (existing) {
      dispatch(
        setOutwardSelectedLine({
          materialId: materialKey,
          issueQty: 0,
        })
      );
    } else {
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

      dispatch(refreshInventoryCodes());
      dispatch(setOutwardField({ field: "issueTo", value: "" }));
      dispatch(clearOutwardSelections());
      navigate('/workspace/inventory/outwards');
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
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', p: 0.5 }}
          onClick={(e) => handleCheckboxClick(e, row)}
        >
          {row._selected ? (
            <FiCheckCircle size={16} style={{ color: '#10b981' }} />
          ) : (
            <FiCircle size={16} style={{ color: '#cbd5e1' }} />
          )}
        </Box>
      )
    },
    { field: "code", header: "Code", sortable: true, width: "120px", body: (row) => <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.code || "—"}</Typography> },
    { field: "name", header: "Material", sortable: true, body: (row) => <Typography variant="caption" sx={{ fontWeight: 500 }}>{row.name}</Typography> },
    { field: "unit", header: "Unit", width: "80px", body: (row) => <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.unit || "—"}</Typography> },
    {
      field: "inStockQty",
      header: "In Stock",
      align: "right",
      width: "100px",
      body: (row) => <Typography variant="caption" sx={{ fontWeight: 500 }}>{row.inStockQty ?? 0}</Typography>
    },
    {
      field: "_issueQty",
      header: "Issue Qty",
      align: "right",
      width: "100px",
      body: (row) => <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>{row._issueQty || "—"}</Typography>
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ borderBottom: 1, borderColor: 'divider', px: 1.5, py: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <CustomButton
              variant="text"
              onClick={() => navigate('/workspace/inventory/outwards')}
              size="small"
            >
              <FiArrowLeft size={18} />
            </CustomButton>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                New Outward Entry
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                Issue materials from stock
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip label={`${selectedLineCount} items`} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
            <CustomButton
              onClick={handleSaveOutward}
              disabled={saving || selectedLineCount === 0}
              loading={saving}
              startIcon={<FiSave />}
            >
              Create Outward
            </CustomButton>
          </Stack>
        </Stack>
      </Paper>

      {/* Form Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <Stack spacing={1}>
          {/* Issue Details Card */}
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block' }}>
              Issue Details
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <CustomSelect
                  label="Project *"
                  value={projectId}
                  options={assignedProjects.map((p) => ({
                    label: `${p.code} — ${p.name}`,
                    value: String(p.id),
                  }))}
                  onChange={(value) =>
                    dispatch(
                      setOutwardField({
                        field: "projectId",
                        value: String(value),
                      })
                    )
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ p: 1, bgcolor: 'info.lighter', borderRadius: 1, border: 1, borderColor: 'info.light' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'info.dark', display: 'block' }}>
                    Status: <Chip label="OPEN" size="small" color="info" sx={{ height: 18, fontSize: '0.6rem', ml: 0.5 }} />
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'info.dark', fontStyle: 'italic', display: 'block', mt: 0.25 }}>
                    New outwards are created as OPEN
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Materials Table Card */}
          {projectId && (
            <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    Select Materials to Issue
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
                </Stack>
              </Box>

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
            </Paper>
          )}
        </Stack>
      </Box>

      {/* Issue Quantity Modal */}
      <IssueModal
        line={modalLine}
        values={modalValues}
        onChange={(vals) => dispatch(setOutwardModalValues(vals))}
        onSave={handleModalSave}
        onClose={handleModalClose}
      />
    </Box>
  );
};

export default OutwardCreatePage;
