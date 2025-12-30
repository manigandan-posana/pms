import React from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Enable custom parse format plugin
dayjs.extend(customParseFormat);

interface CustomDateInputProps {
    label: string;
    value: Date | null | undefined;
    onChange: (date: Date | null) => void;
    size?: "small" | "medium";
    required?: boolean;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
}

const CustomDateInput: React.FC<CustomDateInputProps> = ({
    label,
    value,
    onChange,
    size = "medium",
    required = false,
    disabled = false,
    minDate,
    maxDate
}) => {
    // Convert Date to Dayjs
    const dayjsValue = value ? dayjs(value) : null;
    const dayjsMinDate = minDate ? dayjs(minDate) : undefined;
    const dayjsMaxDate = maxDate ? dayjs(maxDate) : undefined;

    // Handle change and convert Dayjs back to Date
    const handleChange = (newValue: Dayjs | null) => {
        if (newValue && newValue.isValid()) {
            onChange(newValue.toDate());
        } else {
            onChange(null);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label={label}
                value={dayjsValue}
                onChange={handleChange}
                format="DD-MM-YYYY"
                disabled={disabled}
                minDate={dayjsMinDate}
                maxDate={dayjsMaxDate}
                slotProps={{
                    textField: {
                        size: size,
                        fullWidth: true,
                        required: required,
                        variant: "outlined",
                    },
                }}
            />
        </LocalizationProvider>
    );
};

export default CustomDateInput;
