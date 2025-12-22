import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { StatCard, InfoCard } from "../../components/ui/DataCards";
import CustomButton from "../../widgets/CustomButton";
import type { RootState, AppDispatch } from "../../store/store";
import { searchInwardHistory, searchOutwardHistory } from "../../store/slices/historySlice";
import { loadVehicleData } from "../../store/slices/vehicleSlice";
import CustomTable from "../../widgets/CustomTable";
import type { ColumnDef } from "../../widgets/CustomTable";

const UserDashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
  const { inwardHistory, outwardHistory } = useSelector((state: RootState) => state.history);
  // Always arrays in Redux state, but type as any[] for safety
  const inwardArray: any[] = Array.isArray(inwardHistory) ? inwardHistory : [];
  const outwardArray: any[] = Array.isArray(outwardHistory) ? outwardHistory : [];
  const { vehicles, fuelEntries, dailyLogs } = useSelector((state: RootState) => state.vehicles);
  // Columns for vehicle running km table
  const vehicleColumns: ColumnDef<any>[] = [
    { field: "vehicleName", header: "Vehicle Name", style: { minWidth: "120px" }, body: (row) => <span className="font-medium text-slate-700">{row.vehicleName}</span> },
    { field: "vehicleNumber", header: "Vehicle Number", style: { minWidth: "100px" } },
    {
      field: "runningKm", header: "Running Km",
      body: (row) => {
        const runningKm = dailyLogs.filter((log) => log.vehicleId === row.id && log.status === "CLOSED")
          .reduce((sum, log) => sum + (log.distance || 0), 0);
        return <span>{runningKm.toFixed(1)} km</span>;
      }
    },
  ];

  useEffect(() => {
    if (selectedProjectId) {
      dispatch(searchInwardHistory({ projectId: selectedProjectId, page: 1, size: 5 }));
      dispatch(searchOutwardHistory({ projectId: selectedProjectId, page: 1, size: 5 }));
      dispatch(loadVehicleData(Number(selectedProjectId)));
    }
  }, [selectedProjectId, dispatch]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <h1 className="text-lg font-bold text-slate-800 mb-2">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Inwards" value={inwardArray.length} icon="pi-arrow-down" variant="blue" />
        <StatCard title="Outwards" value={outwardArray.length} icon="pi-arrow-up" variant="orange" />
        <StatCard title="Fuel Entries" value={fuelEntries.length} icon="pi-gas-pump" variant="green" />
        <StatCard title="Daily Logs" value={dailyLogs.length} icon="pi-calendar" variant="indigo" />
      </div>

      {/* Vehicle Running Km Table */}
      <div className="mt-6">
        <CustomTable
          data={vehicles}
          columns={vehicleColumns}
          pagination={false}
          title={<span className="font-semibold text-base text-slate-700">Vehicle Running Km</span>}
          emptyMessage="No vehicles found"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <InfoCard title="Recent Inwards" action={<CustomButton size="small" onClick={() => navigate("/workspace/inward")}>View All</CustomButton>}>
          <ul className="divide-y divide-slate-100">
            {inwardArray.slice(0, 5).map((item: any) => (
              <li key={item.id} className="py-2 flex items-center justify-between">
                <span className="font-mono text-xs text-blue-700">{item.code}</span>
                <CustomButton size="small" variant="text" onClick={() => navigate(`/workspace/inward/detail/${item.id}`)}>Details</CustomButton>
              </li>
            ))}
            {inwardArray.length === 0 && <li className="py-2 text-xs text-slate-400">No inwards found</li>}
          </ul>
        </InfoCard>
        <InfoCard title="Recent Outwards" action={<CustomButton size="small" onClick={() => navigate("/workspace/outward")}>View All</CustomButton>}>
          <ul className="divide-y divide-slate-100">
            {outwardArray.slice(0, 5).map((item: any) => (
              <li key={item.id} className="py-2 flex items-center justify-between">
                <span className="font-mono text-xs text-orange-700">{item.code}</span>
                <CustomButton size="small" variant="text" onClick={() => navigate(`/workspace/outward/detail/${item.id}`)}>Details</CustomButton>
              </li>
            ))}
            {outwardArray.length === 0 && <li className="py-2 text-xs text-slate-400">No outwards found</li>}
          </ul>
        </InfoCard>
        <InfoCard title="Recent Fuel Entries" action={<CustomButton size="small" onClick={() => navigate("/workspace/vehicles")}>View All</CustomButton>}>
          <ul className="divide-y divide-slate-100">
            {fuelEntries.slice(0, 5).map((item: any) => (
              <li key={item.id} className="py-2 flex items-center justify-between">
                <span className="font-mono text-xs text-green-700">{item.vehicleNumber}</span>
                <CustomButton size="small" variant="text" onClick={() => navigate(`/workspace/vehicles/${item.vehicleId}`)}>Details</CustomButton>
              </li>
            ))}
            {fuelEntries.length === 0 && <li className="py-2 text-xs text-slate-400">No fuel entries found</li>}
          </ul>
        </InfoCard>
        <InfoCard title="Recent Daily Logs" action={<CustomButton size="small" onClick={() => navigate("/workspace/vehicles")}>View All</CustomButton>}>
          <ul className="divide-y divide-slate-100">
            {dailyLogs.slice(0, 5).map((item: any) => (
              <li key={item.id} className="py-2 flex items-center justify-between">
                <span className="font-mono text-xs text-indigo-700">{item.vehicleNumber}</span>
                <CustomButton size="small" variant="text" onClick={() => navigate(`/workspace/vehicles/${item.vehicleId}`)}>Details</CustomButton>
              </li>
            ))}
            {dailyLogs.length === 0 && <li className="py-2 text-xs text-slate-400">No daily logs found</li>}
          </ul>
        </InfoCard>
      </div>
    </div>
  );
};

export default UserDashboardPage;
