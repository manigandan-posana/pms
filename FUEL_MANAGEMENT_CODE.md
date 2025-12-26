# FuelManagementPage.tsx - Complete Implementation

## File: src/pages/workspace/FuelManagementPage.tsx

```typescript
import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { FiPlus, FiLock, FiUnlock, FiRefreshCw } from "react-icons/fi";
import {
  Box, Paper, Typography, Grid, Stack, Chip, Button, IconButton,
  ToggleButtonGroup, ToggleButton, Divider
} from "@mui/material";

import {
  loadVehicleData, createFuelEntry, closeFuelEntry, refillFuelEntry
} from "../../store/slices/vehicleSlice";
import type { RootState, AppDispatch } from "../../store/store";
import type { FuelEntry, FuelType } from "../../types/vehicle";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";
import CustomDateInput from "../../widgets/CustomDateInput";
import { Get } from "../../utils/apiService";

const FuelManagementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
  const { vehicles, fuelEntries, suppliers, dailyLogs, status } = useSelector(
    (state: RootState) => state.vehicles
  );

  const loading = status === "loading";

  // View Mode and Filters
  const [fuelViewMode, setFuelViewMode] = useState<"current" | "history">("current");
  const [activeFuelType, setActiveFuelType] = useState<FuelType>("DIESEL");
  const [fuelSearchQuery, setFuelSearchQuery] = useState<string>("");
  const [fuelVehicleFilter, setFuelVehicleFilter] = useState<number | null>(null);
  const [fuelSupplierFilter, setFuelSupplierFilter] = useState<number | null>(null);
  const [fuelDateFrom, setFuelDateFrom] = useState<Date | null>(null);
  const [fuelDateTo, setFuelDateTo] = useState<Date | null>(null);

  // Fuel Entry Dialog
  const [showFuelDialog, setShowFuelDialog] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    date: new Date(),
    vehicleId: "" as string | number,
    supplierId: "" as string | number,
    litres: "" as string | number,
    openingKm: "" as string | number,
    pricePerLitre: "" as string | number,
  });

  // Close Fuel Entry Dialog
  const [showCloseFuelDialog, setShowCloseFuelDialog] = useState(false);
  const [selectedFuelEntry, setSelectedFuelEntry] = useState<FuelEntry | null>(null);
  const [closingKm, setClosingKm] = useState<string | number>("");

  // Refill Dialog
  const [showRefillDialog, setShowRefillDialog] = useState(false);
  const [refillForm, setRefillForm] = useState({
    date: new Date(),
    vehicleId: "" as string | number,
    openingKm: "" as string | number,
    supplierId: "" as string | number,
    litres: "" as string | number,
    pricePerLitre: "" as string | number,
  });

  const [filteredFuelEntries, setFilteredFuelEntries] = useState<FuelEntry[]>([]);

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(loadVehicleData(Number(selectedProjectId)));
    }
  }, [selectedProjectId, dispatch]);

  useEffect(() => {
    const loadFilteredFuelEntries = async () => {
      if (!selectedProjectId) {
        setFilteredFuelEntries([]);
        return;
      }
      const params: Record<string, any> = {
        fuelType: activeFuelType,
        status: fuelViewMode === "current" ? "OPEN" : "CLOSED",
      };

      if (fuelViewMode === "history") {
        if (fuelVehicleFilter) params.vehicleId = fuelVehicleFilter;
        if (fuelSupplierFilter) params.supplierId = fuelSupplierFilter;
        if (fuelSearchQuery.trim()) params.search = fuelSearchQuery.trim();
        if (fuelDateFrom) params.startDate = fuelDateFrom.toISOString().split("T")[0];
        if (fuelDateTo) params.endDate = fuelDateTo.toISOString().split("T")[0];
      }

      const response = await Get<FuelEntry[]>(`/vehicles/fuel-entries/project/${selectedProjectId}`, params);
      setFilteredFuelEntries(Array.isArray(response) ? response : []);
    };
    loadFilteredFuelEntries();
  }, [
    selectedProjectId, activeFuelType, fuelViewMode, fuelVehicleFilter,
    fuelSupplierFilter, fuelSearchQuery, fuelDateFrom, fuelDateTo, fuelEntries
  ]);

  const fuelSummaryMetrics = useMemo(() => {
    const totalQuantity = filteredFuelEntries.reduce((sum, e) => sum + e.litres, 0);
    const totalCost = filteredFuelEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const totalDistance = filteredFuelEntries
      .filter(e => e.status === "CLOSED")
      .reduce((sum, e) => sum + (e.distance || 0), 0);
    const avgMileage = totalQuantity > 0 ? totalDistance / totalQuantity : 0;
    return { totalQuantity, totalCost, totalDistance, avgMileage };
  }, [filteredFuelEntries]);

  const handleAddFuelEntry = async () => {
    if (!selectedProjectId || !fuelForm.vehicleId || !fuelForm.supplierId ||
      !fuelForm.litres || !fuelForm.openingKm || !fuelForm.pricePerLitre) {
      toast.error("Please fill in all required fields");
      return;
    }

    const openingKm = Number(fuelForm.openingKm);
    const vehicleDailyLogs = dailyLogs.filter((log) => log.vehicleId === Number(fuelForm.vehicleId));
    const openDailyLog = vehicleDailyLogs.find((log) => log.status === "OPEN");

    if (openDailyLog) {
      toast.error("Please close the open daily log before creating a new fuel entry");
      return;
    }

    const closedDailyLogs = vehicleDailyLogs
      .filter((log) => log.status === "CLOSED" && log.closingKm != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDailyLogClosingKm = closedDailyLogs.length > 0 ? closedDailyLogs[0].closingKm! : null;

    const vehicleFuelEntries = fuelEntries.filter((entry) => entry.vehicleId === Number(fuelForm.vehicleId));
    const closedFuelEntries = vehicleFuelEntries
      .filter((entry) => entry.status === "CLOSED" && entry.closingKm != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastFuelEntryClosingKm = closedFuelEntries.length > 0 ? closedFuelEntries[0].closingKm! : null;

    if (lastDailyLogClosingKm !== null && openingKm < lastDailyLogClosingKm) {
      toast.error(`Fuel entry opening km must be >= last daily log closing km (${lastDailyLogClosingKm.toFixed(1)} km)`);
      return;
    }
    if (lastFuelEntryClosingKm !== null && openingKm < lastFuelEntryClosingKm) {
      toast.error(`Fuel entry opening km must be >= last fuel entry closing km (${lastFuelEntryClosingKm.toFixed(1)} km)`);
      return;
    }

    try {
      await dispatch(createFuelEntry({
        date: fuelForm.date.toISOString().split('T')[0],
        projectId: Number(selectedProjectId),
        vehicleId: Number(fuelForm.vehicleId),
        supplierId: Number(fuelForm.supplierId),
        litres: Number(fuelForm.litres),
        openingKm: openingKm,
        pricePerLitre: Number(fuelForm.pricePerLitre),
      })).unwrap();

      toast.success("Fuel entry added successfully");
      setShowFuelDialog(false);
      resetFuelForm();
    } catch (error) {
      toast.error("Failed to add fuel entry");
      console.error(error);
    }
  };

  const handleCloseFuelEntry = async () => {
    const km = Number(closingKm);
    if (!selectedFuelEntry || !closingKm) {
      toast.error("Please enter closing km");
      return;
    }

    if (km < selectedFuelEntry.openingKm) {
      toast.error("Closing km cannot be less than opening km");
      return;
    }

    const vehicleDailyLogs = dailyLogs
      .filter((log) => log.vehicleId === selectedFuelEntry.vehicleId && log.status === "CLOSED" && log.closingKm)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestDailyLogClosingKm = vehicleDailyLogs.length > 0 ? vehicleDailyLogs[0].closingKm : null;

    if (latestDailyLogClosingKm != null && km < latestDailyLogClosingKm) {
      toast.error(`Fuel closing km (${km.toFixed(1)}) must be >= daily log closing km (${latestDailyLogClosingKm.toFixed(1)} km)`);
      return;
    }

    try {
      await dispatch(closeFuelEntry({ id: selectedFuelEntry.id, data: { closingKm: km } })).unwrap();
      toast.success("Fuel entry closed successfully");
      setShowCloseFuelDialog(false);
      setSelectedFuelEntry(null);
      setClosingKm("");
    } catch (error) {
      toast.error("Failed to close fuel entry");
      console.error(error);
    }
  };

  const handleRefillFuelEntry = async () => {
    if (!selectedProjectId || !refillForm.vehicleId || !refillForm.openingKm || 
        !refillForm.supplierId || !refillForm.litres || !refillForm.pricePerLitre) {
      toast.error("Please fill in all required fields");
      return;
    }

    const openingKm = Number(refillForm.openingKm);
    const vehicleDailyLogs = dailyLogs
      .filter((log) => log.vehicleId === Number(refillForm.vehicleId) && log.status === "CLOSED" && log.closingKm != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDailyLogKm = vehicleDailyLogs.length > 0 ? vehicleDailyLogs[0].closingKm! : null;

    const vehicleFuelEntries = fuelEntries
      .filter((entry) => entry.vehicleId === Number(refillForm.vehicleId) && entry.status === "CLOSED" && entry.closingKm != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastFuelEntryKm = vehicleFuelEntries.length > 0 ? vehicleFuelEntries[0].closingKm! : null;

    const maxClosedKm = Math.max(lastDailyLogKm || 0, lastFuelEntryKm || 0);
    const openEntry = fuelEntries.find(e => e.vehicleId === Number(refillForm.vehicleId) && e.status === "OPEN");
    
    if (openEntry && openingKm < openEntry.openingKm) {
      toast.error(`Refill KM cannot be less than current Open Entry KM (${openEntry.openingKm})`);
      return;
    }

    if (openingKm < maxClosedKm) {
      toast.error(`Refill KM cannot be less than last recorded KM (${maxClosedKm})`);
      return;
    }

    try {
      await dispatch(refillFuelEntry({
        date: refillForm.date.toISOString().split('T')[0],
        projectId: Number(selectedProjectId),
        vehicleId: Number(refillForm.vehicleId),
        openingKm: openingKm,
        supplierId: Number(refillForm.supplierId),
        litres: Number(refillForm.litres),
        pricePerLitre: Number(refillForm.pricePerLitre),
      })).unwrap();

      toast.success("Refill recorded successfully");
      setShowRefillDialog(false);
      resetRefillForm();
    } catch (error) {
      toast.error("Failed to record refill");
      console.error(error);
    }
  };

  const resetFuelForm = () => {
    setFuelForm({
      date: new Date(),
      vehicleId: "",
      supplierId: "",
      litres: "",
      openingKm: "",
      pricePerLitre: "",
    });
  };

  const resetRefillForm = () => {
    setRefillForm({
      date: new Date(),
      vehicleId: "",
      openingKm: "",
      supplierId: "",
      litres: "",
      pricePerLitre: "",
    });
  };

  const fuelColumns: ColumnDef<FuelEntry>[] = [
    { field: "date", header: "Date", sortable: true, body: (row) => new Date(row.date).toLocaleDateString() },
    { field: "vehicleName", header: "Vehicle", sortable: true, body: (row) => <Typography variant="body2" fontWeight={600}>{row.vehicleName}</Typography> },
    { field: "supplierName", header: "Supplier", sortable: true, body: (row) => <Typography variant="caption" color="text.secondary">{row.supplierName}</Typography> },
    { field: "pricePerLitre", header: "Unit Price", sortable: true, body: (row) => row.pricePerLitre != null ? `₹${row.pricePerLitre.toFixed(2)}` : "—" },
    { field: "litres", header: "Quantity", sortable: true, body: (row) => row.litres != null ? `${row.litres.toFixed(2)} L` : "—" },
    { field: "totalCost", header: "Fuel Cost", sortable: true, body: (row) => (row.pricePerLitre != null && row.litres != null) ? `₹${(row.pricePerLitre * row.litres).toFixed(2)}` : "—" },
    { field: "openingKm", header: "Op. Km", sortable: true, body: (row) => row.openingKm != null ? row.openingKm.toFixed(1) : "—" },
    { field: "closingKm", header: "Cl. Km", sortable: true, body: (row) => (row.status === "CLOSED" && row.closingKm != null) ? row.closingKm.toFixed(1) : "—" },
    { field: "distance", header: "Dist.", sortable: true, body: (row) => (row.status === "CLOSED" && row.distance != null) ? `${row.distance.toFixed(1)} km` : "—" },
    { field: "mileage", header: "Mileage", sortable: true, body: (row) => (row.status === "CLOSED" && row.mileage != null) ? row.mileage.toFixed(2) : "—" },
    {
      field: "status", header: "Status", align: "center", body: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {row.status === "OPEN" ? (
            <IconButton
              size="small"
              color="warning"
              title="Open - Click to close entry"
              onClick={() => { setSelectedFuelEntry(row); setShowCloseFuelDialog(true); }}
            >
              <FiUnlock size={18} />
            </IconButton>
          ) : (
            <FiLock size={18} style={{ color: '#10b981' }} title="Closed" />
          )}
        </Box>
      )
    }
  ];

  const vehicleOptions = vehicles.map(v => ({ label: `${v.vehicleName} (${v.vehicleNumber})`, value: v.id }));
  const supplierOptions = suppliers.map(s => ({ label: s.supplierName, value: s.id }));

  return (
    <Box sx={{ p: 2 }}>
      {/* View Mode Toggle */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={fuelViewMode}
          exclusive
          onChange={(_, newMode) => newMode && setFuelViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="current">Current</ToggleButton>
          <ToggleButton value="history">History</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1}>
          <CustomButton
            label="Add Fuel Entry"
            icon={<FiPlus />}
            onClick={() => setShowFuelDialog(true)}
          />
          <CustomButton
            label="Refill"
            icon={<FiRefreshCw />}
            onClick={() => setShowRefillDialog(true)}
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Fuel Type Tabs */}
      <ToggleButtonGroup
        value={activeFuelType}
        exclusive
        onChange={(_, newType) => newType && setActiveFuelType(newType)}
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="DIESEL">Diesel</ToggleButton>
        <ToggleButton value="PETROL">Petrol</ToggleButton>
        <ToggleButton value="ELECTRIC">Electric</ToggleButton>
      </ToggleButtonGroup>

      {/* Filters (History Mode) */}
      {fuelViewMode === "history" && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <CustomSelect
              label="Vehicle"
              value={fuelVehicleFilter || ""}
              onChange={(value) => setFuelVehicleFilter(value ? Number(value) : null)}
              options={[{ label: "All Vehicles", value: "" }, ...vehicleOptions]}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomSelect
              label="Supplier"
              value={fuelSupplierFilter || ""}
              onChange={(value) => setFuelSupplierFilter(value ? Number(value) : null)}
              options={[{ label: "All Suppliers", value: "" }, ...supplierOptions]}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomDateInput
              label="From Date"
              value={fuelDateFrom}
              onChange={(date) => setFuelDateFrom(date)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomDateInput
              label="To Date"
              value={fuelDateTo}
              onChange={(date) => setFuelDateTo(date)}
            />
          </Grid>
        </Grid>
      )}

      {/* Summary Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700}>{fuelSummaryMetrics.totalQuantity.toFixed(2)}</Typography>
            <Typography variant="caption" color="text.secondary">Total Litres</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              ₹{fuelSummaryMetrics.totalCost.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" color="text.secondary">Total Cost</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700}>{fuelSummaryMetrics.totalDistance.toFixed(0)}</Typography>
            <Typography variant="caption" color="text.secondary">Total Distance (km)</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {fuelSummaryMetrics.avgMileage.toFixed(2)}
            </Typography>
            <Typography variant="caption" color="text.secondary">Avg Mileage (km/l)</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Fuel Table */}
      <CustomTable
        data={filteredFuelEntries}
        columns={fuelColumns}
        loading={loading}
      />

      {/* Add Fuel Entry Dialog */}
      <CustomModal
        open={showFuelDialog}
        onClose={() => { setShowFuelDialog(false); resetFuelForm(); }}
        title="Add Fuel Entry"
        actions={
          <>
            <Button onClick={() => { setShowFuelDialog(false); resetFuelForm(); }}>Cancel</Button>
            <Button variant="contained" onClick={handleAddFuelEntry}>Add Entry</Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <CustomDateInput label="Date" value={fuelForm.date} onChange={(date) => setFuelForm({ ...fuelForm, date: date || new Date() })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomSelect label="Vehicle" value={fuelForm.vehicleId} onChange={(value) => setFuelForm({ ...fuelForm, vehicleId: value })} options={vehicleOptions} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomSelect label="Supplier" value={fuelForm.supplierId} onChange={(value) => setFuelForm({ ...fuelForm, supplierId: value })} options={supplierOptions} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomTextField label="Litres" type="number" value={fuelForm.litres} onChange={(e) => setFuelForm({ ...fuelForm, litres: e.target.value })} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomTextField label="Opening KM" type="number" value={fuelForm.openingKm} onChange={(e) => setFuelForm({ ...fuelForm, openingKm: e.target.value })} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomTextField label="Price per Litre" type="number" value={fuelForm.pricePerLitre} onChange={(e) => setFuelForm({ ...fuelForm, pricePerLitre: e.target.value })} required />
          </Grid>
        </Grid>
      </CustomModal>

      {/* Close Fuel Entry Dialog */}
      <CustomModal
        open={showCloseFuelDialog}
        onClose={() => { setShowCloseFuelDialog(false); setSelectedFuelEntry(null); setClosingKm(""); }}
        title="Close Fuel Entry"
        actions={
          <>
            <Button onClick={() => { setShowCloseFuelDialog(false); setSelectedFuelEntry(null); setClosingKm(""); }}>Cancel</Button>
            <Button variant="contained" onClick={handleCloseFuelEntry}>Close Entry</Button>
          </>
        }
      >
        {selectedFuelEntry && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2"><strong>Vehicle:</strong> {selectedFuelEntry.vehicleName}</Typography>
              <Typography variant="body2"><strong>Opening KM:</strong> {selectedFuelEntry.openingKm.toFixed(1)}</Typography>
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                label="Closing KM"
                type="number"
                value={closingKm}
                onChange={(e) => setClosingKm(e.target.value)}
                required
              />
            </Grid>
          </Grid>
        )}
      </CustomModal>

      {/* Refill Dialog */}
      <CustomModal
        open={showRefillDialog}
        onClose={() => { setShowRefillDialog(false); resetRefillForm(); }}
        title="Refill Fuel Entry"
        actions={
          <>
            <Button onClick={() => { setShowRefillDialog(false); resetRefillForm(); }}>Cancel</Button>
            <Button variant="contained" onClick={handleRefillFuelEntry}>Record Refill</Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <CustomDateInput label="Date" value={refillForm.date} onChange={(date) => setRefillForm({ ...refillForm, date: date || new Date() })} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomSelect label="Vehicle" value={refillForm.vehicleId} onChange={(value) => setRefillForm({ ...refillForm, vehicleId: value })} options={vehicleOptions} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomTextField label="Opening KM" type="number" value={refillForm.openingKm} onChange={(e) => setRefillForm({ ...refillForm, openingKm: e.target.value })} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomSelect label="Supplier" value={refillForm.supplierId} onChange={(value) => setRefillForm({ ...refillForm, supplierId: value })} options={supplierOptions} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomTextField label="Litres" type="number" value={refillForm.litres} onChange={(e) => setRefillForm({ ...refillForm, litres: e.target.value })} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CustomTextField label="Price per Litre" type="number" value={refillForm.pricePerLitre} onChange={(e) => setRefillForm({ ...refillForm, pricePerLitre: e.target.value })} required />
          </Grid>
        </Grid>
      </CustomModal>
    </Box>
  );
};

export default FuelManagementPage;
```

## Key Features Implemented:

✅ View modes (Current/History)
✅ Fuel type tabs (Diesel/Petrol/Electric)
✅ Advanced filters for history mode
✅ Add fuel entry with KM validation
✅ Close fuel entry with validation
✅ Refill functionality
✅ Summary metrics
✅ Responsive table
✅ All validation logic preserved

## File Size: ~600 lines
