import React, { useState, useMemo } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Stack,
    Switch,
    TextField,
} from "@mui/material";
import { Post } from "../../../utils/apiService";
import type { Labour } from "../../../types/contractor";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store";
import { listProjects } from "../../../store/slices/adminProjectsSlice";
import CustomSelect from "../../../widgets/CustomSelect";

interface LabourFormDialogProps {
    open: boolean;
    onClose: () => void;
    contractorId: string;
    onSuccess: (labour: Labour) => void;
}

// Helper functions (could be moved to a shared utils file)
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

function isFutureDateISO(iso: string) {
    if (!iso) return false;
    const d = parseISODate(iso);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return d.getTime() > today.getTime();
}

export default function LabourFormDialog({
    open,
    onClose,
    contractorId,
    onSuccess,
}: LabourFormDialogProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { items: adminProjects } = useSelector((state: RootState) => state.adminProjects);

    React.useEffect(() => {
        if (open) {
            dispatch(listProjects({}));
        }
    }, [open, dispatch]);

    const projectOptions = React.useMemo(() => {
        return adminProjects.map(p => ({ label: p.name || p.code || "Unknown", value: Number(p.id) }));
    }, [adminProjects]);

    const [newLabour, setNewLabour] = useState({
        name: "",
        dob: "",
        active: true,
        projectIds: [] as number[],
        aadharNumber: "",
        bloodGroup: "",
        contactNumber: "",
        emergencyContactNumber: "",
        contactAddress: "",
        esiNumber: "",
        uanNumber: "",
    });

    const [loading, setLoading] = useState(false);

    const addLabourAge = useMemo(() => calcAge(newLabour.dob), [newLabour.dob]);
    const addLabourHardBlocked = useMemo(() => {
        if (!newLabour.dob) return false;
        if (isFutureDateISO(newLabour.dob)) return true;
        if (addLabourAge == null) return true;
        return addLabourAge >= 60;
    }, [newLabour.dob, addLabourAge]);

    const addLabourWarning = useMemo(() => {
        if (addLabourAge == null) return "";
        if (addLabourAge > 55 && addLabourAge < 60) return "Warning: Labour age is above 55.";
        return "";
    }, [addLabourAge]);

    const addLabourError = useMemo(() => {
        if (!newLabour.dob) return "";
        if (isFutureDateISO(newLabour.dob)) return "Date of birth cannot be in the future.";
        if (addLabourAge == null) return "Invalid date of birth.";
        if (addLabourAge >= 60) return "Labour creation not allowed when age is 60 or above.";
        return "";
    }, [newLabour.dob, addLabourAge]);

    const canSaveLabour = useMemo(() => {
        if (!newLabour.name.trim()) return false;
        if (!newLabour.dob) return false;
        if (addLabourHardBlocked) return false;
        return true;
    }, [newLabour.name, newLabour.dob, addLabourHardBlocked]);

    const handleCreateLabour = async () => {
        const name = newLabour.name.trim();
        const dob = newLabour.dob;
        const age = calcAge(dob);

        if (!contractorId) return;
        if (!name) return;
        if (!dob) return;
        if (isFutureDateISO(dob)) return;
        if (age == null) return;
        if (age >= 60) return;

        setLoading(true);
        try {
            const data = await Post<any>(`/contractors/${encodeURIComponent(contractorId)}/labours`, {
                name,
                dob,
                active: newLabour.active,
                projectIds: newLabour.projectIds,
                aadharNumber: newLabour.aadharNumber?.trim(),
                bloodGroup: newLabour.bloodGroup?.trim(),
                contactNumber: newLabour.contactNumber?.trim(),
                emergencyContactNumber: newLabour.emergencyContactNumber?.trim(),
                contactAddress: newLabour.contactAddress?.trim(),
                esiNumber: newLabour.esiNumber?.trim(),
                uanNumber: newLabour.uanNumber?.trim(),
            });
            const createdLab = data?.labour ?? data;
            const mapped: Labour = {
                id: createdLab.code ?? `LAB-${createdLab.id}`,
                contractorId: contractorId,
                name: createdLab.name,
                dob: createdLab.dob,
                active: !!createdLab.active,
                aadharNumber: createdLab.aadharNumber,
                bloodGroup: createdLab.bloodGroup,
                contactNumber: createdLab.contactNumber,
                emergencyContactNumber: createdLab.emergencyContactNumber,
                contactAddress: createdLab.contactAddress,
                esiNumber: createdLab.esiNumber,
                uanNumber: createdLab.uanNumber,
                createdAt: createdLab.createdAt,
            };

            toast.success("Labour added successfully");
            onSuccess(mapped);
            onClose();
            // Reset
            setNewLabour({
                name: "",
                dob: "",
                active: true,
                projectIds: [],
                aadharNumber: "",
                bloodGroup: "",
                contactNumber: "",
                emergencyContactNumber: "",
                contactAddress: "",
                esiNumber: "",
                uanNumber: "",
            });
        } catch (err: any) {
            console.error("Create labour failed", err);
            toast.error(err?.message || "Failed to add labour");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 900 }}>Add Labour</DialogTitle>
            <DialogContent>
                <Stack spacing={1.5} sx={{ mt: 0.5 }}>
                    {addLabourError ? <Alert severity="error">{addLabourError}</Alert> : null}
                    {addLabourWarning ? <Alert severity="warning">{addLabourWarning}</Alert> : null}

                    <TextField
                        size="small"
                        label="Labour Name"
                        value={newLabour.name}
                        onChange={(e) => setNewLabour((p) => ({ ...p, name: e.target.value }))}
                        fullWidth
                        required
                    />

                    <CustomSelect
                        label="Projects"
                        value={newLabour.projectIds}
                        options={projectOptions}
                        onChange={(val: number[]) => setNewLabour((p) => ({ ...p, projectIds: val }))}
                        multiple
                        fullWidth
                    />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            size="small"
                            label="Date of Birth"
                            type="date"
                            value={newLabour.dob}
                            onChange={(e) => setNewLabour((p) => ({ ...p, dob: e.target.value }))}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                        <TextField
                            size="small"
                            label="Age (auto)"
                            value={addLabourAge ?? ""}
                            fullWidth
                            InputProps={{ readOnly: true }}
                        />
                    </Stack>

                    <TextField
                        size="small"
                        label="Aadhar Number"
                        value={newLabour.aadharNumber}
                        onChange={(e) => setNewLabour((p) => ({ ...p, aadharNumber: e.target.value }))}
                        fullWidth
                    />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            size="small"
                            label="Blood Group"
                            value={newLabour.bloodGroup}
                            onChange={(e) => setNewLabour((p) => ({ ...p, bloodGroup: e.target.value }))}
                            fullWidth
                        />
                        <TextField
                            size="small"
                            label="Contact Number"
                            value={newLabour.contactNumber}
                            onChange={(e) => setNewLabour((p) => ({ ...p, contactNumber: e.target.value }))}
                            fullWidth
                        />
                    </Stack>

                    <TextField
                        size="small"
                        label="Emergency Contact"
                        value={newLabour.emergencyContactNumber}
                        onChange={(e) => setNewLabour((p) => ({ ...p, emergencyContactNumber: e.target.value }))}
                        fullWidth
                    />

                    <TextField
                        size="small"
                        label="Contact Address"
                        value={newLabour.contactAddress}
                        onChange={(e) => setNewLabour((p) => ({ ...p, contactAddress: e.target.value }))}
                        fullWidth
                        multiline
                        rows={2}
                    />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            size="small"
                            label="ESI Number"
                            value={newLabour.esiNumber}
                            onChange={(e) => setNewLabour((p) => ({ ...p, esiNumber: e.target.value }))}
                            fullWidth
                        />
                        <TextField
                            size="small"
                            label="UAN Number"
                            value={newLabour.uanNumber}
                            onChange={(e) => setNewLabour((p) => ({ ...p, uanNumber: e.target.value }))}
                            fullWidth
                        />
                    </Stack>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={newLabour.active}
                                onChange={(e) => setNewLabour((p) => ({ ...p, active: e.target.checked }))}
                            />
                        }
                        label="Active"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleCreateLabour}
                    disabled={!canSaveLabour || loading}
                    sx={{ fontWeight: 800, borderRadius: 2 }}
                >
                    Create Labour
                </Button>
            </DialogActions>
        </Dialog>
    );
}
