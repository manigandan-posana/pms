import React, { useEffect, useState } from "react";
import { Box, Stack, Typography, Paper, Chip } from "@mui/material";
import { FiSearch } from "react-icons/fi";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomTextField from "../../widgets/CustomTextField";
import { Get } from "../../utils/apiService";

export interface WorkspaceMaterial {
  id: string | number;
  code?: string | null;
  name?: string | null;
  category?: string | null;
  unit?: string | null;
  [key: string]: unknown;
}

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
    { field: "code", header: "Code", body: (row) => <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.code}</Typography>, width: 120 },
    { field: "name", header: "Name" },
    { field: "category", header: "Category" },
    { field: "unit", header: "Unit", width: 80 },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          Material Master
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          Read-only view of backend controlled materials
        </Typography>
      </Box>

      {/* Content */}
      <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Box sx={{ flex: 1, maxWidth: 320 }}>
              <CustomTextField
                placeholder="Search by code, name or category"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                startAdornment={<FiSearch size={14} style={{ color: '#9ca3af' }} />}
              />
            </Box>
            <Chip label={`${totalItems} items`} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
          </Stack>
        </Box>

        <CustomTable
          data={materials}
          columns={columns}
          pagination
          rows={10}
          emptyMessage="No materials found."
        />
      </Paper>
    </Box>
  );
};

export default MasterPage;
