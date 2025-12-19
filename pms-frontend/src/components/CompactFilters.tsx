
import React, { useState } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Button,
  Chip,
  Box,
  Popover
} from "@mui/material";
import { FiFilter, FiX } from "react-icons/fi";
import CustomSelect from "../widgets/CustomSelect";

interface FilterOption {
  label: string;
  value: string;
}

interface CompactFilterConfig {
  id: string;
  label: string;
  type: "text" | "select" | "multiselect";
  options?: FilterOption[];
  placeholder?: string;
}

interface CompactFiltersProps {
  filters: CompactFilterConfig[];
  values: Record<string, any>;
  onChange: (filterId: string, value: any) => void;
  onReset?: () => void;
}

export const CompactFilters: React.FC<CompactFiltersProps> = ({
  filters,
  values,
  onChange,
  onReset,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const hasActiveFilters = Object.values(values).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== ""));
  const activeCount = Object.values(values).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length;

  return (
    <div>
      <Button
        aria-describedby={id}
        variant={hasActiveFilters ? "outlined" : "outlined"}
        color={hasActiveFilters ? "primary" : "inherit"}
        size="small"
        onClick={handleClick}
        startIcon={<FiFilter />}
        sx={{
          borderColor: hasActiveFilters ? 'primary.main' : 'divider',
          backgroundColor: hasActiveFilters ? 'primary.50' : 'background.paper',
          color: hasActiveFilters ? 'primary.main' : 'text.secondary',
          textTransform: 'none',
          minWidth: 'auto',
          fontSize: '0.8125rem',
          py: 0.5,
          '&:hover': {
            borderColor: hasActiveFilters ? 'primary.dark' : 'text.primary',
            backgroundColor: hasActiveFilters ? 'primary.100' : 'action.hover',
          }
        }}
      >
        Filters {hasActiveFilters && `(${activeCount})`}
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { p: 2, width: 320, maxWidth: '100%' }
        }}
      >
        <div className="flex flex-col gap-3">
          {filters.map((filter) => (
            <div key={filter.id} className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-700">{filter.label}</span>
              {filter.type === "text" && (
                <TextField
                  size="small"
                  variant="outlined"
                  value={values[filter.id] || ""}
                  onChange={(e) => onChange(filter.id, e.target.value)}
                  placeholder={filter.placeholder}
                  fullWidth
                  InputProps={{ style: { fontSize: '0.875rem' } }}
                />
              )}
              {filter.type === "select" && filter.options && (
                <CustomSelect
                  value={values[filter.id] || ""}
                  options={filter.options}
                  onChange={(val) => onChange(filter.id, val)}
                  placeholder={filter.placeholder}
                  size="small"
                />
              )}
              {filter.type === "multiselect" && filter.options && (
                <Autocomplete
                  multiple
                  size="small"
                  options={filter.options}
                  getOptionLabel={(option) => option.label}
                  value={filter.options.filter(opt => (values[filter.id] || []).includes(opt.value))}
                  onChange={(_, newValue) => {
                    onChange(filter.id, newValue.map(v => v.value));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} placeholder={filter.placeholder} />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.value}
                        label={option.label}
                        size="small"
                      />
                    ))
                  }
                />
              )}
            </div>
          ))}

          {onReset && hasActiveFilters && (
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                size="small"
                startIcon={<FiX />}
                onClick={onReset}
                color="error"
                sx={{ textTransform: 'none' }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </Popover>
    </div>
  );
};

export default CompactFilters;
