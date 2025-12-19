
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomTextField from "../../widgets/CustomTextField";


// ---- Types ---- //

export interface WorkspaceProject {
  id: string | number;
  code: string;
  name: string;
}

export interface BomRow {
  projectId: string | number;
  materialRef?: string | number | null;
  code?: string | null;
  name?: string | null;
  category?: string | null;
  allocatedQty?: number | null;
  requiredQty?: number | null;
  qty?: number | null;
  orderedQty?: number | null;
  receivedQty?: number | null;
  utilizedQty?: number | null;
  balanceQty?: number | null;
}

export interface WorkspaceSliceState {
  assignedProjects: WorkspaceProject[];
  selectedProjectId: string | null;
  bomByProject: Record<string, BomRow[]>;
}

// ---- Main page ---- //

const BomPage: React.FC = () => {
  const { selectedProjectId, bomByProject } = useSelector<
    RootState,
    WorkspaceSliceState
  >((state) => state.workspace as unknown as WorkspaceSliceState);

  const [search, setSearch] = useState<string>("");

  const rows = useMemo<BomRow[]>(() => {
    const bom =
      (selectedProjectId && bomByProject?.[selectedProjectId]) || [];

    if (!search.trim()) return bom;

    const term = search.toLowerCase();
    return bom.filter(
      (row) =>
        row.code?.toLowerCase().includes(term) ||
        row.name?.toLowerCase().includes(term) ||
        row.category?.toLowerCase().includes(term)
    );
  }, [bomByProject, search, selectedProjectId]);

  const columns: ColumnDef<BomRow>[] = [
    {
      field: 'code',
      header: 'Code',
      body: (row) => row.code || "—",
      style: { fontFamily: 'monospace' }
    },
    { field: 'name', header: 'Material', body: (row) => row.name || "—" },
    { field: 'category', header: 'Category', body: (row) => row.category || "—" },
    {
      field: 'allocatedQty',
      header: 'Allocated',
      align: 'right',
      body: (row) => (row.allocatedQty ?? row.requiredQty ?? row.qty ?? 0).toLocaleString()
    },
    {
      field: 'orderedQty',
      header: 'Ordered',
      align: 'right',
      body: (row) => (row.orderedQty ?? 0).toLocaleString()
    },
    {
      field: 'receivedQty',
      header: 'Received',
      align: 'right',
      body: (row) => (row.receivedQty ?? 0).toLocaleString()
    },
    {
      field: 'utilizedQty',
      header: 'Issued',
      align: 'right',
      body: (row) => (row.utilizedQty ?? 0).toLocaleString()
    },
    {
      field: 'balanceQty',
      header: 'In Stock',
      align: 'right',
      body: (row) => (row.balanceQty ?? 0).toLocaleString()
    },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="w-full max-w-xs">
            <CustomTextField
              placeholder="Search material, code or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {rows.length} items
          </div>
        </div>

        <CustomTable
          data={rows}
          columns={columns}
          pagination
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          emptyMessage="No materials available for this project yet."
        />
      </div>
    </div>
  );
};

export default BomPage;

