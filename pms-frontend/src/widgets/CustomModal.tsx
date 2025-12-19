import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import type { DialogProps } from '@mui/material';

interface CustomModalProps extends DialogProps {
    title: string;
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
            {...props}
        >
            <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                    {title}
                </span>
                {/* We will assume no icon if the package is missing, or use a text X */}
                <button
                    onClick={() => onClose()}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        lineHeight: 1,
                        color: '#666'
                    }}
                >
                    &times;
                </button>
            </DialogTitle>
            <DialogContent dividers style={{ padding: '24px' }}>
                {children}
            </DialogContent>
            {footer && <DialogActions style={{ padding: '16px 24px' }}>{footer}</DialogActions>}
        </Dialog>
    );
};

export default CustomModal;
