// @ts-nocheck - Suppressing React 19 type compatibility warnings for custom components
import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { Box, Paper, Typography, Grid, Button, Collapse, Stack, Divider } from "@mui/material";

import { loadVehicleData, createSupplier, updateSupplier, deleteSupplier } from "../../store/slices/vehicleSlice";
import type { RootState, AppDispatch } from "../../store/store";
import type { Supplier, SupplierType } from "../../types/vehicle";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";

const SupplierManagementPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
    const { suppliers, status } = useSelector((state: RootState) => state.vehicles);

    const loading = status === "loading";

    const [showSupplierDialog, setShowSupplierDialog] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [supplierForm, setSupplierForm] = useState({
        supplierName: "",
        supplierType: "MATERIALS" as SupplierType,
        contactPerson: "",
        email: "",
        phoneNumber: "",
        address: "",
        gstNo: "",
        panNo: "",
        bankHolderName: "",
        bankName: "",
        accountNo: "",
        ifscCode: "",
        branch: "",
        businessType: "",
    });

    useEffect(() => {
        if (selectedProjectId) {
            dispatch(loadVehicleData(Number(selectedProjectId)));
        }
    }, [selectedProjectId, dispatch]);

    const metrics = useMemo(() => {
        const totalSuppliers = suppliers.length;
        const fuelSuppliers = suppliers.filter((s) => s.supplierType === "FUEL").length;
        const materialSuppliers = suppliers.filter((s) => s.supplierType === "MATERIALS").length;
        return { totalSuppliers, fuelSuppliers, materialSuppliers };
    }, [suppliers]);

    const handleAddSupplier = async () => {
        if (!selectedProjectId || !supplierForm.supplierName || !supplierForm.supplierType) {
            toast.error("Please fill in supplier name and type");
            return;
        }

        try {
            if (editingSupplier) {
                await dispatch(
                    updateSupplier({
                        id: editingSupplier.id,
                        data: {
                            supplierName: supplierForm.supplierName,
                            supplierType: supplierForm.supplierType,
                            contactPerson: supplierForm.contactPerson || undefined,
                            email: supplierForm.email || undefined,
                            phoneNumber: supplierForm.phoneNumber || undefined,
                            address: supplierForm.address || undefined,
                            gstNo: supplierForm.gstNo || undefined,
                            panNo: supplierForm.panNo || undefined,
                            bankHolderName: supplierForm.bankHolderName || undefined,
                            bankName: supplierForm.bankName || undefined,
                            accountNo: supplierForm.accountNo || undefined,
                            ifscCode: supplierForm.ifscCode || undefined,
                            branch: supplierForm.branch || undefined,
                            businessType: supplierForm.businessType || undefined,
                        },
                    })
                ).unwrap();
                toast.success("Supplier updated successfully");
            } else {
                await dispatch(
                    createSupplier({
                        projectId: Number(selectedProjectId),
                        supplierName: supplierForm.supplierName,
                        supplierType: supplierForm.supplierType,
                        contactPerson: supplierForm.contactPerson || undefined,
                        email: supplierForm.email || undefined,
                        phoneNumber: supplierForm.phoneNumber || undefined,
                        address: supplierForm.address || undefined,
                        gstNo: supplierForm.gstNo || undefined,
                        panNo: supplierForm.panNo || undefined,
                        bankHolderName: supplierForm.bankHolderName || undefined,
                        bankName: supplierForm.bankName || undefined,
                        accountNo: supplierForm.accountNo || undefined,
                        ifscCode: supplierForm.ifscCode || undefined,
                        branch: supplierForm.branch || undefined,
                        businessType: supplierForm.businessType || undefined,
                    })
                ).unwrap();
                toast.success("Supplier added successfully");
            }
            setShowSupplierDialog(false);
            resetSupplierForm();
        } catch (error) {
            toast.error(editingSupplier ? "Failed to update supplier" : "Failed to add supplier");
            console.error(error);
        }
    };

    const handleEditSupplier = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setSupplierForm({
            supplierName: supplier.supplierName,
            supplierType: supplier.supplierType,
            contactPerson: supplier.contactPerson || "",
            email: supplier.email || "",
            phoneNumber: supplier.phoneNumber || "",
            address: supplier.address || "",
            gstNo: supplier.gstNo || "",
            panNo: supplier.panNo || "",
            bankHolderName: supplier.bankHolderName || "",
            bankName: supplier.bankName || "",
            accountNo: supplier.accountNo || "",
            ifscCode: supplier.ifscCode || "",
            branch: supplier.branch || "",
            businessType: supplier.businessType || "",
        });
        setShowSupplierDialog(true);
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
        setEditingSupplier(null);
        setSupplierForm({
            supplierName: "",
            supplierType: "MATERIALS",
            contactPerson: "",
            email: "",
            phoneNumber: "",
            address: "",
            gstNo: "",
            panNo: "",
            bankHolderName: "",
            bankName: "",
            accountNo: "",
            ifscCode: "",
            branch: "",
            businessType: "",
        });
    };

    const toggleRowExpansion = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const supplierColumns: ColumnDef<Supplier>[] = [
        {
            field: "expand",
            header: "",
            width: "50px",
            align: "center",
            // @ts-expect-error - React 19 type compatibility
            body: (row) => (
                <Box
                    sx={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        toggleRowExpansion(row.id);
                    }}
                >
                    {expandedRows.has(row.id) ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                </Box>
            ),
        },
        {
            field: "code",
            header: "Code",
            sortable: true,
            width: "150px",
            // @ts-expect-error - React 19 type compatibility
            body: (row) => (
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, color: "primary.main" }}>
                    {row.code}
                </Typography>
            ),
        },
        {
            field: "supplierName",
            header: "Supplier Name",
            sortable: true,
            // @ts-expect-error - React 19 type compatibility
            body: (row) => (
                <Typography variant="body2" fontWeight={600}>
                    {row.supplierName}
                </Typography>
            ),
        },
        {
            field: "supplierType",
            header: "Type",
            sortable: true,
            width: "120px",
            // @ts-expect-error - React 19 type compatibility
            body: (row) => (
                <Box
                    sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: row.supplierType === "FUEL" ? "warning.light" : "info.light",
                        color: row.supplierType === "FUEL" ? "warning.dark" : "info.dark",
                        display: "inline-block",
                    }}
                >
                    <Typography variant="caption" fontWeight={600}>
                        {row.supplierType}
                    </Typography>
                </Box>
            ),
        },
        { field: "contactPerson", header: "Contact Person", sortable: true },
        { field: "phoneNumber", header: "Phone", sortable: true },
        {
            field: "actions",
            header: "Actions",
            align: "right",
            width: "150px",
            // @ts-expect-error - React 19 type compatibility
            body: (row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                        size="small"
                        color="primary"
                        startIcon={<FiEdit2 size={14} />}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleEditSupplier(row);
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        size="small"
                        color="error"
                        startIcon={<FiTrash2 size={14} />}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteSupplier(row.id);
                        }}
                    >
                        Delete
                    </Button>
                </Stack>
            ),
        },
    ];

    const renderExpandedRow = (row: Supplier) => (
        <Box sx={{ p: 3, bgcolor: "grey.50" }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                        Contact Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                Email
                            </Typography>
                            <Typography variant="body2">{row.email || "—"}</Typography>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Typography variant="caption" color="text.secondary">
                                Address
                            </Typography>
                            <Typography variant="body2">{row.address || "—"}</Typography>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12}>
                    <Divider />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                        Tax Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                GST No
                            </Typography>
                            <Typography variant="body2">{row.gstNo || "—"}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                PAN No
                            </Typography>
                            <Typography variant="body2">{row.panNo || "—"}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                Business Type
                            </Typography>
                            <Typography variant="body2">{row.businessType || "—"}</Typography>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12}>
                    <Divider />
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
                        Bank Account Details
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                Account Holder Name
                            </Typography>
                            <Typography variant="body2">{row.bankHolderName || "—"}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                Bank Name
                            </Typography>
                            <Typography variant="body2">{row.bankName || "—"}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                Account Number
                            </Typography>
                            <Typography variant="body2">{row.accountNo || "—"}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                IFSC Code
                            </Typography>
                            <Typography variant="body2">{row.ifscCode || "—"}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="caption" color="text.secondary">
                                Branch
                            </Typography>
                            <Typography variant="body2">{row.branch || "—"}</Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );

    return (
        <Box sx={{ p: 2 }}>
            {/* Metrics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700}>
                            {metrics.totalSuppliers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total Suppliers
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700} color="warning.main">
                            {metrics.fuelSuppliers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Fuel Suppliers
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700} color="info.main">
                            {metrics.materialSuppliers}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Material Suppliers
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Paper
                        sx={{
                            p: 2,
                            textAlign: "center",
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                        }}
                    >
                        {/* @ts-expect-error - React 19 type compatibility */}
                        <CustomButton label="Add Supplier" startIcon={<FiPlus />} onClick={() => setShowSupplierDialog(true)} />
                    </Paper>
                </Grid>
            </Grid>

            {/* Supplier Table */}
            <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
                {suppliers.map((supplier) => (
                    <Box key={supplier.id}>
                        <CustomTable
                            data={[supplier]}
                            columns={supplierColumns}
                            loading={loading}
                            onRowClick={() => toggleRowExpansion(supplier.id)}
                        />
                        <Collapse in={expandedRows.has(supplier.id)} timeout="auto" unmountOnExit>
                            {renderExpandedRow(supplier)}
                        </Collapse>
                    </Box>
                ))}
                {suppliers.length === 0 && !loading && (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                            No suppliers found. Click "Add Supplier" to create one.
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Add/Edit Supplier Dialog */}
            {/* @ts-expect-error - React 19 type compatibility */}
            <CustomModal
                open={showSupplierDialog}
                onClose={() => {
                    setShowSupplierDialog(false);
                    resetSupplierForm();
                }}
                title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                maxWidth="md"
                footer={
                    <>
                        <Button
                            onClick={() => {
                                setShowSupplierDialog(false);
                                resetSupplierForm();
                            }}
                            color="inherit"
                        >
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleAddSupplier}>
                            {editingSupplier ? "Update Supplier" : "Add Supplier"}
                        </Button>
                    </>
                }
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    {/* Basic Information Section */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            Basic Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Supplier Name *"
                                    value={supplierForm.supplierName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })}
                                    required
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {/* @ts-expect-error - React 19 type compatibility */}
                                <CustomSelect
                                    label="Supplier Type *"
                                    value={supplierForm.supplierType}
                                    options={[
                                        { label: "Fuel", value: "FUEL" },
                                        { label: "Materials", value: "MATERIALS" },
                                    ]}
                                    onChange={(value: string | number) => setSupplierForm({ ...supplierForm, supplierType: value as SupplierType })}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Contact Information Section */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            Contact Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Contact Person"
                                    value={supplierForm.contactPerson}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Email"
                                    type="email"
                                    value={supplierForm.email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Phone Number"
                                    value={supplierForm.phoneNumber}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Business Type"
                                    value={supplierForm.businessType}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, businessType: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                {/* @ts-expect-error - React 19 type compatibility */}
                                <CustomTextField
                                    label="Address"
                                    value={supplierForm.address}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                                    multiline
                                    rows={2}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Tax Information Section */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            Tax Information
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="GST No"
                                    value={supplierForm.gstNo}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, gstNo: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="PAN No"
                                    value={supplierForm.panNo}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, panNo: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Bank Account Details Section */}
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                            Bank Account Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Account Holder Name"
                                    value={supplierForm.bankHolderName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, bankHolderName: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Bank Name"
                                    value={supplierForm.bankName}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, bankName: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Account Number"
                                    value={supplierForm.accountNo}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, accountNo: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="IFSC Code"
                                    value={supplierForm.ifscCode}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, ifscCode: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <CustomTextField
                                    label="Branch"
                                    value={supplierForm.branch}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierForm({ ...supplierForm, branch: e.target.value })}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            * Required fields. Code will be generated automatically.
                        </Typography>
                    </Box>
                </Box>
            </CustomModal>
        </Box>
    );
};

export default SupplierManagementPage;
