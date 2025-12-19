import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { getProjectActivity } from "../../store/slices/adminUsersSlice";
import type { ProjectActivityDto, ProjectActivityEntryDto } from "../../types/backend";
import { FiDownloadCloud, FiUploadCloud, FiRepeat, FiShoppingCart, FiPackage, FiActivity } from "react-icons/fi";
import type { AppDispatch } from "../../store/store";

interface ActivityPanelProps {
  title: string;
  accentClass: string;
  emptyLabel: string;
  entries: ProjectActivityEntryDto[];
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ title, accentClass, emptyLabel, entries }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <div className={`text-[11px] font-semibold uppercase ${accentClass}`}>{title}</div>
        <span className="text-[10px] text-slate-500">{entries.length ? `${entries.length} recent` : ""}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {entries.length === 0 && (
          <div className="px-4 py-3 text-[11px] text-slate-500">{emptyLabel}</div>
        )}
        {entries.map((entry) => (
          <div key={`${title}-${entry.id ?? entry.code ?? entry.subject ?? Math.random()}`} className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-800 truncate">{entry.code || "Not set"}</span>
                {entry.status && (
                  <span className="text-[10px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{entry.status}</span>
                )}
              </div>
              <div className="text-[10px] text-slate-600 truncate">
                {entry.subject || "No subject"}
              </div>
              {entry.direction && (
                <div className="text-[10px] text-slate-500 truncate">{entry.direction}</div>
              )}
            </div>
            <div className="text-right text-[10px] text-slate-500 leading-tight">
              <div>{entry.date || "-"}</div>
              {typeof entry.lineCount === "number" && (
                <div className="text-[10px] text-slate-500">{entry.lineCount} item(s)</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectActivityPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [activity, setActivity] = useState<ProjectActivityDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    dispatch(getProjectActivity())
      .unwrap()
      .then((response) => {
        const payload = response?.data ?? response ?? [];
        setActivity(payload as ProjectActivityDto[]);
      })
      .catch((error) => {
        console.error("Failed to load project activity", error);
        toast.error("Unable to load project activity right now.");
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const aggregatedTotals = useMemo(() => {
    return activity.reduce(
      (acc, item) => {
        acc.inwards += item.inwardCount || 0;
        acc.outwards += item.outwardCount || 0;
        acc.transfers += item.transferCount || 0;
        acc.procurements += item.procurementCount || 0;
        return acc;
      },
      { inwards: 0, outwards: 0, transfers: 0, procurements: 0 }
    );
  }, [activity]);

  const summaryCards = [
    { label: "Inwards", value: aggregatedTotals.inwards, icon: FiDownloadCloud, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Outwards", value: aggregatedTotals.outwards, icon: FiUploadCloud, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Transfers", value: aggregatedTotals.transfers, icon: FiRepeat, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Procurements", value: aggregatedTotals.procurements, icon: FiShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-slate-900">
          <FiActivity className="text-[var(--primary)]" />
          <h1 className="text-xl font-bold">Project Movement Overview</h1>
        </div>
        <p className="text-[12px] text-slate-600 max-w-4xl">
          Get a project-wise view of every inward, outward, transfer, and procurement request with concise summaries and the latest activity snapshots.
        </p>
      </div>

      {loading && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">Loading project activity…</div>
      )}

      {!loading && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-lg border border-slate-200 ${bg} p-4 shadow-sm flex items-center justify-between`}>
                <div>
                  <div className="text-[11px] font-medium text-slate-600 uppercase">{label}</div>
                  <div className="text-2xl font-bold text-slate-900">{value}</div>
                </div>
                <div className={`rounded-full p-3 ${bg} ${color}`}>
                  <Icon size={22} />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {activity.map((project) => (
              <div key={project.projectId} className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
                <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <FiPackage className="text-[var(--primary)]" />
                      {project.projectCode ? `${project.projectCode} - ${project.projectName}` : project.projectName}
                    </div>
                    <div className="text-[11px] text-slate-500">Latest material movements and approvals</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 font-semibold">{project.inwardCount} Inwards</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-semibold">{project.outwardCount} Outwards</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 font-semibold">{project.transferCount} Transfers</span>
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700 font-semibold">{project.procurementCount} Procurements</span>
                  </div>
                </div>
                <div className="grid gap-3 p-5 lg:grid-cols-4 md:grid-cols-2">
                  <ActivityPanel
                    title="Inwards"
                    accentClass="text-emerald-700"
                    emptyLabel="No inward records yet"
                    entries={project.recentInwards}
                  />
                  <ActivityPanel
                    title="Outwards"
                    accentClass="text-blue-700"
                    emptyLabel="No outward records yet"
                    entries={project.recentOutwards}
                  />
                  <ActivityPanel
                    title="Transfers"
                    accentClass="text-amber-700"
                    emptyLabel="No transfer records yet"
                    entries={project.recentTransfers}
                  />
                  <ActivityPanel
                    title="Procurements"
                    accentClass="text-purple-700"
                    emptyLabel="No procurement requests yet"
                    entries={project.recentProcurements}
                  />
                </div>
              </div>
            ))}

            {activity.length === 0 && !loading && (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
                No project movements have been recorded yet.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectActivityPage;
