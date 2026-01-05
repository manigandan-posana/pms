import React, { useEffect, useState, useMemo } from "react";
import {
    Box,
    Button,
    Card,
    Tab,
    Tabs,
    TextField,
    Typography,
    Stack,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    IconButton,
    Checkbox,
    Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Get, Post } from "../../utils/apiService";
import type { Contractor, ContractorType } from "../../types/contractor";
import ContractorFormDialog from "./components/ContractorFormDialog";
import ContractorUtilization from "./components/ContractorUtilization";
// import DeleteIcon from '@mui/icons-material/Delete'; // If I had icons
import toast from "react-hot-toast";

import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store/store";
import BulkAssignDialog from "../admin/components/BulkAssignDialog";
import { fetchAllSuppliers } from "../../store/slices/vehicleSlice"; // Re-using for consistency? No, manual reload here.

interface ContractorDirectoryPageProps {
    isAdminMode?: boolean;
}

export default function ContractorDirectoryPage({ isAdminMode = false }: ContractorDirectoryPageProps) {
    const [tab, setTab] = useState(0);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [search, setSearch] = useState("");
    const [openCreate, setOpenCreate] = useState(false);
    const navigate = useNavigate();

    // Bulk Assign
    const [selectedContractorIds, setSelectedContractorIds] = useState<Set<number>>(new Set());
    const [showBulkAssign, setShowBulkAssign] = useState(false);

    // Get current project from store if in workspace mode
    // We need to support 'workspaceSlice' correctly
    const selectedProjectId = useSelector((state: RootState) => (state as any).workspace?.currentProject?.id);

    const loadContractors = async () => {
        try {
            let url = '/contractors';
            if (!isAdminMode) {
                if (!selectedProjectId) return;
                url = `/contractors?projectId=${selectedProjectId}`;
            }

            const cs = await Get<any[]>(url);
            const mapped = (cs || []).map((c) => ({
                id: c.code ?? `CTR-${c.id}`,
                numericId: c.id,
                name: c.name,
                mobile: c.mobile,
                email: c.email,
                address: c.address,
                panCard: c.panCard,
                contactPerson: c.contactPerson,
                gstNumber: c.gstNumber,
                bankAccountHolderName: c.bankAccountHolderName,
                bankName: c.bankName,
                bankAccountNumber: c.bankAccountNumber,
                ifscCode: c.ifscCode,
                bankBranch: c.bankBranch,
                type: c.type,
                createdAt: c.createdAt,
            } as Contractor));
            setContractors(mapped);
        } catch (err) {
            console.error('Load contractors failed', err);
            toast.error('Failed to load contractors');
        }
    };

    // Load contractors
    useEffect(() => {
        loadContractors();
    }, [isAdminMode, selectedProjectId]);

    const filteredContractors = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return contractors;
        return contractors.filter((c) =>
            [c.id, c.name, c.mobile, c.email, c.panCard, c.type].some((x) => String(x).toLowerCase().includes(q))
        );
    }, [contractors, search]);

    const handleDelete = (id: string) => {
        // Local delete simulation as backend doesn't seem to have delete
        if (confirm("Are you sure you want to delete this contractor? This is a local action only.")) {
            setContractors(prev => prev.filter(c => c.id !== id));
            toast.success("Contractor removed from view");
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const ids = new Set<number>();
            filteredContractors.forEach(c => {
                if (c.numericId) ids.add(c.numericId);
            });
            setSelectedContractorIds(ids);
        } else {
            setSelectedContractorIds(new Set());
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        const newSet = new Set(selectedContractorIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedContractorIds(newSet);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={800}>
                    Contractor Management
                </Typography>
            </Stack>

            <Card sx={{ p: 2, borderRadius: 3, minHeight: '80vh' }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
                >
                    <Tab label="Directory" sx={{ fontWeight: 700 }} />
                    <Tab label="Weekly Utilization" sx={{ fontWeight: 700 }} />
                </Tabs>

                {tab === 0 && (
                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between">
                            <TextField
                                size="small"
                                placeholder="Search contractors..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 300 } }}
                            />
                            <Button
                                variant="contained"
                                onClick={() => setOpenCreate(true)}
                                sx={{ borderRadius: 2, fontWeight: 700 }}
                            >
                                + New Contractor
                            </Button>
                        </Stack>

                        {isAdminMode && selectedContractorIds.size > 0 && (
                            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'grey.50' }}>
                                <Typography variant="body2">{selectedContractorIds.size} selected</Typography>
                                <Button variant="outlined" onClick={() => setShowBulkAssign(true)} size="small">
                                    Bulk Assign Projects
                                </Button>
                            </Paper>
                        )}

                        <Box sx={{ overflowX: "auto", border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Table>
                                <TableHead sx={{ bgcolor: "background.neutral" }}>
                                    <TableRow>
                                        {isAdminMode && (
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    checked={filteredContractors.length > 0 && selectedContractorIds.size === filteredContractors.filter(c => c.numericId).length}
                                                    indeterminate={selectedContractorIds.size > 0 && selectedContractorIds.size < filteredContractors.filter(c => c.numericId).length}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Mobile</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>PAN</TableCell>
                                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredContractors.map((c) => (
                                        <TableRow
                                            key={c.id}
                                            hover
                                            onClick={() => navigate(isAdminMode ? `/admin/contractors/${c.id}` : `/workspace/contractors/${c.id}`)}
                                            sx={{ cursor: "pointer" }}
                                            selected={c.numericId ? selectedContractorIds.has(c.numericId) : false}
                                        >
                                            {isAdminMode && (
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        size="small"
                                                        checked={c.numericId ? selectedContractorIds.has(c.numericId) : false}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => c.numericId && handleSelectOne(c.numericId, e.target.checked)}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell>{c.id}</TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2" fontWeight={700}>{c.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{c.contactPerson}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={c.type}
                                                    color={c.type === 'Labour' ? 'primary' : 'default'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{c.mobile}</TableCell>
                                            <TableCell>{c.email}</TableCell>
                                            <TableCell>{c.panCard}</TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(c.id);
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredContractors.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={isAdminMode ? 8 : 7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                                                No contractors found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Stack>
                )}

                {tab === 1 && (
                    <ContractorUtilization contractors={contractors} />
                )}
            </Card>

            <ContractorFormDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSuccess={(newC) => {
                    // Since newC might not have numericId in return from dialog, we might reload or just add it.
                    // But dialog onSuccess returns local object?
                    // Actually logic says `setContractors((prev) => [newC, ...prev])`
                    // We should probably reload to get full ID.
                    loadContractors();
                }}
                isAdminMode={isAdminMode}
                selectedProjectId={selectedProjectId}
            />

            {isAdminMode && (
                <BulkAssignDialog
                    open={showBulkAssign}
                    onClose={() => {
                        setShowBulkAssign(false);
                        setSelectedContractorIds(new Set());
                    }}
                    resourceType="contractors"
                    selectedIds={Array.from(selectedContractorIds)}
                    onSuccess={() => {
                        loadContractors();
                    }}
                />
            )}
        </Box>
    );
}
