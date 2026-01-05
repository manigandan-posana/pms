import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiPlus, FiLock, FiUnlock, FiCalendar } from "react-icons/fi";
import { Box, Paper, Typography, Grid, Button, IconButton, Alert } from "@mui/material";

import { loadVehicleData, createDailyLog, closeDailyLog } from "../../store/slices/vehicleSlice";
import type { RootState, AppDispatch } from "../../store/store";
import type { DailyLog } from "../../types/vehicle";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";
import CustomDateInput from "../../widgets/CustomDateInput";

const DailyLogPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
    const { vehicles, fuelEntries, dailyLogs, status } = useSelector((state: RootState) => state.vehicles);

    const loading = status === "loading";

    // Daily Log Dialog - Create
    const [showDailyLogDialog, setShowDailyLogDialog] = useState(false);
    const [createDate, setCreateDate] = useState<Date>(new Date());
    const [createVehicleId, setCreateVehicleId] = useState<string | number>("");
    const [createOpeningKm, setCreateOpeningKm] = useState<string | number>("");
    const [createOpeningPhoto, setCreateOpeningPhoto] = useState<string>("");

    // Daily Log Dialog - Close
    const [showCloseDailyLogDialog, setShowCloseDailyLogDialog] = useState(false);
    const [selectedDailyLog, setSelectedDailyLog] = useState<DailyLog | null>(null);
    const [closeClosingKm, setCloseClosingKm] = useState<string | number>("");
    const [closeClosingPhoto, setCloseClosingPhoto] = useState<string>("");

    // Validation states
    const [createFormErrors, setCreateFormErrors] = useState<{
        vehicleId?: string;
        openingKm?: string;
    }>({});

    const [closeFormErrors, setCloseFormErrors] = useState<{
        closingKm?: string;
    }>({});

    useEffect(() => {
        if (selectedProjectId) {
            dispatch(loadVehicleData(Number(selectedProjectId)));
        }
    }, [selectedProjectId, dispatch]);

    // Filter logs for current project and current date (for display)
    const projectLogs = useMemo(() => {
        const today = new Date().toDateString();
        return dailyLogs.filter((log) => new Date(log.date).toDateString() === today);
    }, [dailyLogs]);

    // Get the last closing km for the selected vehicle
    const lastClosingKm = useMemo(() => {
        if (!createVehicleId) return null;
        const vId = Number(createVehicleId);

        const vehicleLogs = dailyLogs
            .filter((log) => log.vehicleId === vId && log.status === "CLOSED" && log.closingKm !== undefined)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return vehicleLogs.length > 0 ? vehicleLogs[0].closingKm : null;
    }, [createVehicleId, dailyLogs]);

    // Get open fuel entry for the selected vehicle
    const openFuelEntry = useMemo(() => {
        if (!createVehicleId) return null;
        const vId = Number(createVehicleId);

        return fuelEntries.find((entry) => entry.vehicleId === vId && entry.status === "OPEN");
    }, [createVehicleId, fuelEntries]);

    // Get vehicles that don't have an active (open) log currently
    const availableVehicles = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeProjectVehicles = vehicles.filter((v) => {
            if (v.status === "INACTIVE") return false;

            // Check if start date is in the future (Planned)
            if (v.startDate) {
                const startDate = new Date(v.startDate);
                startDate.setHours(0, 0, 0, 0);
                if (startDate > today) return false;
            }

            return true;
        });

        // Find vehicle IDs that already have an OPEN log (global check, not just today)
        const vehiclesWithOpenLog = new Set(dailyLogs.filter((log) => log.status === "OPEN").map((log) => log.vehicleId));

        return activeProjectVehicles.filter((v) => !vehiclesWithOpenLog.has(v.id));
    }, [vehicles, dailyLogs]);

    // Validate create form
    const isCreateFormValid = useMemo(() => {
        const km = Number(createOpeningKm);
        if (!createVehicleId || isNaN(km) || km <= 0) return false;

        // Check if opening km is valid compared to fuel entry
        if (openFuelEntry && km < openFuelEntry.openingKm) return false;

        // Check if opening km is valid compared to last closing km
        if (lastClosingKm != null && km < lastClosingKm) return false;

        return true;
    }, [createVehicleId, createOpeningKm, openFuelEntry, lastClosingKm]);

    // Validate close form
    const isCloseFormValid = useMemo(() => {
        const km = Number(closeClosingKm);
        if (!selectedDailyLog || isNaN(km) || selectedDailyLog.openingKm == null) return false;
        return km >= selectedDailyLog.openingKm;
    }, [selectedDailyLog, closeClosingKm]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const totalLogs = projectLogs.length;
        const openLogs = projectLogs.filter((log) => log.status === "OPEN").length;
        const closedLogs = projectLogs.filter((log) => log.status === "CLOSED").length;
        const totalDistance = projectLogs.filter((log) => log.status === "CLOSED").reduce((sum, log) => sum + (log.distance || 0), 0);

        return { totalLogs, openLogs, closedLogs, totalDistance };
    }, [projectLogs]);

    const handleAddDailyLog = async () => {
        if (!selectedProjectId || !createVehicleId || !createOpeningKm) {
            toast.error("Please fill in all required fields");
            return;
        }

        const vId = Number(createVehicleId);
        const existingOpenLog = dailyLogs.find((log) => log.vehicleId === vId && log.status === "OPEN");

        if (existingOpenLog) {
            toast.error("This vehicle already has an open daily log. Please close it first.");
            return;
        }

        const km = Number(createOpeningKm);
        if (lastClosingKm != null && km < lastClosingKm) {
            toast.error(`Opening km must be >= last daily log closing km (${lastClosingKm.toFixed(1)} km)`);
            return;
        }
        if (openFuelEntry && km < openFuelEntry.openingKm) {
            toast.error(`Opening km must be >= last fuel entry closing km (${openFuelEntry.openingKm.toFixed(1)} km)`);
            return;
        }

        try {
            await dispatch(
                createDailyLog({
                    date: createDate.toISOString().split("T")[0],
                    projectId: Number(selectedProjectId),
                    vehicleId: vId,
                    openingKm: km,
                    openingKmPhoto: createOpeningPhoto || undefined,
                })
            ).unwrap();

            toast.success("Daily log created successfully");
            resetCreateForm();
            setShowDailyLogDialog(false);
        } catch (error) {
            toast.error("Failed to add daily log");
            console.error(error);
        }
    };

    const handleCloseDailyLog = async () => {
        const km = Number(closeClosingKm);
        if (!selectedDailyLog || !closeClosingKm) {
            toast.error("Please enter closing km");
            return;
        }

        if (selectedDailyLog.openingKm != null && km < selectedDailyLog.openingKm) {
            toast.error("Closing km cannot be less than opening km");
            return;
        }

        try {
            await dispatch(
                closeDailyLog({
                    id: selectedDailyLog.id,
                    data: {
                        closingKm: km,
                        closingKmPhoto: closeClosingPhoto || undefined,
                    },
                })
            ).unwrap();

            toast.success("Daily log closed successfully");
            resetCloseForm();
            setShowCloseDailyLogDialog(false);
            setSelectedDailyLog(null);
        } catch (error) {
            toast.error("Failed to close daily log");
            console.error(error);
        }
    };

    const resetCreateForm = () => {
        setCreateDate(new Date());
        setCreateVehicleId("");
        setCreateOpeningKm("");
        setCreateOpeningPhoto("");
        setCreateFormErrors({});
    };

    const resetCloseForm = () => {
        setCloseClosingKm("");
        setCloseClosingPhoto("");
        setCloseFormErrors({});
    };

    const dailyLogColumns: ColumnDef<DailyLog>[] = [
        {
            field: "vehicleName",
            header: "Vehicle",
            sortable: true,
            body: (row) => <Typography variant="body2" fontWeight={600}>{row.vehicleName}</Typography>,
        },
        {
            field: "vehicleNumber",
            header: "Vehicle No.",
            sortable: true,
        },
        {
            field: "openingKm",
            header: "Opening KM",
            sortable: true,
            body: (row) => (row.openingKm != null ? row.openingKm.toFixed(1) : "—"),
        },
        {
            field: "closingKm",
            header: "Closing KM",
            sortable: true,
            body: (row) => (row.status === "CLOSED" && row.closingKm != null ? row.closingKm.toFixed(1) : "—"),
        },
        {
            field: "distance",
            header: "Distance",
            sortable: true,
            body: (row) => (row.status === "CLOSED" && row.distance != null ? `${row.distance.toFixed(1)} km` : "—"),
        },
        {
            field: "status",
            header: "Status",
            align: "center",
            body: (row) => (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                    {row.status === "OPEN" ? (
                        <IconButton
                            size="small"
                            color="warning"
                            title="Open - Click to close log"
                            onClick={() => {
                                setSelectedDailyLog(row);
                                setShowCloseDailyLogDialog(true);
                            }}
                        >
                            <FiUnlock size={18} />
                        </IconButton>
                    ) : (
                        <FiLock size={18} style={{ color: "#10b981" }} title="Closed" />
                    )}
                </Box>
            ),
        },
    ];

    const vehicleOptions = availableVehicles.map((v) => ({
        label: `${v.vehicleName} (${v.vehicleNumber})`,
        value: v.id,
    }));

    return (
        <Box sx={{ p: 2 }}>
            {/* Header with Date */}
            <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FiCalendar size={18} />
                    <Box>
                        <Typography variant="body1" fontWeight={600}>
                            Today's Daily Logs
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date().toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </Typography>
                    </Box>
                </Box>
                <CustomButton label="Create Daily Log" startIcon={<FiPlus />} onClick={() => setShowDailyLogDialog(true)} />
            </Box>

            {/* Metrics */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700}>
                            {metrics.totalLogs}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total Logs Today
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700} color="warning.main">
                            {metrics.openLogs}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Open Logs
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700} color="success.main">
                            {metrics.closedLogs}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Closed Logs
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: "center", borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight={700}>
                            {metrics.totalDistance.toFixed(0)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total Distance (km)
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Daily Log Table */}
            <CustomTable data={projectLogs} columns={dailyLogColumns} loading={loading} />

            {/* Create Daily Log Dialog */}
            <CustomModal
                open={showDailyLogDialog}
                onClose={() => {
                    setShowDailyLogDialog(false);
                    resetCreateForm();
                }}
                title="Create Daily Log"
                footer={
                    <>
                        <Button
                            onClick={() => {
                                setShowDailyLogDialog(false);
                                resetCreateForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleAddDailyLog} disabled={!isCreateFormValid}>
                            Create Log
                        </Button>
                    </>
                }
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <CustomDateInput label="Date" value={createDate} onChange={(date) => setCreateDate(date || new Date())} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <CustomSelect
                            label="Vehicle"
                            value={createVehicleId}
                            onChange={(value) => setCreateVehicleId(value)}
                            options={vehicleOptions}
                            required
                        />
                    </Grid>
                    {createVehicleId && (
                        <>
                            {lastClosingKm !== null && (
                                <Grid size={{ xs: 12 }}>
                                    <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
                                        Last closing KM for this vehicle: <strong>{lastClosingKm!.toFixed(1)} km</strong>
                                    </Alert>
                                </Grid>
                            )}
                            {openFuelEntry && (
                                <Grid size={{ xs: 12 }}>
                                    <Alert severity="warning" sx={{ fontSize: "0.875rem" }}>
                                        Open fuel entry exists. Opening KM: <strong>{openFuelEntry.openingKm.toFixed(1)} km</strong>
                                    </Alert>
                                </Grid>
                            )}
                        </>
                    )}
                    <Grid size={{ xs: 12 }}>
                        <CustomTextField
                            label="Opening KM"
                            type="number"
                            value={createOpeningKm}
                            onChange={(e) => setCreateOpeningKm(e.target.value)}
                            required
                            error={!!createFormErrors.openingKm}
                            helperText={createFormErrors.openingKm}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <CustomTextField
                            label="Opening KM Photo URL (Optional)"
                            value={createOpeningPhoto}
                            onChange={(e) => setCreateOpeningPhoto(e.target.value)}
                        />
                    </Grid>
                </Grid>
            </CustomModal>

            {/* Close Daily Log Dialog */}
            <CustomModal
                open={showCloseDailyLogDialog}
                onClose={() => {
                    setShowCloseDailyLogDialog(false);
                    setSelectedDailyLog(null);
                    resetCloseForm();
                }}
                title="Close Daily Log"
                footer={
                    <>
                        <Button
                            onClick={() => {
                                setShowCloseDailyLogDialog(false);
                                setSelectedDailyLog(null);
                                resetCloseForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleCloseDailyLog} disabled={!isCloseFormValid}>
                            Close Log
                        </Button>
                    </>
                }
            >
                {selectedDailyLog && (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body2">
                                <strong>Vehicle:</strong> {selectedDailyLog.vehicleName}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Opening KM:</strong> {selectedDailyLog.openingKm?.toFixed(1)}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <CustomTextField
                                label="Closing KM"
                                type="number"
                                value={closeClosingKm}
                                onChange={(e) => setCloseClosingKm(e.target.value)}
                                required
                                error={!!closeFormErrors.closingKm}
                                helperText={closeFormErrors.closingKm}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <CustomTextField
                                label="Closing KM Photo URL (Optional)"
                                value={closeClosingPhoto}
                                onChange={(e) => setCloseClosingPhoto(e.target.value)}
                            />
                        </Grid>
                        {closeClosingKm && selectedDailyLog.openingKm && (
                            <Grid size={{ xs: 12 }}>
                                <Alert severity="success">
                                    Distance: <strong>{(Number(closeClosingKm) - selectedDailyLog.openingKm).toFixed(1)} km</strong>
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                )}
            </CustomModal>
        </Box>
    );
};

export default DailyLogPage;
