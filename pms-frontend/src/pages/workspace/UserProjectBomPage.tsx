import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomTextField from "../../widgets/CustomTextField";
import { Get } from "../../utils/apiService";
import { Box, Stack, Typography, Paper, Chip } from "@mui/material";

// ---- Types ---- //

export interface BomRow {
    id?: string | null;
    projectId?: string | null;
    materialId?: string | null;
    code?: string | null;
    name?: string | null;
    partNo?: string | null;
    lineType?: string | null;
    unit?: string | null;
    category?: string | null;
    allocatedQty?: number | null;
    requiredQty?: number | null;
    orderedQty?: number | null;
    receivedQty?: number | null;
    utilizedQty?: number | null;
    balanceQty?: number | null;
}

export interface ProjectInfo {
    id: string;
    code: string;
    name: string;
    projectManager?: string;
}

// ---- Main page ---- //

const UserProjectBomPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [search, setSearch] = useState<string>("");
    const [rows, setRows] = useState<BomRow[]>([]);
    const [project, setProject] = useState<ProjectInfo | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadData = async () => {
            if (!projectId) {
                setRows([]);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);

                // Load project info
                const projects = await Get<ProjectInfo[]>("/app/projects");
                const currentProject = projects.find((p) => p.id === projectId);
                setProject(currentProject || null);

                // Load BOM data
                const response = await Get<BomRow[]>(`/app/projects/${projectId}/bom`, {
                    search: search.trim() || undefined,
                });
                setRows(Array.isArray(response) ? response : []);
            } catch (err) {
                console.error("Failed to load BOM", err);
                setRows([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [search, projectId]);

    const getStockStatus = (balance: number, allocated: number) => {
        if (balance <= 0) return { label: "Out of Stock", color: "error" as const };
        if (balance < allocated * 0.2) return { label: "Low Stock", color: "warning" as const };
        return { label: "In Stock", color: "success" as const };
    };

    const columns: ColumnDef<BomRow>[] = [
        {
            field: "code",
            header: "Code",
            width: 100,
            body: (row) => (
                <Typography
                    variant="caption"
                    sx={{ fontFamily: "monospace", fontWeight: 600 }}
                >
                    {row.code || "—"}
                </Typography>
            ),
        },
        {
            field: "name",
            header: "Material",
            body: (row) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {row.name || "—"}
                    </Typography>
                    {row.partNo && (
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Part No: {row.partNo}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: "category",
            header: "Category",
            width: 120,
            body: (row) => row.category || "—",
        },
        {
            field: "unit",
            header: "Unit",
            width: 80,
            body: (row) => row.unit || "—",
        },
        {
            field: "allocatedQty",
            header: "Allocated",
            align: "right",
            width: 90,
            body: (row) => (
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {(row.allocatedQty ?? row.requiredQty ?? 0).toLocaleString()}
                </Typography>
            ),
        },
        {
            field: "orderedQty",
            header: "Ordered",
            align: "right",
            width: 90,
            body: (row) => (
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {(row.orderedQty ?? 0).toLocaleString()}
                </Typography>
            ),
        },
        {
            field: "receivedQty",
            header: "Received",
            align: "right",
            width: 90,
            body: (row) => (
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {(row.receivedQty ?? 0).toLocaleString()}
                </Typography>
            ),
        },
        {
            field: "utilizedQty",
            header: "Issued",
            align: "right",
            width: 90,
            body: (row) => (
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {(row.utilizedQty ?? 0).toLocaleString()}
                </Typography>
            ),
        },
        {
            field: "balanceQty",
            header: "In Stock",
            align: "right",
            width: 90,
            body: (row) => {
                const balance = row.balanceQty ?? 0;
                const allocated = row.allocatedQty ?? row.requiredQty ?? 0;
                const status = getStockStatus(balance, allocated);
                return (
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 600,
                            color: status.color === "error" ? "error.main" :
                                status.color === "warning" ? "warning.main" :
                                    "success.main",
                        }}
                    >
                        {balance.toLocaleString()}
                    </Typography>
                );
            },
        },
        {
            field: "status",
            header: "Status",
            width: 120,
            align: "center",
            body: (row) => {
                const balance = row.balanceQty ?? 0;
                const allocated = row.allocatedQty ?? row.requiredQty ?? 0;
                const status = getStockStatus(balance, allocated);
                return (
                    <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                        sx={{ fontSize: "0.7rem", height: "20px" }}
                    />
                );
            },
        },
    ];

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Paper sx={{ p: 2, borderRadius: 1, boxShadow: 1 }}>
                <Stack spacing={2}>
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                                variant="caption"
                                onClick={() => navigate("/workspace/my-projects")}
                                sx={{
                                    cursor: "pointer",
                                    color: "primary.main",
                                    fontWeight: 600,
                                    "&:hover": { textDecoration: "underline" }
                                }}
                            >
                                ← Back to Projects
                            </Typography>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {project?.name || "Project BOM"}
                                </Typography>
                                {project && (
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                        Code: {project.code}
                                        {project.projectManager && ` • PM: ${project.projectManager}`}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                        <Box sx={{ width: { xs: "100%", sm: 300 } }}>
                            <CustomTextField
                                placeholder="Search material, code or category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </Box>
                    </Stack>

                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {rows.length} material{rows.length !== 1 ? "s" : ""} allocated
                    </Typography>

                    <CustomTable
                        data={rows}
                        columns={columns}
                        pagination
                        rows={10}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        emptyMessage={
                            loading
                                ? "Loading BOM..."
                                : "No materials allocated for this project yet."
                        }
                    />
                </Stack>
            </Paper>
        </Box>
    );
};

export default UserProjectBomPage;
