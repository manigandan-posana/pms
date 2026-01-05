import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiCheck, FiSlash, FiTruck } from "react-icons/fi";
import { Box, Paper, Typography, Grid, Stack, Chip, Button, IconButton } from "@mui/material";

import { loadVehicleData, createVehicle, updateVehicleStatus, deleteVehicle } from "../../store/slices/vehicleSlice";
import type { RootState, AppDispatch } from "../../store/store";
import type { Vehicle, VehicleType, FuelType, VehicleStatus } from "../../types/vehicle";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";
import CustomDateInput from "../../widgets/CustomDateInput";

const VehicleDirectoryPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
    const { vehicles, fuelEntries, dailyLogs, status } = useSelector((state: RootState) => state.vehicles);

    const loading = status === "loading";

    const [showVehicleDialog, setShowVehicleDialog] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({
        vehicleName: "",
        vehicleNumber: "",
        vehicleType: "OWN_VEHICLE" as VehicleType,
        fuelType: "DIESEL" as FuelType,
        status: "ACTIVE" as VehicleStatus,
        startDate: new Date(),
        endDate: null as Date | null,
        rentPrice: null as number | null,
        rentPeriod: "MONTHLY" as "MONTHLY" | "DAILY" | "HOURLY",
    });

    useEffect(() => {
        if (selectedProjectId) {
            dispatch(loadVehicleData(Number(selectedProjectId)));
        }
    }, [selectedProjectId, dispatch]);

    const metrics = useMemo(() => {
        const totalVehicles = vehicles.length;
        const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE").length;
        const totalFuelCost = fuelEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
        const totalDistance = dailyLogs.filter((log) => log.status === "CLOSED").reduce((sum, log) => sum + (log.distance || 0), 0);

        return { totalVehicles, activeVehicles, totalFuelCost, totalDistance };
    }, [vehicles, fuelEntries, dailyLogs]);

    const handleAddVehicle = async () => {
        if (!selectedProjectId || !vehicleForm.vehicleName || !vehicleForm.vehicleNumber) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            await dispatch(
                createVehicle({
                    projectId: Number(selectedProjectId),
                    vehicleName: vehicleForm.vehicleName,
                    vehicleNumber: vehicleForm.vehicleNumber,
                    vehicleType: vehicleForm.vehicleType,
                    fuelType: vehicleForm.fuelType,
                    status: vehicleForm.status,
                    startDate: vehicleForm.startDate.toISOString().split("T")[0],
                    endDate: vehicleForm.endDate ? vehicleForm.endDate.toISOString().split("T")[0] : undefined,
                    rentPrice: vehicleForm.rentPrice || undefined,
                    rentPeriod: vehicleForm.rentPrice ? vehicleForm.rentPeriod : undefined,
                })
            ).unwrap();

            toast.success("Vehicle added successfully");
            setShowVehicleDialog(false);
            resetVehicleForm();
        } catch (error) {
            toast.error("Failed to add vehicle");
            console.error(error);
        }
    };

    const handleDeleteVehicle = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

        try {
            await dispatch(deleteVehicle(id)).unwrap();
            toast.success("Vehicle deleted successfully");
        } catch (error) {
            toast.error("Failed to delete vehicle");
            console.error(error);
        }
    };

    const resetVehicleForm = () => {
        setVehicleForm({
            vehicleName: "",
            vehicleNumber: "",
            vehicleType: "OWN_VEHICLE",
            fuelType: "DIESEL",
            status: "ACTIVE",
            startDate: new Date(),
            endDate: null,
            rentPrice: null,
            rentPeriod: "MONTHLY",
        });
    };

    const vehicleTypeOptions = [
        { label: "Own Vehicle", value: "OWN_VEHICLE" },
        { label: "Rent - Monthly", value: "RENT_MONTHLY" },
        { label: "Rent - Daily", value: "RENT_DAILY" },
        { label: "Rent - Hourly", value: "RENT_HOURLY" },
    ];

    const fuelTypeOptions = [
        { label: "Petrol", value: "PETROL" },
        { label: "Diesel", value: "DIESEL" },
        { label: "Electric", value: "ELECTRIC" },
    ];

    const statusOptions = [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
        { label: "Planned", value: "PLANNED" },
    ];

    const vehicleColumns: ColumnDef<Vehicle>[] = [
        {
            field: "vehicleName",
            header: "Vehicle Name",
            sortable: true,
            style: { minWidth: "120px" },
            body: (row) => (
                <Typography variant="body2" fontWeight={600} color="text.primary">
                    {row.vehicleName}
                </Typography>
            ),
        },
        { field: "vehicleNumber", header: "Vehicle Number", sortable: true, style: { minWidth: "100px" } },
        { field: "vehicleType", header: "Type", sortable: true, style: { minWidth: "90px" } },
        { field: "fuelType", header: "Fuel Type", sortable: true, style: { minWidth: "80px" } },
        {
            field: "status",
            header: "Status",
            sortable: true,
            body: (row) => (
                <Chip
                    label={row.status}
                    size="small"
                    sx={{
                        height: 20,
                        fontSize: "10px",
                        bgcolor: row.status === "ACTIVE" ? "success.light" : "grey",
                        color: row.status === "ACTIVE" ? "success.dark" : "white",
                    }}
                />
            ),
        },
        {
            field: "runningKm",
            header: "Running Km",
            body: (row) => {
                const runningKm = dailyLogs.filter((log) => log.vehicleId === row.id && log.status === "CLOSED").reduce((sum, log) => sum + (log.distance || 0), 0);
                return <Typography variant="caption">{runningKm.toFixed(1)} km</Typography>;
            },
        },
        {
            field: "totalQty",
            header: "Total Qty",
            body: (row) => {
                const vehicleEntries = fuelEntries.filter((e) => e.vehicleId === row.id);
                const totalLitres = vehicleEntries.reduce((sum, e) => sum + (e.litres || 0), 0);
                return (
                    <Typography variant="caption" color="text.secondary">
                        {totalLitres.toFixed(2)} L
                    </Typography>
                );
            },
        },
        {
            field: "totalCost",
            header: "Total Fuel Cost",
            body: (row) => {
                const vehicleEntries = fuelEntries.filter((e) => e.vehicleId === row.id);
                const totalCost = vehicleEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
                return (
                    <Typography variant="body2" fontWeight={600} color="success.main">
                        ₹{totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </Typography>
                );
            },
        },
        {
            field: "avgMileage",
            header: "Avg Mileage",
            body: (row) => {
                const vehicleEntries = fuelEntries.filter((e) => e.vehicleId === row.id && e.status === "CLOSED");
                const totalKm = vehicleEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
                const totalLitres = fuelEntries.filter((e) => e.vehicleId === row.id).reduce((sum, e) => sum + (e.litres || 0), 0);
                const avgMileage = totalLitres > 0 ? totalKm / totalLitres : 0;
                return <Typography variant="caption">{avgMileage.toFixed(2)} km/l</Typography>;
            },
        },
        {
            field: "rentCost",
            header: "Rent Cost",
            body: (row) => {
                if (!row.rentPrice) return <Typography variant="caption" color="text.secondary">—</Typography>;

                const startDate = row.startDate ? new Date(row.startDate) : new Date();
                const endDate = row.endDate ? new Date(row.endDate) : new Date();
                const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                let totalRentCost = 0;
                if (row.rentPeriod === "MONTHLY") {
                    const months = Math.ceil(daysDiff / 30);
                    totalRentCost = row.rentPrice * months;
                } else if (row.rentPeriod === "DAILY") {
                    totalRentCost = row.rentPrice * daysDiff;
                } else if (row.rentPeriod === "HOURLY") {
                    const hours = daysDiff * 24;
                    totalRentCost = row.rentPrice * hours;
                }
                return (
                    <Typography variant="body2" fontWeight={600} color="warning.main">
                        ₹{totalRentCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </Typography>
                );
            },
        },
        {
            field: "actions",
            header: "Actions",
            align: "right",
            body: (row) => {
                const isActive = row.status === "ACTIVE";
                return (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton
                            size="small"
                            sx={{ color: isActive ? "warning.main" : "success.main" }}
                            title={isActive ? "Mark Inactive" : "Mark Active"}
                            onClick={async (e) => {
                                e.stopPropagation();
                                const newStatus = isActive ? "INACTIVE" : "ACTIVE";
                                const reason = prompt(`Reason for changing status to ${newStatus}:`);
                                if (reason) {
                                    try {
                                        await dispatch(
                                            updateVehicleStatus({
                                                id: row.id,
                                                data: { status: newStatus, statusChangeDate: new Date().toISOString().split("T")[0], reason },
                                            })
                                        ).unwrap();
                                        toast.success(`Vehicle status updated to ${newStatus}`);
                                    } catch (error) {
                                        toast.error("Failed to update status");
                                    }
                                }
                            }}
                        >
                            {isActive ? <FiSlash size={16} /> : <FiCheck size={16} />}
                        </IconButton>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVehicle(row.id);
                            }}
                        >
                            <FiTrash2 size={16} />
                        </IconButton>
                    </Stack>
                );
            },
        },
    ];

    return (
        <Box sx={{ p: 2 }}>
            {/* Action Bar */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    Vehicle Directory
                </Typography>
                <CustomButton label="Add Vehicle" startIcon={<FiPlus />} onClick={() => setShowVehicleDialog(true)} />
            </Box>

            {/* Vehicle Table */}
            <CustomTable data={vehicles} columns={vehicleColumns} loading={loading} onRowClick={(row) => navigate(`/workspace/vehicles/details/${row.id}`)} />

            {/* Add Vehicle Dialog */}
            <CustomModal
                open={showVehicleDialog}
                onClose={() => {
                    setShowVehicleDialog(false);
                    resetVehicleForm();
                }}
                title="Add New Vehicle"
                footer={
                    <>
                        <Button
                            onClick={() => {
                                setShowVehicleDialog(false);
                                resetVehicleForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleAddVehicle}>
                            Add Vehicle
                        </Button>
                    </>
                }
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            label="Vehicle Name"
                            value={vehicleForm.vehicleName}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            label="Vehicle Number"
                            value={vehicleForm.vehicleNumber}
                            onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomSelect
                            label="Vehicle Type"
                            value={vehicleForm.vehicleType}
                            onChange={(value) => setVehicleForm({ ...vehicleForm, vehicleType: value as VehicleType })}
                            options={vehicleTypeOptions}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomSelect
                            label="Fuel Type"
                            value={vehicleForm.fuelType}
                            onChange={(value) => setVehicleForm({ ...vehicleForm, fuelType: value as FuelType })}
                            options={fuelTypeOptions}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomSelect
                            label="Status"
                            value={vehicleForm.status}
                            onChange={(value) => setVehicleForm({ ...vehicleForm, status: value as VehicleStatus })}
                            options={statusOptions}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomDateInput label="Start Date" value={vehicleForm.startDate} onChange={(date) => setVehicleForm({ ...vehicleForm, startDate: date || new Date() })} />
                    </Grid>
                    {vehicleForm.vehicleType !== "OWN_VEHICLE" && (
                        <>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <CustomTextField
                                    label="Rent Price"
                                    type="number"
                                    value={vehicleForm.rentPrice || ""}
                                    onChange={(e) => setVehicleForm({ ...vehicleForm, rentPrice: e.target.value ? Number(e.target.value) : null })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <CustomDateInput label="End Date" value={vehicleForm.endDate} onChange={(date) => setVehicleForm({ ...vehicleForm, endDate: date })} />
                            </Grid>
                        </>
                    )}
                </Grid>
            </CustomModal>
        </Box>
    );
};

export default VehicleDirectoryPage;
