import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
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
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { AlertCircle, Search, X, ChevronDown } from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import { columns } from './columns';

export default function Index({ transactions, filters }) {
    const [columnVisibility, setColumnVisibility] = useState({});
    const [searchValue, setSearchValue] = useState(filters?.search || '');
    
    const table = useReactTable({
        data: transactions.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualFiltering: true,
        manualSorting: true,
        pageCount: transactions.last_page,
        state: {
            columnVisibility,
            pagination: {
                pageIndex: transactions.current_page - 1,
                pageSize: filters?.per_page || 10,
            },
        },
        onColumnVisibilityChange: setColumnVisibility,
    });

    const handleFilterChange = (newFilters) => {
        router.get(route('transactions.my'), {
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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Transactions
                </h2>
            }
        >
            <Head title="My Transactions" />

            <div className="pt-2 pb-8">
                <div className="mx-auto max-w-7xl">
                    <div className="bg-white">
                        {/* Content */}
                        <div className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                                {/* Search */}
                                <div className="flex items-center gap-2 w-full sm:max-w-md">
                                    <Input
                                        placeholder="Search by Reference ID or Amount..."
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyPress={handleSearchKeyPress}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleSearch}
                                        className="bg-black hover:bg-gray-800 text-white flex-shrink-0"
                                    >
                                        <Search className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Search</span>
                                    </Button>
                                    {filters?.search && (
                                        <Button
                                            onClick={handleClearSearch}
                                            variant="outline"
                                            className="border-gray-300 flex-shrink-0"
                                        >
                                            <X className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Clear</span>
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 justify-end sm:justify-start">
                                    {/* Rows per page */}
                                    <Select
                                        value={String(filters?.per_page || 10)}
                                        onValueChange={(value) => handleFilterChange({ per_page: value, page: 1 })}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10 rows</SelectItem>
                                            <SelectItem value="20">20 rows</SelectItem>
                                            <SelectItem value="30">30 rows</SelectItem>
                                            <SelectItem value="50">50 rows</SelectItem>
                                            <SelectItem value="100">100 rows</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Column visibility */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline">
                                                Columns
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {table.getAllColumns()
                                                .filter((column) => column.getCanHide())
                                                .map((column) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={column.id}
                                                        checked={column.getIsVisible()}
                                                        onCheckedChange={(value) =>
                                                            column.toggleVisibility(!!value)
                                                        }
                                                    >
                                                        {column.columnDef.meta?.label || column.id}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Table */}
                            {transactions.data.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No transactions found.</p>
                                    <Link
                                        href={route('transactions.submit')}
                                        className="mt-4 inline-block text-gray-900 hover:text-gray-700 font-medium"
                                    >
                                        Submit your first transaction
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                {table.getHeaderGroups().map((headerGroup) => (
                                                    <TableRow key={headerGroup.id}>
                                                        {headerGroup.headers.map((header) => (
                                                            <TableHead key={header.id} className="border-r last:border-r-0">
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
                                                {table.getRowModel().rows.map((row) => (
                                                    <TableRow key={row.id}>
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell key={cell.id} className="border-r last:border-r-0">
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext()
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-0 mt-4">
                                        <div className="text-sm text-gray-500 w-full sm:w-auto text-center sm:text-left">
                                            Showing {transactions.from || 0} to {transactions.to || 0} of{' '}
                                            {transactions.total} results
                                        </div>
                                        <Pagination className="mx-0 w-full sm:w-auto justify-center sm:justify-end">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (transactions.prev_page_url) {
                                                                handlePageChange(transactions.current_page - 1);
                                                            }
                                                        }}
                                                        className={!transactions.prev_page_url ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                    />
                                                </PaginationItem>

                                                {/* Page numbers */}
                                                {(() => {
                                                    const pages = [];
                                                    const currentPage = transactions.current_page;
                                                    const lastPage = transactions.last_page;
                                                    
                                                    // Always show first page
                                                    if (lastPage > 0) {
                                                        pages.push(
                                                            <PaginationItem key={1}>
                                                                <PaginationLink
                                                                    href="#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handlePageChange(1);
                                                                    }}
                                                                    isActive={currentPage === 1}
                                                                    className="cursor-pointer"
                                                                >
                                                                    1
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    // Show ellipsis if needed
                                                    if (currentPage > 3) {
                                                        pages.push(
                                                            <PaginationItem key="ellipsis-1">
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    // Show pages around current page
                                                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
                                                        pages.push(
                                                            <PaginationItem key={i}>
                                                                <PaginationLink
                                                                    href="#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handlePageChange(i);
                                                                    }}
                                                                    isActive={currentPage === i}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {i}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    // Show ellipsis if needed
                                                    if (currentPage < lastPage - 2) {
                                                        pages.push(
                                                            <PaginationItem key="ellipsis-2">
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    // Always show last page if more than 1 page
                                                    if (lastPage > 1) {
                                                        pages.push(
                                                            <PaginationItem key={lastPage}>
                                                                <PaginationLink
                                                                    href="#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handlePageChange(lastPage);
                                                                    }}
                                                                    isActive={currentPage === lastPage}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {lastPage}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    return pages;
                                                })()}

                                                <PaginationItem>
                                                    <PaginationNext
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (transactions.next_page_url) {
                                                                handlePageChange(transactions.current_page + 1);
                                                            }
                                                        }}
                                                        className={!transactions.next_page_url ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                </>
                            )}

                            {/* Rejection reasons */}
                            {transactions.data.some(t => t.status === 'rejected' && t.rejection_reason) && (
                                <div className="mt-6 space-y-2">
                                    <h4 className="font-semibold text-sm">Recent Rejections:</h4>
                                    {transactions.data
                                        .filter(t => t.status === 'rejected' && t.rejection_reason)
                                        .slice(0, 3)
                                        .map(transaction => (
                                            <Alert key={transaction.id} variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Transaction {transaction.reference_id}</AlertTitle>
                                                <AlertDescription>{transaction.rejection_reason}</AlertDescription>
                                            </Alert>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
