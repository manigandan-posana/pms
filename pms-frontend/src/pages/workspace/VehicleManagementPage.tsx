import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiCheck, FiSlash, FiLock, FiUnlock, FiTruck } from "react-icons/fi";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Stack,
  Chip,
  Button,
  IconButton,
  Divider,
} from "@mui/material";

import {
  loadVehicleData,
  createVehicle,
  updateVehicleStatus,
  deleteVehicle,
  createFuelEntry,
  closeFuelEntry,
  refillFuelEntry,
  createSupplier,
  deleteSupplier,
  createDailyLog,
  closeDailyLog,
} from "../../store/slices/vehicleSlice";
import type { RootState, AppDispatch } from "../../store/store";
import type { Vehicle, FuelEntry, Supplier, DailyLog, VehicleType, FuelType, VehicleStatus } from "../../types/vehicle";

import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomButton from "../../widgets/CustomButton";
import CustomModal from "../../widgets/CustomModal";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";
import CustomDateInput from "../../widgets/CustomDateInput";
import CustomTabs from "../../widgets/CustomTabs";
import { Get } from "../../utils/apiService";

const VehicleManagementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
  const { vehicles, fuelEntries, suppliers, dailyLogs, status } = useSelector(
    (state: RootState) => state.vehicles
  );

  const loading = status === "loading";

  // Vehicle Dialog
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

  // Supplier Dialog
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    supplierName: "",
    contactPerson: "",
    phoneNumber: "",
    address: "",
  });

  // Fuel Management View Mode and Fuel Type Filter
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
    vehicleId: "" as string | number, // CustomSelect uses string|number
    supplierId: "" as string | number,
    litres: "" as string | number,
    openingKm: "" as string | number,
    pricePerLitre: "" as string | number,
  });

  // Close Fuel Entry Dialog
  const [showCloseFuelDialog, setShowCloseFuelDialog] = useState(false);
  const [selectedFuelEntry, setSelectedFuelEntry] = useState<FuelEntry | null>(null);
  const [closingKm, setClosingKm] = useState<string | number>("");

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
    return dailyLogs.filter(
      (log) =>
        new Date(log.date).toDateString() === today
    );
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

    return fuelEntries.find(
      (entry) => entry.vehicleId === vId && entry.status === "OPEN"
    );
  }, [createVehicleId, fuelEntries]);

  // Get vehicles that don't have an active (open) log currently
  const availableVehicles = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeProjectVehicles = vehicles.filter(
      (v) => {
        if (v.status === "INACTIVE") return false;

        // Check if start date is in the future (Planned)
        if (v.startDate) {
          const startDate = new Date(v.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (startDate > today) return false;
        }

        return true;
      }
    );

    // Find vehicle IDs that already have an OPEN log (global check, not just today)
    const vehiclesWithOpenLog = new Set(
      dailyLogs
        .filter(log => log.status === "OPEN")
        .map(log => log.vehicleId)
    );

    return activeProjectVehicles.filter(v => !vehiclesWithOpenLog.has(v.id));
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

  const [filteredFuelEntries, setFilteredFuelEntries] = useState<FuelEntry[]>([]);

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
    selectedProjectId,
    activeFuelType,
    fuelViewMode,
    fuelVehicleFilter,
    fuelSupplierFilter,
    fuelSearchQuery,
    fuelDateFrom,
    fuelDateTo,
    fuelEntries, // Add this to refresh when Redux state updates
  ]);

  // Summary metrics
  const fuelSummaryMetrics = useMemo(() => {
    const totalQuantity = filteredFuelEntries.reduce((sum, e) => sum + e.litres, 0);
    const totalCost = filteredFuelEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const totalDistance = filteredFuelEntries
      .filter(e => e.status === "CLOSED")
      .reduce((sum, e) => sum + (e.distance || 0), 0);
    return { totalQuantity, totalCost, totalDistance };
  }, [filteredFuelEntries]);

  const handleAddVehicle = async () => {
    if (!selectedProjectId || !vehicleForm.vehicleName || !vehicleForm.vehicleNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await dispatch(createVehicle({
        projectId: Number(selectedProjectId),
        vehicleName: vehicleForm.vehicleName,
        vehicleNumber: vehicleForm.vehicleNumber,
        vehicleType: vehicleForm.vehicleType,
        fuelType: vehicleForm.fuelType,
        status: vehicleForm.status,
        startDate: vehicleForm.startDate.toISOString().split('T')[0],
        endDate: vehicleForm.endDate ? vehicleForm.endDate.toISOString().split('T')[0] : undefined,
        rentPrice: vehicleForm.rentPrice || undefined,
        rentPeriod: vehicleForm.rentPrice ? vehicleForm.rentPeriod : undefined,
      })).unwrap();

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

  const handleAddSupplier = async () => {
    if (!selectedProjectId || !supplierForm.supplierName) {
      toast.error("Please enter supplier name");
      return;
    }

    try {
      await dispatch(createSupplier({
        projectId: Number(selectedProjectId),
        supplierName: supplierForm.supplierName,
        contactPerson: supplierForm.contactPerson || undefined,
        phoneNumber: supplierForm.phoneNumber || undefined,
        address: supplierForm.address || undefined,
      })).unwrap();

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

  const handleAddFuelEntry = async () => {
    if (!selectedProjectId || !fuelForm.vehicleId || !fuelForm.supplierId ||
      !fuelForm.litres || !fuelForm.openingKm || !fuelForm.pricePerLitre) {
      toast.error("Please fill in all required fields");
      return;
    }

    const openingKm = Number(fuelForm.openingKm);

    // Get the vehicle's daily logs to check if there are any open logs
    const vehicleDailyLogs = dailyLogs.filter((log) => log.vehicleId === Number(fuelForm.vehicleId));
    const openDailyLog = vehicleDailyLogs.find((log) => log.status === "OPEN");

    if (openDailyLog) {
      toast.error("Please close the open daily log before creating a new fuel entry");
      return;
    }

    // Get the last closed daily log's closing KM
    const closedDailyLogs = vehicleDailyLogs
      .filter((log) => log.status === "CLOSED" && log.closingKm != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastDailyLogClosingKm = closedDailyLogs.length > 0 ? closedDailyLogs[0].closingKm! : null;

    // Get the last closed fuel entry's closing KM
    const vehicleFuelEntries = fuelEntries.filter((entry) => entry.vehicleId === Number(fuelForm.vehicleId));
    const closedFuelEntries = vehicleFuelEntries
      .filter((entry) => entry.status === "CLOSED" && entry.closingKm != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastFuelEntryClosingKm = closedFuelEntries.length > 0 ? closedFuelEntries[0].closingKm! : null;

    // Enforce: opening km must be >= last closing km of previous daily log
    if (lastDailyLogClosingKm !== null && openingKm < lastDailyLogClosingKm) {
      toast.error(`Fuel entry opening km must be greater than or equal to the last daily log closing km (${lastDailyLogClosingKm.toFixed(1)} km)`);
      return;
    }
    // Enforce: opening km must be >= last closing km of previous fuel entry
    if (lastFuelEntryClosingKm !== null && openingKm < lastFuelEntryClosingKm) {
      toast.error(`Fuel entry opening km must be greater than or equal to the last fuel entry closing km (${lastFuelEntryClosingKm.toFixed(1)} km)`);
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
      toast.error(`Fuel closing km (${km.toFixed(1)}) must be ≥ daily log closing km (${latestDailyLogClosingKm.toFixed(1)} km)`);
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

  const handleRefillFuelEntry = async () => {
    if (!selectedProjectId || !refillForm.vehicleId || !refillForm.openingKm || !refillForm.supplierId || !refillForm.litres || !refillForm.pricePerLitre) {
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
      setRefillForm({
        date: new Date(),
        vehicleId: "",
        openingKm: "",
        supplierId: "",
        litres: "",
        pricePerLitre: "",
      });
    } catch (error) {
      toast.error("Failed to record refill");
      console.error(error);
    }
  };

  const handleAddDailyLog = async () => {
    if (!selectedProjectId || !createVehicleId || !createOpeningKm) {
      toast.error("Please fill in all required fields");
      return;
    }

    const vId = Number(createVehicleId);
    const existingOpenLog = dailyLogs.find(
      (log) => log.vehicleId === vId && log.status === "OPEN"
    );

    if (existingOpenLog) {
      toast.error("This vehicle already has an open daily log. Please close it first.");
      return;
    }

    const km = Number(createOpeningKm);
    if (lastClosingKm != null && km < lastClosingKm) {
      toast.error(`Opening km must be greater than or equal to the last daily log closing km (${lastClosingKm.toFixed(1)} km)`);
      return;
    }
    if (openFuelEntry && km < openFuelEntry.openingKm) {
      toast.error(`Opening km must be greater than or equal to the last fuel entry closing km (${openFuelEntry.openingKm.toFixed(1)} km)`);
      return;
    }

    try {
      await dispatch(createDailyLog({
        date: createDate.toISOString().split('T')[0],
        projectId: Number(selectedProjectId),
        vehicleId: vId,
        openingKm: km,
        openingKmPhoto: createOpeningPhoto || undefined,
      })).unwrap();

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
      await dispatch(closeDailyLog({ id: selectedDailyLog.id, data: { closingKm: km, closingKmPhoto: closeClosingPhoto || undefined } })).unwrap();
      toast.success("Daily log closed successfully");
      resetCloseForm();
      setShowCloseDailyLogDialog(false);
      setSelectedDailyLog(null);
    } catch (error) {
      toast.error("Failed to close daily log");
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

  const resetSupplierForm = () => {
    setSupplierForm({
      supplierName: "",
      contactPerson: "",
      phoneNumber: "",
      address: "",
    });
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
    { field: "vehicleName", header: "Vehicle Name", sortable: true, style: { minWidth: "120px" }, body: (row) => <Typography variant="body2" fontWeight={600} color="text.primary">{row.vehicleName}</Typography> },
    { field: "vehicleNumber", header: "Vehicle Number", sortable: true, style: { minWidth: "100px" } },
    { field: "vehicleType", header: "Type", sortable: true, style: { minWidth: "90px" } },
    { field: "fuelType", header: "Fuel Type", sortable: true, style: { minWidth: "80px" } },
    {
      field: "status", header: "Status", sortable: true,
      body: (row) => (
        <Chip
          label={row.status}
          size="small"
          sx={{
            height: 20,
            fontSize: '10px',
            bgcolor: row.status === 'ACTIVE' ? 'success.light' : 'grey',
            color: row.status === 'ACTIVE' ? 'success.dark' : 'white',
          }}
        />
      )
    },
    {
      field: "runningKm", header: "Running Km",
      body: (row) => {
        const runningKm = dailyLogs.filter(log => log.vehicleId === row.id && log.status === 'CLOSED')
          .reduce((sum, log) => sum + (log.distance || 0), 0);
        return <Typography variant="caption">{runningKm.toFixed(1)} km</Typography>;
      }
    },
    {
      field: "totalQty", header: "Total Qty",
      body: (row) => {
        const vehicleEntries = fuelEntries.filter(e => e.vehicleId === row.id);
        const totalLitres = vehicleEntries.reduce((sum, e) => sum + (e.litres || 0), 0);
        return <Typography variant="caption" color="text.secondary">{totalLitres.toFixed(2)} L</Typography>;
      }
    },
    {
      field: "totalCost", header: "Total Fuel Cost",
      body: (row) => {
        const vehicleEntries = fuelEntries.filter(e => e.vehicleId === row.id);
        const totalCost = vehicleEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
        return <Typography variant="body2" fontWeight={600} color="success.main">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>;
      }
    },
    {
      field: "avgMileage", header: "Avg Mileage",
      body: (row) => {
        const vehicleEntries = fuelEntries.filter(e => e.vehicleId === row.id && e.status === 'CLOSED');
        const totalKm = vehicleEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
        const totalLitres = fuelEntries.filter(e => e.vehicleId === row.id).reduce((sum, e) => sum + (e.litres || 0), 0);
        const avgMileage = totalLitres > 0 ? totalKm / totalLitres : 0;
        return <Typography variant="caption">{avgMileage.toFixed(2)} km/l</Typography>;
      }
    },
    {
      field: "rentCost", header: "Rent Cost",
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
        return <Typography variant="body2" fontWeight={600} color="warning.main">₹{totalRentCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>;
      }
    },
    {
      field: "actions", header: "Actions", align: "right",
      body: (row) => {
        const isActive = row.status === 'ACTIVE';
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton
              size="small"
              sx={{ color: isActive ? 'warning.main' : 'success.main' }}
              title={isActive ? "Mark Inactive" : "Mark Active"}
              onClick={async (e) => {
                e.stopPropagation();
                const newStatus = isActive ? "INACTIVE" : "ACTIVE";
                const reason = prompt(`Reason for changing status to ${newStatus}:`);
                if (reason) {
                  try {
                    await dispatch(updateVehicleStatus({
                      id: row.id,
                      data: { status: newStatus, statusChangeDate: new Date().toISOString().split('T')[0], reason },
                    })).unwrap();
                    toast.success(`Vehicle status updated to ${newStatus}`);
                  } catch (error) { toast.error("Failed to update status"); }
                }
              }}
            >
              {isActive ? <FiSlash size={16} /> : <FiCheck size={16} />}
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(row.id); }}
            >
              <FiTrash2 size={16} />
            </IconButton>
          </Stack>
        )
      }
    }
  ];

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

  const supplierColumns: ColumnDef<Supplier>[] = [
    { field: "supplierName", header: "Supplier Name", sortable: true },
    { field: "contactPerson", header: "Contact Person", sortable: true },
    { field: "phoneNumber", header: "Phone", sortable: true },
    { field: "address", header: "Address", sortable: true },
    {
      field: "actions", header: "Actions", align: "right", body: (row) => (
        <IconButton size="small" color="error" onClick={() => handleDeleteSupplier(row.id)}>
          <FiTrash2 size={16} />
        </IconButton>
      )
    }
  ];

  const dailyLogColumns: ColumnDef<DailyLog>[] = [
    { field: "date", header: "Date", sortable: true, body: (row) => new Date(row.date).toLocaleDateString() },
    { field: "vehicleName", header: "Vehicle", sortable: true },
    { field: "openingKm", header: "Opening Km", sortable: true, body: (row) => row.openingKm != null ? `${row.openingKm.toFixed(1)} km` : "—" },
    { field: "closingKm", header: "Closing Km", sortable: true, body: (row) => row.closingKm != null ? `${row.closingKm.toFixed(1)} km` : "—" },
    {
      field: "distance", header: "Distance", sortable: true, body: (row) => {
        if (row.closingKm != null && row.openingKm != null) {
          const diff = row.closingKm - row.openingKm;
          return <Typography variant="body2" fontWeight={700} color="success.main">{diff.toFixed(1)} km</Typography>;
        }
        return row.distance != null ? `${row.distance.toFixed(1)} km` : "—";
      }
    },
    {
      field: "status", header: "Status", align: "center", sortable: true, body: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {row.status === 'OPEN' ? (
            <Chip
              label="OPEN"
              size="small"
              sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 700, fontSize: '0.65rem' }}
            />
          ) : (
            <Chip
              icon={<FiCheck />}
              label="CLOSED"
              size="small"
              sx={{ bgcolor: 'success.light', color: 'success.dark', fontWeight: 700, fontSize: '0.65rem' }}
            />
          )}
        </Box>
      )
    },
    {
      field: "actions", header: "Actions", align: "right", body: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {row.status === "OPEN" ? (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => { setSelectedDailyLog(row); setShowCloseDailyLogDialog(true); }}
              startIcon={<FiLock size={14} />}
              sx={{ fontSize: '0.7rem', py: 0.5, minWidth: 0 }}
            >
              Close
            </Button>
          ) : (
            <Typography variant="caption" color="text.secondary" fontStyle="italic">Completed</Typography>
          )}
        </Box>
      )
    }
  ];

  if (!selectedProjectId) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <FiTruck size={48} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
          <Typography variant="body1" color="text.secondary">Select a project to manage vehicles</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">Vehicle Management</Typography>
          <Typography variant="caption" color="text.secondary">Manage fleet, fuel, and daily logs</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <CustomButton startIcon={<FiPlus />} onClick={() => setShowVehicleDialog(true)} size="small">
            Add Vehicle
          </CustomButton>
          <CustomButton variant="outlined" startIcon={<FiPlus />} onClick={() => setShowSupplierDialog(true)} size="small">
            Add Supplier
          </CustomButton>
        </Stack>
      </Paper>

      {/* Content Area */}
      <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Box sx={{ maxWidth: '100%', mx: 'auto' }}>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <CustomTabs
                tabs={[
                  {
                    label: "Vehicles",
                    content: (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <CustomButton startIcon={<FiPlus />} onClick={() => setShowVehicleDialog(true)} size="small">Add Vehicle</CustomButton>
                        </Box>
                        <CustomTable data={vehicles} columns={vehicleColumns} loading={loading} pagination rows={10} onRowClick={(row) => navigate(`/workspace/vehicles/${row.id}`)} />
                      </Box>
                    )
                  },
                  {
                    label: "Fuel Management",
                    content: (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Summary Metrics */}
                        <Grid container spacing={2}>
                          {[
                            { label: "Total Qty", value: `${fuelSummaryMetrics.totalQuantity.toFixed(2)} L` },
                            { label: "Total Cost", value: `₹${fuelSummaryMetrics.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
                            { label: "Total Distance", value: `${fuelSummaryMetrics.totalDistance.toFixed(2)} km` }
                          ].map((metric, i) => (
                            <Grid size={{ xs: 12, sm: 4 }} key={i}>
                              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>{metric.label}</Typography>
                                <Typography variant="subtitle2" fontWeight={700}>{metric.value}</Typography>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={1} bgcolor="grey.100" p={0.5} borderRadius={1}>
                            {['current', 'history'].map((mode) => (
                              <Button
                                key={mode}
                                size="small"
                                variant={fuelViewMode === mode ? 'contained' : 'text'}
                                color="primary"
                                onClick={() => { setFuelViewMode(mode as any); setFuelVehicleFilter(null); setActiveFuelType('DIESEL'); }}
                                sx={{ textTransform: 'capitalize', bgcolor: fuelViewMode === mode ? 'background.paper' : 'transparent', color: fuelViewMode === mode ? 'primary.main' : 'text.secondary', boxShadow: fuelViewMode === mode ? 1 : 0 }}
                              >
                                {mode}
                              </Button>
                            ))}
                          </Stack>

                          <Stack direction="row" spacing={1}>
                            {['DIESEL', 'PETROL', 'ELECTRIC'].map((type) => (
                              <Button
                                key={type}
                                size="small"
                                onClick={() => { setActiveFuelType(type as any); setFuelVehicleFilter(null); }}
                                sx={{
                                  textTransform: 'capitalize',
                                  borderBottom: 2,
                                  borderColor: activeFuelType === type ? 'primary.main' : 'transparent',
                                  borderRadius: 0,
                                  color: activeFuelType === type ? 'primary.main' : 'text.secondary',
                                  pt: 1, pb: 0.5
                                }}
                              >
                                {type.toLowerCase()}
                              </Button>
                            ))}
                          </Stack>
                        </Stack>

                        {fuelViewMode === 'history' && (
                          <Grid container spacing={2} sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                            <Grid size={{ xs: 12, md: 3 }}>
                              <CustomTextField placeholder="Search..." value={fuelSearchQuery} onChange={(e) => setFuelSearchQuery(e.target.value)} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 2 }}>
                              <CustomSelect
                                label="Vehicle"
                                value={fuelVehicleFilter || ""}
                                onChange={(v) => setFuelVehicleFilter(v ? Number(v) : null)}
                                options={[{ label: "All Vehicles", value: "" }, ...vehicles.map(v => ({ label: v.vehicleName, value: v.id }))]}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 2 }}>
                              <CustomSelect
                                label="Supplier"
                                value={fuelSupplierFilter || ""}
                                onChange={(v) => setFuelSupplierFilter(v ? Number(v) : null)}
                                options={[{ label: "All Suppliers", value: "" }, ...suppliers.map(s => ({ label: s.supplierName, value: s.id }))]}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 2.5 }}>
                              <CustomDateInput value={fuelDateFrom} onChange={(e) => setFuelDateFrom(e.value as Date)} label="From Date" />
                            </Grid>
                            <Grid size={{ xs: 12, md: 2.5 }}>
                              <CustomDateInput value={fuelDateTo} onChange={(e) => setFuelDateTo(e.value as Date)} label="To Date" />
                            </Grid>
                          </Grid>
                        )}

                        {fuelViewMode === 'current' && (
                          <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <CustomButton
                              startIcon={<FiPlus />}
                              onClick={() => { resetRefillForm(); setShowRefillDialog(true); }}
                              sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
                            >
                              Refill
                            </CustomButton>
                            <CustomButton startIcon={<FiPlus />} onClick={() => setShowFuelDialog(true)}>Add Fuel Entry</CustomButton>
                          </Stack>
                        )}

                        <CustomTable data={filteredFuelEntries} columns={fuelColumns} loading={loading} pagination rows={20} />
                      </Box>
                    )
                  },
                  {
                    label: "Suppliers",
                    content: (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <CustomButton startIcon={<FiPlus />} onClick={() => setShowSupplierDialog(true)} size="small">Add Supplier</CustomButton>
                        </Box>
                        <CustomTable data={suppliers} columns={supplierColumns} loading={loading} pagination rows={10} />
                      </Box>
                    )
                  },
                  {
                    label: "Daily Logs",
                    content: (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <CustomButton startIcon={<FiPlus />} onClick={() => { resetCreateForm(); setShowDailyLogDialog(true); }} size="small">Create Daily Log</CustomButton>
                        </Box>
                        <CustomTable data={projectLogs} columns={dailyLogColumns} loading={loading} pagination rows={10} />
                      </Box>
                    )
                  }
                ]}
              />
            </Box>
          </Paper>

        </Box>
      </Box>

      {/* Vehicle Modal */}
      <CustomModal open={showVehicleDialog} onClose={() => setShowVehicleDialog(false)} title="Add Vehicle"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowVehicleDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddVehicle}>Save</CustomButton>
          </Stack>
        }
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomTextField label="Vehicle Name" required value={vehicleForm.vehicleName} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomTextField label="Vehicle Number" required value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect label="Vehicle Type" required value={vehicleForm.vehicleType} onChange={(v) => setVehicleForm({ ...vehicleForm, vehicleType: v as VehicleType })} options={vehicleTypeOptions} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect label="Fuel Type" required value={vehicleForm.fuelType} onChange={(v) => setVehicleForm({ ...vehicleForm, fuelType: v as FuelType })} options={fuelTypeOptions} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect label="Status" required value={vehicleForm.status} onChange={(v) => setVehicleForm({ ...vehicleForm, status: v as VehicleStatus })} options={statusOptions} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomDateInput label="Start Date" required value={vehicleForm.startDate} onChange={(e) => setVehicleForm({ ...vehicleForm, startDate: e.value as Date })} />
          </Grid>
          {vehicleForm.vehicleType !== "OWN_VEHICLE" && (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField label="Rent Price" type="number" value={vehicleForm.rentPrice || ""} onChange={(e) => setVehicleForm({ ...vehicleForm, rentPrice: parseFloat(e.target.value) || null })} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomSelect label="Rent Period" value={vehicleForm.rentPeriod} onChange={(v) => setVehicleForm({ ...vehicleForm, rentPeriod: v as any })} options={[{ label: "Monthly", value: "MONTHLY" }, { label: "Daily", value: "DAILY" }, { label: "Hourly", value: "HOURLY" }]} />
              </Grid>
            </>
          )}
        </Grid>
      </CustomModal>

      {/* Supplier Modal */}
      <CustomModal open={showSupplierDialog} onClose={() => setShowSupplierDialog(false)} title="Add Supplier"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowSupplierDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddSupplier}>Save</CustomButton>
          </Stack>
        }
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <CustomTextField label="Supplier Name" required value={supplierForm.supplierName} onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomTextField label="Contact Person" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomTextField label="Phone Number" value={supplierForm.phoneNumber} onChange={(e) => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <CustomTextField label="Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
          </Grid>
        </Grid>
      </CustomModal>

      {/* Fuel Entry Modal */}
      <CustomModal open={showFuelDialog} onClose={() => setShowFuelDialog(false)} title="Add Fuel Entry"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowFuelDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddFuelEntry}>Save</CustomButton>
          </Stack>
        }
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <CustomDateInput label="Date" required value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.value as Date })} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect label="Vehicle" required value={fuelForm.vehicleId} onChange={(v) => setFuelForm({ ...fuelForm, vehicleId: v })} options={vehicles.map(v => ({ label: `${v.vehicleName} (${v.vehicleNumber})`, value: v.id }))} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CustomSelect label="Supplier" required value={fuelForm.supplierId} onChange={(v) => setFuelForm({ ...fuelForm, supplierId: v })} options={suppliers.map(s => ({ label: s.supplierName, value: s.id }))} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CustomTextField label="Quantity" required type="number" value={fuelForm.litres} onChange={(e) => setFuelForm({ ...fuelForm, litres: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CustomTextField label="Opening KM" required type="number" value={fuelForm.openingKm} onChange={(e) => setFuelForm({ ...fuelForm, openingKm: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <CustomTextField label="Unit Price" required type="number" value={fuelForm.pricePerLitre} onChange={(e) => setFuelForm({ ...fuelForm, pricePerLitre: e.target.value })} />
          </Grid>
        </Grid>
      </CustomModal>

      {/* Close Fuel Entry Modal */}
      <CustomModal open={showCloseFuelDialog} onClose={() => setShowCloseFuelDialog(false)} title="Close Fuel Entry"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowCloseFuelDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleCloseFuelEntry}>Close Entry</CustomButton>
          </Stack>
        }
      >
        <Stack spacing={3} pt={1}>
          <CustomTextField label="Opening KM" disabled value={selectedFuelEntry?.openingKm} />
          <CustomTextField label="Closing KM" required type="number" value={closingKm} onChange={(e) => setClosingKm(e.target.value)} />
        </Stack>
      </CustomModal>

      {/* Refill Dialog */}
      <CustomModal
        open={showRefillDialog}
        onClose={() => setShowRefillDialog(false)}
        title="Refill Vehicle"
        maxWidth="sm"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <CustomButton variant="outlined" onClick={() => setShowRefillDialog(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              variant="contained"
              color="primary"
              onClick={handleRefillFuelEntry}
              disabled={!refillForm.vehicleId || !refillForm.openingKm || !refillForm.supplierId || !refillForm.litres || !refillForm.pricePerLitre}
            >
              Confirm Refill
            </CustomButton>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <CustomDateInput
            label="Date"
            value={refillForm.date}
            onChange={(date) => setRefillForm({ ...refillForm, date: date.value || new Date() })}
          />
          <CustomSelect
            label="Vehicle"
            value={refillForm.vehicleId}
            onChange={(e) => setRefillForm({ ...refillForm, vehicleId: e })}
            options={vehicles
              .filter(v => v.status === "ACTIVE")
              .map((v) => ({ label: `${v.vehicleName} (${v.vehicleNumber})`, value: v.id }))}
          />
          <CustomTextField
            label="Opening Km (Current Odometer)"
            type="number"
            value={refillForm.openingKm}
            onChange={(e) => setRefillForm({ ...refillForm, openingKm: e.target.value })}
          />
          <CustomSelect
            label="Supplier"
            required
            value={refillForm.supplierId}
            onChange={(e) => setRefillForm({ ...refillForm, supplierId: e })}
            options={suppliers.map(s => ({ label: s.supplierName, value: s.id }))}
          />
          <CustomTextField
            label="Quantity (Litres)"
            type="number"
            required
            value={refillForm.litres}
            onChange={(e) => setRefillForm({ ...refillForm, litres: e.target.value })}
          />
          <CustomTextField
            label="Unit Price (₹/L)"
            type="number"
            required
            value={refillForm.pricePerLitre}
            onChange={(e) => setRefillForm({ ...refillForm, pricePerLitre: e.target.value })}
          />
        </Stack>
      </CustomModal>

      {/* Daily Log Create Modal */}
      <CustomModal open={showDailyLogDialog} onClose={() => setShowDailyLogDialog(false)} title="Create Daily Log"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowDailyLogDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddDailyLog} disabled={!isCreateFormValid}>Create</CustomButton>
          </Stack>
        }
      >
        <Stack spacing={2} pt={1}>
          <CustomDateInput label="Date" disabled value={createDate} onChange={() => { }} />
          <CustomSelect
            label="Vehicle"
            required
            value={createVehicleId}
            onChange={(v) => setCreateVehicleId(v)}
            options={availableVehicles.map(v => ({ label: `${v.vehicleName} (${v.vehicleNumber})`, value: v.id }))}
          />

          <Box>
            <CustomTextField
              label="Opening Km"
              required
              type="number"
              value={createOpeningKm}
              onChange={(e) => setCreateOpeningKm(e.target.value)}
              error={!!createFormErrors.openingKm}
              helperText={createFormErrors.openingKm}
            />
            {createVehicleId && lastClosingKm != null && createOpeningKm && Number(createOpeningKm) >= lastClosingKm && (
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                <FiCheck style={{ marginRight: 4 }} /> Difference: {(Number(createOpeningKm) - lastClosingKm).toFixed(1)} km
              </Typography>
            )}
            {createVehicleId && lastClosingKm != null && !createOpeningKm && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>Last Closing Km: {lastClosingKm.toFixed(1)} km</Typography>
            )}
          </Box>
        </Stack>
      </CustomModal>

      {/* Daily Log Close Modal */}
      <CustomModal open={showCloseDailyLogDialog} onClose={() => setShowCloseDailyLogDialog(false)} title="Close Daily Log"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowCloseDailyLogDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleCloseDailyLog} disabled={!isCloseFormValid}>Close Log</CustomButton>
          </Stack>
        }
      >
        <Stack spacing={3} pt={1}>
          {selectedDailyLog && (
            <>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary">Vehicle</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedDailyLog.vehicleName}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">Opening Km</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedDailyLog.openingKm}</Typography>
              </Paper>
              <CustomTextField
                label="Closing Km"
                required
                type="number"
                value={closeClosingKm}
                onChange={(e) => setCloseClosingKm(e.target.value)}
                error={!!closeFormErrors.closingKm}
                helperText={closeFormErrors.closingKm}
              />
            </>
          )}
        </Stack>
      </CustomModal>
    </Box>
  );
};

export default VehicleManagementPage;
