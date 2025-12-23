import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BarChart, PieChart } from "@mui/x-charts";
import {
  FiArrowUpRight,
  FiArrowDownLeft,
  FiActivity,
  FiTruck,
  FiTrendingUp,
  FiTrendingDown,
  FiBox
} from "react-icons/fi";
import { TbCurrencyRupee } from "react-icons/tb";
import type { RootState, AppDispatch } from "../../store/store";
import { searchInwardHistory, searchOutwardHistory } from "../../store/slices/historySlice";
import { loadVehicleData } from "../../store/slices/vehicleSlice";
import CustomButton from "../../widgets/CustomButton";

// --- Components ---

const DashboardCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon: React.ReactNode;
  colorClass: string;
}> = ({ title, value, subtitle, trend, trendValue, icon, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
    <div className={`absolute top-0 right-0 p-4 opacity-10 ${colorClass}`}>
      <div className="scale-150 transform translate-x-1/4 -translate-y-1/4">
        {icon}
      </div>
    </div>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '50')} ${colorClass}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'text-green-600 bg-green-50' : trend === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-600 bg-slate-50'}`}>
          {trend === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const SectionHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    {action}
  </div>
);

const UserDashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
  const { vehicles, fuelEntries, dailyLogs } = useSelector((state: RootState) => state.vehicles);
  const { inwardHistory: inwardHistoryRaw, outwardHistory: outwardHistoryRaw } = useSelector((state: RootState) => state.history);

  // Safe array access
  const inwardArray = Array.isArray(inwardHistoryRaw) ? inwardHistoryRaw : [];
  const outwardArray = Array.isArray(outwardHistoryRaw) ? outwardHistoryRaw : [];

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(searchInwardHistory({ projectId: selectedProjectId, page: 1, size: 50 })); // Fetch more for charts
      dispatch(searchOutwardHistory({ projectId: selectedProjectId, page: 1, size: 50 }));
      dispatch(loadVehicleData(Number(selectedProjectId)));
    }
  }, [selectedProjectId, dispatch]);

  // --- Derived Metrics ---

  const metrics = useMemo(() => {
    const totalInwards = inwardArray.length;
    const totalOutwards = outwardArray.length;
    const activeVehicles = vehicles.filter(v => v.status === 'ACTIVE').length;
    const totalFuelCost = fuelEntries.reduce((sum, entry) => sum + (entry.totalCost || 0), 0);
    const totalKm = dailyLogs.reduce((sum, log) => sum + (log.distance || 0), 0);

    // Calculate trends (mock logic for now as we don't have separate previous period data easily accessible)
    // In a real app, compare current month vs previous month

    return {
      totalInwards,
      totalOutwards,
      activeVehicles,
      totalFuelCost,
      totalKm
    };
  }, [inwardArray, outwardArray, vehicles, fuelEntries, dailyLogs]);

  // --- Chart Data Preparation ---

  const monthlyActivityData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const inwardData = new Array(12).fill(0);
    const outwardData = new Array(12).fill(0);

    inwardArray.forEach((item: any) => {
      const date = new Date(item.date || item.entryDate);
      if (date.getFullYear() === currentYear) {
        inwardData[date.getMonth()] += 1;
      }
    });

    outwardArray.forEach((item: any) => {
      const date = new Date(item.date);
      if (date.getFullYear() === currentYear) {
        outwardData[date.getMonth()] += 1;
      }
    });

    // Get last 6 months for cleaner view
    const currentMonth = new Date().getMonth();
    const startMonth = Math.max(0, currentMonth - 5);

    return {
      xAxis: months.slice(startMonth, currentMonth + 1),
      inward: inwardData.slice(startMonth, currentMonth + 1),
      outward: outwardData.slice(startMonth, currentMonth + 1)
    };
  }, [inwardArray, outwardArray]);

  const fuelCostByType = useMemo(() => {
    const data = [
      { id: 0, value: 0, label: 'Diesel', color: '#3b82f6' },
      { id: 1, value: 0, label: 'Petrol', color: '#10b981' },
      { id: 2, value: 0, label: 'Electric', color: '#f59e0b' },
    ];

    fuelEntries.forEach(entry => {
      if (entry.fuelType === 'DIESEL') data[0].value += (entry.totalCost || 0);
      else if (entry.fuelType === 'PETROL') data[1].value += (entry.totalCost || 0);
      else if (entry.fuelType === 'ELECTRIC') data[2].value += (entry.totalCost || 0);
    });

    return data.filter(d => d.value > 0); // Only show active types
  }, [fuelEntries]);

  // --- Render ---

  if (!selectedProjectId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center bg-slate-50 p-10 rounded-2xl border border-slate-200">
          <FiBox className="mx-auto text-4xl text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Select a Project</h2>
          <p className="text-slate-500 mt-2">Please select a project from the sidebar to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen bg-slate-50/50">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of inventory movement and fleet performance</p>
        </div>
        <div className="flex gap-3">
          <CustomButton
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            startIcon={<FiBox />}
            onClick={() => navigate('/workspace/inventory/inwards')}
          >
            New Inward
          </CustomButton>
          <CustomButton
            className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            startIcon={<FiTruck />}
            onClick={() => navigate('/workspace/vehicles')}
          >
            Manage Fleet
          </CustomButton>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Inwards"
          value={metrics.totalInwards}
          subtitle="Items received this year"
          trend="up"
          trendValue="+12.5%"
          icon={<FiArrowDownLeft size={24} />}
          colorClass="text-indigo-600"
        />
        <DashboardCard
          title="Total Outwards"
          value={metrics.totalOutwards}
          subtitle="Items issued this year"
          trend="neutral"
          trendValue="+2.1%"
          icon={<FiArrowUpRight size={24} />}
          colorClass="text-orange-600"
        />
        <DashboardCard
          title="Fuel Cost"
          value={`₹${(metrics.totalFuelCost / 1000).toFixed(1)}k`}
          subtitle="Total spend on fuel"
          trend="down"
          trendValue="-5.4%"
          icon={<TbCurrencyRupee size={24} />}
          colorClass="text-rose-600"
        />
        <DashboardCard
          title="Fleet Activity"
          value={`${(metrics.totalKm / 1000).toFixed(1)}k km`}
          subtitle={`${metrics.activeVehicles} active vehicles`}
          trend="up"
          trendValue="+8.2%"
          icon={<FiActivity size={24} />}
          colorClass="text-emerald-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Inventory Movement */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <SectionHeader
            title="Inventory Movement"
            action={
              <select className="text-xs border-none bg-slate-50 rounded-lg px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer hover:bg-slate-100">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            }
          />
          <div className="w-full h-[320px]">
            <BarChart
              xAxis={[{ scaleType: 'band', data: monthlyActivityData.xAxis, disableLine: true, disableTicks: true, categoryGapRatio: 0.4 }]}
              series={[
                { data: monthlyActivityData.inward, label: 'Inward', color: '#6366f1' }, // Indigo
                { data: monthlyActivityData.outward, label: 'Outward', color: '#f97316' }, // Orange
              ]}
              grid={{ horizontal: true }}
              slotProps={{
                legend: { hidden: false, position: { vertical: 'top', horizontal: 'end' }, itemMarkWidth: 10, itemMarkHeight: 10 },
              }}
              margin={{ left: 40, right: 10, top: 20, bottom: 20 }}
            />
          </div>
        </div>

        {/* Secondary Chart: Fuel Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <SectionHeader title="Fuel Expense" />
          <div className="flex flex-col items-center justify-center h-[320px] relative">
            <PieChart
              series={[
                {
                  data: fuelCostByType,
                  innerRadius: 80,
                  outerRadius: 100,
                  paddingAngle: 5,
                  cornerRadius: 8,
                },
              ]}
              height={250}
              slotProps={{ legend: { hidden: true } as any }}
            />
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-3xl font-bold text-slate-800">₹{(metrics.totalFuelCost / 1000).toFixed(0)}k</span>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Spent</span>
            </div>

            {/* Custom Legend */}
            <div className="flex w-full justify-center gap-4 mt-6">
              {fuelCostByType.map((item) => (
                <div key={item.id} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-500 font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">₹{(item.value / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
            {fuelCostByType.length === 0 && <p className="text-slate-400 text-sm absolute">No fuel data available</p>}
          </div>
        </div>
      </div>

      {/* Recent Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inwards */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <SectionHeader title="Recent Inwards" action={<CustomButton variant="text" size="small" className="text-indigo-600" onClick={() => navigate('/workspace/inventory/inwards')}>View All</CustomButton>} />
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 rounded-l-lg">Supplier</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">Project</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 rounded-r-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inwardArray.slice(0, 5).map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/workspace/inward/detail/${item.id}`)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                          {item.supplierName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{item.supplierName}</div>
                          <div className="text-xs text-slate-400 font-mono">{item.invoiceNo || 'No Invoice'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{item.projectName}</td>
                    <td className="py-3 px-4 text-right text-sm text-slate-500 font-medium">
                      {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {inwardArray.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm">No recent data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Fuel */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <SectionHeader title="Recent Fuel Entries" action={<CustomButton variant="text" size="small" className="text-rose-600" onClick={() => navigate('/workspace/vehicles')}>View All</CustomButton>} />
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 rounded-l-lg">Vehicle</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4">Type</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-4 rounded-r-lg">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fuelEntries.slice(0, 5).map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                          <FiTruck size={14} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{item.vehicleName}</div>
                          <div className="text-xs text-slate-400">{item.vehicleNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide
                          ${item.fuelType === 'DIESEL' ? 'bg-amber-100 text-amber-700' :
                          item.fuelType === 'PETROL' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.fuelType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm font-bold text-slate-700">₹{item.totalCost?.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">{item.litres?.toFixed(1)} L</div>
                    </td>
                  </tr>
                ))}
                {fuelEntries.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-slate-400 text-sm">No recent data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
