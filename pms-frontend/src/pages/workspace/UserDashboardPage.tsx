import React, { useEffect, useMemo } from "react";
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
  CardHeader
} from "@mui/material";
import { BarChart, PieChart, LineChart, SparkLineChart, Gauge } from "@mui/x-charts";
import {
  MdArrowUpward as ArrowUpIcon,
  MdArrowDownward as ArrowDownIcon,
  MdInventory as InventoryIcon,
  MdLocalShipping as TruckIcon,
  MdSwapHoriz as TransferIcon,
  MdAssignment as ValidationIcon,
  MdLocalGasStation as FuelIcon,
  MdDirectionsCar as CarIcon,
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

const CompactMetricCard = ({ title, value, subtitle, icon, color, trend, trendValue, onClick, sparklineData }: any) => (
  <Card
    variant="outlined"
    sx={{
      height: '100%',
      borderColor: 'rgba(0,0,0,0.06)',
      borderRadius: 4,
      background: 'white',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)' } : {},
      position: 'relative',
      overflow: 'hidden'
    }}
    onClick={onClick}
  >
    <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.05, transform: 'scale(1.5)', color }}>
      {icon}
    </Box>
    <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Avatar variant="rounded" sx={{ bgcolor: `${color}10`, color: color, width: 42, height: 42, mb: 1.5, borderRadius: 2 }}>
            {React.cloneElement(icon, { fontSize: "1.2rem" })}
          </Avatar>
          <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>
            {title.toUpperCase()}
          </Typography>
          <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ my: 0.5 }}>
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
                bgcolor: trend === 'up' ? '#ecfdf5' : '#fef2f2',
                color: trend === 'up' ? '#059669' : '#dc2626',
                borderRadius: 1,
                fontSize: '0.7rem',
                fontWeight: 700,
                height: 24,
                '& .MuiChip-icon': { fontSize: '1rem', color: 'inherit' }
              }}
            />
          )}
        </Box>
      </Stack>

      {sparklineData && (
        <Box sx={{ flex: 1, minHeight: 60, mx: -2, mb: -2, opacity: 0.8 }}>
          <SparkLineChart
            data={sparklineData}
            height={80}
            curve="natural"
            area
            showHighlight
            showTooltip
            sx={{ '& .MuiSparkLineChart-area': { fill: color, fillOpacity: 0.2 }, '& .MuiSparkLineChart-line': { stroke: color, strokeWidth: 2 } }}
          />
        </Box>
      )}

      {subtitle && !sparklineData && (
        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 'auto' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const SectionHeading = ({ title, action }: any) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 1 }}>
    <Typography variant="h6" fontWeight={700} fontSize="1rem" color="text.primary">
      {title}
    </Typography>
    {action}
  </Box>
);

const UserDashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { selectedProjectId } = useSelector((state: RootState) => state.workspace);
  const { vehicles, fuelEntries, dailyLogs } = useSelector((state: RootState) => state.vehicles);
  const { inwardHistory, outwardHistory, transferHistory } = useSelector((state: RootState) => state.history);

  // Use helper to extract correct data arrays
  // Use helper to extract correct data arrays
  const inwardArray = useMemo(() => extractList(inwardHistory), [inwardHistory]);
  const outwardArray = useMemo(() => extractList(outwardHistory), [outwardHistory]);
  const transferArray = useMemo(() => extractList(transferHistory), [transferHistory]);

  const dailyLogArray = useMemo(() => {
    return [...dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyLogs]);

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

  // --- Metrics Calculations ---

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

  // --- Charts Data ---

  const inventoryTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const inwardData = new Array(12).fill(0);
    const outwardData = new Array(12).fill(0);
    const transferData = new Array(12).fill(0);
    const fuelData = new Array(12).fill(0);

    const processDate = (curr: any, arr: number[], value?: number) => {
      const d = new Date(curr.date || curr.entryDate || curr.createdAt);
      if (!isNaN(d.getTime()) && d.getFullYear() === currentYear) {
        if (value !== undefined) {
          arr[d.getMonth()] += value;
        } else {
          arr[d.getMonth()] += 1;
        }
      }
    };

    inwardArray.forEach(i => processDate(i, inwardData));
    outwardArray.forEach(o => processDate(o, outwardData));
    transferArray.forEach(t => processDate(t, transferData));
    fuelEntries.forEach(f => processDate(f, fuelData, f.totalCost || 0));

    const currentMonth = new Date().getMonth();
    const start = Math.max(0, currentMonth - 5);
    const range = currentMonth + 1;

    return {
      xAxis: months.slice(start, range),
      inward: inwardData.slice(start, range),
      outward: outwardData.slice(start, range),
      transfer: transferData.slice(start, range),
      fuel: fuelData.slice(start, range)
    };
  }, [inwardArray, outwardArray, transferArray, fuelEntries]);

  const categoryData = useMemo(() => {
    // Simple pie chart based on counts
    return [
      { id: 0, value: metrics.totalInwards, label: 'Inwards', color: '#6366f1' },
      { id: 1, value: metrics.totalOutwards, label: 'Outwards', color: '#f97316' },
      { id: 2, value: metrics.totalTransfers, label: 'Transfers', color: '#8b5cf6' },
    ].filter(d => d.value > 0);
  }, [metrics]);



  const topEntities = useMemo(() => {
    // Top Suppliers
    const supplierCounts: Record<string, number> = {};
    inwardArray.forEach(i => {
      const name = i.supplierName || 'Unknown';
      supplierCounts[name] = (supplierCounts[name] || 0) + 1;
    });
    const suppliers = Object.entries(supplierCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ label: name, count }));

    // Top Receivers
    const receiverCounts: Record<string, number> = {};
    outwardArray.forEach(o => {
      const name = o.issueTo || 'Unknown';
      receiverCounts[name] = (receiverCounts[name] || 0) + 1;
    });
    const receivers = Object.entries(receiverCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ label: name, count }));

    return { suppliers, receivers };
  }, [inwardArray, outwardArray]);

  // --- Render ---

  if (!selectedProjectId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <InventoryIcon style={{ fontSize: 48, color: '#94a3b8', marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">Select a Project</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto', bgcolor: '#f8fafc', minHeight: '100vh' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="slate.900" sx={{ letterSpacing: '-0.5px' }}>
            Executive Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time overview of inventory & fleet operations
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/workspace/inventory/inwards')}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2 }}
          >
            New Inward
          </Button>
          <Button
            variant="outlined"
            startIcon={<TruckIcon />}
            onClick={() => navigate('/workspace/vehicles')}
            sx={{ borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }, textTransform: 'none', borderRadius: 2 }}
          >
            Fleet Manager
          </Button>
        </Stack>
      </Box>

      {/* Overview Metrics Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <CompactMetricCard
            title="Total Inwards"
            value={metrics.totalInwards}
            icon={<InventoryIcon />}
            color="#4f46e5"
            onClick={() => navigate('/workspace/inventory/inwards')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <CompactMetricCard
            title="Total Outwards"
            value={metrics.totalOutwards}
            icon={<OutboundIcon />}
            color="#ea580c"
            onClick={() => navigate('/workspace/inventory/outwards')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <CompactMetricCard
            title="Transfers"
            value={metrics.totalTransfers}
            icon={<TransferIcon />}
            color="#9333ea"
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
            trendValue={metrics.pendingValidations + metrics.openEntries > 0 ? 'Attention' : 'All Clear'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Charts Section */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px -3px rgba(6,81,237,0.1)' }}>
            <SectionHeading
              title="Inventory Activity Trend"
              action={
                <Chip label="Last 6 Months" size="small" variant="outlined" sx={{ borderRadius: 1 }} />
              }
            />
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: inventoryTrendData.xAxis, disableLine: true, disableTicks: true, categoryGapRatio: 0.4 }]}
                series={[
                  { data: inventoryTrendData.inward, label: 'Inwards', color: '#6366f1', stack: 'total' },
                  { data: inventoryTrendData.outward, label: 'Outwards', color: '#f97316', stack: 'total' },
                  { data: inventoryTrendData.transfer, label: 'Transfers', color: '#a855f7', stack: 'total' },
                ]}
                margin={{ left: 40, right: 10, top: 20, bottom: 30 }}
                slotProps={{ legend: { hidden: false, position: { vertical: 'top', horizontal: 'end' } } }}
                borderRadius={4}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px -3px rgba(6,81,237,0.1)' }}>
            <SectionHeading title="Transaction Mix" />
            <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <PieChart
                series={[{
                  data: categoryData,
                  innerRadius: 80,
                  outerRadius: 100,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  cx: 150,
                  cy: 110
                }]}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                slotProps={{ legend: { hidden: true } as any }}
                height={220}
              />
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <Typography variant="h4" fontWeight={800} color="text.primary">
                  {metrics.totalTransactions}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Total
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
              {categoryData.map(d => (
                <Box key={d.id} textAlign="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color, mx: 'auto', mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary">{d.label}</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>{d.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* New Analytics: Top Suppliers & Receivers */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', minHeight: 350, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px -3px rgba(6,81,237,0.1)' }}>
            <SectionHeading title="Top Suppliers" />
            {topEntities.suppliers.length > 0 ? (
              <BarChart
                layout="horizontal"
                dataset={topEntities.suppliers}
                yAxis={[{ scaleType: 'band', dataKey: 'label' }]}
                series={[{ dataKey: 'count', label: 'Inwards', color: '#4f46e5' }]}
                height={280}
                margin={{ left: 100, right: 20, top: 20, bottom: 20 }}
                slotProps={{ legend: { hidden: true } as any }}
                borderRadius={4}
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography color="text.secondary">No supplier data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', minHeight: 350, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px -3px rgba(6,81,237,0.1)' }}>
            <SectionHeading title="Top Receivers" />
            {topEntities.receivers.length > 0 ? (
              <BarChart
                layout="horizontal"
                dataset={topEntities.receivers}
                yAxis={[{ scaleType: 'band', dataKey: 'label' }]}
                series={[{ dataKey: 'count', label: 'Outwards', color: '#ea580c' }]}
                height={280}
                margin={{ left: 100, right: 20, top: 20, bottom: 20 }}
                slotProps={{ legend: { hidden: true } as any }}
                borderRadius={4}
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                <Typography color="text.secondary">No receiver data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardHeader
              title="Recent Inwards"
              titleTypographyProps={{ variant: 'h6', fontWeight: 700, fontSize: '1rem' }}
              action={
                <IconButton size="small" onClick={() => navigate('/workspace/inventory/inwards')}>
                  <ArrowUpIcon style={{ transform: 'rotate(45deg)' }} />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {inwardArray.slice(0, 5).map((item: any, i) => (
                <Box key={i} sx={{ p: 2, display: 'flex', gap: 2, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }, cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)' }} onClick={() => navigate(`/workspace/inward/detail/${item.id}`)}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', width: 40, height: 40, fontWeight: 700, fontSize: '0.875rem' }}>
                    {item.supplierName?.[0] || 'S'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {item.supplierName || 'Unknown Supplier'}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <Chip label={item.type || 'SUPPLY'} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: item.type === 'RETURN' ? '#fdf2f8' : '#eff6ff', color: item.type === 'RETURN' ? '#db2777' : '#2563eb' }} />
                      <Typography variant="caption" color="text.secondary">
                        {item.items || 0} items • {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
              {inwardArray.length === 0 && <Box p={3} textAlign="center"><Typography variant="body2" color="text.secondary">No recent data</Typography></Box>}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardHeader
              title="Recent Outwards"
              titleTypographyProps={{ variant: 'h6', fontWeight: 700, fontSize: '1rem' }}
              action={
                <IconButton size="small" onClick={() => navigate('/workspace/inventory/outwards')}>
                  <ArrowUpIcon style={{ transform: 'rotate(45deg)' }} />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {outwardArray.slice(0, 5).map((item: any, i) => (
                <Box key={i} sx={{ p: 2, display: 'flex', gap: 2, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }, cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)' }} onClick={() => navigate(`/workspace/outward/detail/${item.id}`)}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#fff7ed', color: '#ea580c', width: 40, height: 40, fontWeight: 700, fontSize: '0.875rem' }}>
                    {item.issueTo?.[0] || 'O'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {item.issueTo || 'Unknown Receiver'}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <Chip label={item.status || 'OPEN'} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: item.status === 'CLOSED' ? '#ecfdf5' : '#fffbeb', color: item.status === 'CLOSED' ? '#059669' : '#d97706' }} />
                      <Typography variant="caption" color="text.secondary">
                        {item.items || 0} items • {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
              {outwardArray.length === 0 && <Box p={3} textAlign="center"><Typography variant="body2" color="text.secondary">No recent data</Typography></Box>}
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardHeader
              title="Recent Fuel Logs"
              titleTypographyProps={{ variant: 'h6', fontWeight: 700, fontSize: '1rem' }}
              action={
                <IconButton size="small" onClick={() => navigate('/workspace/vehicles')}>
                  <ArrowUpIcon style={{ transform: 'rotate(45deg)' }} />
                </IconButton>
              }
            />
            <Divider />
            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
              {fuelEntries.slice(0, 5).map((item: any, i) => (
                <Box key={i} sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#f1f5f9', color: '#475569', width: 40, height: 40 }}>
                    <CarIcon fontSize="small" />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {item.vehicleName}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                      <Typography variant="caption" fontWeight={700} color="text.primary">
                        ₹{item.totalCost?.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        • {item.litres}L • {item.fuelType}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>
              ))}
              {fuelEntries.length === 0 && <Box p={3} textAlign="center"><Typography variant="body2" color="text.secondary">No recent data</Typography></Box>}
            </Box>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default UserDashboardPage;

