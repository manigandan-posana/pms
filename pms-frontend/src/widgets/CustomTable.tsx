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
    Skeleton,
    Card,
    CardContent,
    Stack,
    Box,
    Divider,
    useMediaQuery,
    useTheme
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
    totalRecords?: number;
    loading?: boolean;
    emptyMessage?: string;
    page?: number;
    onRowClick?: (row: T) => void;
    title?: React.ReactNode;
}

const CustomTable = <T extends Record<string, any>>({
    data,
    columns,
    pagination = false,
    rows = 20,
    rowsPerPageOptions = [10, 20, 50],
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

    // Mobile Card View
    const renderMobileCards = () => (
        <Stack spacing={1} sx={{ p: 1 }}>
            {loading ? (
                Array.from({ length: Math.min(rowsPerPage || 5, 5) }).map((_, index) => (
                    <Card key={`skeleton-${index}`} variant="outlined" sx={{ borderRadius: 1 }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Skeleton animation="wave" height={20} width="60%" sx={{ mb: 0.5 }} />
                            <Skeleton animation="wave" height={16} width="80%" />
                        </CardContent>
                    </Card>
                ))
            ) : slicedData.length > 0 ? (
                slicedData.map((row, rowIndex) => (
                    <Card
                        key={rowIndex}
                        variant="outlined"
                        onClick={() => onRowClick && onRowClick(row)}
                        sx={{
                            borderRadius: 1,
                            cursor: onRowClick ? 'pointer' : 'default',
                            '&:hover': onRowClick ? { bgcolor: 'action.hover' } : {}
                        }}
                    >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Stack spacing={0.5}>
                                {columns.map((col, colIndex) => (
                                    <Box key={`${rowIndex}-${col.field}`}>
                                        <Stack direction="row" spacing={1} alignItems="flex-start">
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: 'text.secondary',
                                                    minWidth: 80,
                                                    fontSize: '0.7rem'
                                                }}
                                            >
                                                {col.header}:
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    flex: 1,
                                                    fontSize: '0.8rem',
                                                    color: 'text.primary'
                                                }}
                                            >
                                                {col.body ? col.body(row) : row[col.field] || '—'}
                                            </Typography>
                                        </Stack>
                                        {colIndex < columns.length - 1 && <Divider sx={{ my: 0.5 }} />}
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card variant="outlined" sx={{ borderRadius: 1 }}>
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {emptyMessage}
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Stack>
    );

    // Desktop Table View
    const renderDesktopTable = () => (
        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        {columns.map((col) => (
                            <TableCell
                                key={col.field}
                                align={col.align || 'left'}
                                sx={{
                                    fontWeight: 600,
                                    bgcolor: 'grey.50',
                                    color: 'text.secondary',
                                    fontSize: '0.75rem',
                                    py: 0.75,
                                    px: 1,
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    whiteSpace: 'nowrap',
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
                                    <TableCell key={`skeleton-cell-${colIndex}`} sx={{ py: 0.75, px: 1 }}>
                                        <Skeleton animation="wave" height={16} width="80%" />
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
                                sx={{
                                    cursor: onRowClick ? 'pointer' : 'default',
                                    '&:last-child td': { borderBottom: 0 }
                                }}
                            >
                                {columns.map((col) => (
                                    <TableCell
                                        key={`${rowIndex}-${col.field}`}
                                        align={col.align || 'left'}
                                        sx={{
                                            fontSize: '0.75rem',
                                            py: 0.75,
                                            px: 1,
                                            color: 'text.primary',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: col.width || 200
                                        }}
                                    >
                                        {col.body ? col.body(row) : row[col.field]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                align="center"
                                sx={{ py: 3, fontSize: '0.75rem', color: 'text.secondary' }}
                            >
                                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                    {emptyMessage}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 1, borderRadius: 1 }}>
            {title && (
                <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {title}
                </Box>
            )}

            {/* Responsive rendering */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                {renderDesktopTable()}
            </Box>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {renderMobileCards()}
            </Box>

            {pagination && (
                <TablePagination
                    rowsPerPageOptions={rowsPerPageOptions}
                    component="div"
                    count={totalRecords ?? data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: 1,
                        borderColor: 'divider',
                        fontSize: '0.75rem',
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            m: 0
                        },
                        '& .MuiTablePagination-select': {
                            fontSize: '0.75rem'
                        },
                        '& .MuiTablePagination-toolbar': {
                            minHeight: 40,
                            px: 1
                        }
                    }}
                />
            )}
        </Paper>
    );
};

export default CustomTable;
