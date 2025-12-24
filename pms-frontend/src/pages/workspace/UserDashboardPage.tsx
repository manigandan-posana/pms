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
import { BarChart, PieChart, SparkLineChart } from "@mui/x-charts";
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

const CompactMetricCard = ({ title, value, subtitle, icon, color, trend, trendValue, onClick, sparklineData }: any) => (
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

      {sparklineData && (
        <Box sx={{ flex: 1, minHeight: 40, mx: -1, mb: -1, opacity: 0.8 }}>
          <SparkLineChart
            data={sparklineData}
            height={50}
            curve="natural"
            area
            showHighlight
            showTooltip
            sx={{ '& .MuiSparkLineChart-area': { fill: color, fillOpacity: 0.1 }, '& .MuiSparkLineChart-line': { stroke: color, strokeWidth: 1.5 } }}
          />
        </Box>
      )}

      {subtitle && !sparklineData && (
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
        <Stack direction="row" spacing={1}>
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
            <SectionHeading
              title="Inventory Activity"
              action={
                <Chip label="6 Months" size="small" variant="outlined" sx={{ borderRadius: 1, height: 20, fontSize: '0.65rem' }} />
              }
            />
            <Box sx={{ width: '100%', height: 250 }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: inventoryTrendData.xAxis, disableLine: true, disableTicks: true, categoryGapRatio: 0.4 }]}
                series={[
                  { data: inventoryTrendData.inward, label: 'Inwards', color: '#6366f1', stack: 'total' },
                  { data: inventoryTrendData.outward, label: 'Outwards', color: '#f97316', stack: 'total' },
                  { data: inventoryTrendData.transfer, label: 'Transfers', color: '#a855f7', stack: 'total' },
                ]}
                margin={{ left: 30, right: 10, top: 10, bottom: 20 }}
                slotProps={{ legend: { position: { vertical: 'top', horizontal: 'end' }, itemMarkWidth: 8, itemMarkHeight: 8, labelStyle: { fontSize: 10 } } } as any}
                borderRadius={2}
                height={250}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <SectionHeading title="Transaction Mix" />
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <PieChart
                series={[{
                  data: categoryData,
                  innerRadius: 60,
                  outerRadius: 80,
                  paddingAngle: 2,
                  cornerRadius: 2,
                }]}
                margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                slotProps={{ legend: { hidden: true } as any }}
                height={180}
                width={180}
              />
              <Box sx={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  {metrics.totalTransactions}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" sx={{ fontSize: '0.65rem' }}>
                  Total
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1.5} justifyContent="center" mt={2} flexWrap="wrap">
              {categoryData.map(d => (
                <Box key={d.id} textAlign="center">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: d.color, mx: 'auto', mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{d.label}</Typography>
                  <Typography variant="body2" fontWeight={700}>{d.value}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Top Suppliers & Receivers */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', minHeight: 300 }}>
            <SectionHeading title="Top Suppliers" />
            {topEntities.suppliers.length > 0 ? (
              <BarChart
                layout="horizontal"
                dataset={topEntities.suppliers}
                yAxis={[{ scaleType: 'band', dataKey: 'label', tickLabelStyle: { fontSize: 10 } }]}
                series={[{ dataKey: 'count', label: 'Inwards', color: '#4f46e5' }]}
                height={250}
                margin={{ left: 80, right: 10, top: 10, bottom: 20 }}
                slotProps={{ legend: { hidden: true } as any }}
                borderRadius={2}
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography variant="caption" color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', minHeight: 300 }}>
            <SectionHeading title="Top Receivers" />
            {topEntities.receivers.length > 0 ? (
              <BarChart
                layout="horizontal"
                dataset={topEntities.receivers}
                yAxis={[{ scaleType: 'band', dataKey: 'label', tickLabelStyle: { fontSize: 10 } }]}
                series={[{ dataKey: 'count', label: 'Outwards', color: '#ea580c' }]}
                height={250}
                margin={{ left: 80, right: 10, top: 10, bottom: 20 }}
                slotProps={{ legend: { hidden: true } as any }}
                borderRadius={2}
              />
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography variant="caption" color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Lists */}
        {[
          { title: "Recent Inwards", data: inwardArray, icon: <InventoryIcon />, path: '/workspace/inventory/inwards', type: 'inward' },
          { title: "Recent Outwards", data: outwardArray, icon: <OutboundIcon />, path: '/workspace/inventory/outwards', type: 'outward' },
        ].map((section, idx) => (
          <Grid size={{ xs: 12, md: 6, lg: 6 }} key={idx}>
            <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', borderColor: 'divider' }}>
              <CardHeader
                title={section.title}
                titleTypographyProps={{ variant: 'subtitle2', fontWeight: 700 }}
                sx={{ py: 1.5, px: 2 }}
                action={
                  <IconButton size="small" onClick={() => navigate(section.path)}>
                    <ArrowUpIcon style={{ transform: 'rotate(45deg)', fontSize: 16 }} />
                  </IconButton>
                }
              />
              <Divider />
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {section.data.slice(0, 5).map((item: any, i: number) => (
                  <Box key={i} sx={{ p: 1.5, display: 'flex', gap: 1.5, '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer', borderBottom: '1px solid', borderColor: 'divider' }} onClick={() => navigate(section.type === 'inward' ? `/workspace/inward/detail/${item.id}` : `/workspace/outward/detail/${item.id}`)}>
                    <Avatar variant="rounded" sx={{ bgcolor: section.type === 'inward' ? 'primary.lighter' : 'warning.lighter', color: section.type === 'inward' ? 'primary.main' : 'warning.main', width: 32, height: 32, fontSize: '0.75rem' }}>
                      {section.type === 'inward' ? (item.supplierName?.[0] || 'S') : (item.issueTo?.[0] || 'O')}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {section.type === 'inward' ? (item.supplierName || 'Unknown') : (item.issueTo || 'Unknown')}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                        <Chip
                          label={section.type === 'inward' ? (item.type || 'SUPPLY') : (item.status || 'OPEN')}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.6rem',
                            bgcolor: section.type === 'inward' ? (item.type === 'RETURN' ? 'error.lighter' : 'primary.lighter') : (item.status === 'CLOSED' ? 'success.lighter' : 'warning.lighter'),
                            color: section.type === 'inward' ? (item.type === 'RETURN' ? 'error.main' : 'primary.main') : (item.status === 'CLOSED' ? 'success.main' : 'warning.main')
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {item.items || 0} items • {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                ))}
                {section.data.length === 0 && <Box p={2} textAlign="center"><Typography variant="caption" color="text.secondary">No data</Typography></Box>}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default UserDashboardPage;
