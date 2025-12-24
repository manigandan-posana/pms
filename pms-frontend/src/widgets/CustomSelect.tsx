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
    multiple,
    sx,
    ...props
}) => {
    const handleChange = (event: any) => {
        if (onChange) {
            onChange(event.target.value);
        }
    };

    // For multiple select, value must always be an array
    // For single select, validate the value exists in options
    const getValidValue = () => {
        if (multiple) {
            // Always return an array for multiple select
            if (Array.isArray(value)) {
                return value;
            }
            return [];
        }

        // Single select logic
        if (options.length === 0) {
            return '';
        }
        if (options.some(opt => String(opt.value) === String(value))) {
            return value;
        }
        return '';
    };

    const validValue = getValidValue();

    return (
        <FormControl fullWidth size={size} error={error} variant="outlined">
            {label && <InputLabel sx={{ fontSize: '0.75rem' }}>{label}</InputLabel>}
            <Select
                label={label}
                value={validValue}
                onChange={handleChange}
                multiple={multiple}
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
