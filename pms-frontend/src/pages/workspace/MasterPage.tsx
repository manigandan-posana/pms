import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import PaginationControls from "../../components/PaginationControls";
import usePagination from "../../hooks/usePagination";
import type { RootState } from "../../store/store";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';

// ---- Types ---- //

export interface WorkspaceMaterial {
  id: string | number;
  code?: string | null;
  name?: string | null;
  category?: string | null;
  unit?: string | null;
  // allow any additional backend fields without breaking the UI
  [key: string]: unknown;
}

interface WorkspaceStateSlice {
  materials: WorkspaceMaterial[];
}

// ---- Component ---- //

const MasterPage: React.FC = () => {
  const { materials } = useSelector<RootState, WorkspaceStateSlice>(
    (state) => state.workspace as unknown as WorkspaceStateSlice
  );

  const [search, setSearch] = useState<string>("");

  const rows = useMemo<WorkspaceMaterial[]>(() => {
    if (!search.trim()) return materials;
    const term = search.toLowerCase();
    return materials.filter(
      (m) =>
        m.code?.toLowerCase().includes(term) ||
        m.name?.toLowerCase().includes(term) ||
        m.category?.toLowerCase().includes(term)
    );
  }, [materials, search]);

  const {
    page,
    pageSize,
    totalItems,
    totalPages,
    currentItems,
    setPage,
    setPageSize,
  } = usePagination<WorkspaceMaterial>(rows, 10);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xs font-semibold text-slate-800">Material master</h1>
        <p className="text-xs text-slate-500">
          Read-only view of backend controlled materials.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex flex-col gap-1 text-xs text-slate-700">
            Search
            <InputText value={search} onChange={(e) => setSearch((e.target as HTMLInputElement).value)} />
          </label>
          <div className="text-xs text-slate-500">{rows.length} items</div>
        </div>
        <div className="overflow-x-auto">
          <DataTable value={currentItems} dataKey="id" className="min-w-full text-xs">
            <Column header="Code" field="code" body={(row: any) => <span className="font-mono">{row.code}</span>} style={{ width: "150px", minWidth: "150px" }} />
            <Column header="Name" field="name" />
            <Column header="Category" field="category" />
            <Column header="Unit" field="unit" />
          </DataTable>
          {rows.length === 0 && (
            <div className="border border-slate-200 px-3 py-6 text-center text-slate-500">No materials found.</div>
          )}
        </div>
        <div className="mt-3">
          <PaginationControls
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>
    </div>
  );
};

export default MasterPage;
