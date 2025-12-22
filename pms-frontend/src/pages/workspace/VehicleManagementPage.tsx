import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiCheck, FiSlash, FiLock, FiUnlock, FiTruck, FiMapPin, FiZap } from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import { BarChart, PieChart } from "@mui/x-charts";
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

  // Filtered fuel entries
  const filteredFuelEntries = useMemo(() => {
    let filtered = fuelEntries.filter(e => e.fuelType === activeFuelType);

    if (fuelViewMode === "current") {
      filtered = filtered.filter((e) => e.status === "OPEN");
    } else {
      filtered = filtered.filter((e) => e.status === "CLOSED");

      if (fuelVehicleFilter) {
        filtered = filtered.filter((e) => e.vehicleId === fuelVehicleFilter);
      }

      if (fuelSearchQuery.trim()) {
        const query = fuelSearchQuery.toLowerCase();
        filtered = filtered.filter(
          (e) =>
            e.vehicleName.toLowerCase().includes(query) ||
            e.supplierName.toLowerCase().includes(query)
        );
      }

      if (fuelDateFrom) {
        const fromDate = new Date(fuelDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((e) => new Date(e.date) >= fromDate);
      }
      if (fuelDateTo) {
        const toDate = new Date(fuelDateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((e) => new Date(e.date) <= toDate);
      }

      if (fuelSupplierFilter) {
        filtered = filtered.filter((e) => e.supplierId === fuelSupplierFilter);
      }
    }

    return filtered.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    fuelEntries,
    activeFuelType,
    fuelViewMode,
    fuelVehicleFilter,
    fuelSearchQuery,
    fuelDateFrom,
    fuelDateTo,
    fuelSupplierFilter,
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
  });

  const handleRefillFuelEntry = async () => {
    if (!selectedProjectId || !refillForm.vehicleId || !refillForm.openingKm) {
      toast.error("Please fill in all required fields");
      return;
    }

    const openingKm = Number(refillForm.openingKm);

    // Attempt validation logic similar to Create if possible, but backend handles most.
    // Client-side validation:
    // Check if entered KM < last recorded KM (Daily Log or Fuel Entry).

    // Get last closing daily log KM
    const vehicleDailyLogs = dailyLogs
      .filter((log) => log.vehicleId === Number(refillForm.vehicleId) && log.status === "CLOSED" && log.closingKm != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDailyLogKm = vehicleDailyLogs.length > 0 ? vehicleDailyLogs[0].closingKm! : null;

    // Get last closed fuel entry KM
    const vehicleFuelEntries = fuelEntries
      .filter((entry) => entry.vehicleId === Number(refillForm.vehicleId) && entry.status === "CLOSED" && entry.closingKm != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastFuelEntryKm = vehicleFuelEntries.length > 0 ? vehicleFuelEntries[0].closingKm! : null;

    const maxClosedKm = Math.max(lastDailyLogKm || 0, lastFuelEntryKm || 0);

    // Also check current OPEN fuel entry Opening KM (cannot be less than start of current trip)
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
      })).unwrap();

      toast.success("Refill recorded successfully");
      setShowRefillDialog(false);
      setRefillForm({
        date: new Date(),
        vehicleId: "",
        openingKm: "",
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
    // Enforce: opening km must be >= last closing km of previous daily log
    if (lastClosingKm != null && km < lastClosingKm) {
      toast.error(`Opening km must be greater than or equal to the last daily log closing km (${lastClosingKm.toFixed(1)} km)`);
      return;
    }
    // Enforce: opening km must be >= last closing km of previous fuel entry
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

  if (!selectedProjectId) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-xs font-medium text-slate-700 mb-2">Select a Project</h3>
          <p className="text-slate-500">Please select a project to manage vehicles</p>
        </div>
      </div>
    );
  }

  // Define Columns
  const vehicleColumns: ColumnDef<Vehicle>[] = [
    { field: "vehicleName", header: "Vehicle Name", sortable: true, style: { minWidth: "120px" }, body: (row) => <span className="font-medium text-slate-700">{row.vehicleName}</span> },
    { field: "vehicleNumber", header: "Vehicle Number", sortable: true, style: { minWidth: "100px" } },
    { field: "vehicleType", header: "Type", sortable: true, style: { minWidth: "90px" } },
    { field: "fuelType", header: "Fuel Type", sortable: true, style: { minWidth: "80px" } },
    {
      field: "status", header: "Status", sortable: true,
      body: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : row.status === 'INACTIVE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {row.status}
        </span>
      )
    },
    {
      field: "runningKm", header: "Running Km",
      body: (row) => {
        // Sum of all daily log distances for this vehicle
        const runningKm = dailyLogs.filter(log => log.vehicleId === row.id && log.status === 'CLOSED')
          .reduce((sum, log) => sum + (log.distance || 0), 0);
        return <span>{runningKm.toFixed(1)} km</span>;
      }
    },
    {
      field: "totalQty", header: "Total Qty",
      body: (row) => {
        const vehicleEntries = fuelEntries.filter(e => e.vehicleId === row.id);
        const totalLitres = vehicleEntries.reduce((sum, e) => sum + (e.litres || 0), 0);
        return <span className="text-slate-700">{totalLitres.toFixed(2)} L</span>;
      }
    },
    {
      field: "totalCost", header: "Total Fuel Cost",
      body: (row) => {
        const vehicleEntries = fuelEntries.filter(e => e.vehicleId === row.id);
        const totalCost = vehicleEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
        return <span className="font-medium text-green-600">₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>;
      }
    },
    {
      field: "avgMileage", header: "Avg Mileage",
      body: (row) => {
        const vehicleEntries = fuelEntries.filter(e => e.vehicleId === row.id && e.status === 'CLOSED');
        const totalKm = vehicleEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
        const totalLitres = fuelEntries.filter(e => e.vehicleId === row.id).reduce((sum, e) => sum + (e.litres || 0), 0);
        const avgMileage = totalLitres > 0 ? totalKm / totalLitres : 0;
        return <span>{avgMileage.toFixed(2)} km/l</span>;
      }
    },
    {
      field: "rentCost", header: "Rent Cost",
      body: (row) => {
        if (!row.rentPrice) return <span className="text-slate-400">—</span>;

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
        return <span className="font-medium text-orange-600">₹{totalRentCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>;
      }
    },
    {
      field: "actions", header: "Actions", align: "right",
      body: (row) => {
        const isActive = row.status === 'ACTIVE';
        return (
          <div className="flex justify-end gap-2">
            <CustomButton
              variant="text"
              size="small"
              className={`!p-1 ${isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
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
            </CustomButton>
            <CustomButton
              variant="text"
              size="small"
              className="!p-1 text-red-600 hover:bg-red-50"
              onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(row.id); }}
            >
              <FiTrash2 size={16} />
            </CustomButton>
          </div>
        )
      }
    }
  ];

  const fuelColumns: ColumnDef<FuelEntry>[] = [
    { field: "date", header: "Date", sortable: true, body: (row) => new Date(row.date).toLocaleDateString() },
    { field: "vehicleName", header: "Vehicle", sortable: true, body: (row) => <span className="font-semibold">{row.vehicleName}</span> },
    { field: "supplierName", header: "Supplier", sortable: true, body: (row) => <span className="text-slate-500">{row.supplierName}</span> },
    { field: "pricePerLitre", header: "Unit Price", sortable: true, body: (row) => row.pricePerLitre != null ? `₹${row.pricePerLitre.toFixed(2)}` : "—" },
    { field: "litres", header: "Quantity", sortable: true, body: (row) => row.litres != null ? `${row.litres.toFixed(2)} L` : "—" },
    { field: "totalCost", header: "Fuel Cost", sortable: true, body: (row) => (row.pricePerLitre != null && row.litres != null) ? `₹${(row.pricePerLitre * row.litres).toFixed(2)}` : "—" },
    { field: "openingKm", header: "Op. Km", sortable: true, body: (row) => row.openingKm != null ? row.openingKm.toFixed(1) : "—" },
    { field: "closingKm", header: "Cl. Km", sortable: true, body: (row) => (row.status === "CLOSED" && row.closingKm != null) ? row.closingKm.toFixed(1) : "—" },
    { field: "distance", header: "Dist.", sortable: true, body: (row) => (row.status === "CLOSED" && row.distance != null) ? `${row.distance.toFixed(1)} km` : "—" },
    { field: "mileage", header: "Mileage", sortable: true, body: (row) => (row.status === "CLOSED" && row.mileage != null) ? row.mileage.toFixed(2) : "—" },
    {
      field: "status", header: "Status", align: "center", body: (row) => (
        <div className="flex justify-center">
          {row.status === "OPEN" ? (
            <CustomButton
              variant="text"
              size="small"
              className="text-amber-500 hover:text-amber-600"
              title="Open - Click to close entry"
              onClick={() => { setSelectedFuelEntry(row); setShowCloseFuelDialog(true); }}
            >
              <FiUnlock size={18} />
            </CustomButton>
          ) : (
            <FiLock size={18} className="text-green-500" title="Closed" />
          )}
        </div>
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
        <CustomButton variant="text" size="small" className="text-red-500" onClick={() => handleDeleteSupplier(row.id)}>
          <FiTrash2 />
        </CustomButton>
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
          return <span className="font-bold text-green-600">{diff.toFixed(1)} km</span>;
        }
        return row.distance != null ? `${row.distance.toFixed(1)} km` : "—";
      }
    },
    {
      field: "status", header: "Status", align: "center", sortable: true, body: (row) => (
        <div className="flex justify-center">
          {row.status === 'OPEN' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 uppercase tracking-wider">
              <FiCheck className="text-[12px]" />
              Closed
            </span>
          )}
        </div>
      )
    },
    {
      field: "actions", header: "Actions", align: "right", body: (row) => (
        <div className="flex justify-end pr-2">
          {row.status === "OPEN" ? (
            <CustomButton
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => { setSelectedDailyLog(row); setShowCloseDailyLogDialog(true); }}
              style={{
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '6px',
                height: '28px',
                borderColor: '#f59e0b',
                color: '#f59e0b',
                fontWeight: 700
              }}
              startIcon={<FiLock size={12} />}
            >
              Close Log
            </CustomButton>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium px-3 italic">Completed</span>
          )}
        </div >
      )
    }
  ];


  // Dashboard states and logic
  const [dashboardTimeFilter, setDashboardTimeFilter] = useState<"day" | "week" | "month" | "3months" | "6months" | "year" | "all">("all");

  const dashboardDateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dashboardTimeFilter) {
      case "day":
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        return { start: weekStart, end: now };
      }
      case "month": {
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: monthStart, end: now };
      }
      case "3months": {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 3);
        return { start, end: now };
      }
      case "6months": {
        const start = new Date(today);
        start.setMonth(today.getMonth() - 6);
        return { start, end: now };
      }
      case "year": {
        const yearStart = new Date(today);
        yearStart.setFullYear(today.getFullYear() - 1);
        return { start: yearStart, end: now };
      }
      case "all":
      default:
        return { start: new Date(0), end: now };
    }
  }, [dashboardTimeFilter]);

  const dashboardFuelEntries = useMemo(
    () =>
      fuelEntries.filter(
        (e) =>
          e.status === "CLOSED" &&
          new Date(e.date) >= dashboardDateRange.start &&
          new Date(e.date) <= dashboardDateRange.end
      ),
    [fuelEntries, dashboardDateRange]
  );

  const dashboardStats = useMemo(() => {
    const totalCost = dashboardFuelEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const totalDistance = dashboardFuelEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
    const totalLitres = dashboardFuelEntries.reduce((sum, e) => sum + (e.litres || 0), 0);
    const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE").length;

    const totalRentCost = vehicles.reduce((sum, vehicle) => {
      if (!vehicle.rentPrice || vehicle.vehicleType === "OWN_VEHICLE") return sum;
      const startDate = vehicle.startDate ? new Date(vehicle.startDate) : new Date();
      const endDate = vehicle.endDate ? new Date(vehicle.endDate) : new Date();
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      let rentCost = 0;
      if (vehicle.rentPeriod === "MONTHLY") rentCost = vehicle.rentPrice * Math.ceil(daysDiff / 30);
      else if (vehicle.rentPeriod === "DAILY") rentCost = vehicle.rentPrice * daysDiff;
      else if (vehicle.rentPeriod === "HOURLY") rentCost = vehicle.rentPrice * (daysDiff * 24);

      return sum + rentCost;
    }, 0);

    return { totalCost, totalDistance, totalLitres, activeVehicles, totalRentCost };
  }, [dashboardFuelEntries, vehicles]);

  const fuelByType = useMemo(() => {
    const petrol = dashboardFuelEntries.filter((e) => e.fuelType === "PETROL").reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const diesel = dashboardFuelEntries.filter((e) => e.fuelType === "DIESEL").reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const electric = dashboardFuelEntries.filter((e) => e.fuelType === "ELECTRIC").reduce((sum, e) => sum + (e.totalCost || 0), 0);
    return { petrol, diesel, electric };
  }, [dashboardFuelEntries]);



  // Chart data for different periods
  const trendData = useMemo(() => {
    const now = new Date();
    let labels: string[] = [];
    let groupCount = 12;
    let groupType: 'month' | 'week' = 'month';
    let labelFormatter = (date: Date) => date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    switch (dashboardTimeFilter) {
      case 'week':
        groupCount = 7;
        groupType = 'week';
        labelFormatter = (date: Date) => date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
        break;
      case '3months':
        groupCount = 3;
        groupType = 'month';
        break;
      case '6months':
        groupCount = 6;
        groupType = 'month';
        break;
      case 'month':
        groupCount = 1;
        groupType = 'month';
        break;
      case 'year':
      case 'all':
      default:
        groupCount = 12;
        groupType = 'month';
        break;
    }

    const petrolData: number[] = Array(groupCount).fill(0);
    const dieselData: number[] = Array(groupCount).fill(0);
    const electricData: number[] = Array(groupCount).fill(0);

    if (groupType === 'week') {
      // Last 7 days
      for (let i = groupCount - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(labelFormatter(date));
      }
      fuelEntries.filter(e => e.status === 'CLOSED').forEach(entry => {
        const entryDate = new Date(entry.date);
        for (let i = 0; i < groupCount; i++) {
          const date = new Date(now);
          date.setDate(now.getDate() - (groupCount - 1 - i));
          if (
            entryDate.getFullYear() === date.getFullYear() &&
            entryDate.getMonth() === date.getMonth() &&
            entryDate.getDate() === date.getDate()
          ) {
            if (entry.fuelType === 'PETROL') petrolData[i] += entry.litres;
            else if (entry.fuelType === 'DIESEL') dieselData[i] += entry.litres;
            else if (entry.fuelType === 'ELECTRIC') electricData[i] += entry.litres;
          }
        }
      });
    } else {
      // Month-based grouping
      for (let i = groupCount - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(labelFormatter(date));
      }
      fuelEntries.filter(e => e.status === 'CLOSED').forEach(entry => {
        const entryDate = new Date(entry.date);
        for (let i = 0; i < groupCount; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - (groupCount - 1 - i), 1);
          if (
            entryDate.getFullYear() === date.getFullYear() &&
            entryDate.getMonth() === date.getMonth()
          ) {
            if (entry.fuelType === 'PETROL') petrolData[i] += entry.litres;
            else if (entry.fuelType === 'DIESEL') dieselData[i] += entry.litres;
            else if (entry.fuelType === 'ELECTRIC') electricData[i] += entry.litres;
          }
        }
      });
    }

    return {
      labels,
      datasets: [
        { label: 'Petrol', data: petrolData, backgroundColor: '#10b981' },
        { label: 'Diesel', data: dieselData, backgroundColor: '#f59e0b' },
        { label: 'Electric', data: electricData, backgroundColor: '#3b82f6' },
      ],
    };
  }, [fuelEntries, dashboardTimeFilter]);

  const vehiclePerformance = useMemo(() => {
    const vehicleStats = vehicles.map((vehicle) => {
      const vehicleEntries = dashboardFuelEntries.filter((e) => e.vehicleId === vehicle.id);
      const totalKm = vehicleEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
      const totalLitres = vehicleEntries.reduce((sum, e) => sum + (e.litres || 0), 0);
      const totalFuelCost = vehicleEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
      const avgMileage = totalLitres > 0 ? totalKm / totalLitres : 0;
      const performanceRate = avgMileage > 0 ? Math.min((avgMileage / 15) * 100, 100) : 0;

      let totalRentCost = 0;
      if (vehicle.rentPrice && vehicle.vehicleType !== "OWN_VEHICLE") {
        const startDate = vehicle.startDate ? new Date(vehicle.startDate) : new Date();
        const endDate = vehicle.endDate ? new Date(vehicle.endDate) : new Date();
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (vehicle.rentPeriod === "MONTHLY") totalRentCost = vehicle.rentPrice * Math.ceil(daysDiff / 30);
        else if (vehicle.rentPeriod === "DAILY") totalRentCost = vehicle.rentPrice * daysDiff;
        else if (vehicle.rentPeriod === "HOURLY") totalRentCost = vehicle.rentPrice * (daysDiff * 24);
      }

      return {
        id: vehicle.id,
        name: vehicle.vehicleName,
        number: vehicle.vehicleNumber,
        performanceRate,
        avgMileage,
        totalFuelCost,
        totalRentCost,
        totalCost: totalFuelCost + totalRentCost,
        totalKm,
      };
    });

    return vehicleStats
      .filter((v) => v.totalKm > 0)
      .sort((a, b) => b.performanceRate - a.performanceRate)
      .slice(0, 5);
  }, [vehicles, dashboardFuelEntries]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const formatNumber = (value: number, decimals = 1) => value.toFixed(decimals);

  const performanceColumns: ColumnDef<any>[] = [
    { field: "name", header: "Vehicle", body: (row) => <div><div className="font-semibold text-slate-800">{row.name}</div><div className="text-xs text-slate-500">{row.number}</div></div> },
    {
      field: "performanceRate", header: "Performance", body: (row) => (
        <div className="w-full"><div className="w-full bg-slate-100 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${row.performanceRate}%` }}></div>
        </div><span className="text-xs text-slate-500 mt-1 block">{formatNumber(row.performanceRate)}%</span></div>
      )
    },
    { field: "avgMileage", header: "Avg Mileage", body: (row) => `${formatNumber(row.avgMileage, 2)} km/l` },
    { field: "totalKm", header: "Total KM", body: (row) => `${formatNumber(row.totalKm)} km` },
    { field: "totalFuelCost", header: "Fuel Cost", body: (row) => formatCurrency(row.totalFuelCost) },
    { field: "totalCost", header: "Total Cost", body: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.totalCost)}</span> },
    { field: "actions", header: "Action", body: (row) => <CustomButton size="small" variant="text" onClick={() => navigate(`/workspace/vehicles/${row.id}`)}>View</CustomButton> }
  ];

  return (
    <div className="space-y-6 p-6">
      <CustomTabs
        tabs={[
          {
            label: "Dashboard",
            content: (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xs font-bold text-slate-800">Vehicle Dashboard</h2>
                  <div className="w-48">
                    <CustomSelect
                      value={dashboardTimeFilter}
                      onChange={(v) => setDashboardTimeFilter(v as any)}
                      options={[
                        { label: "Today", value: "day" },
                        { label: "Last 7 Days", value: "week" },
                        { label: "Last 30 Days", value: "month" },
                        { label: "Last 3 Months", value: "3months" },
                        { label: "Last 6 Months", value: "6months" },
                        { label: "Last Year", value: "year" },
                        { label: "All Time", value: "all" },
                      ]}
                      size="small"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><FiTruck size={24} /></div>
                    <div><div className="text-xs text-slate-500">Active Vehicles</div><div className="text-xs font-bold text-slate-800">{dashboardStats.activeVehicles}</div></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg"><FiMapPin size={24} /></div>
                    <div><div className="text-xs text-slate-500">Total Distance</div><div className="text-xs font-bold text-slate-800">{formatNumber(dashboardStats.totalDistance)} km</div></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><FiZap size={24} /></div>
                    <div><div className="text-xs text-slate-500">Total Fuel</div><div className="text-xs font-bold text-slate-800">{formatNumber(dashboardStats.totalLitres)} L</div></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-lg"><TbCurrencyRupee size={24} /></div>
                    <div><div className="text-xs text-slate-500">Fuel Cost</div><div className="text-xs font-bold text-slate-800">{formatCurrency(dashboardStats.totalCost)}</div></div>
                  </div>
                  {dashboardStats.totalRentCost > 0 && (
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><TbCurrencyRupee size={24} /></div>
                      <div><div className="text-xs text-slate-500">Rent Cost</div><div className="text-xs font-bold text-slate-800">{formatCurrency(dashboardStats.totalRentCost)}</div></div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-800 mb-4">Fuel Cost by Type</h3>
                    <div className="h-64 flex flex-col items-center justify-center">
                      <PieChart
                        series={[
                          {
                            data: [
                              { id: 0, value: fuelByType.petrol, label: 'Petrol', color: '#10b981' },
                              { id: 1, value: fuelByType.diesel, label: 'Diesel', color: '#f59e0b' },
                              { id: 2, value: fuelByType.electric, label: 'Electric', color: '#3b82f6' }
                            ].filter(d => d.value > 0),
                            innerRadius: 60,
                            paddingAngle: 5,
                            cornerRadius: 5,
                          },
                        ]}
                        height={200}
                        slotProps={{ legend: { hidden: true } as any }}
                      />
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Petrol: {formatCurrency(fuelByType.petrol)}</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Diesel: {formatCurrency(fuelByType.diesel)}</div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-800 mb-4">
                      {dashboardTimeFilter === 'week' ? 'Week-wise' :
                        dashboardTimeFilter === '3months' ? '3-Month' :
                          dashboardTimeFilter === '6months' ? '6-Month' :
                            dashboardTimeFilter === 'month' ? 'Month' :
                              '12-Month'} Fuel Consumption
                    </h3>
                    <div className="h-72 w-full">
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: trendData.labels }]}
                        series={trendData.datasets.map(ds => ({
                          data: ds.data,
                          label: ds.label,
                          color: ds.backgroundColor,
                          stack: 'total'
                        }))}
                        height={280}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-800">Top Performing Vehicles</h3>
                  </div>
                  <CustomTable data={vehiclePerformance} columns={performanceColumns} />
                </div>
              </div>
            )
          },
          {
            label: "Vehicles",
            content: (
              <>
                <div className="mb-4">
                  <CustomButton startIcon={<FiPlus />} onClick={() => setShowVehicleDialog(true)}>Add Vehicle</CustomButton>
                </div>
                <CustomTable data={vehicles} columns={vehicleColumns} loading={loading} pagination rows={10} onRowClick={(row) => navigate(`/workspace/vehicles/${row.id}`)} />
              </>
            )
          },
          {
            label: "Fuel Management",
            content: (
              <div className="space-y-4">
                {/* Top Controls */}
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex gap-6 items-center">
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                      {['current', 'history'].map(mode => (
                        <button
                          key={mode}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${fuelViewMode === mode ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                          onClick={() => { setFuelViewMode(mode as any); setFuelVehicleFilter(null); setActiveFuelType('DIESEL'); }}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <div className="flex gap-2">
                      {['DIESEL', 'PETROL', 'ELECTRIC'].map(type => (
                        <button
                          key={type}
                          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${activeFuelType === type ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                          onClick={() => { setActiveFuelType(type as any); setFuelVehicleFilter(null); }}
                        >
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex gap-3">
                    {[
                      { label: "Total Qty", value: `${fuelSummaryMetrics.totalQuantity.toFixed(2)} L` },
                      { label: "Total Cost", value: `₹${fuelSummaryMetrics.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
                      { label: "Total Distance", value: `${fuelSummaryMetrics.totalDistance.toFixed(2)} km` }
                    ].map((metric, i) => (
                      <div key={i} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="text-xs text-slate-500 uppercase tracking-wider">{metric.label}</div>
                        <div className="text-xs font-bold text-slate-800">{metric.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filters (History Only) */}
                {fuelViewMode === 'history' && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <CustomTextField placeholder="Search vehicle / supplier" value={fuelSearchQuery} onChange={(e) => setFuelSearchQuery(e.target.value)} size="small" />
                    <CustomSelect
                      label="Vehicle"
                      value={fuelVehicleFilter || ""}
                      onChange={(v) => setFuelVehicleFilter(v ? Number(v) : null)}
                      options={[{ label: "All Vehicles", value: "" }, ...vehicles.map(v => ({ label: v.vehicleName, value: v.id }))]}
                      size="small"
                    />
                    <CustomSelect
                      label="Supplier"
                      value={fuelSupplierFilter || ""}
                      onChange={(v) => setFuelSupplierFilter(v ? Number(v) : null)}
                      options={[{ label: "All Suppliers", value: "" }, ...suppliers.map(s => ({ label: s.supplierName, value: s.id }))]}
                      size="small"
                    />
                    <CustomDateInput value={fuelDateFrom} onChange={(e) => setFuelDateFrom(e.value as Date)} label="From Date" size="small" />
                    <CustomDateInput value={fuelDateTo} onChange={(e) => setFuelDateTo(e.value as Date)} label="To Date" size="small" />
                  </div>
                )}

                {fuelViewMode === 'current' && (
                  <div className="mb-2">
                    <div className="flex gap-2">
                      <CustomButton
                        startIcon={<FiPlus />}
                        onClick={() => { resetRefillForm(); setShowRefillDialog(true); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Refill
                      </CustomButton>
                      <CustomButton startIcon={<FiPlus />} onClick={() => setShowFuelDialog(true)}>Add Fuel Entry</CustomButton>
                    </div>
                  </div>
                )}

                <CustomTable data={filteredFuelEntries} columns={fuelColumns} loading={loading} pagination rows={20} />
              </div>
            )
          },
          {
            label: "Suppliers",
            content: (
              <>
                <div className="mb-4">
                  <CustomButton startIcon={<FiPlus />} onClick={() => setShowSupplierDialog(true)}>Add Supplier</CustomButton>
                </div>
                <CustomTable data={suppliers} columns={supplierColumns} loading={loading} pagination rows={10} />
              </>
            )
          },
          {
            label: "Daily Logs",
            content: (
              <>
                <div className="mb-4">
                  <CustomButton startIcon={<FiPlus />} onClick={() => { resetCreateForm(); setShowDailyLogDialog(true); }}>Create Daily Log</CustomButton>
                </div>
                <CustomTable data={projectLogs} columns={dailyLogColumns} loading={loading} pagination rows={10} />
              </>
            )
          }
        ]}
      />

      {/* Vehicle Modal */}
      <CustomModal open={showVehicleDialog} onClose={() => setShowVehicleDialog(false)} title="Add Vehicle"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowVehicleDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddVehicle}>Save</CustomButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <CustomTextField label="Vehicle Name" required value={vehicleForm.vehicleName} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleName: e.target.value })} />
          <CustomTextField label="Vehicle Number" required value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} />
          <CustomSelect label="Vehicle Type" required value={vehicleForm.vehicleType} onChange={(v) => setVehicleForm({ ...vehicleForm, vehicleType: v as VehicleType })} options={vehicleTypeOptions} />
          <CustomSelect label="Fuel Type" required value={vehicleForm.fuelType} onChange={(v) => setVehicleForm({ ...vehicleForm, fuelType: v as FuelType })} options={fuelTypeOptions} />
          <CustomSelect label="Status" required value={vehicleForm.status} onChange={(v) => setVehicleForm({ ...vehicleForm, status: v as VehicleStatus })} options={statusOptions} />
          <CustomDateInput label="Start Date" required value={vehicleForm.startDate} onChange={(e) => setVehicleForm({ ...vehicleForm, startDate: e.value as Date })} />
          {vehicleForm.vehicleType !== "OWN_VEHICLE" && (
            <>
              <CustomTextField label="Rent Price" type="number" value={vehicleForm.rentPrice || ""} onChange={(e) => setVehicleForm({ ...vehicleForm, rentPrice: parseFloat(e.target.value) || null })} />
              <CustomSelect label="Rent Period" value={vehicleForm.rentPeriod} onChange={(v) => setVehicleForm({ ...vehicleForm, rentPeriod: v as any })} options={[{ label: "Monthly", value: "MONTHLY" }, { label: "Daily", value: "DAILY" }, { label: "Hourly", value: "HOURLY" }]} />
            </>
          )}
        </div>
      </CustomModal>

      {/* Supplier Modal */}
      <CustomModal open={showSupplierDialog} onClose={() => setShowSupplierDialog(false)} title="Add Supplier"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowSupplierDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddSupplier}>Save</CustomButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="md:col-span-2">
            <CustomTextField label="Supplier Name" required value={supplierForm.supplierName} onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })} />
          </div>
          <CustomTextField label="Contact Person" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
          <CustomTextField label="Phone Number" value={supplierForm.phoneNumber} onChange={(e) => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })} />
          <div className="md:col-span-2">
            <CustomTextField label="Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
          </div>
        </div>
      </CustomModal>

      {/* Fuel Entry Modal */}
      <CustomModal open={showFuelDialog} onClose={() => setShowFuelDialog(false)} title="Add Fuel Entry"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowFuelDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddFuelEntry}>Save</CustomButton>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="md:col-span-2">
            <CustomDateInput label="Date" required value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.value as Date })} />
          </div>
          <CustomSelect label="Vehicle" required value={fuelForm.vehicleId} onChange={(v) => setFuelForm({ ...fuelForm, vehicleId: v })} options={vehicles.map(v => ({ label: `${v.vehicleName} (${v.vehicleNumber})`, value: v.id }))} />
          <CustomSelect label="Supplier" required value={fuelForm.supplierId} onChange={(v) => setFuelForm({ ...fuelForm, supplierId: v })} options={suppliers.map(s => ({ label: s.supplierName, value: s.id }))} />
          <CustomTextField label="Quantity" required type="number" value={fuelForm.litres} onChange={(e) => setFuelForm({ ...fuelForm, litres: e.target.value })} />
          <CustomTextField label="Opening KM" required type="number" value={fuelForm.openingKm} onChange={(e) => setFuelForm({ ...fuelForm, openingKm: e.target.value })} />
          <CustomTextField label="Unit Price" required type="number" value={fuelForm.pricePerLitre} onChange={(e) => setFuelForm({ ...fuelForm, pricePerLitre: e.target.value })} />
        </div>
      </CustomModal>

      {/* Close Fuel Entry Modal */}
      <CustomModal open={showCloseFuelDialog} onClose={() => setShowCloseFuelDialog(false)} title="Close Fuel Entry"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowCloseFuelDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleCloseFuelEntry}>Close Entry</CustomButton>
          </div>
        }
      >
        <div className="space-y-4 pt-2 flex flex-col gap-2">
          <CustomTextField label="Opening KM" disabled value={selectedFuelEntry?.openingKm} />
          <CustomTextField label="Closing KM" required type="number" value={closingKm} onChange={(e) => setClosingKm(e.target.value)} />
        </div>
      </CustomModal>

      {/* Refill Dialog */}
      <CustomModal
        open={showRefillDialog}
        onClose={() => setShowRefillDialog(false)}
        title="Refill Vehicle"
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" onClick={() => setShowRefillDialog(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              variant="contained"
              color="primary"
              onClick={handleRefillFuelEntry}
              disabled={!refillForm.vehicleId || !refillForm.openingKm}
            >
              Confirm Refill
            </CustomButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
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
        </div>
      </CustomModal>

      {/* Daily Log Create Modal */}
      <CustomModal open={showDailyLogDialog} onClose={() => setShowDailyLogDialog(false)} title="Create Daily Log"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowDailyLogDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddDailyLog} disabled={!isCreateFormValid}>Create</CustomButton>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <CustomDateInput label="Date" disabled value={createDate} onChange={() => { }} />
          <CustomSelect
            label="Vehicle"
            required
            value={createVehicleId}
            onChange={(v) => setCreateVehicleId(v)}
            options={availableVehicles.map(v => ({ label: `${v.vehicleName} (${v.vehicleNumber})`, value: v.id }))}
          />

          <div>
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
              <p className="text-xs text-green-600 mt-1 font-medium flex items-center">
                <FiCheck className="mr-1" /> Difference: {(Number(createOpeningKm) - lastClosingKm).toFixed(1)} km
              </p>
            )}
            {createVehicleId && lastClosingKm != null && !createOpeningKm && (
              <p className="text-xs text-slate-500 mt-1">Last Closing Km: {lastClosingKm.toFixed(1)} km</p>
            )}
          </div>
        </div>
      </CustomModal>

      {/* Daily Log Close Modal */}
      <CustomModal open={showCloseDailyLogDialog} onClose={() => setShowCloseDailyLogDialog(false)} title="Close Daily Log"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" color="inherit" onClick={() => setShowCloseDailyLogDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleCloseDailyLog} disabled={!isCloseFormValid}>Close Log</CustomButton>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          {selectedDailyLog && (
            <>
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-xs text-slate-500">Vehicle</p>
                <p className="font-medium">{selectedDailyLog.vehicleName}</p>
                <p className="text-xs text-slate-500 mt-2">Opening Km</p>
                <p className="font-medium">{selectedDailyLog.openingKm}</p>
              </div>
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
        </div>
      </CustomModal>
    </div>
  );
};

export default VehicleManagementPage;
