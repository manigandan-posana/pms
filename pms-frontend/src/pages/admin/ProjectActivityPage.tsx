import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Box, Stack, Typography, Paper, Grid, Chip, CircularProgress } from "@mui/material";
import { FiDownloadCloud, FiUploadCloud, FiRepeat, FiShoppingCart, FiPackage, FiActivity } from "react-icons/fi";
import { getProjectActivity } from "../../store/slices/adminUsersSlice";
import type { ProjectActivityDto, ProjectActivityEntryDto } from "../../types/backend";
import type { AppDispatch } from "../../store/store";

interface ActivityPanelProps {
  title: string;
  accentColor: string;
  emptyLabel: string;
  entries: ProjectActivityEntryDto[];
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ title, accentColor, emptyLabel, entries }) => {
  return (
    <Paper sx={{ borderRadius: 1, overflow: 'hidden' }}>
      <Box sx={{ px: 1, py: 0.75, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ fontWeight: 600, color: accentColor, textTransform: 'uppercase', fontSize: '0.65rem' }}>
            {title}
          </Typography>
          {entries.length > 0 && (
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
              {entries.length} recent
            </Typography>
          )}
        </Stack>
      </Box>
      <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
        {entries.length === 0 && (
          <Box sx={{ px: 1, py: 1.5, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
              {emptyLabel}
            </Typography>
          </Box>
        )}
        {entries.map((entry) => (
          <Box
            key={`${title}-${entry.id ?? entry.code ?? entry.subject ?? Math.random()}`}
            sx={{ px: 1, py: 0.75, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', fontFamily: 'monospace' }} noWrap>
                    {entry.code || "Not set"}
                  </Typography>
                  {entry.status && (
                    <Chip label={entry.status} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                  )}
                </Stack>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }} noWrap>
                  {entry.subject || "No subject"}
                </Typography>
                {entry.direction && (
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }} noWrap>
                    {entry.direction}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                  {entry.date || "-"}
                </Typography>
                {typeof entry.lineCount === "number" && (
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', display: 'block' }}>
                    {entry.lineCount} item(s)
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>
    </Paper>
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
    { label: "Inwards", value: aggregatedTotals.inwards, icon: FiDownloadCloud, color: "#2e7d32", bgcolor: "success.lighter" },
    { label: "Outwards", value: aggregatedTotals.outwards, icon: FiUploadCloud, color: "#1976d2", bgcolor: "primary.lighter" },
    { label: "Transfers", value: aggregatedTotals.transfers, icon: FiRepeat, color: "#ed6c02", bgcolor: "warning.lighter" },
    { label: "Procurements", value: aggregatedTotals.procurements, icon: FiShoppingCart, color: "#9c27b0", bgcolor: "secondary.lighter" },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header */}
      <Box>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <FiActivity size={16} style={{ color: '#1976d2' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Project Movement Overview
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block', mt: 0.25 }}>
          Get a project-wise view of every inward, outward, transfer, and procurement request with concise summaries and the latest activity snapshots.
        </Typography>
      </Box>

      {loading && (
        <Paper sx={{ p: 2, borderRadius: 1 }}>
          <Stack spacing={1} alignItems="center">
            <CircularProgress size={32} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Loading project activity…
            </Typography>
          </Stack>
        </Paper>
      )}

      {!loading && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={1}>
            {summaryCards.map(({ label, value, icon: Icon, color, bgcolor }) => (
              <Grid item xs={12} sm={6} md={3} key={label}>
                <Paper sx={{ p: 1.5, borderRadius: 1, bgcolor }}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                        {label}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                        {value}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 0.75, borderRadius: '50%', bgcolor }}>
                      <Icon size={20} style={{ color }} />
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Project Activity */}
          <Stack spacing={1}>
            {activity.map((project) => (
              <Paper key={project.projectId} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <FiPackage size={14} style={{ color: '#1976d2' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {project.projectCode ? `${project.projectCode} - ${project.projectName}` : project.projectName}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        Latest material movements and approvals
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      <Chip label={`${project.inwardCount} Inwards`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'success.lighter', color: 'success.dark' }} />
                      <Chip label={`${project.outwardCount} Outwards`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'primary.lighter', color: 'primary.dark' }} />
                      <Chip label={`${project.transferCount} Transfers`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'warning.lighter', color: 'warning.dark' }} />
                      <Chip label={`${project.procurementCount} Procurements`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: 'secondary.lighter', color: 'secondary.dark' }} />
                    </Stack>
                  </Stack>
                </Box>
                <Box sx={{ p: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} sm={6} lg={3}>
                      <ActivityPanel
                        title="Inwards"
                        accentColor="success.dark"
                        emptyLabel="No inward records yet"
                        entries={project.recentInwards}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                      <ActivityPanel
                        title="Outwards"
                        accentColor="primary.dark"
                        emptyLabel="No outward records yet"
                        entries={project.recentOutwards}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                      <ActivityPanel
                        title="Transfers"
                        accentColor="warning.dark"
                        emptyLabel="No transfer records yet"
                        entries={project.recentTransfers}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} lg={3}>
                      <ActivityPanel
                        title="Procurements"
                        accentColor="secondary.dark"
                        emptyLabel="No procurement requests yet"
                        entries={project.recentProcurements}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            ))}

            {activity.length === 0 && !loading && (
              <Paper sx={{ p: 3, borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  No project movements have been recorded yet.
                </Typography>
              </Paper>
            )}
          </Stack>
        </>
      )}
    </Box>
  );
};

export default ProjectActivityPage;
