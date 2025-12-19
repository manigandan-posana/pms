import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Chart } from "primereact/chart"; // Keeping for data viz specific needs for now
import { FiArrowLeft, FiMapPin, FiActivity, FiZap, FiDollarSign, FiMap, FiTrendingUp } from "react-icons/fi"; // Using react-icons

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
      labels: sortedData.map((d) => d.date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })),
      datasets: [
        {
          label: "Distance (km)",
          data: sortedData.map((d) => d.distance),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [filteredDailyData]);

  const fuelChartData = useMemo(() => {
    const sortedData = [...filteredDailyData].reverse().slice(-30);
    return {
      labels: sortedData.map((d) => d.date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })),
      datasets: [
        {
          label: "Fuel (Litres)",
          data: sortedData.map((d) => d.litres),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [filteredDailyData]);

  const costChartData = useMemo(() => {
    const sortedData = [...filteredDailyData].reverse().slice(-30);
    return {
      labels: sortedData.map((d) => d.date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })),
      datasets: [
        {
          label: "Cost (₹)",
          data: sortedData.map((d) => d.cost),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [filteredDailyData]);

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };



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
    { field: "litres", header: "Litres", sortable: true, body: (row) => numberTemplate(row.litres, 2) },
    { field: "openingKm", header: "Opening KM", sortable: true, body: (row) => numberTemplate(row.openingKm, 1) },
    { field: "closingKm", header: "Closing KM", sortable: true, body: (row) => row.closingKm ? numberTemplate(row.closingKm, 1) : "—" },
    { field: "distance", header: "Distance", sortable: true, body: (row) => row.distance ? <span className="text-green-600 font-medium">{numberTemplate(row.distance, 1)} km</span> : "—" },
    { field: "mileage", header: "Mileage", sortable: true, body: (row) => row.mileage ? `${numberTemplate(row.mileage, 2)} km/l` : "—" },
    { field: "totalCost", header: "Cost", sortable: true, body: (row) => <span className="font-medium text-slate-700">{formatCurrency(row.totalCost || 0)}</span> },
    { field: "status", header: "Status", sortable: true, body: (row) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{row.status === "CLOSED" ? "Closed" : "Open"}</span> },
  ];

  const dailyLogColumns: ColumnDef<any>[] = [
    { field: "date", header: "Date", sortable: true, body: (row) => new Date(row.date).toLocaleDateString() },
    { field: "openingKm", header: "Opening KM", sortable: true, body: (row) => numberTemplate(row.openingKm, 1) },
    { field: "closingKm", header: "Closing KM", sortable: true, body: (row) => row.closingKm ? numberTemplate(row.closingKm, 1) : "—" },
    {
      field: "distance", header: "Distance (Diff)", sortable: true, body: (row) => {
        if (row.closingKm && row.openingKm) {
          const diff = row.closingKm - row.openingKm;
          return <span className="text-green-600 font-medium">{numberTemplate(diff, 1)} km</span>;
        }
        return row.distance ? <span className="text-green-600 font-medium">{numberTemplate(row.distance, 1)} km</span> : "—";
      }
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
            <h1 className="text-2xl font-bold text-slate-800">{vehicle.vehicleName}</h1>
            <p className="text-slate-500 text-sm">{vehicle.vehicleNumber}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${vehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{vehicle.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Meta Info */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Details</h3>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Type</span><span className="font-medium">{vehicle.vehicleType}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Fuel</span><span className="font-medium">{vehicle.fuelType}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Start</span><span className="font-medium">{vehicle.startDate ? new Date(vehicle.startDate).toLocaleDateString() : 'N/A'}</span></div>
          </div>

          {/* Metrics */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiMapPin /></div>
              <div>
                <div className="text-xs text-slate-500">Total Distance</div>
                <div className="text-lg font-bold text-slate-800">{numberTemplate(vehicleStats.fuelTotalKm, 1)} km</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><FiActivity /></div>
              <div>
                <div className="text-xs text-slate-500">Avg Mileage</div>
                <div className="text-lg font-bold text-slate-800">{numberTemplate(vehicleStats.fuelAvgMileage, 2)} km/l</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FiZap /></div>
              <div>
                <div className="text-xs text-slate-500">Total Fuel</div>
                <div className="text-lg font-bold text-slate-800">{numberTemplate(vehicleStats.totalLitres, 1)} L</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><FiDollarSign /></div>
              <div>
                <div className="text-xs text-slate-500">Total Cost</div>
                <div className="text-lg font-bold text-slate-800">{formatCurrency(vehicleStats.totalCost)}</div>
              </div>
            </div>
          </div>

          {vehicleStats.totalRentCost > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><FiDollarSign /></div>
              <div>
                <div className="text-xs text-slate-500">Rent Cost</div>
                <div className="text-lg font-bold text-slate-800">{formatCurrency(vehicleStats.totalRentCost)}</div>
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
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><FiMap className="text-blue-500" /> Distance Trend</h4>
                      <div className="h-48">
                        <Chart type="line" data={chartData} options={chartOptions} />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><FiZap className="text-green-500" /> Fuel Consumption</h4>
                      <div className="h-48">
                        <Chart type="line" data={fuelChartData} options={chartOptions} />
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2"><FiTrendingUp className="text-amber-500" /> Cost Trend</h4>
                      <div className="h-48">
                        <Chart type="line" data={costChartData} options={chartOptions} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Daily Breakdown</h3>
                    <div className="max-w-full overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
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
                <CustomTable data={vehicleDailyLogs} columns={dailyLogColumns} loading={loading} pagination rows={10} />
              )
            },
            {
              label: "Vehicle History",
              content: (
                <div className="p-4">
                  {vehicle.statusHistory && vehicle.statusHistory.length > 0 ? (
                    <table className="w-full text-sm text-left text-slate-600">
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
