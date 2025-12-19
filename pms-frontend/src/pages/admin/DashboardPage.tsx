import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Chart } from "primereact/chart";
import toast from "react-hot-toast";
import { getAnalytics } from "../../store/slices/adminUsersSlice";
import { FiBox, FiFile, FiUsers, FiTrendingUp } from "react-icons/fi";
import type { AppDispatch } from "../../store/store";

type AnalyticsSummary = {
  totalProjects: number;
  totalMaterials: number;
  totalUsers: number;
  received: number;
  utilized: number;
};

const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingAnalytics(true);
    dispatch(getAnalytics())
      .unwrap()
      .then((response) => {
        if (!isMounted) return;
        const payload = response?.data ?? response;
        setAnalytics(payload as AnalyticsSummary);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("Failed to load admin analytics", error);
        toast.error("Unable to load admin analytics right now.");
      })
      .finally(() => {
        if (isMounted) {
          setLoadingAnalytics(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const chartBaseOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#334155",
            font: { size: 10 },
          },
        },
      },
      layout: {
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
      },
      scales: {
        x: {
          ticks: { color: "#475569", font: { size: 10 } },
          grid: { display: false },
        },
        y: {
          ticks: { color: "#475569", font: { size: 10 } },
          grid: { color: "#e2e8f0" },
        },
      },
    }),
    []
  );

  const totalsChartData = useMemo(() => {
    const summary = analytics || {
      totalProjects: 0,
      totalMaterials: 0,
      totalUsers: 0,
      received: 0,
      utilized: 0,
    };
    return {
      labels: ["Projects", "Materials", "Users"],
      datasets: [
        {
          type: "bar" as const,
          label: "Totals",
          backgroundColor: "#10b981",
          borderRadius: 4,
          data: [
            summary.totalProjects,
            summary.totalMaterials,
            summary.totalUsers,
          ],
        },
      ],
    };
  }, [analytics]);

  const materialChartData = useMemo(() => {
    const summary = analytics || {
      totalProjects: 0,
      totalMaterials: 0,
      totalUsers: 0,
      received: 0,
      utilized: 0,
    };
    return {
      labels: ["Received", "Utilized"],
      datasets: [
        {
          label: "Quantity",
          backgroundColor: ["#3b82f6", "#f59e0b"],
          borderRadius: 4,
          data: [summary.received, summary.utilized],
        },
      ],
    };
  }, [analytics]);

  const summary =
    analytics ||
    ({
      totalProjects: 0,
      totalMaterials: 0,
      totalUsers: 0,
      received: 0,
      utilized: 0,
    } as AnalyticsSummary);

  const utilizationPercentage = summary.received > 0 
    ? Math.round((summary.utilized / summary.received) * 100) 
    : 0;

  if (loadingAnalytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-slate-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-xs text-slate-600 mt-1">
          Overview of inventory, projects, and user statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase">
                Total Projects
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {summary.totalProjects}
              </div>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <FiFile className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase">
                Total Materials
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {summary.totalMaterials}
              </div>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <FiBox className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase">
                Total Users
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {summary.totalUsers}
              </div>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <FiUsers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase">
                Utilization
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {utilizationPercentage}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {summary.utilized} / {summary.received}
              </div>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <FiTrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            System Overview
          </h2>
          <div style={{ height: "250px" }}>
            <Chart type="bar" data={totalsChartData} options={chartBaseOptions} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Material Inventory
          </h2>
          <div style={{ height: "250px" }}>
            <Chart type="bar" data={materialChartData} options={chartBaseOptions} />
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Inventory Summary
          </h3>
          <div className="space-y-2 text-xs text-blue-800">
            <div className="flex justify-between">
              <span>Materials Received:</span>
              <span className="font-semibold">{summary.received}</span>
            </div>
            <div className="flex justify-between">
              <span>Materials Utilized:</span>
              <span className="font-semibold">{summary.utilized}</span>
            </div>
            <div className="flex justify-between">
              <span>Available Stock:</span>
              <span className="font-semibold">{summary.received - summary.utilized}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-green-50 p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2">
            Quick Stats
          </h3>
          <div className="space-y-2 text-xs text-green-800">
            <div className="flex justify-between">
              <span>Active Projects:</span>
              <span className="font-semibold">{summary.totalProjects}</span>
            </div>
            <div className="flex justify-between">
              <span>Material Types:</span>
              <span className="font-semibold">{summary.totalMaterials}</span>
            </div>
            <div className="flex justify-between">
              <span>System Users:</span>
              <span className="font-semibold">{summary.totalUsers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
