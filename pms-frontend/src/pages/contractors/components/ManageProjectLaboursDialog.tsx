import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Checkbox,
    CircularProgress,
    TextField,
    Box,
    Typography
} from '@mui/material';
import { Get, Put } from '../../../utils/apiService';
import type { Labour } from '../../../types/contractor';
import toast from 'react-hot-toast';

interface ManageProjectLaboursDialogProps {
    open: boolean;
    onClose: () => void;
    contractorId: string;
    projectId: number;
    currentLabours: Labour[];
    onSuccess: (updatedLabours: Labour[]) => void;
}

export default function ManageProjectLaboursDialog({
    open,
    onClose,
    contractorId,
    projectId,
    currentLabours,
    onSuccess,
}: ManageProjectLaboursDialogProps) {
    const [allLabours, setAllLabours] = useState<Labour[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (open && contractorId) {
            fetchAllLabours();
            // initialize selection from currentLabours
            const initialIds = new Set(currentLabours.map(l => l.id));
            setSelectedIds(initialIds);
        }
    }, [open, contractorId, currentLabours]);

    const fetchAllLabours = async () => {
        setLoading(true);
        try {
            // Fetch ALL labours (no projectId param)
            const data = await Get<any[]>(`/contractors/${encodeURIComponent(contractorId)}/labours`);
            const mapped = (data || []).map((l) => ({
                id: l.code ?? `LAB-${l.id}`,
                name: l.name,
                dob: l.dob,
                active: !!l.active,
                // simplified mapping for selection list
            } as Labour));
            setAllLabours(mapped);
        } catch (err) {
            console.error("Failed to fetch all labours", err);
            toast.error("Failed to load labour list");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const codesToLink = Array.from(selectedIds);
            await Put(`/contractors/${encodeURIComponent(contractorId)}/projects/${projectId}/labours`, codesToLink);

            toast.success("Project labour assignment updated");

            // Filter allLabours to return the updated list locally, or just trigger refresh
            const updatedList = allLabours.filter(l => selectedIds.has(l.id));
            onSuccess(updatedList);
            onClose();
        } catch (err) {
            console.error("Failed to update assignments", err);
            toast.error("Failed to update assignments");
        } finally {
            setSaving(false);
        }
    };

    const filteredLabours = allLabours.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Manage Project Labours</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
                ) : (
                    <>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search labours..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ mb: 2, mt: 1 }}
                        />
                        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {filteredLabours.map((labour) => {
                                const isSelected = selectedIds.has(labour.id);
                                return (
                                    <ListItem
                                        key={labour.id}
                                        disablePadding
                                    >
                                        <ListItemButton onClick={() => handleToggle(labour.id)}>
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={isSelected}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={labour.name}
                                                secondary={!labour.active ? "(Inactive)" : null}
                                                primaryTypographyProps={{ color: !labour.active ? 'text.secondary' : 'inherit' }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                            {filteredLabours.length === 0 && (
                                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                                    No labours found.
                                </Typography>
                            )}
                        </List>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            {selectedIds.size} labours selected for this project.
                        </Typography>
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading || saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
