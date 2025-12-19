import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiBarChart2, FiCheck, FiSlash, FiLock, FiUnlock } from "react-icons/fi";
import {
  loadVehicleData,
  createVehicle,
  updateVehicleStatus,
  deleteVehicle,
  createFuelEntry,
  closeFuelEntry,

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

    try {
      await dispatch(createFuelEntry({
        date: fuelForm.date.toISOString().split('T')[0],
        projectId: Number(selectedProjectId),
        vehicleId: Number(fuelForm.vehicleId),
        supplierId: Number(fuelForm.supplierId),
        litres: Number(fuelForm.litres),
        openingKm: Number(fuelForm.openingKm),
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

    if (latestDailyLogClosingKm != null && km > latestDailyLogClosingKm) {
      toast.error(`Fuel closing km (${km.toFixed(1)}) must be ≤ daily log closing km (${latestDailyLogClosingKm.toFixed(1)} km)`);
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
    if (openFuelEntry && km < openFuelEntry.openingKm) {
      toast.error(`Opening km must be greater than or equal to the open fuel entry opening km (${openFuelEntry.openingKm.toFixed(1)} km)`);
      return;
    }

    if (lastClosingKm != null && km < lastClosingKm) {
      toast.error(`Opening km must be greater than or equal to the last closing km (${lastClosingKm.toFixed(1)} km)`);
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
          <h3 className="text-lg font-medium text-slate-700 mb-2">Select a Project</h3>
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
      field: "totalKm", header: "Total Km",
      body: (row) => {
        const vehicleEntries = fuelEntries.filter(e => e.vehicleId === row.id && e.status === 'CLOSED');
        const totalKm = vehicleEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
        return <span>{totalKm.toFixed(1)} km</span>;
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
    { field: "pricePerLitre", header: "Unit Price", sortable: true, body: (row) => row.pricePerLitre ? `₹${row.pricePerLitre.toFixed(2)}` : "—" },
    { field: "litres", header: "Quantity", sortable: true, body: (row) => `${row.litres.toFixed(2)} L` },
    { field: "totalCost", header: "Fuel Cost", sortable: true, body: (row) => (row.pricePerLitre && row.litres) ? `₹${(row.pricePerLitre * row.litres).toFixed(2)}` : "—" },
    { field: "openingKm", header: "Op. Km", sortable: true, body: (row) => row.openingKm.toFixed(1) },
    { field: "closingKm", header: "Cl. Km", sortable: true, body: (row) => (row.status === "CLOSED" && row.closingKm) ? row.closingKm.toFixed(1) : "—" },
    { field: "distance", header: "Dist.", sortable: true, body: (row) => (row.status === "CLOSED" && row.distance) ? `${row.distance.toFixed(1)} km` : "—" },
    { field: "mileage", header: "Mileage", sortable: true, body: (row) => (row.status === "CLOSED" && row.mileage) ? row.mileage.toFixed(2) : "—" },
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
      field: "status", header: "Status", sortable: true, body: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
          {row.status === 'OPEN' ? 'Open' : 'Closed'}
        </span>
      )
    },
    {
      field: "actions", header: "Actions", align: "center", body: (row) => (
        row.status === "OPEN" ? (
          <CustomButton size="small" onClick={() => { setSelectedDailyLog(row); setShowCloseDailyLogDialog(true); }}>Close Log</CustomButton>
        ) : null
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Vehicle Management</h2>
        <CustomButton
          startIcon={<FiBarChart2 />}
          variant="outlined"
          onClick={() => navigate("/workspace/vehicles/dashboard")}
        >
          Dashboard
        </CustomButton>
      </div>

      <CustomTabs
        tabs={[
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
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${fuelViewMode === mode ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                          onClick={() => { setFuelViewMode(mode as any); setFuelVehicleFilter(null); }}
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
                          className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${activeFuelType === type ? 'border-orange-500 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
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
                        <div className="text-sm font-bold text-slate-800">{metric.value}</div>
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
                    <CustomButton startIcon={<FiPlus />} onClick={() => setShowFuelDialog(true)}>Add Fuel Entry</CustomButton>
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
            <CustomButton variant="outlined" onClick={() => setShowVehicleDialog(false)}>Cancel</CustomButton>
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
            <CustomButton variant="outlined" onClick={() => setShowSupplierDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleAddSupplier}>Save</CustomButton>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <CustomTextField label="Supplier Name" required value={supplierForm.supplierName} onChange={(e) => setSupplierForm({ ...supplierForm, supplierName: e.target.value })} />
          <CustomTextField label="Contact Person" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
          <CustomTextField label="Phone Number" value={supplierForm.phoneNumber} onChange={(e) => setSupplierForm({ ...supplierForm, phoneNumber: e.target.value })} />
          <CustomTextField label="Address" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} />
        </div>
      </CustomModal>

      {/* Fuel Entry Modal */}
      <CustomModal open={showFuelDialog} onClose={() => setShowFuelDialog(false)} title="Add Fuel Entry"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" onClick={() => setShowFuelDialog(false)}>Cancel</CustomButton>
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
            <CustomButton variant="outlined" onClick={() => setShowCloseFuelDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleCloseFuelEntry}>Close Entry</CustomButton>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <CustomTextField label="Opening KM" disabled value={selectedFuelEntry?.openingKm} />
          <CustomTextField label="Closing KM" required type="number" value={closingKm} onChange={(e) => setClosingKm(e.target.value)} />
        </div>
      </CustomModal>

      {/* Daily Log Create Modal */}
      <CustomModal open={showDailyLogDialog} onClose={() => setShowDailyLogDialog(false)} title="Create Daily Log"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton variant="outlined" onClick={() => setShowDailyLogDialog(false)}>Cancel</CustomButton>
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
            <CustomButton variant="outlined" onClick={() => setShowCloseDailyLogDialog(false)}>Cancel</CustomButton>
            <CustomButton onClick={handleCloseDailyLog} disabled={!isCloseFormValid}>Close Log</CustomButton>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          {selectedDailyLog && (
            <>
              <div className="bg-slate-50 p-3 rounded">
                <p className="text-sm text-slate-500">Vehicle</p>
                <p className="font-medium">{selectedDailyLog.vehicleName}</p>
                <p className="text-sm text-slate-500 mt-2">Opening Km</p>
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
