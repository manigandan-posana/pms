import React from 'react';
import CustomTextField from './CustomTextField';
import type { CustomInputProps } from './CustomTextField';

interface CustomDateInputProps extends Omit<CustomInputProps, 'type'> {
    value?: Date | string | null;
    onChange?: (e: any) => void;
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
    value,
    onChange,
    InputLabelProps, // Extract to merge
    ...props
}) => {
    // Convert Date object to YYYY-MM-DD string for input type="date"
    const formattedValue = value instanceof Date
        ? value.toISOString().split('T')[0]
        : value || '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Pass back the event or value. Previous usage in Calendar was e.value (Date).
        // Here we get a string. We might want to convert back to Date if expected.
        // However, existing usage in AdvancedHistoryFilters: onChange={(e) => handleInputChange("startDate", e.value)}
        // PrimeReact Calendar e.value is Date.

        if (onChange) {
            // Mocking the event structure or handling value directly?
            // AdvancedHistoryFilters expects handleInputChange(key, value).
            // We'll standardise that existing code should handle Date or string.
            // But let's return a Date if possible to be compatible.

            const dateVal = e.target.value ? new Date(e.target.value) : null;
            // We can trigger onChange with a synthetic event-like object or just call the parent handler logic.
            // But CustomModal etc are widgets. 
            // Let's stick to returning the event, but we need compatibility.

            // Actually, let's look at usage: e.value
            // Let's mimic the expected signature if we can, or change usage.
            // Changing usage is safer.
            onChange({ target: { value: dateVal }, value: dateVal });
        }
    };

    return (
        <CustomTextField
            type="date"
            value={formattedValue}
            onChange={handleChange}
            InputLabelProps={{ shrink: true, ...InputLabelProps }}
            {...props}
        />
    );
};

export default CustomDateInput;
