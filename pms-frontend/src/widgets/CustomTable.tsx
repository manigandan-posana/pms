
import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Typography,
    Skeleton
} from "@mui/material";

export interface ColumnDef<T = any> {
    field: string;
    header: string;
    body?: (row: T) => React.ReactNode;
    width?: string | number;
    align?: 'left' | 'center' | 'right';
    style?: React.CSSProperties;
    sortable?: boolean;
}

interface CustomTableProps<T = any> {
    data: T[];
    columns: ColumnDef<T>[];
    pagination?: boolean;
    rows?: number;
    rowsPerPageOptions?: number[];
    onPageChange?: (page: number, rowsPerPage: number) => void;
    totalRecords?: number; // For server-side pagination
    loading?: boolean;
    emptyMessage?: string;
    page?: number; // Controlled page index (0-based)
    onRowClick?: (row: T) => void;
    title?: React.ReactNode;
}

const CustomTable = <T extends Record<string, any>>({
    data,
    columns,
    pagination = false,
    rows = 10,
    rowsPerPageOptions = [5, 10, 25],
    onPageChange,
    emptyMessage = "No records found",
    page: controlledPage,
    totalRecords,
    onRowClick,
    title,
    loading = false
}: CustomTableProps<T>) => {
    const [internalPage, setInternalPage] = useState(0);
    const [internalRowsPerPage, setInternalRowsPerPage] = useState(rows);

    const page = controlledPage !== undefined ? controlledPage : internalPage;
    const rowsPerPage = internalRowsPerPage;

    const handleChangePage = (_: unknown, newPage: number) => {
        if (controlledPage === undefined) {
            setInternalPage(newPage);
        }
        if (onPageChange) {
            onPageChange(newPage, rowsPerPage);
        }
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newRows = parseInt(event.target.value, 10);
        setInternalRowsPerPage(newRows);
        if (controlledPage === undefined) {
            setInternalPage(0);
        }
        if (onPageChange) {
            onPageChange(0, newRows);
        }
    };

    const slicedData = pagination && !onPageChange
        ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : data;

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            {title && (
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {title}
                </div>
            )}
            <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {columns.map((col) => (
                                <TableCell
                                    key={col.field}
                                    align={col.align || 'left'}
                                    style={{
                                        fontWeight: 600,
                                        backgroundColor: '#f8fafc',
                                        color: '#475569',
                                        fontSize: '0.75rem',
                                        ...col.style
                                    }}
                                    width={col.width}
                                >
                                    {col.header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: Math.min(rowsPerPage || 5, 5) }).map((_, index) => (
                                <TableRow key={`skeleton-${index}`}>
                                    {columns.map((col, colIndex) => (
                                        <TableCell key={`skeleton-cell-${colIndex}`} style={{ padding: '16px' }}>
                                            <Skeleton animation="wave" height={20} width="80%" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : slicedData.length > 0 ? (
                            slicedData.map((row, rowIndex) => (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    tabIndex={-1}
                                    key={rowIndex}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                                >
                                    {columns.map((col) => (
                                        <TableCell key={`${rowIndex}-${col.field}`} align={col.align || 'left'}>
                                            {col.body ? col.body(row) : row[col.field]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" style={{ padding: '2rem' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {emptyMessage}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {pagination && (
                <TablePagination
                    rowsPerPageOptions={rowsPerPageOptions}
                    component="div"
                    count={totalRecords ?? data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            )}
        </Paper>
    );
};

export default CustomTable;
