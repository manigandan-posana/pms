import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { Box, Paper, Typography, Grid, Button } from "@mui/material";

import { loadVehicleData, createSupplier, deleteSupplier } from "../../store/slices/vehicleSlice";
import type { RootState, AppDispatch } from "../../store/store";
import type { Supplier } from "../../types/vehicle";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";

const SupplierManagementPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
    const { suppliers, status } = useSelector((state: RootState) => state.vehicles);

    const loading = status === "loading";

    const [showSupplierDialog, setShowSupplierDialog] = useState(false);
    const [supplierForm, setSupplierForm] = useState({
        supplierName: "",
        contactPerson: "",
        phoneNumber: "",
    });

    useEffect(() => {
        if (selectedProjectId) {
            dispatch(loadVehicleData(Number(selectedProjectId)));
        }
    }, [selectedProjectId, dispatch]);

    const metrics = useMemo(() => {
        const totalSuppliers = suppliers.length;
        return { totalSuppliers };
    }, [suppliers]);

    const handleAddSupplier = async () => {
        if (!selectedProjectId || !supplierForm.supplierName) {
            toast.error("Please fill in supplier name");
            return;
        }

        try {
            await dispatch(
                createSupplier({
                    projectId: Number(selectedProjectId),
                    supplierName: supplierForm.supplierName,
                    contactPerson: supplierForm.contactPerson || undefined,
                    phoneNumber: supplierForm.phoneNumber || undefined,
                })
            ).unwrap();

            toast.success("Supplier added successfully");
            setShowSupplierDialog(false);
            resetSupplierForm();
        } catch (error) {
            toast.error("Failed to add supplier");
            console.error(error);
        }
    };

    const handleDeleteSupplier = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) return;

        try {
            await dispatch(deleteSupplier(id)).unwrap();
            toast.success("Supplier deleted successfully");
        } catch (error) {
            toast.error("Failed to delete supplier");
            console.error(error);
        }
    };

    const resetSupplierForm = () => {
        setSupplierForm({
            supplierName: "",
            contactPerson: "",
            phoneNumber: "",
        });
    };

    const supplierColumns: ColumnDef<Supplier>[] = [
        {
            field: "supplierName",
            header: "Supplier Name",
            sortable: true,
            body: (row) => (
                <Typography variant="body2" fontWeight={600}>
                    {row.supplierName}
                </Typography>
            ),
        },
        { field: "contactPerson", header: "Contact Person", sortable: true },
        { field: "phoneNumber", header: "Contact Number", sortable: true },
        {
            field: "actions",
            header: "Actions",
            align: "right",
            body: (row) => (
                <Button
                    size="small"
                    color="error"
                    startIcon={<FiTrash2 size={14} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSupplier(row.id);
                    }}
                >
                    Delete
                </Button>
            ),
        },
    ];

    return (
        <Box sx={{ p: 2 }}>
            {/* Metrics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700}>
                            {metrics.totalSuppliers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total Suppliers
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700} color="primary.main">
                            {suppliers.filter((s) => s.phoneNumber).length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            With Contact
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <CustomButton label="Add Supplier" startIcon={<FiPlus />} onClick={() => setShowSupplierDialog(true)} />
                    </Paper>
                </Grid>
            </Grid>

            {/* Supplier Table */}
            <CustomTable data={suppliers} columns={supplierColumns} loading={loading} />

            {/* Add Supplier Dialog */}
            <CustomModal
                open={showSupplierDialog}
                onClose={() => {
                    setShowSupplierDialog(false);
                    resetSupplierForm();
                }}
                title="Add New Supplier"
                footer={
                    <>
                        <Button
                            onClick={() => {
                                setShowSupplierDialog(false);
                                resetSupplierForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleAddSupplier}>
                            Add Supplier
                        </Button>
                    </>
                }
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <CustomTextField
                            label="Supplier Name"
                            value={supplierForm.supplierName}
                            onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            label="Contact Person"
                            value={supplierForm.contactPerson}
                            onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            label="Contact Number"
                            value={supplierForm.phoneNumber}
                            onChange={(e) => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                            * Supplier name is required. Contact details are optional.
                        </Typography>
                    </Grid>
                </Grid>
            </CustomModal>
        </Box>
    );
};

export default SupplierManagementPage;
