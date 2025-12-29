import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomTextField from "../../widgets/CustomTextField";
import { Box, Stack, Typography, Paper, Chip } from "@mui/material";
import { Get } from "../../utils/apiService";

// ---- Types ---- //

export interface UserProject {
    id: string;
    code: string;
    name: string;
    projectManager?: string;
}

// ---- Main page ---- //

const UserProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const role = useSelector((state: RootState) => state.auth.role);
    const [search, setSearch] = useState<string>("");
    const [projects, setProjects] = useState<UserProject[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Prevent admins from accessing the user "My Projects" page
        if (role === "ADMIN") {
            navigate("/workspace/projects", { replace: true });
            return;
        }
        const loadProjects = async () => {
            try {
                setLoading(true);
                const response = await Get<UserProject[]>("/app/projects");
                setProjects(Array.isArray(response) ? response : []);
            } catch (err) {
                console.error("Failed to load projects", err);
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };
        loadProjects();
    }, []);

    const filteredProjects = projects.filter((project) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
            project.code?.toLowerCase().includes(term) ||
            project.name?.toLowerCase().includes(term) ||
            project.projectManager?.toLowerCase().includes(term)
        );
    });

    const columns: ColumnDef<UserProject>[] = [
        {
            field: "code",
            header: "Code",
            width: 120,
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
            header: "Project Name",
            body: (row) => (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {row.name || "—"}
                </Typography>
            ),
        },
        {
            field: "projectManager",
            header: "Project Manager",
            width: 200,
            body: (row) => (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {row.projectManager || "—"}
                </Typography>
            ),
        },
    ];

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Paper sx={{ p: 2, borderRadius: 1, boxShadow: 1 }}>
                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            My Projects
                        </Typography>
                        <Box sx={{ width: { xs: "100%", sm: 300 } }}>
                            <CustomTextField
                                placeholder="Search projects..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </Box>
                    </Stack>

                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""} accessible
                    </Typography>

                    <CustomTable
                        data={filteredProjects}
                        columns={columns}
                        pagination
                        rows={10}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        emptyMessage={
                            loading
                                ? "Loading projects..."
                                : "No projects assigned to you yet."
                        }
                        onRowClick={(row) => navigate(`/workspace/my-projects/${(row as UserProject).id}`)}
                    />
                </Stack>
            </Paper>
        </Box>
    );
};

export default UserProjectsPage;
