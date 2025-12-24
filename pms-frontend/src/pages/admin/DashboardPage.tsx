import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Box, Stack, Typography, Paper, Grid, CircularProgress } from "@mui/material";
import { FiBox, FiFile, FiUsers, FiTrendingUp } from "react-icons/fi";
import { getAnalytics } from "../../store/slices/adminUsersSlice";
import type { AppDispatch } from "../../store/store";
import { BarChart } from "@mui/x-charts/BarChart";

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Stack spacing={1} alignItems="center">
          <CircularProgress size={32} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Loading analytics...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Page Header */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          Admin Dashboard
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          Overview of inventory, projects, and user statistics
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={1}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, textTransform: 'uppercase' }}>
                  Total Projects
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  {summary.totalProjects}
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, bgcolor: 'primary.lighter', borderRadius: '50%' }}>
                <FiFile size={20} style={{ color: '#1976d2' }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, textTransform: 'uppercase' }}>
                  Total Materials
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  {summary.totalMaterials}
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, bgcolor: 'success.lighter', borderRadius: '50%' }}>
                <FiBox size={20} style={{ color: '#2e7d32' }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, textTransform: 'uppercase' }}>
                  Total Users
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  {summary.totalUsers}
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, bgcolor: 'secondary.lighter', borderRadius: '50%' }}>
                <FiUsers size={20} style={{ color: '#9c27b0' }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, textTransform: 'uppercase' }}>
                  Utilization
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  {utilizationPercentage}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                  {summary.utilized} / {summary.received}
                </Typography>
              </Box>
              <Box sx={{ p: 0.75, bgcolor: 'warning.lighter', borderRadius: '50%' }}>
                <FiTrendingUp size={20} style={{ color: '#ed6c02' }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={1}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>
              System Overview
            </Typography>
            <Box sx={{ width: '100%', minHeight: 250 }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: ['Projects', 'Materials', 'Users'] }]}
                series={[{ data: [summary.totalProjects, summary.totalMaterials, summary.totalUsers], color: '#10b981' }]}
                margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                height={250}
                slotProps={{ legend: { hidden: true } }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>
              Material Inventory
            </Typography>
            <Box sx={{ width: '100%', minHeight: 250 }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: ['Received', 'Utilized'] }]}
                series={[{ data: [summary.received, summary.utilized], color: '#3b82f6' }]}
                margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                height={250}
                slotProps={{ legend: { hidden: true } }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Info Cards */}
      <Grid container spacing={1}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 1.5, borderRadius: 1, bgcolor: 'primary.lighter' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1, color: 'primary.dark' }}>
              Inventory Summary
            </Typography>
            <Stack spacing={0.75} sx={{ fontSize: '0.75rem', color: 'primary.dark' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">Materials Received:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{summary.received}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">Materials Utilized:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{summary.utilized}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">Available Stock:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{summary.received - summary.utilized}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 1.5, borderRadius: 1, bgcolor: 'success.lighter' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1, color: 'success.dark' }}>
              Quick Stats
            </Typography>
            <Stack spacing={0.75} sx={{ fontSize: '0.75rem', color: 'success.dark' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">Active Projects:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{summary.totalProjects}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">Material Types:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{summary.totalMaterials}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">System Users:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{summary.totalUsers}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
