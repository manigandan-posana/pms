
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomTextField from "../../widgets/CustomTextField";

// ---- Types ---- //
export interface WorkspaceMaterial {
  id: string | number;
  code?: string | null;
  name?: string | null;
  category?: string | null;
  unit?: string | null;
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

  const filteredMaterials = useMemo<WorkspaceMaterial[]>(() => {
    if (!search.trim()) return materials;
    const term = search.toLowerCase();
    return materials.filter(
      (m) =>
        m.code?.toLowerCase().includes(term) ||
        m.name?.toLowerCase().includes(term) ||
        m.category?.toLowerCase().includes(term)
    );
  }, [materials, search]);

  const columns: ColumnDef<WorkspaceMaterial>[] = [
    { field: "code", header: "Code", body: (row) => <span className="font-mono text-xs">{row.code}</span>, width: 150 },
    { field: "name", header: "Name" },
    { field: "category", header: "Category" },
    { field: "unit", header: "Unit" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xs font-semibold text-slate-800">Material Master</h1>
        <p className="text-xs text-slate-500">
          Read-only view of backend controlled materials.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="w-full max-w-xs">
            <CustomTextField
              placeholder="Search by code, name or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
            />
          </div>
          <div className="text-xs text-slate-500">{filteredMaterials.length} items</div>
        </div>

        <CustomTable
          data={filteredMaterials}
          columns={columns}
          pagination
          rows={10}
          emptyMessage="No materials found."
        />
      </div>
    </div>
  );
};

export default MasterPage;
