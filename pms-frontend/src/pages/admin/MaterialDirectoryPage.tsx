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
  const [pageSize, setPageSize] = useState<number>(10);

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
        token,
        query: {
          page: page + 1,
          size: pageSize,
          search,
          category: filters.categories,
          unit: filters.units,
          partNo: [], // partNumbers filtering not fully implemented in UI state map
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

  const openEditMaterial = (material: Material) => {
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
  };

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
            token,
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

  const handleDelete = async (materialId: number | string | null | undefined) => {
    if (!token || materialId == null) return;
    const confirmDelete = window.confirm("Delete this material?");
    if (!confirmDelete) return;
    try {
      await dispatch(deleteMaterial({ token, materialId: String(materialId) })).unwrap();
      toast.success("Material removed");
      refreshMaterials(); // No await on purpose to feel faster
      onRequestReload?.();
    } catch (err: unknown) {
      toast.error("Unable to delete material");
    }
  };

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

  const columns: ColumnDef<Material>[] = [
    { field: 'code', header: 'Code', width: '100px', body: (r) => <span className="font-mono font-bold text-slate-700">{r.code || '—'}</span> },
    { field: 'name', header: 'Material', body: (r) => <span className="font-medium text-slate-800">{r.name || '—'}</span> },
    { field: 'partNo', header: 'Part No', width: '120px', body: (r) => <span className="text-slate-600 text-xs">{r.partNo || '—'}</span> },
    { field: 'lineType', header: 'Line Type', width: '100px', body: (r) => <span className="text-slate-600">{r.lineType || '—'}</span> },
    { field: 'unit', header: 'UOM', width: '80px', body: (r) => <span className="text-slate-500">{r.unit || '—'}</span> },
    { field: 'category', header: 'Category', width: '120px', body: (r) => <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{r.category || '—'}</span> },
    {
      field: 'id',
      header: 'Actions',
      align: 'right',
      width: '100px',
      body: (r) => (
        <div className="flex justify-end gap-1">
          <CustomButton variant="text" size="small" onClick={() => openEditMaterial(r)} className="text-blue-500 hover:bg-blue-50 p-1 min-w-0" title="Edit"><FiEdit2 /></CustomButton>
          <CustomButton variant="text" size="small" onClick={() => handleDelete(r.id)} className="text-red-500 hover:bg-red-50 p-1 min-w-0" title="Delete"><FiTrash2 /></CustomButton>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportChange} />

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-col gap-4 sticky top-0 bg-slate-50 z-10 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xs font-bold text-slate-800">Material Directory</h1>
              <p className="text-slate-500">Manage all materials and master data</p>
            </div>
            <div className="flex items-center gap-2">
              <CustomButton variant="outlined" onClick={handleExportClick} startIcon={<FiDownload />} loading={exporting}>Export</CustomButton>
              <CustomButton variant="outlined" onClick={handleImportClick} startIcon={<FiUpload />} loading={importing}>Import</CustomButton>
              <CustomButton onClick={openCreateMaterial} startIcon={<FiPlus />}>Add Material</CustomButton>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <CustomTextField
                placeholder="Search materials..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                size="small"
                InputProps={{ startAdornment: <FiSearch className="text-slate-400 mr-2" /> }}
              />
            </div>
            <CustomButton
              variant={filtersOpen ? "secondary" : "text"}
              onClick={() => setFiltersOpen(!filtersOpen)}
              size="small"
              startIcon={filtersOpen ? <FiX /> : <FiFilter />}
            >
              {filtersOpen ? "Close Filters" : "Filters"}
            </CustomButton>
          </div>

          {filtersOpen && (
            <div className="grid gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:grid-cols-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <CustomSelect
                label="Line Type"
                multiple
                value={filters.lineTypes}
                options={availableFilters.lineTypes.map(l => ({ label: l || "Unspecified", value: l }))}
                onChange={(val: any) => { setFilters(prev => ({ ...prev, lineTypes: val })); setPage(0); }}
              />
              <CustomSelect
                label="Category"
                multiple
                value={filters.categories}
                options={availableFilters.categories.map(c => ({ label: c || "Uncategorized", value: c }))}
                onChange={(val: any) => { setFilters(prev => ({ ...prev, categories: val })); setPage(0); }}
              />
              <CustomSelect
                label="Unit"
                multiple
                value={filters.units}
                options={availableFilters.units.map(u => ({ label: u || "None", value: u }))}
                onChange={(val: any) => { setFilters(prev => ({ ...prev, units: val })); setPage(0); }}
              />
              <div className="md:col-span-3 flex justify-end">
                <CustomButton variant="text" size="small" onClick={() => { setFilters({ categories: [], units: [], lineTypes: [] }); setPage(0); }}>Reset Filters</CustomButton>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
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
        </div>
      </div>

      <CustomModal
        open={modalState.open}
        title={modalState.mode === "edit" ? "Edit Material" : "Add Material"}
        onClose={closeModal}
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="text" onClick={closeModal}>Cancel</CustomButton>
            <CustomButton onClick={handleSubmit} loading={modalState.saving} disabled={modalState.saving}>{modalState.saving ? 'Saving...' : 'Save'}</CustomButton>
          </div>
        }
      >
        <div className="grid gap-4 py-2">
          {modalState.mode === 'edit' && (
            <CustomTextField label="Code" value={modalState.fields.code} disabled />
          )}
          <CustomTextField label="Material Name *" value={modalState.fields.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <CustomTextField label="Part No" value={modalState.fields.partNo} onChange={(e) => handleFieldChange('partNo', e.target.value)} />
            <CustomTextField label="UOM" value={modalState.fields.unit} onChange={(e) => handleFieldChange('unit', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CustomTextField label="Line Type" value={modalState.fields.lineType} onChange={(e) => handleFieldChange('lineType', e.target.value)} />
            <CustomTextField label="Category" value={modalState.fields.category} onChange={(e) => handleFieldChange('category', e.target.value)} />
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default MaterialDirectoryPage;
