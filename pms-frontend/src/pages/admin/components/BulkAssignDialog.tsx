import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    CircularProgress,
    Typography,
    Box,
    Checkbox,
    FormControlLabel
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../store/store";
import { listProjects } from "../../../store/slices/adminProjectsSlice";
import CustomSelect from "../../../widgets/CustomSelect";
import { Post } from "../../../utils/apiService";
import toast from "react-hot-toast";

interface BulkAssignDialogProps {
    open: boolean;
    onClose: () => void;
    resourceType: "suppliers" | "contractors";
    selectedIds: number[]; // or strings if that's what we use
    onSuccess: () => void;
}

export default function BulkAssignDialog({
    open,
    onClose,
    resourceType,
    selectedIds,
    onSuccess,
}: BulkAssignDialogProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { items: adminProjects, status } = useSelector((state: RootState) => state.adminProjects);
    const [projectIds, setProjectIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            dispatch(listProjects({}));
            setProjectIds([]);
        }
    }, [open, dispatch]);

    const projectOptions = React.useMemo(() => {
        return adminProjects.map((p: any) => ({ label: p.name || p.code || "Unknown", value: Number(p.id) }));
    }, [adminProjects]);

    const handleSave = async () => {
        if (projectIds.length === 0) {
            toast.error("Please select at least one project");
            return;
        }
        setLoading(true);
        try {
            await Post(`/${resourceType}/bulk-assign`, {
                ids: selectedIds,
                projectIds: projectIds
            });
            toast.success("Assignments updated successfully");
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Bulk assign failed", err);
            toast.error("Failed to assign projects");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Bulk Assign Projects</DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Assigning {selectedIds.length} {resourceType} to selected projects.
                    This will add the projects to the existing assignments.
                </Typography>

                {status === 'loading' ? (
                    <CircularProgress size={24} />
                ) : (
                    <CustomSelect
                        label="Select Projects"
                        value={projectIds}
                        options={projectOptions}
                        onChange={(val: number[]) => setProjectIds(val)}
                        multiple
                        fullWidth
                    />
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading || projectIds.length === 0}>
                    {loading ? "Assigning..." : "Assign"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
