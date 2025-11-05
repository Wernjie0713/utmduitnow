import { useState, useEffect } from 'react';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/animate-ui/components/radix/tabs';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
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
    DropdownMenuItem,
} from '@/Components/ui/dropdown-menu';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from '@/Components/ui/pagination';
import UserAvatar from '@/Components/UserAvatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Trophy, Medal, Award, Search, Download, ChevronDown } from 'lucide-react';

export default function FullRankings({ auth }) {
    // Detect if user is admin
    const isAdmin = auth?.user?.roles?.some(role => role.name === 'admin') || false;
    
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [search, setSearch] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [period, setPeriod] = useState(isAdmin ? 'all_time' : 'weekly');
    const [userPosition, setUserPosition] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Export function for full rankings (not limited to Top 20)
    const exportLeaderboard = (period) => {
        window.location.href = route('leaderboard.export', { period });
    };
    
    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <Trophy className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-gray-400" />;
            case 3:
                return <Award className="h-5 w-5 text-amber-600" />;
            default:
                return null;
        }
    };

    const getRankClass = (rank) => {
        switch (rank) {
            case 1:
                return 'border-l-4 border-yellow-500';
            case 2:
                return 'border-l-4 border-gray-400';
            case 3:
                return 'border-l-4 border-amber-500';
            default:
                return '';
        }
    };
    
    // Ensure non-admin users can't access all_time period
    useEffect(() => {
        if (!isAdmin && period === 'all_time') {
            setPeriod('weekly');
        }
    }, [isAdmin, period]);
    
    // Fetch data when pagination, search, or period changes
    useEffect(() => {
        fetchData();
    }, [pagination.pageIndex, pagination.pageSize, search, period]);
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                period: period,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: search,
            });
            
            const response = await fetch(`/api/leaderboard/full?${params}`);
            const result = await response.json();
            
            setData(result.data || []);
            setTotalPages(result.last_page || 1);
            setTotalRecords(result.total || 0);
            setUserPosition(result.user_position);
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSearch = () => {
        setSearch(searchValue);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClearSearch = () => {
        setSearchValue('');
        setSearch('');
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const handlePageChange = (pageNumber) => {
        setPagination(prev => ({ ...prev, pageIndex: pageNumber - 1 }));
    };
    
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Full Rankings
                </h2>
            }
        >
            <Head title="Full Rankings" />
            
            <div className="pt-2 pb-8">
                <div className="mx-auto max-w-7xl">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                            <Tabs value={period} onValueChange={(value) => {
                                // Prevent non-admin users from selecting all_time
                                if (!isAdmin && value === 'all_time') {
                                    return;
                                }
                                setPeriod(value);
                                setPagination({ pageIndex: 0, pageSize: 10 });
                            }}>
                                <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} mb-6`}>
                                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                    {isAdmin && (
                                        <TabsTrigger value="all_time">All-Time</TabsTrigger>
                                    )}
                                </TabsList>
                                
                                {/* Date Display Below Tabs */}
                                <div className="mb-4">
                                    {period === 'weekly' && (
                                        <>
                                            <h3 className="text-lg font-semibold">This Week</h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date().toLocaleDateString('en-MY', { 
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </>
                                    )}
                                    {period === 'monthly' && (
                                        <>
                                            <h3 className="text-lg font-semibold">This Month</h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date().toLocaleDateString('en-MY', {
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </>
                                    )}
                                    {isAdmin && period === 'all_time' && (
                                        <>
                                            <h3 className="text-lg font-semibold">All-Time Champions</h3>
                                            <p className="text-sm text-gray-600">
                                                Since the beginning of the competition
                                            </p>
                                        </>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Toolbar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                        {/* Search */}
                                        <div className="flex items-center gap-2 w-full sm:max-w-md">
                                            {/* Export CSV Button - Admin Only */}
                                            {isAdmin && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="gap-2 mr-2 flex-shrink-0">
                                                            <Download className="h-4 w-4" />
                                                            Export CSV
                                                            <ChevronDown className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuItem onClick={() => exportLeaderboard('weekly')}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Weekly (Full List)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => exportLeaderboard('monthly')}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Monthly (Full List)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => exportLeaderboard('all_time')}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            All-Time (Full List)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => exportLeaderboard('all')}>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            All Periods (Full List)
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            <Input
                                                placeholder="Search by name..."
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
                                            {search && (
                                                <Button
                                                    onClick={handleClearSearch}
                                                    variant="outline"
                                                    className="border-gray-300 flex-shrink-0"
                                                >
                                                    <span className="hidden sm:inline">Clear</span>
                                                    <span className="sm:hidden">×</span>
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 justify-end sm:justify-start">
                                            {/* Rows per page */}
                                            <Select
                                                value={String(pagination.pageSize)}
                                                onValueChange={(value) => setPagination({ pageIndex: 0, pageSize: parseInt(value) })}
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
                                        </div>
                                    </div>
                                    
                                    {/* Data Table */}
                                    <div className="border rounded-lg overflow-hidden">
                                        {/* Fixed Header */}
                                        <Table className="table-fixed w-full">
                                            <TableHeader className="bg-gray-50">
                                                <TableRow>
                                                    <TableHead className="w-24 px-6">Rank</TableHead>
                                                    <TableHead className="w-20 px-4">Avatar</TableHead>
                                                    <TableHead className="px-4">Name</TableHead>
                                                    {isAdmin && (
                                                        <>
                                                            <TableHead className="w-32 px-4">Matric No</TableHead>
                                                            <TableHead className="w-36 px-4">Phone Number</TableHead>
                                                            <TableHead className="w-24 px-4">Faculty</TableHead>
                                                            <TableHead className="w-20 px-4">Year</TableHead>
                                                        </>
                                                    )}
                                                    <TableHead className="w-36 text-right px-6">Transactions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                        </Table>
                                        
                                        {/* Scrollable Body */}
                                        <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                                            <Table className="table-fixed w-full">
                                                <TableBody>
                                                    {isLoading ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-24 text-center">
                                                                Loading...
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : data.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-24 text-center">
                                                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                                                    <Trophy className="h-12 w-12 text-gray-300" />
                                                                    <p>No rankings found</p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        data.map((entry, index) => (
                                                            <TableRow 
                                                                key={entry.user_id}
                                                                className={`${getRankClass(entry.rank)} ${index % 2 === 0 ? '' : 'bg-gray-50/50'} hover:bg-gray-100/50 transition-colors`}
                                                            >
                                                                <TableCell className="w-24 font-bold px-6">
                                                                    <div className="flex items-center gap-2">
                                                                        {getRankIcon(entry.rank)}
                                                                        <span className={entry.rank <= 3 ? 'text-lg' : ''}>#{entry.rank}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="w-20 px-4">
                                                                    <div className="flex items-center justify-center">
                                                                        <UserAvatar user={entry.user} size="sm" />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-medium px-4">
                                                                    {entry.user?.name}
                                                                </TableCell>
                                                                {isAdmin && (
                                                                    <>
                                                                        <TableCell className="w-32 px-4">
                                                                            {entry.user?.matric_no || 'N/A'}
                                                                        </TableCell>
                                                                        <TableCell className="w-36 px-4">
                                                                            {entry.user?.phone_number || 'N/A'}
                                                                        </TableCell>
                                                                        <TableCell className="w-24 px-4">
                                                                            {entry.user?.faculty ? (
                                                                                <Badge variant="outline">{entry.user.faculty.short_name}</Badge>
                                                                            ) : (
                                                                                <span className="text-gray-400">N/A</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="w-20 px-4">
                                                                            {entry.user?.year_of_study ? `Year ${entry.user.year_of_study}` : 'N/A'}
                                                                        </TableCell>
                                                                    </>
                                                                )}
                                                                <TableCell className={`w-36 text-right font-bold px-6 ${entry.rank <= 3 ? 'text-xl' : 'text-lg'}`}>
                                                                    <span className={
                                                                        entry.rank === 1 ? 'text-yellow-600' :
                                                                        entry.rank === 2 ? 'text-gray-600' :
                                                                        entry.rank === 3 ? 'text-amber-600' : ''
                                                                    }>
                                                                        {entry.transaction_count}
                                                                    </span>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        
                                        {/* Fixed Footer - Current User's Rank */}
                                        {userPosition && !isAdmin && (
                                            <div className="bg-gray-100 border-t-2 border-gray-300">
                                                <Table className="table-fixed w-full">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="w-24 font-bold px-6">
                                                                #{userPosition.rank !== null && userPosition.rank !== undefined ? userPosition.rank : '-'}
                                                            </TableCell>
                                                            <TableCell className="w-20 px-4">
                                                                <div className="flex items-center justify-center">
                                                                    <UserAvatar user={auth.user} size="sm" />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-bold px-4">
                                                                You
                                                            </TableCell>
                                                            <TableCell className="w-36 text-right font-bold text-lg px-6">
                                                                {userPosition.transaction_count || 0}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Pagination */}
                                    {totalRecords > 0 && (
                                        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-0">
                                            <div className="text-sm text-gray-500 w-full sm:w-auto text-center sm:text-left">
                                                Showing {pagination.pageIndex * pagination.pageSize + 1} to {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRecords)} of {totalRecords} results
                                            </div>
                                            {totalPages > 1 && (
                                                <Pagination className="mx-0 w-full sm:w-auto justify-center sm:justify-end">
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (pagination.pageIndex > 0) {
                                                                    handlePageChange(pagination.pageIndex);
                                                                }
                                                            }}
                                                            className={pagination.pageIndex === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                        />
                                                    </PaginationItem>

                                                    {/* Page numbers */}
                                                    {(() => {
                                                        const pages = [];
                                                        const currentPage = pagination.pageIndex + 1;
                                                        
                                                        // Always show first page
                                                        if (totalPages > 0) {
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
                                                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
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
                                                        if (currentPage < totalPages - 2) {
                                                            pages.push(
                                                                <PaginationItem key="ellipsis-2">
                                                                    <PaginationEllipsis />
                                                                </PaginationItem>
                                                            );
                                                        }

                                                        // Always show last page if more than 1 page
                                                        if (totalPages > 1) {
                                                            pages.push(
                                                                <PaginationItem key={totalPages}>
                                                                    <PaginationLink
                                                                        href="#"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handlePageChange(totalPages);
                                                                        }}
                                                                        isActive={currentPage === totalPages}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {totalPages}
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
                                                                if (pagination.pageIndex < totalPages - 1) {
                                                                    handlePageChange(pagination.pageIndex + 2);
                                                                }
                                                            }}
                                                            className={pagination.pageIndex >= totalPages - 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}

