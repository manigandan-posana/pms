import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography
} from '@mui/material';
import type { DialogProps } from '@mui/material';
import { FiX } from 'react-icons/fi';

interface CustomModalProps extends Omit<DialogProps, 'title'> {
    title: React.ReactNode;
    onClose: () => void;
    footer?: React.ReactNode;
}

const CustomModal: React.FC<CustomModalProps> = ({
    title,
    open,
    onClose,
    children,
    footer,
    maxWidth = "sm",
    fullWidth = true,
    ...props
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            PaperProps={{
                sx: {
                    borderRadius: 1
                }
            }}
            {...props}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, pb: 1 }}>
                <Typography variant="subtitle2" component="div" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {title}
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                >
                    <FiX size={16} />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 1.5 }}>
                {children}
            </DialogContent>
            {footer && <DialogActions sx={{ p: 1, gap: 0.5 }}>{footer}</DialogActions>}
        </Dialog>
    );
};

export default CustomModal;
