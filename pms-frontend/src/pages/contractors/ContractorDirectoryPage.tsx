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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Get, Post } from "../../utils/apiService";
import type { Contractor, ContractorType } from "../../types/contractor";
import ContractorFormDialog from "./components/ContractorFormDialog";
import ContractorUtilization from "./components/ContractorUtilization";
// import DeleteIcon from '@mui/icons-material/Delete'; // If I had icons
import toast from "react-hot-toast";

export default function ContractorDirectoryPage() {
    const [tab, setTab] = useState(0);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [search, setSearch] = useState("");
    const [openCreate, setOpenCreate] = useState(false);
    const navigate = useNavigate();

    // Load contractors
    useEffect(() => {
        (async () => {
            try {
                const cs = await Get<any[]>('/contractors');
                const mapped = (cs || []).map((c) => ({
                    id: c.code ?? `CTR-${c.id}`,
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
        })();
    }, []);

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

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" fontWeight={800}>
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

                        <Box sx={{ overflowX: "auto", border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Table>
                                <TableHead sx={{ bgcolor: "background.neutral" }}>
                                    <TableRow>
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
                                            onClick={() => navigate(`/workspace/contractors/${c.id}`)}
                                            sx={{ cursor: "pointer" }}
                                        >
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
                                            <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
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
                onSuccess={(newC) => setContractors((prev) => [newC, ...prev])}
            />
        </Box>
    );
}
