import React, { useState, useCallback } from "react";
import CustomTextField from "../widgets/CustomTextField";
import CustomDateInput from "../widgets/CustomDateInput";
import { FiCalendar, FiSearch, FiX } from "react-icons/fi";
import { Stack, Box, IconButton } from "@mui/material";

export interface HistoryFilters {
  startDate?: Date | null;
  endDate?: Date | null;
}

interface AdvancedHistoryFiltersProps {
  filterType: "inward" | "outward" | "transfer";
  onFilterChange: (filters: HistoryFilters) => void;
  isLoading?: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  createButton?: React.ReactNode;
}

export const AdvancedHistoryFilters: React.FC<AdvancedHistoryFiltersProps> = ({
  filterType: _filterType,
  onFilterChange,
  isLoading = false,
  searchQuery,
  onSearchChange,
  createButton,
}) => {
  const [filters, setFilters] = useState<HistoryFilters>({});

  const handleInputChange = useCallback(
    (key: keyof HistoryFilters, value: any) => {
      const updatedFilters = {
        ...filters,
        [key]: value || undefined,
      };
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
    },
    [filters, onFilterChange]
  );

  const handleReset = useCallback(() => {
    setFilters({});
    onFilterChange({});
    onSearchChange("");
  }, [onFilterChange, onSearchChange]);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      sx={{ width: '100%' }}
    >
      {/* Date filters */}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Stack direction="row" spacing={0.5} alignItems="center">
          <FiCalendar size={14} style={{ color: '#9ca3af' }} />
          <Box sx={{ width: 120 }}>
            <CustomDateInput
              value={filters.startDate}
              onChange={(date: Date | null) => handleInputChange("startDate", date)}
              label="Start Date"
              size="small"
              disabled={isLoading}
            />
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <FiCalendar size={14} style={{ color: '#9ca3af' }} />
          <Box sx={{ width: 120 }}>
            <CustomDateInput
              value={filters.endDate}
              onChange={(date: Date | null) => handleInputChange("endDate", date)}
              label="End Date"
              size="small"
              disabled={isLoading}
            />
          </Box>
        </Stack>

        {(filters.startDate || filters.endDate || searchQuery) && (
          <IconButton
            onClick={handleReset}
            disabled={isLoading}
            size="small"
            title="Clear filters"
            sx={{ color: 'text.secondary' }}
          >
            <FiX size={16} />
          </IconButton>
        )}
      </Stack>

      {/* Search bar and create button */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: { xs: '100%', sm: 200 } }}>
          <CustomTextField
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
            placeholder="Search records..."
            size="small"
            startAdornment={<FiSearch size={14} style={{ color: '#9ca3af' }} />}
          />
        </Box>
        {createButton}
      </Stack>
    </Stack>
  );
};

export default AdvancedHistoryFilters;
