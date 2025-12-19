import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiCheck, FiCircle, FiFilter, FiPlus, FiSearch, FiTrash2, FiEye, FiEdit2, FiX, FiCheckCircle
} from "react-icons/fi";

import {
  createProjectAllocations,
  deleteProjectAllocation,
  fetchProjectBom,
  updateProjectAllocation,
} from "../store/slices/adminAllocationsSlice";
import type { RootState, AppDispatch } from "../store/store";

import CustomTable, { type ColumnDef } from "../widgets/CustomTable";
import CustomButton from "../widgets/CustomButton";
import CustomModal from "../widgets/CustomModal";
import CustomTextField from "../widgets/CustomTextField";
import CustomSelect from "../widgets/CustomSelect";

/* ---------- Domain Types ---------- */

export interface Material {
  id: string | number;
  code?: string;
  name?: string;
  partNo?: string;
  unit?: string;
  category?: string;
  lineType?: string;
}

export interface Project {
  id: string | number;
  code?: string;
  name?: string;
}

export interface AllocationLine {
  projectId: string | number;
  materialId: string | number;
  qty?: number;
  code?: string;
  name?: string;
  partNo?: string;
  lineType?: string;
  unit?: string;
  category?: string;
}

export interface AllocationWithMaterial extends AllocationLine {
  materialRef?: Material;
}

export interface AllocationInputLine {
  materialId: string;
  quantity: number;
}

import type { BomLine } from "../store/slices/adminAllocationsSlice";
interface AdminAllocationsState {
  bomByProject: Record<string, BomLine[]>;
  bomStatusByProject: Record<string, string>;
  error: string;
}

/* ---------- Helpers & Small Types ---------- */

const normalizeId = (
  value: string | number | null | undefined
): string => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
};

type AllocationFormMode = "create" | "edit";

interface AllocationFormState {
  open: boolean;
  mode: AllocationFormMode;
  materialId: string;
  quantity: string;
  saving: boolean;
  line: AllocationWithMaterial | null;
}

interface ViewModalState {
  open: boolean;
  line: AllocationWithMaterial | null;
}

interface SelectedLine {
  quantity: number;
  material: Material;
}

type SelectedLinesMap = Record<string, SelectedLine>;

interface QuantityModalState {
  open: boolean;
  material: Material | null;
  quantity: number | null;
}

interface MultiFiltersState {
  category: string;
  lineType: string;
}

interface AllocationFilters {
  categories: string[];
  lineTypes: string[];
  status: "all" | "allocated" | "unallocated";
}

const getLineQty = (line: any): number => {
  if (typeof line?.qty === "number") return Number(line.qty);
  if (typeof line?.quantity === "number") return Number(line.quantity);
  if (typeof line?.requiredQty === "number") return Number(line.requiredQty);
  if (typeof line?.allocatedQty === "number") return Number(line.allocatedQty);
  return 0;
};

/* ---------- MultiAllocationPanel ---------- */

interface MultiAllocationPanelProps {
  projectId: string;
  materials: Material[];
  allocatedMaterialIds: Set<string>;
  onSaveLines?: (lines: AllocationInputLine[]) => Promise<void> | void;
}

function MultiAllocationPanel({
  projectId,
  materials,
  allocatedMaterialIds,
  onSaveLines,
}: MultiAllocationPanelProps) {
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<MultiFiltersState>({
    category: "",
    lineType: "",
  });

  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedLines, setSelectedLines] = useState<SelectedLinesMap>({});
  const [modalState, setModalState] = useState<QuantityModalState>({
    open: false,
    material: null,
    quantity: null,
  });
  const [saving, setSaving] = useState<boolean>(false);

  const categoryOptions = useMemo(() =>
    Array.from(new Set(materials.map((m) => m.category).filter((cat): cat is string => Boolean(cat)))).sort()
    , [materials]);

  const lineTypeOptions = useMemo(() =>
    Array.from(new Set(materials.map((m) => m.lineType).filter((lt): lt is string => Boolean(lt)))).sort()
    , [materials]);

  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return materials
      .filter((m) => !allocatedMaterialIds.has(String(m.id)))
      .filter((m) => {
        if (filters.category && m.category !== filters.category) return false;
        if (filters.lineType && m.lineType !== filters.lineType) return false;
        if (!q) return true;
        return (
          (m.code || "").toLowerCase().includes(q) ||
          (m.name || "").toLowerCase().includes(q) ||
          (m.partNo || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.code || "").localeCompare(b.code || ""));
  }, [materials, allocatedMaterialIds, search, filters]);

  // Use CustomTable internal pagination via data prop
  // But we need to pass selected state for checkmarks.
  // CustomTable rows don't easily access external state unless we wrap the row or data.
  // We can inject _selected into data passed to CustomTable?
  // Yes, let's prepare the data.

  const tableData = useMemo(() => {
    return filteredMaterials.map(m => {
      const key = String(m.id);
      const existing = selectedLines[key];
      return {
        ...m,
        _selected: !!existing,
        _quantity: existing ? existing.quantity : 0
      };
    });
  }, [filteredMaterials, selectedLines]);

  const totalQty = useMemo(() =>
    Object.values(selectedLines).reduce((sum, s) => sum + Number(s.quantity || 0), 0)
    , [selectedLines]);

  const selectedCount = Object.keys(selectedLines).length; // Fix: was using Object.keys(selectedLines).length but missed

  const openModalForMaterial = (material: Material) => {
    const key = String(material.id);
    const existing = selectedLines[key];
    setModalState({
      open: true,
      material,
      quantity: existing ? existing.quantity : null,
    });
  };

  const handleSaveModal = () => {
    if (!modalState.material) return;
    const raw = modalState.quantity ?? 0;
    const quantity = Number(raw);
    const key = String(modalState.material.id);

    setSelectedLines((prev) => {
      const next: SelectedLinesMap = { ...prev };
      if (!quantity || quantity <= 0 || Number.isNaN(quantity)) {
        delete next[key];
      } else {
        next[key] = {
          quantity,
          material: modalState.material as Material,
        };
      }
      return next;
    });
    setModalState({ open: false, material: null, quantity: null });
  };

  const handleSubmitAll = async () => {
    if (!projectId) {
      toast.error("Select a project first");
      return;
    }
    if (!onSaveLines) return;
    const entries = Object.entries(selectedLines);
    if (entries.length === 0) {
      toast.error("Select at least one material to allocate");
      return;
    }
    setSaving(true);
    try {
      await onSaveLines(entries.map(([materialId, data]) => ({ materialId, quantity: data.quantity })));
      setSelectedLines({});
    } catch (err: any) {
      toast.error(err?.message || "Failed to allocate materials");
    } finally {
      setSaving(false);
    }
  };

  if (!projectId) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
        Select a project above to see materials available for allocation.
      </div>
    );
  }

  const columns: ColumnDef<any>[] = [
    {
      field: 'id',
      header: '',
      width: '50px',
      align: 'center',
      body: (row) => row._selected ? <FiCheckCircle className="text-emerald-500" size={18} /> : <FiCircle className="text-slate-300" size={18} />
    },
    { field: 'code', header: 'Code', body: (row) => <span className="font-mono text-slate-700 font-semibold">{row.code || '—'}</span> },
    { field: 'name', header: 'Material', body: (row) => <span className="text-slate-800">{row.name || '—'}</span> },
    { field: 'partNo', header: 'Part No', body: (row) => <span className="text-slate-600 text-xs">{row.partNo || '—'}</span> },
    { field: 'category', header: 'Category', body: (row) => <span className="text-slate-600">{row.category || '—'}</span> },
    { field: 'unit', header: 'UOM', width: '80px', body: (row) => <span className="text-slate-500">{row.unit || '—'}</span> },
    {
      field: '_quantity',
      header: 'Req. Qty',
      align: 'right',
      body: (row) => row._selected ? <span className="font-bold text-emerald-600">{Number(row._quantity).toLocaleString()}</span> : <span className="text-slate-300">—</span>
    }
  ];

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800">Assign Materials</h3>
            <p className="text-slate-500 text-xs">Select materials to allocate to this project</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100">
                {selectedCount} selected ({totalQty.toLocaleString()} qty)
              </div>
            )}
            <CustomButton
              variant="secondary"
              size="small"
              onClick={() => setSelectedLines({})}
              disabled={selectedCount === 0 || saving}
            >
              Clear
            </CustomButton>
            <CustomButton
              onClick={handleSubmitAll}
              loading={saving}
              disabled={selectedCount === 0 || saving}
            >
              Allocate Selected
            </CustomButton>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <CustomTextField
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <FiSearch className="text-slate-400 mr-2" /> }}
            />
          </div>
          <CustomSelect
            label="Line Type"
            value={filters.lineType}
            options={[{ label: 'All', value: '' }, ...lineTypeOptions.map(l => ({ label: l, value: l }))]}
            onChange={(e) => setFilters(prev => ({ ...prev, lineType: e.target.value }))}
          />
          <CustomSelect
            label="Category"
            value={filters.category}
            options={[{ label: 'All', value: '' }, ...categoryOptions.map(c => ({ label: c, value: c }))]}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <CustomTable
          data={tableData}
          columns={columns}
          pagination
          rows={pageSize}
          page={page}
          totalRecords={tableData.length} // Client side filtering
          onPageChange={(p, rows) => { setPage(p); setPageSize(rows); }}
          rowsPerPageOptions={[10, 20, 50]}
          onRowClick={(row) => openModalForMaterial(row)}
          emptyMessage="No available materials found"
        />
      </div>

      <CustomModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, material: null, quantity: null })}
        title={modalState.material ? `Set Quantity: ${modalState.material.name}` : 'Set Quantity'}
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="text" onClick={() => setModalState({ open: false, material: null, quantity: null })}>Cancel</CustomButton>
            <CustomButton onClick={handleSaveModal}>Save</CustomButton>
          </div>
        }
      >
        <div className="py-2">
          <CustomTextField
            label="Required Quantity"
            type="number"
            value={modalState.quantity ?? ''}
            onChange={(e) => setModalState(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
            placeholder="Enter quantity..."
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-2">Set to 0 to deselect.</p>
        </div>
      </CustomModal>
    </div>
  );
}

/* ---------- Main ProjectAllocationManager ---------- */

interface ProjectAllocationManagerProps {
  token?: string | null;
  projects?: Project[];
  materials?: Material[];
  defaultProjectId?: string | number | null;
  onBack?: () => void;
  onProjectBomUpdate?: (projectId: string) => void;
  onCreateMaterial?: () => void;
  showMultiAllocator?: boolean;
  showAllocationTable?: boolean;
}

const emptyFormState: AllocationFormState = { open: false, mode: "create", materialId: "", quantity: "", saving: false, line: null };
const emptyViewState: ViewModalState = { open: false, line: null };

const ProjectAllocationManager: React.FC<ProjectAllocationManagerProps> = ({
  token, projects = [], materials = [], defaultProjectId, onBack, onProjectBomUpdate, onCreateMaterial, showMultiAllocator = true, showAllocationTable = true,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const storeToken = useSelector((state: RootState) => state.auth.token);
  const { bomByProject, bomStatusByProject, error } = useSelector((state: RootState) => state.adminAllocations as AdminAllocationsState);
  const resolvedToken = token || storeToken || undefined;

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => normalizeId(defaultProjectId ?? projects[0]?.id));
  const [search, setSearch] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [allocationFilters, setAllocationFilters] = useState<AllocationFilters>({ categories: [], lineTypes: [], status: "all" });

  const [formModal, setFormModal] = useState<AllocationFormState>(emptyFormState);
  const [viewModal, setViewModal] = useState<ViewModalState>(emptyViewState);
  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(new Set());

  // ... (Project sorting logic reuse)
  const sortedProjects = useMemo(() => [...projects].sort((a, b) => (a.code || "").localeCompare(b.code || "")), [projects]);

  useEffect(() => {
    if (sortedProjects.length > 0 && !selectedProjectId) setSelectedProjectId(normalizeId(sortedProjects[0].id));
  }, [sortedProjects, selectedProjectId]);

  useEffect(() => { if (defaultProjectId) setSelectedProjectId(normalizeId(defaultProjectId)); }, [defaultProjectId]);

  const allocations: AllocationLine[] = selectedProjectId ? (bomByProject[selectedProjectId] as unknown as AllocationLine[]) || [] : [];

  const materialsMap = useMemo(() => {
    const map = new Map<string, Material>();
    materials.forEach((m) => { if (m?.id !== undefined) map.set(String(m.id), m); });
    return map;
  }, [materials]);

  const refreshBom = useCallback(async (pid: string) => {
    if (!resolvedToken || !pid) return;
    try { await dispatch(fetchProjectBom({ token: resolvedToken, projectId: pid })).unwrap(); }
    catch (err) { console.error(err); }
  }, [dispatch, resolvedToken]);

  useEffect(() => { if (selectedProjectId) void refreshBom(selectedProjectId); }, [refreshBom, selectedProjectId]);

  const allocatedMaterialIds = useMemo(() => new Set(allocations.map(l => String(l.materialId))), [allocations]);

  const filteredAllocations = useMemo(() => {
    // Filter logic applied to allocations
    // ... reuse existing logic simplified
    let res = allocations.map(line => ({
      ...line,
      code: line.code ?? materialsMap.get(String(line.materialId))?.code ?? "",
      name: line.name ?? materialsMap.get(String(line.materialId))?.name ?? "",
      materialRef: materialsMap.get(String(line.materialId))
    } as AllocationWithMaterial));

    if (search) {
      const q = search.toLowerCase();
      res = res.filter(l => (l.code || "").toLowerCase().includes(q) || (l.name || "").toLowerCase().includes(q));
    }
    return res;
  }, [allocations, search, materialsMap]);

  // Handlers
  const handleSaveLines = useCallback(async (lines: AllocationInputLine[]) => {
    if (!resolvedToken || !selectedProjectId) return;
    await dispatch(createProjectAllocations({
      token: resolvedToken,
      projectId: selectedProjectId,
      lines: lines.map(line => ({ materialId: String(line.materialId), quantity: line.quantity }))
    })).unwrap();
    toast.success("Materials allocated");
    await refreshBom(selectedProjectId);
    onProjectBomUpdate?.(selectedProjectId);
  }, [dispatch, resolvedToken, selectedProjectId, refreshBom, onProjectBomUpdate]);

  const handleDelete = async (line: AllocationWithMaterial) => {
    if (!resolvedToken || !selectedProjectId || !line.materialId) return;
    if (!window.confirm("Remove allocation?")) return;
    await dispatch(deleteProjectAllocation({ token: resolvedToken, projectId: selectedProjectId, materialId: line.materialId })).unwrap();
    toast.success("Removed");
    refreshBom(selectedProjectId);
  };

  const handleEditAllocation = (line: AllocationWithMaterial) => {
    setFormModal({
      open: true,
      mode: "edit",
      materialId: String(line.materialId),
      quantity: String(getLineQty(line)),
      saving: false,
      line: line,
    });
  };

  const handleSaveForm = async () => {
    if (!resolvedToken || !selectedProjectId) return;
    const qty = Number(formModal.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    setFormModal(prev => ({ ...prev, saving: true }));
    try {
      if (formModal.mode === "edit" && formModal.materialId) {
        await dispatch(updateProjectAllocation({
          projectId: selectedProjectId,
          materialId: formModal.materialId,
          payload: { quantity: qty }
        })).unwrap();
        toast.success("Updated");
      }
      setFormModal(emptyFormState);
      await refreshBom(selectedProjectId);
      onProjectBomUpdate?.(selectedProjectId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setFormModal(prev => ({ ...prev, saving: false }));
    }
  };

  // Columns for Allocated Table
  const allocColumns: ColumnDef<AllocationWithMaterial>[] = [
    { field: 'code', header: 'Code', body: (r) => <span className="font-mono text-slate-700">{r.code || '—'}</span> },
    { field: 'name', header: 'Material', body: (r) => <span className="font-medium text-slate-800">{r.name || '—'}</span> },
    { field: 'qty', header: 'Required Qty', align: 'right', body: (r) => <span className="font-bold text-slate-700">{Number(getLineQty(r)).toLocaleString()}</span> },
    {
      field: 'id', header: 'Actions', align: 'right', width: '150px',
      body: (r) => (
        <div className="flex justify-end gap-1">
          <CustomButton variant="text" size="small" onClick={() => handleEditAllocation(r)} className="text-blue-600 hover:bg-blue-50 p-1 min-w-0" title="Edit quantity"><FiEdit2 /></CustomButton>
          <CustomButton variant="text" size="small" onClick={() => handleDelete(r)} className="text-red-500 hover:bg-red-50 p-1 min-w-0" title="Remove allocation"><FiTrash2 /></CustomButton>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 justify-between">
        <div className="flex flex-col gap-1 min-w-[300px] flex-1 max-w-md">
          <CustomSelect
            label="Select Project"
            value={selectedProjectId}
            options={sortedProjects.map(p => ({ label: `${p.code} - ${p.name}`, value: String(p.id) }))}
            onChange={(value) => setSelectedProjectId(value)}
            size="small"
          />
        </div>
        {showAllocationTable && (
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <CustomTextField
              placeholder="Search allocations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <FiSearch className="text-slate-400 mr-2" /> }}
            />
          </div>
        )}
      </div>

      {showMultiAllocator && (
        <MultiAllocationPanel
          projectId={selectedProjectId}
          materials={materials}
          allocatedMaterialIds={allocatedMaterialIds}
          onSaveLines={handleSaveLines}
        />
      )}

      {showAllocationTable && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Current Allocations</h3>
          </div>
          <CustomTable
            data={filteredAllocations}
            columns={allocColumns}
            pagination
            rows={10}
            emptyMessage="No allocated materials yet"
          />
        </div>
      )}

      {/* Edit Allocation Modal */}
      <CustomModal
        open={formModal.open && formModal.mode === "edit"}
        onClose={() => setFormModal(emptyFormState)}
        title={formModal.line ? `Edit Allocation: ${formModal.line.name}` : "Edit Allocation"}
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="text" onClick={() => setFormModal(emptyFormState)} disabled={formModal.saving}>Cancel</CustomButton>
            <CustomButton onClick={handleSaveForm} loading={formModal.saving} disabled={formModal.saving}>Update</CustomButton>
          </div>
        }
      >
        <div className="py-2">
          {formModal.line && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-xs text-slate-500 space-y-1">
                <div><span className="font-semibold">Code:</span> {formModal.line.code}</div>
                <div><span className="font-semibold">Material:</span> {formModal.line.name}</div>
                <div><span className="font-semibold">Unit:</span> {formModal.line.unit || '—'}</div>
              </div>
            </div>
          )}
          <CustomTextField
            label="Required Quantity *"
            type="number"
            value={formModal.quantity}
            onChange={(e) => setFormModal(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="Enter quantity..."
            autoFocus
            required
          />
        </div>
      </CustomModal>
    </div>
  );
};

export default ProjectAllocationManager;
