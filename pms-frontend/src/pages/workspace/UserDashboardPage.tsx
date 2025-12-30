import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Paper,
  Divider,
  Stack,
  IconButton,
  CardHeader,
  ToggleButtonGroup,
  ToggleButton
} from "@mui/material";
import { LineChart, PieChart } from "@mui/x-charts";
import {
  MdArrowUpward as ArrowUpIcon,
  MdArrowDownward as ArrowDownIcon,
  MdInventory as InventoryIcon,
  MdLocalShipping as TruckIcon,
  MdSwapHoriz as TransferIcon,
  MdAssignment as ValidationIcon,
  MdLocalGasStation as FuelIcon,
  MdAdd as AddIcon,
  MdOutbound as OutboundIcon
} from "react-icons/md";

import type { RootState, AppDispatch } from "../../store/store";
import { searchInwardHistory, searchOutwardHistory, searchTransferHistory } from "../../store/slices/historySlice";
import { loadVehicleData } from "../../store/slices/vehicleSlice";

// --- Helpers ---

// Helper to extract array from paginated response
const extractList = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

// --- Components ---

const CompactMetricCard = ({ title, value, subtitle, icon, color, trend, trendValue, onClick }: any) => (
  <Card
    variant="outlined"
    sx={{
      height: '100%',
      borderColor: 'divider',
      borderRadius: 1, // Compact radius
      transition: 'box-shadow 0.2s',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 2 } : {}, // Softer hover
      position: 'relative',
      overflow: 'hidden'
    }}
    onClick={onClick}
  >
    <Box sx={{ position: 'absolute', top: -8, right: -8, opacity: 0.05, transform: 'scale(1.5)', color }}>
      {icon}
    </Box>
    <CardContent sx={{ p: 1.5, display: 'flex', flexDirection: 'column', height: '100%', '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Avatar variant="rounded" sx={{ bgcolor: `${color}15`, color: color, width: 28, height: 28, borderRadius: 1 }}>
              {React.cloneElement(icon, { fontSize: "1rem" })}
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
              {title.toUpperCase()}
            </Typography>
          </Stack>
          <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ my: 0.5, fontSize: '1.5rem' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {(trend || trendValue) && (
            <Chip
              icon={trend === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
              label={trendValue || '0%'}
              size="small"
              sx={{
                bgcolor: trend === 'up' ? 'success.lighter' : 'error.lighter', // Use theme
                color: trend === 'up' ? 'success.main' : 'error.main',
                borderRadius: 0.5,
                fontSize: '0.65rem',
                fontWeight: 700,
                height: 20,
                '& .MuiChip-icon': { fontSize: '0.85rem', color: 'inherit' }
              }}
            />
          )}
        </Box>
      </Stack>

      {subtitle && (
        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mt: 'auto', fontSize: '0.7rem' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const SectionHeading = ({ title, action }: any) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 0.5 }}>
    <Typography variant="subtitle2" fontWeight={700} color="text.primary">
      {title}
    </Typography>
    {action}
  </Box>
);

const UserDashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months' | '6months' | 'year'>('month');

  const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
  const { vehicles, fuelEntries, dailyLogs } = useSelector((state: RootState) => state.vehicles);
  const { inwardHistory, outwardHistory, transferHistory } = useSelector((state: RootState) => state.history);

  const inwardArray = useMemo(() => extractList(inwardHistory), [inwardHistory]);
  const outwardArray = useMemo(() => extractList(outwardHistory), [outwardHistory]);
  const transferArray = useMemo(() => extractList(transferHistory), [transferHistory]);

  useEffect(() => {
    if (selectedProjectId) {
      const timer = setTimeout(() => {
        dispatch(searchInwardHistory({ projectId: selectedProjectId, page: 1, size: 100 }));
        dispatch(searchOutwardHistory({ projectId: selectedProjectId, page: 1, size: 100 }));
        dispatch(searchTransferHistory({ projectId: selectedProjectId, page: 1, size: 100 }));
        dispatch(loadVehicleData(Number(selectedProjectId)));
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedProjectId, dispatch]);

  const metrics = useMemo(() => {
    const totalInwards = inwardArray.length;
    const totalOutwards = outwardArray.length;
    const totalTransfers = transferArray.length;
    const pendingValidations = [...inwardArray, ...outwardArray].filter((item: any) =>
      item.validated === false || item.validated === "false" || item.status === "PENDING"
    ).length;
    const totalTransactions = totalInwards + totalOutwards + totalTransfers;

    const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE').length;
    const totalVehicles = vehicles.length;
    const utilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    const totalFuelCost = fuelEntries.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    const totalDistance = dailyLogs.filter(log => log.status === 'CLOSED').reduce((sum, log) => sum + (log.distance || 0), 0);
    const openEntries = fuelEntries.filter(e => e.status === 'OPEN').length + dailyLogs.filter(l => l.status === 'OPEN').length;

    return {
      totalInwards,
      totalOutwards,
      totalTransfers,
      pendingValidations,
      totalTransactions,
      activeVehicles,
      totalVehicles,
      utilization,
      totalFuelCost,
      totalDistance,
      openEntries
    };
  }, [inwardArray, outwardArray, transferArray, vehicles, fuelEntries, dailyLogs]);

  const inventoryTrendData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let labels: string[] = [];
    let dataPoints = 0;
    let startDate = new Date();

    // Determine time range
    switch (timeRange) {
      case 'week':
        dataPoints = 7;
        startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        labels = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return d.toLocaleDateString('en-US', { weekday: 'short' });
        });
        break;
      case 'month':
        dataPoints = 30;
        startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        labels = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return `${d.getDate()}`;
        });
        break;
      case '3months':
        dataPoints = 12;
        startDate = new Date(currentYear, currentMonth - 2, 1);
        labels = Array.from({ length: 12 }, (_, i) => {
          const d = new Date(currentYear, currentMonth - 2, 1 + i * 7);
          return `W${i + 1}`;
        });
        break;
      case '6months':
        dataPoints = 6;
        startDate = new Date(currentYear, currentMonth - 5, 1);
        labels = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(currentYear, currentMonth - 5 + i, 1);
          return d.toLocaleDateString('en-US', { month: 'short' });
        });
        break;
      case 'year':
        dataPoints = 12;
        startDate = new Date(currentYear, 0, 1);
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        break;
    }

    const inwardData = new Array(dataPoints).fill(0);
    const outwardData = new Array(dataPoints).fill(0);
    const transferData = new Array(dataPoints).fill(0);
    const fuelData = new Array(dataPoints).fill(0);

    const getIndex = (date: Date) => {
      if (timeRange === 'week') {
        const diff = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        return diff >= 0 && diff < 7 ? diff : -1;
      } else if (timeRange === 'month') {
        const diff = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        return diff >= 0 && diff < 30 ? diff : -1;
      } else if (timeRange === '3months') {
        const weeksDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return weeksDiff >= 0 && weeksDiff < 12 ? weeksDiff : -1;
      } else if (timeRange === '6months') {
        const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + date.getMonth() - startDate.getMonth();
        return monthsDiff >= 0 && monthsDiff < 6 ? monthsDiff : -1;
      } else {
        return date.getMonth();
      }
    };

    const processDate = (curr: any, arr: number[], value?: number) => {
      const d = new Date(curr.date || curr.entryDate || curr.createdAt);
      if (!isNaN(d.getTime()) && d >= startDate && d <= now) {
        const idx = getIndex(d);
        if (idx >= 0 && idx < dataPoints) {
          arr[idx] += value !== undefined ? value : 1;
        }
      }
    };

    inwardArray.forEach(i => processDate(i, inwardData));
    outwardArray.forEach(o => processDate(o, outwardData));
    transferArray.forEach(t => processDate(t, transferData));
    fuelEntries.forEach(f => processDate(f, fuelData, f.totalCost || 0));

    return {
      xAxis: labels,
      inward: inwardData,
      outward: outwardData,
      transfer: transferData,
      fuel: fuelData
    };
  }, [inwardArray, outwardArray, transferArray, fuelEntries, timeRange]);

  const categoryData = useMemo(() => {
    return [
      { id: 0, value: metrics.totalInwards, label: 'Inwards', color: '#6366f1' },
      { id: 1, value: metrics.totalOutwards, label: 'Outwards', color: '#f97316' },
      { id: 2, value: metrics.totalTransfers, label: 'Transfers', color: '#8b5cf6' },
    ].filter(d => d.value > 0);
  }, [metrics]);

  const vehicleChartData = useMemo(() => {
    const now = new Date();
    let labels: string[] = [];
    let dataPoints = 0;
    let startDate = new Date();

    // Use same time range logic
    switch (timeRange) {
      case 'week':
        dataPoints = 7;
        startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        labels = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return d.toLocaleDateString('en-US', { weekday: 'short' });
        });
        break;
      case 'month':
        dataPoints = 30;
        startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        labels = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          return `${d.getDate()}`;
        });
        break;
      case '3months':
        dataPoints = 12;
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        labels = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
        break;
      case '6months':
        dataPoints = 6;
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        labels = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
          return d.toLocaleDateString('en-US', { month: 'short' });
        });
        break;
      case 'year':
        dataPoints = 12;
        startDate = new Date(now.getFullYear(), 0, 1);
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        break;
    }

    // Vehicle Status over time
    const activeData = new Array(dataPoints).fill(0);
    const inactiveData = new Array(dataPoints).fill(0);
    const plannedData = new Array(dataPoints).fill(0);

    // Fuel Type over time
    const petrolData = new Array(dataPoints).fill(0);
    const dieselData = new Array(dataPoints).fill(0);
    const electricData = new Array(dataPoints).fill(0);

    // For simplicity, we'll show current counts across all time points
    // In a real scenario, you'd track historical changes
    vehicles.forEach(v => {
      for (let i = 0; i < dataPoints; i++) {
        if (v.status === 'ACTIVE') activeData[i]++;
        else if (v.status === 'INACTIVE') inactiveData[i]++;
        else if (v.status === 'PLANNED') plannedData[i]++;

        if (v.fuelType === 'PETROL') petrolData[i]++;
        else if (v.fuelType === 'DIESEL') dieselData[i]++;
        else if (v.fuelType === 'ELECTRIC') electricData[i]++;
      }
    });

    return {
      labels,
      statusData: { active: activeData, inactive: inactiveData, planned: plannedData },
      fuelData: { petrol: petrolData, diesel: dieselData, electric: electricData }
    };
  }, [vehicles, timeRange]);

  if (!selectedProjectId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <InventoryIcon style={{ fontSize: 48, color: '#bdbdbd', marginBottom: 16 }} />
          <Typography variant="body1" color="text.secondary">Select a Project to view dashboard</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, maxWidth: 1600, mx: 'auto', bgcolor: 'grey.50', minHeight: '100vh' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} color="text.primary">
            Executive Dashboard
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Real-time operations overview
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_, newValue) => newValue && setTimeRange(newValue)}
            size="small"
            sx={{
              bgcolor: 'background.paper',
              '& .MuiToggleButton-root': {
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                textTransform: 'none',
                border: '1px solid',
                borderColor: 'divider',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }
              }
            }}
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="3months">3M</ToggleButton>
            <ToggleButton value="6months">6M</ToggleButton>
            <ToggleButton value="year">Year</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate('/workspace/inventory/inwards')}
            sx={{ textTransform: 'none', borderRadius: 1 }}
          >
            New Inward
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TruckIcon />}
            onClick={() => navigate('/workspace/vehicles')}
            sx={{ textTransform: 'none', borderRadius: 1 }}
          >
            Fleet Manager
          </Button>
        </Stack>
      </Box>

      {/* Overview Metrics Grid */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <CompactMetricCard
            title="Total Inwards"
            value={metrics.totalInwards}
            icon={<InventoryIcon />}
            color="#6366f1"
            onClick={() => navigate('/workspace/inventory/inwards')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <CompactMetricCard
            title="Total Outwards"
            value={metrics.totalOutwards}
            icon={<OutboundIcon />}
            color="#f97316"
            onClick={() => navigate('/workspace/inventory/outwards')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <CompactMetricCard
            title="Transfers"
            value={metrics.totalTransfers}
            icon={<TransferIcon />}
            color="#a855f7"
            onClick={() => navigate('/workspace/inventory/transfers')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <CompactMetricCard
            title="Fuel Cost"
            value={`₹${(metrics.totalFuelCost / 1000).toFixed(1)}k`}
            subtitle={`${(metrics.totalDistance / 1000).toFixed(1)}k km run`}
            icon={<FuelIcon />}
            color="#e11d48"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <CompactMetricCard
            title="Pending Actions"
            value={metrics.pendingValidations + metrics.openEntries}
            subtitle={`${metrics.pendingValidations} Val, ${metrics.openEntries} Logs`}
            icon={<ValidationIcon />}
            color="#d97706"
            trend={metrics.pendingValidations + metrics.openEntries > 0 ? 'up' : 'neutral'}
            trendValue={metrics.pendingValidations + metrics.openEntries > 0 ? 'Action' : 'OK'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Charts Section */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <SectionHeading title="Inventory Activity" />
            <Box sx={{ width: '100%', height: 280 }}>
              <LineChart
                xAxis={[{ scaleType: 'point', data: inventoryTrendData.xAxis }]}
                series={[
                  {
                    data: inventoryTrendData.inward,
                    label: 'Inwards',
                    color: '#6366f1',
                    curve: 'natural',
                    showMark: true,
                    area: true
                  },
                  {
                    data: inventoryTrendData.outward,
                    label: 'Outwards',
                    color: '#f97316',
                    curve: 'natural',
                    showMark: true,
                    area: true
                  },
                  {
                    data: inventoryTrendData.transfer,
                    label: 'Transfers',
                    color: '#a855f7',
                    curve: 'natural',
                    showMark: true,
                    area: true
                  },
                ]}
                margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                slotProps={{
                  legend: {
                    position: { vertical: 'top', horizontal: 'right' },
                    padding: { top: 0, bottom: 10, left: 10, right: 10 }
                  }
                } as any}
                height={280}
                sx={{
                  '& .MuiLineElement-root': {
                    strokeWidth: 2.5
                  },
                  '& .MuiAreaElement-root': {
                    fillOpacity: 0.1
                  },
                  '& .MuiMarkElement-root': {
                    scale: '0.8',
                    strokeWidth: 2
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <SectionHeading title="Transaction Mix" />
            <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <PieChart
                series={[{
                  data: categoryData,
                  innerRadius: 55,
                  outerRadius: 85,
                  paddingAngle: 3,
                  cornerRadius: 5,
                  highlightScope: { fade: 'global', highlight: 'item' },
                }]}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                slotProps={{ legend: { hidden: true } as any }}
                height={200}
                width={200}
                sx={{
                  '& .MuiPieArc-root': {
                    stroke: '#fff',
                    strokeWidth: 2,
                  }
                }}
              />
              <Box sx={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                <Typography variant="h4" fontWeight={700} color="text.primary">
                  {metrics.totalTransactions}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" sx={{ fontSize: '0.65rem' }}>
                  Total
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1.5} justifyContent="center" mt={1} flexWrap="wrap">
              {categoryData.map(d => (
                <Box key={d.id} textAlign="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color, mx: 'auto', mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{d.label}</Typography>
                  <Typography variant="body2" fontWeight={700}>{d.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Vehicle Analytics Charts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', minHeight: 300 }}>
            <SectionHeading title="Vehicle Status Over Time" />
            {vehicles.length > 0 ? (
              <Box sx={{ width: '100%', height: 280 }}>
                <LineChart
                  xAxis={[{ scaleType: 'point', data: vehicleChartData.labels }]}
                  series={[
                    {
                      data: vehicleChartData.statusData.active,
                      label: 'Active',
                      color: '#10b981',
                      curve: 'natural',
                      showMark: true,
                      area: true
                    },
                    {
                      data: vehicleChartData.statusData.inactive,
                      label: 'Inactive',
                      color: '#ef4444',
                      curve: 'natural',
                      showMark: true,
                      area: true
                    },
                    {
                      data: vehicleChartData.statusData.planned,
                      label: 'Planned',
                      color: '#f59e0b',
                      curve: 'natural',
                      showMark: true,
                      area: true
                    },
                  ]}
                  margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'top', horizontal: 'right' },
                    }
                  } as any}
                  height={280}
                  sx={{
                    '& .MuiLineElement-root': {
                      strokeWidth: 2.5
                    },
                    '& .MuiAreaElement-root': {
                      fillOpacity: 0.1
                    },
                    '& .MuiMarkElement-root': {
                      scale: '0.8',
                      strokeWidth: 2
                    }
                  }}
                />
              </Box>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography variant="caption" color="text.secondary">No vehicles available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', minHeight: 300 }}>
            <SectionHeading title="Fuel Type Distribution Over Time" />
            {vehicles.length > 0 ? (
              <Box sx={{ width: '100%', height: 280 }}>
                <LineChart
                  xAxis={[{ scaleType: 'point', data: vehicleChartData.labels }]}
                  series={[
                    {
                      data: vehicleChartData.fuelData.petrol,
                      label: 'Petrol',
                      color: '#3b82f6',
                      curve: 'natural',
                      showMark: true,
                      area: true
                    },
                    {
                      data: vehicleChartData.fuelData.diesel,
                      label: 'Diesel',
                      color: '#f97316',
                      curve: 'natural',
                      showMark: true,
                      area: true
                    },
                    {
                      data: vehicleChartData.fuelData.electric,
                      label: 'Electric',
                      color: '#10b981',
                      curve: 'natural',
                      showMark: true,
                      area: true
                    },
                  ]}
                  margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                  slotProps={{
                    legend: {
                      position: { vertical: 'top', horizontal: 'right' },
                      itemMarkWidth: 10,
                      itemMarkHeight: 10,
                      labelStyle: { fontSize: 10, fontWeight: 600 }
                    }
                  } as any}
                  height={280}
                  sx={{
                    '& .MuiLineElement-root': {
                      strokeWidth: 2.5
                    },
                    '& .MuiAreaElement-root': {
                      fillOpacity: 0.1
                    },
                    '& .MuiMarkElement-root': {
                      scale: '0.8',
                      strokeWidth: 2
                    }
                  }}
                />
              </Box>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography variant="caption" color="text.secondary">No vehicles available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity Lists */}
        {/* Recent Transfers */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderColor: 'divider' }}>
            <CardHeader
              title="Recent Transfers"
              titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
              sx={{ py: 1.5, px: 2 }}
              action={
                <IconButton size="small" onClick={() => navigate('/workspace/inventory/transfers')}>
                  <ArrowUpIcon style={{ transform: 'rotate(45deg)', fontSize: 16 }} />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {transferArray.slice(0, 5).map((item: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    gap: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                  onClick={() => navigate(`/workspace/transfer/detail/${item.id}`)}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: 'purple.lighter',
                      color: 'purple.main',
                      width: 32,
                      height: 32
                    }}
                  >
                    <TransferIcon style={{ fontSize: '1rem' }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      Transfer #{item.id}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <Chip
                        label={item.status || 'PENDING'}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          bgcolor: item.status === 'COMPLETED' ? 'success.lighter' : 'warning.lighter',
                          color: item.status === 'COMPLETED' ? 'success.main' : 'warning.main'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
              {transferArray.length === 0 && (
                <Box p={2} textAlign="center">
                  <Typography variant="caption" color="text.secondary">No transfers yet</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Recent Fuel Entries */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderColor: 'divider' }}>
            <CardHeader
              title="Recent Fuel Entries"
              titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
              sx={{ py: 1.5, px: 2 }}
              action={
                <IconButton size="small" onClick={() => navigate('/workspace/vehicles')}>
                  <ArrowUpIcon style={{ transform: 'rotate(45deg)', fontSize: 16 }} />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {fuelEntries.slice(0, 5).map((item: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    gap: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                  onClick={() => navigate('/workspace/vehicles')}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: 'error.lighter',
                      color: 'error.main',
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem'
                    }}
                  >
                    <FuelIcon style={{ fontSize: '1rem' }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.vehicleName || item.vehicleNumber}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <Chip
                        label={item.status || 'OPEN'}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          bgcolor: item.status === 'CLOSED' ? 'success.lighter' : 'warning.lighter',
                          color: item.status === 'CLOSED' ? 'success.main' : 'warning.main'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.litres}L • ₹{item.totalCost}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
              {fuelEntries.length === 0 && (
                <Box p={2} textAlign="center">
                  <Typography variant="caption" color="text.secondary">No fuel entries yet</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Recent Daily Logs */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderColor: 'divider' }}>
            <CardHeader
              title="Recent Daily Logs"
              titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
              sx={{ py: 1.5, px: 2 }}
              action={
                <IconButton size="small" onClick={() => navigate('/workspace/vehicles')}>
                  <ArrowUpIcon style={{ transform: 'rotate(45deg)', fontSize: 16 }} />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {dailyLogs.slice(0, 5).map((item: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    gap: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                  onClick={() => navigate('/workspace/vehicles')}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: 'info.lighter',
                      color: 'info.main',
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem'
                    }}
                  >
                    <TruckIcon style={{ fontSize: '1rem' }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.vehicleName || item.vehicleNumber}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <Chip
                        label={item.status || 'OPEN'}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          bgcolor: item.status === 'CLOSED' ? 'success.lighter' : 'warning.lighter',
                          color: item.status === 'CLOSED' ? 'success.main' : 'warning.main'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.distance ? `${item.distance} km` : `${item.openingKm} km`}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
              {dailyLogs.length === 0 && (
                <Box p={2} textAlign="center">
                  <Typography variant="caption" color="text.secondary">No daily logs yet</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Recent Inwards */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderColor: 'divider' }}>
            <CardHeader
              title="Recent Inwards"
              titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
              sx={{ py: 1.5, px: 2 }}
              action={
                <IconButton size="small" onClick={() => navigate('/workspace/inventory/inwards')}>
                  <ArrowUpIcon style={{ transform: 'rotate(45deg)', fontSize: 16 }} />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {inwardArray.slice(0, 5).map((item: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    gap: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                  onClick={() => navigate(`/workspace/inward/detail/${item.id}`)}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: 'primary.lighter',
                      color: 'primary.main',
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem'
                    }}
                  >
                    {item.supplierName?.[0] || 'S'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.supplierName || 'Unknown Supplier'}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <Chip
                        label={item.type || 'SUPPLY'}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          bgcolor: item.type === 'RETURN' ? 'error.lighter' : 'primary.lighter',
                          color: item.type === 'RETURN' ? 'error.main' : 'primary.main'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.items || 0} items • {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
              {inwardArray.length === 0 && (
                <Box p={2} textAlign="center">
                  <Typography variant="caption" color="text.secondary">No inwards yet</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Recent Outwards */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderColor: 'divider' }}>
            <CardHeader
              title="Recent Outwards"
              titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
              sx={{ py: 1.5, px: 2 }}
              action={
                <IconButton size="small" onClick={() => navigate('/workspace/inventory/outwards')}>
                  <ArrowUpIcon style={{ transform: 'rotate(45deg)', fontSize: 16 }} />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {outwardArray.slice(0, 5).map((item: any, i: number) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    gap: 1.5,
                    '&:hover': { bgcolor: 'action.hover' },
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                  onClick={() => navigate(`/workspace/outward/detail/${item.id}`)}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: 'warning.lighter',
                      color: 'warning.main',
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem'
                    }}
                  >
                    {item.issueTo?.[0] || 'O'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.issueTo || 'Unknown Receiver'}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <Chip
                        label={item.status || 'OPEN'}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          bgcolor: item.status === 'CLOSED' ? 'success.lighter' : 'warning.lighter',
                          color: item.status === 'CLOSED' ? 'success.main' : 'warning.main'
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.items || 0} items • {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
              {outwardArray.length === 0 && (
                <Box p={2} textAlign="center">
                  <Typography variant="caption" color="text.secondary">No outwards yet</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDashboardPage;
