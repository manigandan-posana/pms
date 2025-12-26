
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomTextField from "../../widgets/CustomTextField";
import { Get } from "../../utils/apiService";
import { Box, Stack, Typography, Paper } from "@mui/material";


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

interface BomPageProps {
  projectId?: string | number;
}

const BomPage: React.FC<BomPageProps> = ({ projectId: propProjectId }) => {
  const { selectedProjectId: reduxProjectId } = useSelector<
    RootState,
    WorkspaceSliceState
  >((state) => state.workspace as unknown as WorkspaceSliceState);

  // Use the prop if provided, otherwise fall back to the global selection
  const activeProjectId = propProjectId || reduxProjectId;

  const [search, setSearch] = useState<string>("");
  const [rows, setRows] = useState<BomRow[]>([]);

  useEffect(() => {
    const loadBom = async () => {
      // If no project is identified, clear the rows and return
      if (!activeProjectId) {
        setRows([]);
        return;
      }
      try {
        const response = await Get<BomRow[]>(`/app/projects/${activeProjectId}/bom`, {
          search: search.trim() || undefined,
        });
        setRows(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Failed to load BOM", err);
        setRows([]);
      }
    };
    loadBom();
  }, [search, activeProjectId]);

  const columns: ColumnDef<BomRow>[] = [
    {
      field: 'code',
      header: 'Code',
      width: 100,
      body: (row) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {row.code || "—"}
        </Typography>
      )
    },
    { field: 'name', header: 'Material', body: (row) => row.name || "—" },
    { field: 'category', header: 'Category', body: (row) => row.category || "—" },
    {
      field: 'allocatedQty',
      header: 'Allocated',
      align: 'right',
      width: 80,
      body: (row) => (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {(row.allocatedQty ?? row.requiredQty ?? row.qty ?? 0).toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'orderedQty',
      header: 'Ordered',
      align: 'right',
      width: 80,
      body: (row) => (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {(row.orderedQty ?? 0).toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'receivedQty',
      header: 'Received',
      align: 'right',
      width: 80,
      body: (row) => (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {(row.receivedQty ?? 0).toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'utilizedQty',
      header: 'Issued',
      align: 'right',
      width: 80,
      body: (row) => (
        <Typography variant="caption" sx={{ fontWeight: 500 }}>
          {(row.utilizedQty ?? 0).toLocaleString()}
        </Typography>
      )
    },
    {
      field: 'balanceQty',
      header: 'In Stock',
      align: 'right',
      width: 80,
      body: (row) => (
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {(row.balanceQty ?? 0).toLocaleString()}
        </Typography>
      )
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Paper sx={{ p: 1, borderRadius: 1, boxShadow: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 1 }}>
          <Box sx={{ width: { xs: '100%', sm: 300 } }}>
            <CustomTextField
              placeholder="Search material, code or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {rows.length} items
          </Typography>
        </Stack>

        <CustomTable
          data={rows}
          columns={columns}
          pagination
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          emptyMessage="No materials available for this project yet."
        />
      </Paper>
    </Box>
  );
};

export default BomPage;
