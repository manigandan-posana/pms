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
    ...props
}) => {
    const handleChange = (event: any) => {
        if (onChange) {
            onChange(event.target.value);
        }
    };

    return (
        <FormControl fullWidth size={size} error={error} variant="outlined">
            {label && <InputLabel>{label}</InputLabel>}
            <Select
                label={label}
                value={value}
                onChange={handleChange}
                style={{ backgroundColor: '#fff', fontSize: '0.875rem' }}
                {...props}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value} style={{ fontSize: '0.875rem' }}>
                        {option.label}
                    </MenuItem>
                ))}
            </Select>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
};

export default CustomSelect;
