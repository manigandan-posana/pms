import React, { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import type { Labour } from "../../../types/contractor";
import LabourFormDialog from "./LabourFormDialog";

interface LabourListProps {
    contractorId: string;
    labours: Labour[];
    onLaboursChange: (labours: Labour[]) => void; // To update parent state
}

function parseISODate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function calcAge(dobISO: string, now = new Date()) {
    if (!dobISO) return null;
    const dob = parseISODate(dobISO);
    if (Number.isNaN(dob.getTime())) return null;
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
}

export default function LabourList({
    contractorId,
    labours,
    onLaboursChange,
}: LabourListProps) {
    const [openAdd, setOpenAdd] = useState(false);

    const handleDelete = (labourId: string) => {
        // In a real app, this should call an API. The original code only updated local state for delete.
        // I will simulate local update as requested by "without any errors and bugs" relative to current logic.
        // BUT usually delete should be an API call.
        // The original code:
        // setLabours((prev) => prev.filter((l) => l.contractorId !== id)); // wait, that was contractor delete
        // setLabours((prev) => prev.filter((l) => l.id !== labourId)); // Labour delete

        // There was no API call in the original code for deleting a labour?
        // Let's check the original code again.
        // function deleteLabour(labourId: string) { setLabours(...) } -> No API call.
        // Okay, I will keep it local-only but I should mention/warn or maybe add API if I can find the endpoint.
        // There is no DELETE endpoint in ContractorController.java for labours. So local only.

        onLaboursChange(labours.filter((l) => l.id !== labourId));
    };

    const handleToggleActive = (labourId: string, active: boolean) => {
        onLaboursChange(labours.map((l) => (l.id === labourId ? { ...l, active } : l)));
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={800}>
                    Labours ({labours.length})
                </Typography>
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => setOpenAdd(true)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                    Add Labour
                </Button>
            </Stack>

            <Box sx={{ overflowX: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: "background.neutral" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>DOB / Age</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800, textAlign: "right" }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {labours.map((l) => {
                            const age = calcAge(l.dob);
                            const warn = age != null && age > 55 && age < 60;
                            return (
                                <TableRow key={l.id} hover>
                                    <TableCell>{l.id}</TableCell>
                                    <TableCell>
                                        <Stack spacing={0.5}>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {l.name}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                {warn && <Chip size="small" label="Age > 55" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                                                {l.emergencyContactNumber && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Emerg: {l.emergencyContactNumber}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{l.dob}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {age != null ? `${age} years` : "—"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={l.active}
                                            onChange={(e) => handleToggleActive(l.id, e.target.checked)}
                                            size="small"
                                        />
                                        <Typography variant="caption" ml={1}>
                                            {l.active ? "Active" : "Inactive"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(l.id)}
                                            sx={{ minWidth: "auto" }}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {labours.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                                    No labours added yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Box>

            <LabourFormDialog
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                contractorId={contractorId}
                onSuccess={(newLab) => {
                    onLaboursChange([newLab, ...labours]);
                }}
            />
        </Box>
    );
}
