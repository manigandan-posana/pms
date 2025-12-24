import React from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
} from '@mui/material';
import type { SelectProps } from '@mui/material';

export interface CustomSelectOption {
    value: string | number;
    label: string;
}

interface CustomSelectProps extends Omit<SelectProps, 'onChange'> {
    label?: string;
    options: CustomSelectOption[];
    onChange?: (value: any) => void;
    helperText?: string;
    error?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    label,
    options,
    value,
    onChange,
    helperText,
    error,
    size = "small",
    sx,
    ...props
}) => {
    const handleChange = (event: any) => {
        if (onChange) {
            onChange(event.target.value);
        }
    };

    return (
        <FormControl fullWidth size={size} error={error} variant="outlined">
            {label && <InputLabel sx={{ fontSize: '0.75rem' }}>{label}</InputLabel>}
            <Select
                label={label}
                value={value}
                onChange={handleChange}
                sx={{
                    bgcolor: 'background.paper',
                    fontSize: '0.75rem',
                    '& .MuiSelect-select': {
                        py: 0.75,
                        fontSize: '0.75rem'
                    },
                    minHeight: 32,
                    ...sx
                }}
                {...props}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
            {helperText && <FormHelperText sx={{ fontSize: '0.65rem', mt: 0.25 }}>{helperText}</FormHelperText>}
        </FormControl>
    );
};

export default CustomSelect;
