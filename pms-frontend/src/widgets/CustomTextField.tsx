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
                style: {
                    fontSize: '0.875rem',
                    backgroundColor: '#fff',
                    ...InputProps?.style
                }
            }}
            {...props}
        />
    );
};

export default CustomTextField;
