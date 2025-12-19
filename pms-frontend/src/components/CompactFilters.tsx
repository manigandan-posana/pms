import React, { useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { FiFilter, FiX } from "react-icons/fi";

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
  const [expanded, setExpanded] = useState(false);
  const hasActiveFilters = Object.values(values).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== ""));

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border transition ${
          hasActiveFilters
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <FiFilter size={12} />
        <span>Filters</span>
        {hasActiveFilters && <span className="text-[8px]">({Object.values(values).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length})</span>}
      </button>

      {expanded && (
        <div className="grid gap-1 rounded-md border border-slate-200 bg-white p-1 text-[9px] sm:grid-cols-2 lg:grid-cols-3">
          {filters.map((filter) => (
            <div key={filter.id} className="flex flex-col gap-0.5">
              <label className="font-semibold text-slate-700">{filter.label}</label>
              {filter.type === "text" && (
                <InputText
                  type="text"
                  value={values[filter.id] || ""}
                  onChange={(e) => onChange(filter.id, e.target.value)}
                  placeholder={filter.placeholder || ""}
                  className="p-inputtext-sm w-full"
                />
              )}
              {filter.type === "select" && filter.options && (
                <Dropdown
                  value={values[filter.id] || ""}
                  options={filter.options}
                  onChange={(e) => onChange(filter.id, e.value)}
                  placeholder={filter.placeholder || "Select"}
                  className="p-dropdown-sm w-full"
                  optionLabel="label"
                  optionValue="value"
                />
              )}
              {filter.type === "multiselect" && filter.options && (
                <MultiSelect
                  value={values[filter.id] || []}
                  options={filter.options}
                  onChange={(e) => onChange(filter.id, e.value)}
                  placeholder={filter.placeholder || "Select"}
                  className="p-multiselect-sm w-full"
                  optionLabel="label"
                  optionValue="value"
                  display="chip"
                  maxSelectedLabels={1}
                />
              )}
            </div>
          ))}
          {onReset && hasActiveFilters && (
            <button
              onClick={onReset}
              className="col-span-full mt-1 inline-flex items-center justify-center gap-1 rounded border border-slate-300 bg-slate-100 px-2 py-1 text-[8px] font-medium text-slate-700 hover:bg-slate-200"
            >
              <FiX size={10} />
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactFilters;
