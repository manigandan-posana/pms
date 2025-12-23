
import React, { useEffect, useState } from "react";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomTextField from "../../widgets/CustomTextField";
import { Get } from "../../utils/apiService";

// ---- Types ---- //
export interface WorkspaceMaterial {
  id: string | number;
  code?: string | null;
  name?: string | null;
  category?: string | null;
  unit?: string | null;
  [key: string]: unknown;
}

// ---- Component ---- //
const MasterPage: React.FC = () => {
  const [materials, setMaterials] = useState<WorkspaceMaterial[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const loadMaterials = async () => {
      const response = await Get<any>("/materials/search", {
        page: 1,
        size: 1000,
        search: search.trim() || undefined,
      });
      const content = (response?.content ?? []) as WorkspaceMaterial[];
      setMaterials(content);
      setTotalItems(response?.totalElements ?? content.length);
    };
    loadMaterials();
  }, [search]);

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
          <div className="text-xs text-slate-500">{totalItems} items</div>
        </div>

        <CustomTable
          data={materials}
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
