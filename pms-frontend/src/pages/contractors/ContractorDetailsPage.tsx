import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    Chip,
    Divider,
    Grid,
    Stack,
    Typography,
    Alert,
} from "@mui/material";
import { Get } from "../../utils/apiService";
import type { Contractor, Labour } from "../../types/contractor";
import LabourList from "./components/LabourList";
import toast from "react-hot-toast";

export default function ContractorDetailsPage() {
    const { id } = useParams<{ id: string }>();

    const navigate = useNavigate();
    const [contractor, setContractor] = useState<Contractor | null>(null);
    const [labours, setLabours] = useState<Labour[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchDetails = async () => {
            try {
                setLoading(true);
                const c = await Get<any>(`/contractors/${encodeURIComponent(id)}`).catch(() => null);

                if (!c) {
                    toast.error("Contractor not found");
                    setLoading(false);
                    return;
                }

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
                setContractor(mapped);

                // Fetch labours if available
                try {
                    const lres = await Get<any[]>(`/contractors/${encodeURIComponent(mapped.id)}/labours`);
                    const mappedLab = (lres || []).map((l) => ({
                        id: l.code ?? `LAB-${l.id}`,
                        contractorId: mapped.id,
                        name: l.name,
                        dob: l.dob,
                        active: !!l.active,
                        createdAt: l.createdAt,
                        aadharNumber: l.aadharNumber,
                        bloodGroup: l.bloodGroup,
                        contactNumber: l.contactNumber,
                        emergencyContactNumber: l.emergencyContactNumber,
                        contactAddress: l.contactAddress,
                        esiNumber: l.esiNumber,
                        uanNumber: l.uanNumber,
                    } as Labour));
                    setLabours(mappedLab);
                } catch (e) {
                    console.warn("Failed to fetch labours", e);
                }

            } catch (err) {
                console.error("Error fetching contractor details", err);
                toast.error("Error loading contractor");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (loading) return <Box p={3}>Loading...</Box>;
    if (!contractor) return <Box p={3}>Contractor not found.</Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Button
                onClick={() => navigate(-1)} // Go back
                sx={{ mb: 2, color: 'text.secondary' }}
            >
                ← Back to Contractors
            </Button>

            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h4" fontWeight={800}>
                        {contractor.name}
                    </Typography>
                    <Chip label={contractor.type} color={contractor.type === "Labour" ? "primary" : "default"} variant="outlined" />
                </Stack>

                <Card sx={{ p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={800} gutterBottom>
                        Details
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">Code</Typography>
                            <Typography variant="body2" fontWeight={600}>{contractor.id}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">Contact Person</Typography>
                            <Typography variant="body2">{contractor.contactPerson || "—"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">Mobile</Typography>
                            <Typography variant="body2">{contractor.mobile || "—"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body2">{contractor.email || "—"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">Address</Typography>
                            <Typography variant="body2">{contractor.address || "—"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">PAN</Typography>
                            <Typography variant="body2">{contractor.panCard || "—"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">GST No</Typography>
                            <Typography variant="body2">{contractor.gstNumber || "—"}</Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }} /></Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">Bank Name</Typography>
                            <Typography variant="body2">{contractor.bankName || "—"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">Account Holder</Typography>
                            <Typography variant="body2">{contractor.bankAccountHolderName || "—"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">Account Number</Typography>
                            <Typography variant="body2">{contractor.bankAccountNumber || "—"}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Typography variant="caption" color="text.secondary">IFSC / Branch</Typography>
                            <Typography variant="body2">{contractor.ifscCode || "—"} / {contractor.bankBranch || "—"}</Typography>
                        </Grid>
                    </Grid>
                </Card>

                {contractor.type === "Labour" ? (
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <LabourList
                            contractorId={contractor.id}
                            labours={labours}
                            onLaboursChange={setLabours}
                        />
                    </Card>
                ) : (
                    <Alert severity="info">
                        This is a Work contractor. Labour management is not applicable.
                    </Alert>
                )}
            </Stack>
        </Box>
    );
}
