import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from '@/Components/ui/pagination';
import { Search, X, ChevronDown, Download } from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import { columns } from './columns';

export default function Units({ units, filters }) {
    const [columnVisibility, setColumnVisibility] = useState({});
    const [searchValue, setSearchValue] = useState(filters?.search || '');
    
    const table = useReactTable({
        data: units.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        pageCount: units.last_page,
        state: {
            columnVisibility,
            pagination: {
                pageIndex: units.current_page - 1,
                pageSize: filters?.per_page || 10,
            },
        },
        onColumnVisibilityChange: setColumnVisibility,
    });

    const handleFilterChange = (newFilters) => {
        router.get(route('admin.entrepreneur.units'), {
            ...filters,
            ...newFilters,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = () => {
        handleFilterChange({ search: searchValue, page: 1 });
    };

    const handleClearSearch = () => {
        setSearchValue('');
        handleFilterChange({ search: '', page: 1 });
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handlePageChange = (pageNumber) => {
        handleFilterChange({ page: pageNumber });
    };

    const exportUnits = () => {
        window.location.href = route('admin.entrepreneur.units.export', filters);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Entrepreneur Units Management
                </h2>
            }
        >
            <Head title="Entrepreneur Units Management" />

            <div className="p-6">
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        {/* Search Bar */}
                        <div className="flex w-full sm:w-auto gap-2 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                <Input
                                    placeholder="Search by business name, manager, or course tag..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    className="pl-9"
                                />
                            </div>
                            <Button onClick={handleSearch} variant="default">
                                Search
                            </Button>
                            {searchValue && (
                                <Button onClick={handleClearSearch} variant="outline" size="icon">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-2 w-full sm:w-auto">
                            {/* Columns Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        Columns
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => {
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    className="capitalize"
                                                    checked={column.getIsVisible()}
                                                    onCheckedChange={(value) =>
                                                        column.toggleVisibility(!!value)
                                                    }
                                                >
                                                    {column.columnDef.meta?.label || column.id}
                                                </DropdownMenuCheckboxItem>
                                            );
                                        })}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Rows Per Page */}
                            <Select
                                value={String(filters?.per_page || 10)}
                                onValueChange={(value) => handleFilterChange({ per_page: value, page: 1 })}
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 rows</SelectItem>
                                    <SelectItem value="25">25 rows</SelectItem>
                                    <SelectItem value="50">50 rows</SelectItem>
                                    <SelectItem value="100">100 rows</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Export CSV */}
                            <Button onClick={exportUnits} variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead 
                                                key={header.id}
                                                className="border-r last:border-r-0"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && 'selected'}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell 
                                                    key={cell.id}
                                                    className="border-r last:border-r-0"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No business units found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                            Showing {units.from || 0} to {units.to || 0} of {units.total} results
                        </div>
                        <Pagination className="mx-0 w-full sm:w-auto justify-center sm:justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious 
                                        onClick={() => units.current_page > 1 && handlePageChange(units.current_page - 1)}
                                        className={units.current_page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                                
                                {units.current_page > 2 && (
                                    <>
                                        <PaginationItem>
                                            <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer">
                                                1
                                            </PaginationLink>
                                        </PaginationItem>
                                        {units.current_page > 3 && <PaginationEllipsis />}
                                    </>
                                )}

                                {units.current_page > 1 && (
                                    <PaginationItem>
                                        <PaginationLink onClick={() => handlePageChange(units.current_page - 1)} className="cursor-pointer">
                                            {units.current_page - 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                )}

                                <PaginationItem>
                                    <PaginationLink isActive className="cursor-pointer">
                                        {units.current_page}
                                    </PaginationLink>
                                </PaginationItem>

                                {units.current_page < units.last_page && (
                                    <PaginationItem>
                                        <PaginationLink onClick={() => handlePageChange(units.current_page + 1)} className="cursor-pointer">
                                            {units.current_page + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                )}

                                {units.current_page < units.last_page - 1 && (
                                    <>
                                        {units.current_page < units.last_page - 2 && <PaginationEllipsis />}
                                        <PaginationItem>
                                            <PaginationLink onClick={() => handlePageChange(units.last_page)} className="cursor-pointer">
                                                {units.last_page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </>
                                )}

                                <PaginationItem>
                                    <PaginationNext 
                                        onClick={() => units.current_page < units.last_page && handlePageChange(units.current_page + 1)}
                                        className={units.current_page === units.last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
