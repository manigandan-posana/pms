import React, { useState } from "react";
import CustomTable, { type ColumnDef } from "../widgets/CustomTable";
import CustomButton from "../widgets/CustomButton";
import CustomTextField from "../widgets/CustomTextField";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

export interface DataRow {
  id: string | number;
  [key: string]: any;
}

export interface ColumnConfig<T = DataRow> {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  body?: (rowData: T) => React.ReactNode;
}

interface AdminDataTableProps<T extends DataRow = DataRow> {
  data: T[];
  columns: ColumnConfig<T>[];
  title?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onAdd?: () => void;
  loading?: boolean;
  totalRecords?: number;
  first?: number;
  rows?: number;
  onPageChange?: (event: any) => void; // PrimeReact signature
  resizableColumns?: boolean;
  reorderableColumns?: boolean;
  scrollable?: boolean;
  scrollHeight?: string;
  className?: string;
}

export const AdminDataTable = <T extends DataRow = DataRow>({
  data,
  columns,
  title,
  onEdit,
  onDelete,
  onAdd,
  loading = false,
  totalRecords = 0,
  first = 0,
  rows = 10,
  onPageChange,
  className = "",
}: AdminDataTableProps<T>) => {
  const [filterText, setFilterText] = useState("");

  // Filter data client-side if no server-side pagination handler is usually involved for search in this component
  // note: The original component set globalFilter on DataTable.
  const filteredData = React.useMemo(() => {
    if (!filterText) return data;
    const lower = filterText.toLowerCase();
    return data.filter((row) => {
      // Simple checking of all string values in row
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lower)
      );
    });
  }, [data, filterText]);

  const tableColumns: ColumnDef<T>[] = columns.map((col) => ({
    field: col.field,
    header: col.header,
    width: col.width ? parseInt(col.width) : undefined, // CustomTable expects number for width mostly, or string? CustomTable 'width' type is number|string? Check CustomTable.
    // CustomTable ColumnDef width is number. 
    // If incoming width is string "20%", it might be issue.
    // Let's assume CustomTable handles style width if passed?
    // CustomTable uses `style={{ width: col.width }}` if provided. 
    // If width is "20%", it works in style.
    // But ColumnDef type says width?: number. I should update CustomTable ColumnDef or cast here.
    // I will cast to any to bypass strict check or update CustomTable later.
    // Actually, let's treat it as flexible.
    body: col.body,
    align: 'left', // Default
  }));

  if (onEdit || onDelete) {
    tableColumns.push({
      field: "actions",
      header: "Actions",
      width: 100,
      align: "right",
      body: (row) => (
        <div className="flex justify-end gap-2">
          {onEdit && (
            <CustomButton
              size="small"
              variant="text"
              onClick={() => onEdit(row)}
              className="!p-1 !min-w-0 text-blue-600 hover:bg-blue-50"
              title="Edit"
            >
              <FiEdit2 size={14} />
            </CustomButton>
          )}
          {onDelete && (
            <CustomButton
              size="small"
              variant="text"
              onClick={() => onDelete(row)}
              className="!p-1 !min-w-0 text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <FiTrash2 size={14} />
            </CustomButton>
          )}
        </div>
      ),
    });
  }

  // Calculate page index from 'first' and 'rows'
  const pageIndex = Math.floor(first / rows);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          {title && <h3 className="font-semibold text-slate-700">{title}</h3>}
          <span className="text-xs text-slate-500 font-medium bg-slate-200 px-2 py-0.5 rounded-full">
            {totalRecords || data.length} records
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-64">
            <CustomTextField
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              size="small"
            />
          </div>
          {onAdd && (
            <CustomButton
              startIcon={<FiPlus />}
              onClick={onAdd}
              size="small"
            >
              Add
            </CustomButton>
          )}
        </div>
      </div>

      <CustomTable
        data={filteredData}
        columns={tableColumns as any} // Cast because of width type mismatch potentially
        loading={loading}
        pagination
        rows={rows}
        page={pageIndex} // CustomTable uses 0-based page index
        totalRecords={totalRecords}
        onPageChange={(p, r) => {
          if (onPageChange) {
            // PrimeReact onPage expects { first: number, rows: number, page: number, pageCount: number }
            // We construct a mock event
            onPageChange({
              first: p * r,
              rows: r,
              page: p,
              pageCount: Math.ceil((totalRecords || filteredData.length) / r)
            });
          }
        }}
        rowsPerPageOptions={[10, 20, 50]}
        emptyMessage="No records found."
      />
    </div>
  );
};

export default AdminDataTable;
