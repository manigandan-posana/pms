
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { LineChart } from "@mui/x-charts/LineChart";
import { FiArrowLeft, FiMapPin, FiActivity, FiZap, FiMap, FiTrendingUp } from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";

import type { RootState } from "../../store/store";
import CustomButton from "../../widgets/CustomButton";
import CustomTabs from "../../widgets/CustomTabs";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";
import CustomDateInput from "../../widgets/CustomDateInput";

const VehicleDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { vehicles, fuelEntries, dailyLogs, status } = useSelector((state: RootState) => state.vehicles);

  const loading = status === "loading";

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const vehicle = vehicles.find((v) => v.id === Number(vehicleId));

  const vehicleFuelEntries = useMemo(() => {
    if (!vehicle) return [];
    return fuelEntries
      .filter((e) => e.vehicleId === vehicle.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fuelEntries, vehicle]);

  const vehicleDailyLogs = useMemo(() => {
    if (!vehicle) return [];
    return dailyLogs
      .filter((log) => log.vehicleId === vehicle.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyLogs, vehicle]);

  // Calculate stats
  const vehicleStats = useMemo(() => {
    if (!vehicle) return null;

    const closedFuelEntries = vehicleFuelEntries.filter((e) => e.status === "CLOSED");
    const fuelTotalKm = closedFuelEntries.reduce((sum, e) => sum + (e.distance || 0), 0);
    const totalLitres = vehicleFuelEntries.reduce((sum, e) => sum + (e.litres || 0), 0);
    const totalCost = vehicleFuelEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const fuelAvgMileage = totalLitres > 0 ? fuelTotalKm / totalLitres : 0;
    const avgCostPerLitre = totalLitres > 0 ? totalCost / totalLitres : 0;
    const avgCostPerKm = fuelTotalKm > 0 ? totalCost / fuelTotalKm : 0;

    const closedDailyLogs = vehicleDailyLogs.filter((log) => log.status === "CLOSED");
    const dailyLogTotalKm = closedDailyLogs.reduce((sum, log) => sum + (log.distance || 0), 0);
    const dailyLogAvgMileage = totalLitres > 0 ? dailyLogTotalKm / totalLitres : 0;

    const kmDifference = dailyLogTotalKm - fuelTotalKm;
    const mileageDifference = dailyLogAvgMileage - fuelAvgMileage;

    let totalRentCost = 0;
    if (vehicle.rentPrice && vehicle.vehicleType !== "OWN_VEHICLE") {
      const startDate = vehicle.startDate ? new Date(vehicle.startDate) : new Date();
      const endDate = vehicle.endDate ? new Date(vehicle.endDate) : new Date();
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (vehicle.rentPeriod === "MONTHLY") {
        const months = Math.ceil(daysDiff / 30);
        totalRentCost = vehicle.rentPrice * months;
      } else if (vehicle.rentPeriod === "DAILY") {
        totalRentCost = vehicle.rentPrice * daysDiff;
      } else if (vehicle.rentPeriod === "HOURLY") {
        const hours = daysDiff * 24;
        totalRentCost = vehicle.rentPrice * hours;
      }
    }

    return {
      fuelTotalKm,
      totalLitres,
      totalCost,
      fuelAvgMileage,
      avgCostPerLitre,
      avgCostPerKm,
      dailyLogTotalKm,
      dailyLogAvgMileage,
      kmDifference,
      mileageDifference,
      totalRentCost,
      totalEntries: vehicleFuelEntries.length,
    };
  }, [vehicleFuelEntries, vehicleDailyLogs, vehicle]);

  const filteredDailyData = useMemo(() => {
    let filtered = vehicleFuelEntries.filter((e) => e.status === "CLOSED");

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((e) => new Date(e.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((e) => new Date(e.date) <= to);
    }

    const grouped = filtered.reduce((acc, entry) => {
      const dateKey = new Date(entry.date).toLocaleDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: new Date(entry.date),
          distance: 0,
          litres: 0,
          cost: 0,
          count: 0,
        };
      }
      acc[dateKey].distance += entry.distance || 0;
      acc[dateKey].litres += entry.litres || 0;
      acc[dateKey].cost += entry.totalCost || 0;
      acc[dateKey].count += 1;
      return acc;
    }, {} as Record<string, { date: Date; distance: number; litres: number; cost: number; count: number }>);

    return Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [vehicleFuelEntries, dateFrom, dateTo]);

  const chartData = useMemo(() => {
    const sortedData = [...filteredDailyData].reverse().slice(-30);
    return {
      labels: sortedData.map((d) => d.date),
      distance: sortedData.map((d) => d.distance),
      fuel: sortedData.map((d) => d.litres),
      cost: sortedData.map((d) => d.cost)
    };
  }, [filteredDailyData]);

  // Enhanced daily logs with fuel entry correlation
  const enhancedDailyLogs = useMemo(() => {
    return vehicleDailyLogs.map((log) => {
      const logDate = new Date(log.date);
      
      // Find the fuel entry that was active during this daily log
      // A fuel entry is active if the log date is on or after the fuel entry date
      // and before the next fuel entry date (or if it's the latest entry)
      const sortedEntries = [...vehicleFuelEntries]
        .filter(e => new Date(e.date) <= logDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const activeFuelEntry = sortedEntries[0];
      
      if (activeFuelEntry && activeFuelEntry.status === 'OPEN') {
        // Calculate running km from daily logs during this fuel entry period
        const fuelEntryDate = new Date(activeFuelEntry.date);
        const dailyLogsInPeriod = vehicleDailyLogs.filter(dl => {
          const dlDate = new Date(dl.date);
          return dlDate >= fuelEntryDate && dlDate <= logDate && dl.status === 'CLOSED';
        });
        
        const runningKm = dailyLogsInPeriod.reduce((sum, dl) => sum + (dl.distance || 0), 0);
        const avgMileage = activeFuelEntry.litres > 0 ? runningKm / activeFuelEntry.litres : 0;
        
        return {
          ...log,
          fuelEntryId: activeFuelEntry.id,
          fuelEntryDate: activeFuelEntry.date,
          runningKm,
          avgMileage,
          fuelLitres: activeFuelEntry.litres
        };
      } else if (activeFuelEntry && activeFuelEntry.status === 'CLOSED') {
        // For closed fuel entries, use the fuel entry's own calculations
        return {
          ...log,
          fuelEntryId: activeFuelEntry.id,
          fuelEntryDate: activeFuelEntry.date,
          runningKm: activeFuelEntry.distance || 0,
          avgMileage: activeFuelEntry.mileage || 0,
          fuelLitres: activeFuelEntry.litres
        };
      }
      
      return {
        ...log,
        fuelEntryId: null,
        fuelEntryDate: null,
        runningKm: 0,
        avgMileage: 0,
        fuelLitres: 0
      };
    });
  }, [vehicleDailyLogs, vehicleFuelEntries]);

  const numberTemplate = (value: number, decimals = 2) => value.toFixed(decimals);
  const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  if (!vehicle || !vehicleStats) {
    return (
      <div className="p-8 text-center text-slate-500">
        <CustomButton startIcon={<FiArrowLeft />} onClick={() => navigate("/workspace/vehicles")} variant="text">
          Back to Vehicles
        </CustomButton>
        <p className="mt-4">Vehicle not found</p>
      </div>
    );
  }

  // Column Definitions
  const entryColumns: ColumnDef<any>[] = [
    { field: "date", header: "Date", sortable: true, body: (row) => new Date(row.date).toLocaleDateString() },
    { field: "supplierName", header: "Supplier", sortable: true, body: (row) => <span className="font-semibold text-slate-700">{row.supplierName}</span> },
    { field: "litres", header: "Quantity (L)", sortable: true, body: (row) => <span className="font-medium text-blue-600">{numberTemplate(row.litres, 2)}</span> },
    { field: "pricePerLitre", header: "Unit Price", sortable: true, body: (row) => <span className="font-medium text-slate-700">{formatCurrency(row.pricePerLitre || 0)}/L</span> },
    { field: "totalCost", header: "Total Cost", sortable: true, body: (row) => <span className="font-semibold text-slate-800">{formatCurrency(row.totalCost || 0)}</span> },
    { field: "openingKm", header: "Opening KM", sortable: true, body: (row) => numberTemplate(row.openingKm, 1) },
    { field: "closingKm", header: "Closing KM", sortable: true, body: (row) => row.closingKm ? numberTemplate(row.closingKm, 1) : "—" },
    { field: "distance", header: "Distance", sortable: true, body: (row) => row.distance ? <span className="text-green-600 font-medium">{numberTemplate(row.distance, 1)} km</span> : "—" },
    { field: "mileage", header: "Mileage", sortable: true, body: (row) => row.mileage ? `${numberTemplate(row.mileage, 2)} km/l` : "—" },
    { field: "status", header: "Status", sortable: true, body: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{row.status === "CLOSED" ? "Closed" : "Open"}</span> },
  ];

  const dailyLogColumns: ColumnDef<any>[] = [
    { field: "date", header: "Date", sortable: true, body: (row) => new Date(row.date).toLocaleDateString() },
    { field: "openingKm", header: "Opening KM", sortable: true, body: (row) => numberTemplate(row.openingKm, 1) },
    { field: "closingKm", header: "Closing KM", sortable: true, body: (row) => row.closingKm ? numberTemplate(row.closingKm, 1) : "—" },
    {
      field: "distance", header: "Distance", sortable: true, body: (row) => {
        if (row.closingKm && row.openingKm) {
          const diff = row.closingKm - row.openingKm;
          return <span className="text-green-600 font-medium">{numberTemplate(diff, 1)} km</span>;
        }
        return row.distance ? <span className="text-green-600 font-medium">{numberTemplate(row.distance, 1)} km</span> : "—";
      }
    },
    {
      field: "fuelEntryDate",
      header: "Fuel Entry",
      sortable: true,
      body: (row) => row.fuelEntryDate ? (
        <span className="text-xs text-slate-600">
          {new Date(row.fuelEntryDate).toLocaleDateString()}
        </span>
      ) : "—"
    },
    {
      field: "runningKm",
      header: "Running KM",
      sortable: true,
      body: (row) => row.runningKm > 0 ? (
        <span className="text-blue-600 font-medium">
          {numberTemplate(row.runningKm, 1)} km
        </span>
      ) : "—"
    },
    {
      field: "fuelLitres",
      header: "Fuel (L)",
      sortable: true,
      body: (row) => row.fuelLitres > 0 ? (
        <span className="text-slate-600">
          {numberTemplate(row.fuelLitres, 2)} L
        </span>
      ) : "—"
    },
    {
      field: "avgMileage",
      header: "Avg Mileage",
      sortable: true,
      body: (row) => row.avgMileage > 0 ? (
        <span className="text-purple-600 font-medium">
          {numberTemplate(row.avgMileage, 2)} km/l
        </span>
      ) : "—"
    },
    { field: "status", header: "Status", sortable: true, body: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{row.status === "CLOSED" ? "Closed" : "Open"}</span> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <CustomButton onClick={() => navigate("/workspace/vehicles")} variant="text" size="small" className="text-slate-500 hover:text-slate-700">
            <FiArrowLeft size={20} />
          </CustomButton>
          <div className="flex-1">
            <h1 className="text-xs font-bold text-slate-800">{vehicle.vehicleName}</h1>
            <p className="text-slate-500 text-xs">{vehicle.vehicleNumber}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${vehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{vehicle.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Meta Info */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h3 className="text-xs font-semibold text-slate-800 mb-2">Details</h3>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Type</span><span className="font-medium">{vehicle.vehicleType}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Fuel</span><span className="font-medium">{vehicle.fuelType}</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Start</span><span className="font-medium">{vehicle.startDate ? new Date(vehicle.startDate).toLocaleDateString() : 'N/A'}</span></div>
          </div>

          {/* Fuel Entry Metrics */}
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">Fuel Entry Metrics</div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Total KM</span>
              <span className="text-xs font-bold text-blue-700">{numberTemplate(vehicleStats.fuelTotalKm, 1)} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Avg Mileage</span>
              <span className="text-xs font-bold text-blue-700">{numberTemplate(vehicleStats.fuelAvgMileage, 2)} km/l</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Total Quantity</span>
              <span className="text-xs font-bold text-blue-700">{numberTemplate(vehicleStats.totalLitres, 1)} L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Total Cost</span>
              <span className="text-xs font-bold text-blue-700">{formatCurrency(vehicleStats.totalCost)}</span>
            </div>
          </div>

          {/* Daily Log Metrics */}
          <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">Daily Log Metrics</div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Total KM</span>
              <span className="text-xs font-bold text-green-700">{numberTemplate(vehicleStats.dailyLogTotalKm, 1)} km</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Avg Mileage</span>
              <span className="text-xs font-bold text-green-700">{numberTemplate(vehicleStats.dailyLogAvgMileage, 2)} km/l</span>
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="space-y-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-2">Cost Analysis</div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Avg Cost/Unit</span>
              <span className="text-xs font-bold text-purple-700">{formatCurrency(vehicleStats.avgCostPerLitre)}/L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Avg Cost/KM</span>
              <span className="text-xs font-bold text-purple-700">{formatCurrency(vehicleStats.avgCostPerKm)}/km</span>
            </div>
          </div>

          {/* KM Difference */}
          <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Variance</div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">KM Difference</span>
              <span className={`text-xs font-bold ${vehicleStats.kmDifference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {vehicleStats.kmDifference >= 0 ? '+' : ''}{numberTemplate(vehicleStats.kmDifference, 1)} km
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-600">Mileage Variance</span>
              <span className={`text-xs font-bold ${vehicleStats.mileageDifference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {vehicleStats.mileageDifference >= 0 ? '+' : ''}{numberTemplate(vehicleStats.mileageDifference, 2)} km/l
              </span>
            </div>
          </div>

          {vehicleStats.totalRentCost > 0 && (
            <div className="space-y-2 p-4 bg-rose-50 rounded-lg border border-rose-200">
              <div className="text-xs font-semibold text-rose-800 uppercase tracking-wide mb-2">Rent Cost</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Total Rent</span>
                <span className="text-xs font-bold text-rose-700">{formatCurrency(vehicleStats.totalRentCost)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <CustomTabs
          tabs={[
            {
              label: "Fuel Entries",
              content: (
                <CustomTable data={vehicleFuelEntries} columns={entryColumns} loading={loading} pagination rows={10} />
              )
            },
            {
              label: "Daily Analysis",
              content: (
                <div className="space-y-6">
                  <div className="flex gap-4 mb-6">
                    <CustomDateInput label="From Date" value={dateFrom} onChange={(e) => setDateFrom(e.value as Date)} size="small" />
                    <CustomDateInput label="To Date" value={dateTo} onChange={(e) => setDateTo(e.value as Date)} size="small" />
                    <CustomButton variant="outlined" onClick={() => { setDateFrom(null); setDateTo(null); }} className="mt-auto">Clear</CustomButton>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-700 mb-4 flex items-center gap-2"><FiMap className="text-blue-500" /> Distance Trend</h4>
                      <div className="h-48 w-full">
                        <LineChart
                          xAxis={[{ scaleType: 'point', data: chartData.labels, valueFormatter: (d) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) }]}
                          series={[{ data: chartData.distance, label: 'Distance', color: '#3b82f6', area: true }]}
                          height={200}
                          slotProps={{ legend: { hidden: true } as any }}
                        />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-700 mb-4 flex items-center gap-2"><FiZap className="text-green-500" /> Fuel Consumption</h4>
                      <div className="h-48 w-full">
                        <LineChart
                          xAxis={[{ scaleType: 'point', data: chartData.labels, valueFormatter: (d) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) }]}
                          series={[{ data: chartData.fuel, label: 'Fuel', color: '#10b981', area: true }]}
                          height={200}
                          slotProps={{ legend: { hidden: true } as any }}
                        />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-700 mb-4 flex items-center gap-2"><FiTrendingUp className="text-amber-500" /> Cost Trend</h4>
                      <div className="h-48 w-full">
                        <LineChart
                          xAxis={[{ scaleType: 'point', data: chartData.labels, valueFormatter: (d) => d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) }]}
                          series={[{ data: chartData.cost, label: 'Cost', color: '#f59e0b', area: true }]}
                          height={200}
                          slotProps={{ legend: { hidden: true } as any }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-xs font-bold text-slate-800 mb-4">Daily Breakdown</h3>
                    <div className="max-w-full overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Entries</th>
                            <th className="px-4 py-3">Distance (km)</th>
                            <th className="px-4 py-3">Fuel (L)</th>
                            <th className="px-4 py-3">Mileage</th>
                            <th className="px-4 py-3">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDailyData.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No data available</td></tr>
                          ) : (
                            filteredDailyData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{row.date.toLocaleDateString()}</td>
                                <td className="px-4 py-3">{row.count}</td>
                                <td className="px-4 py-3 text-green-600 font-medium">{numberTemplate(row.distance, 1)}</td>
                                <td className="px-4 py-3">{numberTemplate(row.litres, 2)}</td>
                                <td className="px-4 py-3 font-medium text-blue-600">
                                  {row.litres > 0 ? (row.distance / row.litres).toFixed(2) : "0.00"} km/l
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(row.cost)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            },
            {
              label: "Daily Logs",
              content: (
                <CustomTable data={enhancedDailyLogs} columns={dailyLogColumns} loading={loading} pagination rows={10} />
              )
            },
            {
              label: "Vehicle History",
              content: (
                <div className="p-4">
                  {vehicle.statusHistory && vehicle.statusHistory.length > 0 ? (
                    <table className="w-full text-xs text-left text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold">
                        <tr>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Start Date</th>
                          <th className="px-4 py-3">End Date</th>
                          <th className="px-4 py-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicle.statusHistory.map((hist: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${hist.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                {hist.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">{new Date(hist.startDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{hist.endDate ? new Date(hist.endDate).toLocaleDateString() : 'Ongoing'}</td>
                            <td className="px-4 py-3 text-slate-500 italic">{hist.reason || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-slate-400">No history available</div>
                  )}
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
};

export default VehicleDetailsPage;
