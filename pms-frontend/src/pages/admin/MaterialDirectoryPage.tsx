import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiPlus, FiDownload, FiUpload, FiSearch, FiEdit2, FiTrash2, FiFilter, FiX } from "react-icons/fi";

import {
  createMaterial,
  deleteMaterial,
  fetchMaterials,
  exportMaterials,
  importMaterials,
  updateMaterial,
} from "../../store/slices/materialSlice";
import type { RootState, AppDispatch } from "../../store/store";

import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";
import { Box, Stack, Typography, Paper, Chip, IconButton, Collapse, Grid } from "@mui/material";

// ---- Types ----

type LoadingStatus = "idle" | "loading" | "succeeded" | "failed";

export interface Material {
  id: number | string;
  code: string;
  name: string;
  partNo?: string | null;
  lineType?: string | null;
  unit?: string | null;
  category?: string | null;
}

interface MaterialFormFields {
  code: string;
  name: string;
  partNo: string;
  lineType: string;
  unit: string;
  category: string;
}

type ModalMode = "create" | "edit";

interface ModalState {
  open: boolean;
  mode: ModalMode;
  materialId: number | string | null;
  saving: boolean;
  fields: MaterialFormFields;
}

interface FiltersState {
  categories: string[];
  units: string[];
  lineTypes: string[];
}

interface MaterialsSliceState {
  items: Material[];
  totalItems: number;
  totalPages: number;
  status: LoadingStatus;
  availableFilters: {
    lineTypes: string[];
    categories: string[];
    units: string[];
  };
  error: string | null;
}

interface MaterialDirectoryPageProps {
  onRequestReload?: () => void;
}

// ---- Helpers ----

const createEmptyMaterial = (): MaterialFormFields => ({
  code: "",
  name: "",
  partNo: "",
  lineType: "",
  unit: "",
  category: "",
});

const createEmptyModal = (): ModalState => ({
  open: false,
  mode: "create",
  materialId: null,
  saving: false,
  fields: createEmptyMaterial(),
});

// ---- Main Component ----

const MaterialDirectoryPage: React.FC<MaterialDirectoryPageProps> = ({
  onRequestReload,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);

  const {
    items: materials,
    totalItems,
    status,
    availableFilters,
    error: materialError,
  } = useSelector<RootState, MaterialsSliceState>(
    (state) => state.materials as unknown as MaterialsSliceState
  );

  const loading = status === "loading";

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    categories: [],
    units: [],
    lineTypes: [],
  });

  const [modalState, setModalState] = useState<ModalState>(createEmptyModal);
  const [importing, setImporting] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshMaterials = useCallback(async () => {
    if (!token) return;
    await dispatch(
      fetchMaterials({
        query: {
          page: page + 1,
          size: pageSize,
          search,
          category: filters.categories,
          unit: filters.units,
          partNo: [],
        },
      })
    );
  }, [dispatch, filters.categories, filters.units, page, pageSize, search, token]);

  useEffect(() => {
    void refreshMaterials();
  }, [refreshMaterials]);

  useEffect(() => {
    if (materialError) {
      toast.error(materialError);
    }
  }, [materialError]);

  const closeModal = () => setModalState(createEmptyModal());

  const openCreateMaterial = () => {
    setModalState({ ...createEmptyModal(), open: true });
  };

  const openEditMaterial = useCallback((material: Material) => {
    setModalState({
      open: true,
      mode: "edit",
      materialId: material.id,
      saving: false,
      fields: {
        code: material.code || "",
        name: material.name || "",
        partNo: material.partNo || "",
        lineType: material.lineType || "",
        unit: material.unit || "",
        category: material.category || "",
      },
    });
  }, []);

  const handleFieldChange = (field: keyof MaterialFormFields, value: string) => {
    setModalState((prev) => ({
      ...prev,
      fields: { ...prev.fields, [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!token) return;
    const payload = {
      name: modalState.fields.name?.trim() || "",
      partNo: modalState.fields.partNo?.trim() || "",
      lineType: modalState.fields.lineType?.trim() || "",
      unit: modalState.fields.unit?.trim() || "",
      category: modalState.fields.category?.trim() || "",
    };
    if (!payload.name) {
      toast.error("Material name is required");
      return;
    }
    setModalState((prev) => ({ ...prev, saving: true }));
    try {
      if (modalState.mode === "edit" && modalState.materialId != null) {
        await dispatch(
          updateMaterial({
            materialId: String(modalState.materialId),
            payload,
          })
        ).unwrap();
        toast.success("Material updated");
      } else {
        await dispatch(createMaterial(payload)).unwrap();
        toast.success("Material created");
      }
      closeModal();
      await refreshMaterials();
      onRequestReload?.();
    } catch (err: unknown) {
      setModalState((prev) => ({ ...prev, saving: false }));
      const message = err instanceof Error ? err.message : "Unable to save material";
      toast.error(message);
    }
  };

  const handleDelete = useCallback(async (materialId: number | string | null | undefined) => {
    if (!token || materialId == null) return;
    const confirmDelete = window.confirm("Delete this material?");
    if (!confirmDelete) return;
    try {
      await dispatch(deleteMaterial(String(materialId))).unwrap();
      toast.success("Material removed");
      refreshMaterials();
      onRequestReload?.();
    } catch (err: unknown) {
      toast.error("Unable to delete material");
    }
  }, [dispatch, onRequestReload, refreshMaterials, token]);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleExportClick = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const blob = await dispatch(exportMaterials()).unwrap();
      if (!blob) {
        toast.error("Nothing to export");
        return;
      }
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "materials.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Unable to export materials");
    } finally {
      setExporting(false);
    }
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!token) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await dispatch(importMaterials(file)).unwrap();
      toast.success("Materials imported");
      await refreshMaterials();
      onRequestReload?.();
    } catch (err) {
      toast.error("Unable to import materials");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const columns = React.useMemo<ColumnDef<Material>[]>(
    () => [
      { field: 'code', header: 'Code', width: 100, body: (r) => <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.code || '—'}</Typography> },
      { field: 'name', header: 'Material', body: (r) => <Typography variant="caption" sx={{ fontWeight: 500 }}>{r.name || '—'}</Typography> },
      { field: 'partNo', header: 'Part No', width: 100, body: (r) => r.partNo || '—' },
      { field: 'lineType', header: 'Line Type', width: 90, body: (r) => r.lineType || '—' },
      { field: 'unit', header: 'UOM', width: 60, body: (r) => r.unit || '—' },
      { field: 'category', header: 'Category', width: 100, body: (r) => <Chip label={r.category || '—'} size="small" sx={{ height: 18, fontSize: '0.65rem' }} /> },
      {
        field: 'id',
        header: 'Actions',
        align: 'right',
        width: 80,
        body: (r) => (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <IconButton size="small" onClick={() => openEditMaterial(r)} sx={{ color: 'primary.main' }} title="Edit">
              <FiEdit2 size={14} />
            </IconButton>
            <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: 'error.main' }} title="Delete">
              <FiTrash2 size={14} />
            </IconButton>
          </Stack>
        )
      }
    ],
    [handleDelete, openEditMaterial]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportChange} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Material Directory</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>Manage all materials and master data</Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={handleExportClick} disabled={exporting} title="Export data">
            <FiDownload size={14} />
          </IconButton>
          <IconButton size="small" onClick={handleImportClick} disabled={importing} title="Import data">
            <FiUpload size={14} />
          </IconButton>
          <CustomButton startIcon={<FiPlus size={14} />} onClick={openCreateMaterial}>Add Material</CustomButton>
        </Stack>
      </Stack>

      <Paper sx={{ borderRadius: 1, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <CustomTextField
                placeholder="Search materials..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                size="small"
                startAdornment={<FiSearch size={14} style={{ color: '#9ca3af' }} />}
              />
            </Box>
            <IconButton size="small" onClick={() => setFiltersOpen(!filtersOpen)} title={filtersOpen ? "Close Filters" : "Filters"}>
              {filtersOpen ? <FiX size={14} /> : <FiFilter size={14} />}
            </IconButton>
          </Stack>

          <Collapse in={filtersOpen}>
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomSelect
                    label="Line Type"
                    multiple
                    value={filters.lineTypes}
                    options={availableFilters.lineTypes.map(l => ({ label: l || "Unspecified", value: l }))}
                    onChange={(val: any) => { setFilters(prev => ({ ...prev, lineTypes: val })); setPage(0); }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomSelect
                    label="Category"
                    multiple
                    value={filters.categories}
                    options={availableFilters.categories.map(c => ({ label: c || "Uncategorized", value: c }))}
                    onChange={(val: any) => { setFilters(prev => ({ ...prev, categories: val })); setPage(0); }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <CustomSelect
                    label="Unit"
                    multiple
                    value={filters.units}
                    options={availableFilters.units.map(u => ({ label: u || "None", value: u }))}
                    onChange={(val: any) => { setFilters(prev => ({ ...prev, units: val })); setPage(0); }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" justifyContent="flex-end">
                    <CustomButton
                      variant="text"
                      size="small"
                      onClick={() => { setFilters({ categories: [], units: [], lineTypes: [] }); setPage(0); }}
                    >
                      Reset Filters
                    </CustomButton>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Box>

        <CustomTable
          data={materials}
          columns={columns}
          loading={loading}
          pagination
          rows={pageSize}
          page={page}
          totalRecords={totalItems}
          onPageChange={(p, rows) => { setPage(p); setPageSize(rows); }}
          rowsPerPageOptions={[10, 20, 50]}
          emptyMessage="No materials found"
        />
      </Paper >

      <CustomModal
        open={modalState.open}
        title={modalState.mode === "edit" ? "Edit Material" : "Add Material"}
        onClose={closeModal}
        footer={
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <CustomButton variant="text" onClick={closeModal}>Cancel</CustomButton>
            <CustomButton onClick={handleSubmit} disabled={modalState.saving}>{modalState.saving ? 'Saving...' : 'Save'}</CustomButton>
          </Stack>
        }
      >
        <Stack spacing={1.5}>
          {modalState.mode === 'edit' && (
            <CustomTextField label="Code" value={modalState.fields.code} disabled />
          )}
          <CustomTextField label="Material Name *" value={modalState.fields.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField label="Part No" value={modalState.fields.partNo} onChange={(e) => handleFieldChange('partNo', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField label="UOM" value={modalState.fields.unit} onChange={(e) => handleFieldChange('unit', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField label="Line Type" value={modalState.fields.lineType} onChange={(e) => handleFieldChange('lineType', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField label="Category" value={modalState.fields.category} onChange={(e) => handleFieldChange('category', e.target.value)} />
            </Grid>
          </Grid>
        </Stack>
      </CustomModal>
    </Box >
  );
};

export default MaterialDirectoryPage;
