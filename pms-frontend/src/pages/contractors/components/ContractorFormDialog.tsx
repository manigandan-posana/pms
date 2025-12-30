import React, { useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Grid,
} from "@mui/material";
import type { ContractorType, Contractor } from "../../../types/contractor";
import { Post } from "../../../utils/apiService";
import toast from "react-hot-toast";

interface ContractorFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (contractor: Contractor) => void;
}

export default function ContractorFormDialog({
    open,
    onClose,
    onSuccess,
}: ContractorFormDialogProps) {
    const [newContractor, setNewContractor] = useState({
        name: "",
        mobile: "",
        email: "",
        address: "",
        panCard: "",
        type: "Work" as ContractorType,
        contactPerson: "",
        gstNumber: "",
        bankAccountHolderName: "",
        bankName: "",
        bankAccountNumber: "",
        ifscCode: "",
        bankBranch: "",
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!newContractor.name.trim()) return;
        setLoading(true);
        try {
            const payload = {
                name: newContractor.name.trim(),
                mobile: newContractor.mobile.trim(),
                email: newContractor.email.trim(),
                address: newContractor.address.trim(),
                panCard: newContractor.panCard.trim().toUpperCase(),
                type: newContractor.type,
                contactPerson: newContractor.contactPerson?.trim(),
                gstNumber: newContractor.gstNumber?.trim(),
                bankAccountHolderName: newContractor.bankAccountHolderName?.trim(),
                bankName: newContractor.bankName?.trim(),
                bankAccountNumber: newContractor.bankAccountNumber?.trim(),
                ifscCode: newContractor.ifscCode?.trim(),
                bankBranch: newContractor.bankBranch?.trim(),
            };

            const c = await Post<any>("/contractors", payload);
            const mapped: Contractor = {
                id: c.code ?? `CTR-${c.id}`,
                name: c.name,
                mobile: c.mobile,
                email: c.email,
                address: c.address,
                panCard: c.panCard,
                type: c.type,
                createdAt: c.createdAt,
                contactPerson: c.contactPerson,
                gstNumber: c.gstNumber,
                bankAccountHolderName: c.bankAccountHolderName,
                bankName: c.bankName,
                bankAccountNumber: c.bankAccountNumber,
                ifscCode: c.ifscCode,
                bankBranch: c.bankBranch,
            };

            toast.success("Contractor created successfully");
            onSuccess(mapped);
            onClose();
            // Reset form
            setNewContractor({
                name: "",
                mobile: "",
                email: "",
                address: "",
                panCard: "",
                type: "Work",
                contactPerson: "",
                gstNumber: "",
                bankAccountHolderName: "",
                bankName: "",
                bankAccountNumber: "",
                ifscCode: "",
                bankBranch: "",
            });
        } catch (err) {
            console.error("Create contractor failed", err);
            toast.error("Failed to create contractor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Create New Contractor</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Contractor Name"
                            value={newContractor.name}
                            onChange={(e) => setNewContractor((p) => ({ ...p, name: e.target.value }))}
                            fullWidth
                            required
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Mobile"
                            value={newContractor.mobile}
                            onChange={(e) => setNewContractor((p) => ({ ...p, mobile: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Email"
                            value={newContractor.email}
                            onChange={(e) => setNewContractor((p) => ({ ...p, email: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="PAN Card"
                            value={newContractor.panCard}
                            onChange={(e) => setNewContractor((p) => ({ ...p, panCard: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="GST Number"
                            value={newContractor.gstNumber}
                            onChange={(e) => setNewContractor((p) => ({ ...p, gstNumber: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                label="Type"
                                value={newContractor.type}
                                onChange={(e) => setNewContractor((p) => ({ ...p, type: e.target.value as ContractorType }))}
                            >
                                <MenuItem value="Work">Work</MenuItem>
                                <MenuItem value="Labour">Labour</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Contact Person"
                            value={newContractor.contactPerson}
                            onChange={(e) => setNewContractor((p) => ({ ...p, contactPerson: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Address"
                            value={newContractor.address}
                            onChange={(e) => setNewContractor((p) => ({ ...p, address: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Bank Account Holder Name"
                            value={newContractor.bankAccountHolderName}
                            onChange={(e) => setNewContractor((p) => ({ ...p, bankAccountHolderName: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Bank Name"
                            value={newContractor.bankName}
                            onChange={(e) => setNewContractor((p) => ({ ...p, bankName: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Bank Account Number"
                            value={newContractor.bankAccountNumber}
                            onChange={(e) => setNewContractor((p) => ({ ...p, bankAccountNumber: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="IFSC Code"
                            value={newContractor.ifscCode}
                            onChange={(e) => setNewContractor((p) => ({ ...p, ifscCode: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField
                            size="small"
                            label="Bank Branch"
                            value={newContractor.bankBranch}
                            onChange={(e) => setNewContractor((p) => ({ ...p, bankBranch: e.target.value }))}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!newContractor.name.trim() || loading}
                    sx={{ fontWeight: 800, borderRadius: 2, px: 3 }}
                >
                    Create Contractor
                </Button>
            </DialogActions>
        </Dialog>
    );
}
