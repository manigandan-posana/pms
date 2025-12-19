import React, { useState, useCallback } from "react";
import CustomTextField from "../widgets/CustomTextField";
import CustomDateInput from "../widgets/CustomDateInput";
import CustomButton from "../widgets/CustomButton";
import { FiCalendar, FiSearch, FiX } from "react-icons/fi";

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
  filterType,
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
    <div className="flex flex-wrap items-center justify-between gap-4 w-full">
      {/* Date filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-slate-400" />
          <div style={{ width: 140 }}>
            <CustomDateInput
              value={filters.startDate}
              onChange={(e: any) => handleInputChange("startDate", e.value)}
              label="Start Date"
              size="small"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FiCalendar className="text-slate-400" />
          <div style={{ width: 140 }}>
            <CustomDateInput
              value={filters.endDate}
              onChange={(e: any) => handleInputChange("endDate", e.value)}
              label="End Date"
              size="small"
              disabled={isLoading}
            />
          </div>
        </div>

        {(filters.startDate || filters.endDate || searchQuery) && (
          <CustomButton
            onClick={handleReset}
            disabled={isLoading}
            variant="text"
            className="text-slate-500 hover:text-slate-700 p-2 min-w-0"
            title="Clear filters"
          >
            <FiX size={18} />
          </CustomButton>
        )}
      </div>

      {/* Search bar and create button */}
      <div className="flex items-center gap-3">
        <div className="w-64">
          <CustomTextField
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
            placeholder="Search records..."
            size="small"
            InputProps={{
              startAdornment: <FiSearch className="text-slate-400 mr-2" />,
            }}
          />
        </div>
        {createButton}
      </div>
    </div>
  );
};

export default AdvancedHistoryFilters;
