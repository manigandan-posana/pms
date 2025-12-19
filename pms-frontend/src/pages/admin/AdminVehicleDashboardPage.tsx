
import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FiTruck, FiMapPin, FiZap } from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

import type { RootState, AppDispatch } from "../../store/store";
import { setSelectedAdminProject } from "../../store/slices/adminProjectsSlice";
import CustomSelect from "../../widgets/CustomSelect";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";

const AdminVehicleDashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { vehicles, fuelEntries } = useSelector((state: RootState) => state.vehicles);
  const { projects } = useSelector((state: RootState) => state.workspace);
  const { selectedAdminProjectId } = useSelector((state: RootState) => state.adminProjects);

  const [timeFilter, setTimeFilter] = useState<"day" | "week" | "month" | "year" | "all">("all");

  // Auto-select "all" if no project is selected
  useEffect(() => {
    if (!selectedAdminProjectId) {
      dispatch(setSelectedAdminProject("all"));
    }
  }, []);

  // Get date range based on filter
  const getDateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeFilter) {
      case "day":
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: now };
      case "month":
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: monthStart, end: now };
      case "year":
        const yearStart = new Date(today);
        yearStart.setFullYear(today.getFullYear() - 1);
        return { start: yearStart, end: now };
      case "all":
      default:
        return { start: new Date(0), end: now };
    }
  }, [timeFilter]);

  const filteredVehicles = useMemo(() => {
    if (selectedAdminProjectId === "all" || !selectedAdminProjectId) return vehicles;
    return vehicles.filter((v) => String(v.projectId) === String(selectedAdminProjectId));
  }, [vehicles, selectedAdminProjectId]);

  const filteredFuelEntries = useMemo(
    () =>
      fuelEntries.filter(
        (e) =>
          e.status === "CLOSED" &&
          new Date(e.date) >= getDateRange.start &&
          new Date(e.date) <= getDateRange.end &&
          (selectedAdminProjectId === "all" ||
            filteredVehicles.some(v => v.id === e.vehicleId))
      ),
    [fuelEntries, getDateRange, selectedAdminProjectId, filteredVehicles]
  );

  const stats = useMemo(() => {
    const totalCost = filteredFuelEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const totalDistance = filteredFuelEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
    const totalLitres = filteredFuelEntries.reduce((sum, e) => sum + (e.litres || 0), 0);
    const activeVehicles = filteredVehicles.filter((v) => v.status === "ACTIVE").length;

    // Calculate total rent cost
    const totalRentCost = filteredVehicles.reduce((sum, vehicle) => {
      if (!vehicle.rentPrice || vehicle.vehicleType === "OWN_VEHICLE") {
        return sum;
      }

      const startDate = vehicle.startDate ? new Date(vehicle.startDate) : new Date();
      const endDate = vehicle.endDate ? new Date(vehicle.endDate) : new Date();
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      let rentCost = 0;
      if (vehicle.rentPeriod === "MONTHLY") {
        const months = Math.ceil(daysDiff / 30);
        rentCost = vehicle.rentPrice * months;
      } else if (vehicle.rentPeriod === "DAILY") {
        rentCost = vehicle.rentPrice * daysDiff;
      } else if (vehicle.rentPeriod === "HOURLY") {
        const hours = daysDiff * 24;
        rentCost = vehicle.rentPrice * hours;
      }

      return sum + rentCost;
    }, 0);

    return { totalCost, totalDistance, totalLitres, activeVehicles, totalRentCost };
  }, [filteredFuelEntries, filteredVehicles]);

  const fuelByType = useMemo(() => {
    const petrol = filteredFuelEntries.filter((e) => e.fuelType === "PETROL").reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const diesel = filteredFuelEntries.filter((e) => e.fuelType === "DIESEL").reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const electric = filteredFuelEntries.filter((e) => e.fuelType === "ELECTRIC").reduce((sum, e) => sum + (e.totalCost || 0), 0);
    return { petrol, diesel, electric };
  }, [filteredFuelEntries]);

  // Pie chart data
  const pieData = [
    { id: 0, value: fuelByType.petrol, label: 'Petrol', color: '#10b981' },
    { id: 1, value: fuelByType.diesel, label: 'Diesel', color: '#f59e0b' },
    { id: 2, value: fuelByType.electric, label: 'Electric', color: '#3b82f6' }
  ].filter(d => d.value > 0);


  const monthlyTrendData = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const labels = [];
    const petrolData = [];
    const dieselData = [];
    const electricData = [];

    const pDataMap: Record<string, number> = {};
    const dDataMap: Record<string, number> = {};
    const eDataMap: Record<string, number> = {};

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      pDataMap[monthKey] = 0;
      dDataMap[monthKey] = 0;
      eDataMap[monthKey] = 0;
      labels.push(date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }));
    }

    fuelEntries.filter(e => e.status === "CLOSED" &&
      (selectedAdminProjectId === "all" || filteredVehicles.some(v => v.id === e.vehicleId))
    ).forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (pDataMap[monthKey] !== undefined) {
        if (entry.fuelType === "PETROL") pDataMap[monthKey] += entry.litres;
        else if (entry.fuelType === "DIESEL") dDataMap[monthKey] += entry.litres;
        else if (entry.fuelType === "ELECTRIC") eDataMap[monthKey] += entry.litres;
      }
    });

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      petrolData.push(pDataMap[monthKey]);
      dieselData.push(dDataMap[monthKey]);
      electricData.push(eDataMap[monthKey]);
    }

    return {
      labels,
      petrolData,
      dieselData,
      electricData
    };
  }, [fuelEntries, selectedAdminProjectId, filteredVehicles]);

  const vehiclePerformance = useMemo(() => {
    const vehicleStats = filteredVehicles.map((vehicle) => {
      const vehicleEntries = filteredFuelEntries.filter((e) => e.vehicleId === vehicle.id);
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

      const project = projects.find(p => String(p.id) === String(vehicle.projectId));

      return {
        id: vehicle.id,
        name: vehicle.vehicleName,
        number: vehicle.vehicleNumber,
        projectName: project?.projectName || "N/A",
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
      .slice(0, 10);
  }, [filteredVehicles, filteredFuelEntries, projects]);


  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const formatNumber = (value: number, decimals = 1) => value.toFixed(decimals);

  const projectOptions = useMemo(() => [
    { label: "All Projects", value: "all" },
    ...projects.map(p => ({ label: p.projectName, value: p.id }))
  ], [projects]);

  const performanceColumns: ColumnDef<any>[] = [
    {
      field: "name",
      header: "Vehicle",
      body: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.name}</div>
          <div className="text-xs text-slate-500">{row.number}</div>
        </div>
      )
    },
    {
      field: "projectName",
      header: "Project",
      body: (row) => <span className="text-xs text-slate-600">{row.projectName}</span>
    },
    {
      field: "performanceRate",
      header: "Performance",
      body: (row) => (
        <div className="w-full">
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${row.performanceRate}%` }}></div>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{formatNumber(row.performanceRate)}%</span>
        </div>
      )
    },
    { field: "avgMileage", header: "Avg Mileage", body: (row) => `${formatNumber(row.avgMileage, 2)} km/l` },
    { field: "totalKm", header: "Total KM", body: (row) => `${formatNumber(row.totalKm)} km` },
    { field: "totalFuelCost", header: "Fuel Cost", body: (row) => formatCurrency(row.totalFuelCost) },
    { field: "totalCost", header: "Total Cost", body: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.totalCost)}</span> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xs font-bold text-slate-800">Vehicle Dashboard - Admin View</h2>
        <div className="flex gap-2">
          <div className="w-48">
            <CustomSelect
              label="Project"
              value={selectedAdminProjectId || "all"}
              onChange={(v) => dispatch(setSelectedAdminProject(v))}
              options={projectOptions}
              size="small"
            />
          </div>
          <div className="w-48">
            <CustomSelect
              label="Time Period"
              value={timeFilter}
              onChange={(v) => setTimeFilter(v as any)}
              options={[
                { label: "Today", value: "day" },
                { label: "Last 7 Days", value: "week" },
                { label: "Last 30 Days", value: "month" },
                { label: "Last Year", value: "year" },
                { label: "All Time", value: "all" },
              ]}
              size="small"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><FiTruck size={24} /></div>
          <div><div className="text-xs text-slate-500">Active Vehicles</div><div className="text-xs font-bold text-slate-800">{stats.activeVehicles}</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><FiMapPin size={24} /></div>
          <div><div className="text-xs text-slate-500">Total Distance</div><div className="text-xs font-bold text-slate-800">{formatNumber(stats.totalDistance)} km</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg"><FiZap size={24} /></div>
          <div><div className="text-xs text-slate-500">Total Fuel</div><div className="text-xs font-bold text-slate-800">{formatNumber(stats.totalLitres)} L</div></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-lg"><TbCurrencyRupee size={24} /></div>
          <div><div className="text-xs text-slate-500">Fuel Cost</div><div className="text-xs font-bold text-slate-800">{formatCurrency(stats.totalCost)}</div></div>
        </div>

        {stats.totalRentCost > 0 && (
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><TbCurrencyRupee size={24} /></div>
            <div><div className="text-xs text-slate-500">Rent Cost</div><div className="text-xs font-bold text-slate-800">{formatCurrency(stats.totalRentCost)}</div></div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-800 mb-4">Fuel Cost by Type</h3>
          <div className="h-64 flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: pieData,
                    innerRadius: 60,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  },
                ]}
                height={200}
                slotProps={{ legend: { position: { vertical: 'bottom', horizontal: 'center' } } }}
              />
            ) : <div className="text-xs text-slate-400">No data</div>}
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs">
            {pieData.map(d => (
              <div key={d.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span> {d.label}: {formatCurrency(d.value)}
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-800 mb-4">12-Month Fuel Consumption</h3>
          <div className="h-72 w-full">
            <BarChart
              xAxis={[{ scaleType: 'band', data: monthlyTrendData.labels }]}
              series={[
                { data: monthlyTrendData.petrolData, label: 'Petrol', color: '#10b981', stack: 'total' },
                { data: monthlyTrendData.dieselData, label: 'Diesel', color: '#f59e0b', stack: 'total' },
                { data: monthlyTrendData.electricData, label: 'Electric', color: '#3b82f6', stack: 'total' },
              ]}
              height={280}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-800">Top Performing Vehicles</h3>
        </div>
        <CustomTable
          data={vehiclePerformance}
          columns={performanceColumns}
        />
      </div>
    </div>
  );
};

export default AdminVehicleDashboardPage;
