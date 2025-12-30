import React, { useState, useEffect, useMemo } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import type { Contractor, Labour, UtilizationHours } from "../../../types/contractor";
import { Get, Post } from "../../../utils/apiService";
import {
    toISODate,
    parseISODate,
    startOfWeekMonday,
    addDays,
    isTodayISO,
    isFutureDateISO,
    calcAge,
} from "../../../utils/dateUtils";
import toast from "react-hot-toast";

interface ContractorUtilizationProps {
    contractors: Contractor[]; // List of all contractors to populate the dropdown
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function normalizeHours(v: string) {
    const num = Number(v);
    if (Number.isNaN(num)) return 0;
    return clamp(num, 0, 24);
}

export default function ContractorUtilization({ contractors }: ContractorUtilizationProps) {
    const [utilContractorId, setUtilContractorId] = useState<string>("");
    const [weekOfISO, setWeekOfISO] = useState<string>(() => toISODate(new Date()));
    const [labours, setLabours] = useState<Labour[]>([]);
    const [utilization, setUtilization] = useState<UtilizationHours>({});
    const [closedLaboursDates, setClosedLaboursDates] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const weekStart = useMemo(() => startOfWeekMonday(parseISODate(weekOfISO)), [weekOfISO]);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    // Set default selection
    useEffect(() => {
        if (!utilContractorId && contractors.length > 0) {
            const labourType = contractors.find((c) => c.type === "Labour");
            if (labourType) setUtilContractorId(labourType.id);
        }
    }, [contractors, utilContractorId]);

    // Fetch Labours and Utilization when contractor or week changes
    useEffect(() => {
        if (!utilContractorId) return;
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch labours
                const lres = await Get<any[]>(`/contractors/${encodeURIComponent(utilContractorId)}/labours`);
                const mappedLab = (lres || []).map((l) => ({
                    id: l.code ?? `LAB-${l.id}`,
                    contractorId: utilContractorId,
                    name: l.name,
                    dob: l.dob,
                    active: !!l.active,
                    createdAt: l.createdAt,
                    aadharNumber: l.aadharNumber,
                    bloodGroup: l.bloodGroup,
                    contactNumber: l.contactNumber,
                    emergencyContactNumber: l.emergencyContactNumber,
                    contactAddress: l.contactAddress,
                    esiNumber: l.esiNumber,
                    uanNumber: l.uanNumber,
                } as Labour));

                // Fetch utilization
                const start = toISODate(weekStart);
                const end = toISODate(addDays(weekStart, 6));
                const dto = await Get<any>(`/contractors/${encodeURIComponent(utilContractorId)}/utilization`, { start, end });

                if (mounted) {
                    setLabours(mappedLab);
                    setUtilization(dto?.data ?? {});
                }
            } catch (err) {
                console.error("Failed to load utilization/labours", err);
                toast.error("Failed to load data");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => {
            mounted = false;
        };
    }, [utilContractorId, weekOfISO, weekStart]);

    const utilizationActiveLabours = useMemo(() => {
        return labours.filter((l) => l.active).sort((a, b) => a.name.localeCompare(b.name));
    }, [labours]);

    async function setHours(labourId: string, dateISO: string, hours: number) {
        try {
            await Post<void>(
                `/contractors/labours/${encodeURIComponent(labourId)}/utilization?date=${encodeURIComponent(
                    dateISO
                )}&hours=${encodeURIComponent(String(hours))}`,
                null
            );
            setUtilization((prev) => {
                const next = { ...prev };
                const row = { ...(next[labourId] ?? {}) };
                row[dateISO] = hours;
                next[labourId] = row;
                return next;
            });
        } catch (err) {
            console.error("Set hours failed", err);
            toast.error("Failed to update hours");
        }
    }

    const utilizationContractor = contractors.find((c) => c.id === utilContractorId);

    return (
        <Stack spacing={2} sx={{ mt: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>

                <FormControl size="small" sx={{ minWidth: 250 }}>
                    <InputLabel>Labour Contractor</InputLabel>
                    <Select
                        label="Labour Contractor"
                        value={utilContractorId}
                        onChange={(e) => setUtilContractorId(String(e.target.value))}
                    >
                        {contractors
                            .filter((c) => c.type === "Labour")
                            .map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.name}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    label="Week Of"
                    type="date"
                    value={weekOfISO}
                    onChange={(e) => setWeekOfISO(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 160 }}
                />

                {loading && <Typography variant="caption" color="text.secondary">Loading...</Typography>}
            </Stack>

            {!utilContractorId ? (
                <Alert severity="info">Please select a labour contractor to view utilization.</Alert>
            ) : utilizationActiveLabours.length === 0 ? (
                <Alert severity="warning">No active labours found for this contractor.</Alert>
            ) : (
                <Box sx={{ overflowX: "auto", border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: "background.neutral" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, minWidth: 150 }}>Labour</TableCell>
                                {weekDays.map((d) => {
                                    const iso = toISODate(d);
                                    const isToday = isTodayISO(iso);
                                    const isPast = !isToday && !isFutureDateISO(iso);
                                    const isFuture = isFutureDateISO(iso);
                                    return (
                                        <TableCell key={iso} align="center" sx={{ minWidth: 80, fontWeight: 800 }}>
                                            <Stack>
                                                <Typography variant="caption" fontWeight={700}>
                                                    {d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' })}
                                                    {isToday && " (T)"}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    {iso}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    );
                                })}
                                <TableCell sx={{ fontWeight: 800, minWidth: 80, textAlign: 'center' }}>Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {utilizationActiveLabours.map((l) => {
                                const total = weekDays.reduce((sum, d) => {
                                    const iso = toISODate(d);
                                    return sum + (utilization[l.id]?.[iso] ?? 0);
                                }, 0);

                                return (
                                    <TableRow key={l.id} hover>
                                        <TableCell>
                                            <Stack>
                                                <Typography variant="body2" fontWeight={700}>{l.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{l.id}</Typography>
                                            </Stack>
                                        </TableCell>
                                        {weekDays.map((d) => {
                                            const iso = toISODate(d);
                                            const value = utilization[l.id]?.[iso] ?? 0;
                                            const isToday = isTodayISO(iso);
                                            const isClosed = closedLaboursDates.has(`${l.id}-${iso}`);
                                            const canEdit = isToday && !isClosed;

                                            // Allow editing past dates? Usually strictly today.
                                            // Original code: Disabled if !isToday || isClosed.
                                            // So only today is editable.

                                            return (
                                                <TableCell key={iso} align="center" sx={{ p: 0.5 }}>
                                                    <TextField
                                                        size="small"
                                                        value={String(value)}
                                                        onChange={(e) => setHours(l.id, iso, normalizeHours(e.target.value))}
                                                        inputProps={{
                                                            inputMode: "decimal",
                                                            style: { textAlign: 'center', padding: '4px' }
                                                        }}
                                                        disabled={!canEdit}
                                                        sx={{
                                                            width: 50,
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: canEdit ? 'background.paper' : 'action.skip',
                                                            }
                                                        }}
                                                    />
                                                    {canEdit && (
                                                        <Button
                                                            size="small"
                                                            sx={{ display: 'block', mx: 'auto', mt: 0.5, fontSize: '0.6rem', minWidth: 'auto', p: 0 }}
                                                            onClick={() => setClosedLaboursDates(prev => new Set([...prev, `${l.id}-${iso}`]))}
                                                        >
                                                            Close
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                        <TableCell align="center">
                                            <Typography fontWeight={700}>{total}</Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {/* Totals Row */}
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell sx={{ fontWeight: 800 }}>Total Hours</TableCell>
                                {weekDays.map((d) => {
                                    const iso = toISODate(d);
                                    const dayTotal = utilizationActiveLabours.reduce((sum, l) => sum + (utilization[l.id]?.[iso] ?? 0), 0);
                                    return (
                                        <TableCell key={iso} align="center">
                                            <Typography variant="body2" fontWeight={800}>{dayTotal}</Typography>
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="center">
                                    <Typography variant="body2" fontWeight={800}>
                                        {utilizationActiveLabours.reduce((sum, l) => {
                                            return sum + weekDays.reduce((s2, d) => s2 + (utilization[l.id]?.[toISODate(d)] ?? 0), 0);
                                        }, 0)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Stack>
    );
}
