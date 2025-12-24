import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

export type CustomInputProps = TextFieldProps & {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
};

const CustomTextField: React.FC<CustomInputProps> = ({
    startAdornment,
    endAdornment,
    InputProps,
    size = "small",
    variant = "outlined",
    type,
    sx,
    ...props
}) => {
    return (
        <TextField
            size={size}
            variant={variant}
            fullWidth
            type={type}
            onWheel={(e) => {
                if (type === 'number') {
                    (e.target as HTMLInputElement).blur();
                }
            }}
            InputProps={{
                ...InputProps,
                startAdornment: startAdornment ? (
                    <InputAdornment position="start">{startAdornment}</InputAdornment>
                ) : undefined,
                endAdornment: endAdornment ? (
                    <InputAdornment position="end">{endAdornment}</InputAdornment>
                ) : undefined,
                sx: {
                    fontSize: '0.75rem',
                    bgcolor: 'background.paper',
                    '& input': {
                        py: 0.75,
                        fontSize: '0.75rem'
                    },
                    ...InputProps?.sx
                }
            }}
            InputLabelProps={{
                sx: {
                    fontSize: '0.75rem'
                }
            }}
            sx={{
                '& .MuiOutlinedInput-root': {
                    minHeight: 32
                },
                ...sx
            }}
            {...props}
        />
    );
};

export default CustomTextField;
