import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
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
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Trophy, Medal, Award, Search, Info, Download, ChevronDown } from 'lucide-react';

export default function FullRankings({ auth }) {
    const isAdmin = auth?.user?.roles?.some(role => role.name === 'admin') || false;
    
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [search, setSearch] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [period, setPeriod] = useState('weekly');
    const [selectedWeek, setSelectedWeek] = useState('8'); // Default to last week
    const [selectedMonth, setSelectedMonth] = useState('12'); // Default to last month
    const [unitPosition, setUnitPosition] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
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
    
    useEffect(() => {
        fetchData();
    }, [pagination.pageIndex, pagination.pageSize, search, period, selectedWeek, selectedMonth]);
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                period: period,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: search,
            });

            if (period === 'weekly' && selectedWeek) {
                params.append('week', selectedWeek);
            } else if (period === 'monthly' && selectedMonth) {
                params.append('month', selectedMonth);
                params.append('year', '2025');
            }

            // Need to match correct route for API
            const response = await fetch(`${route('shop.api.leaderboard.full')}?${params}`);
            const result = await response.json();
            
            setData(result.data || []);
            setTotalPages(result.last_page || 1);
            setTotalRecords(result.total || 0);
            setUnitPosition(result.unit_position);
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

    const exportLeaderboard = (targetPeriod) => {
        const params = new URLSearchParams();
        params.append('period', targetPeriod);
        
        // Include month and year if currently viewing monthly tab
        if (targetPeriod === 'monthly' && period === 'monthly') {
            const currentMonth = new URLSearchParams(window.location.search).get('month');
            const currentYear = new URLSearchParams(window.location.search).get('year');
            
            if (currentMonth && currentYear) {
                params.append('month', currentMonth);
                params.append('year', currentYear);
            }
        }
        
        window.location.href = `${route('shop.leaderboard.full.export')}?${params.toString()}`;
    };
    
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Entrepreneur Full Rankings
                    </h2>
                </div>
            }
        >
            <Head title="Entrepreneur Full Rankings" />
            
            <div className="pt-2 pb-8">
                <div className="mx-auto max-w-7xl">
                    
                    <div className="bg-white rounded-lg shadow-sm p-6">
                            <Tabs value={period} onValueChange={(value) => {
                                setPeriod(value);
                                setPagination({ pageIndex: 0, pageSize: 10 });
                            }}>
                                <div className="mb-6">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                        <TabsTrigger value="all_time">All-Time</TabsTrigger>
                                    </TabsList>
                                </div>
                                
                                {/* Date Display Below Tabs */}
                                <div className="mb-4">
                                    {period === 'weekly' && (
                                        <>
                                            <h3 className="text-lg font-semibold">Week {selectedWeek}</h3>
                                            <p className="text-sm text-gray-600">
                                                {{
                                                    '1': 'Nov 1 - 9, 2025',
                                                    '2': 'Nov 10 - 16, 2025',
                                                    '3': 'Nov 17 - 23, 2025',
                                                    '4': 'Nov 24 - 30, 2025',
                                                    '5': 'Dec 1 - 7, 2025',
                                                    '6': 'Dec 8 - 14, 2025',
                                                    '7': 'Dec 15 - 21, 2025',
                                                    '8': 'Dec 22 - 28, 2025',
                                                }[selectedWeek] || 'Select a week'}
                                            </p>
                                        </>
                                    )}
                                    {period === 'monthly' && (
                                        <>
                                            <h3 className="text-lg font-semibold">
                                                {{
                                                    '11': 'November 2025',
                                                    '12': 'December 2025',
                                                }[selectedMonth] || 'Select a month'}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Monthly Leaderboard
                                            </p>
                                        </>
                                    )}
                                    {period === 'all_time' && (
                                        <>
                                            <h3 className="text-lg font-semibold">All-Time Champions</h3>
                                            <p className="text-sm text-gray-600">
                                                {isAdmin 
                                                    ? 'Since the beginning of the competition' 
                                                    : 'Since November 1, 2025'
                                                }
                                            </p>
                                        </>
                                    )}
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Toolbar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                        {/* Search & Export */}
                                        <div className="flex items-center gap-2 w-full sm:max-w-md">
                                            {isAdmin && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" className="gap-2 flex-shrink-0">
                                                            <Download className="h-4 w-4" />
                                                            <span className="hidden sm:inline">Export CSV</span>
                                                            <ChevronDown className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuItem onClick={() => exportLeaderboard('weekly')}>
                                                            Weekly (Full List)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => exportLeaderboard('monthly')}>
                                                            Monthly (Full List)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => exportLeaderboard('all_time')}>
                                                            All-Time (Full List)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => exportLeaderboard('all')}>
                                                            All Periods (Full List)
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                            <Input
                                                placeholder="Search by business name..."
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
                                            {/* Week/Month Selector */}
                                            {period === 'weekly' && (
                                                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Select Week" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">Week 1 (Nov 1-9)</SelectItem>
                                                        <SelectItem value="2">Week 2 (Nov 10-16)</SelectItem>
                                                        <SelectItem value="3">Week 3 (Nov 17-23)</SelectItem>
                                                        <SelectItem value="4">Week 4 (Nov 24-30)</SelectItem>
                                                        <SelectItem value="5">Week 5 (Dec 1-7)</SelectItem>
                                                        <SelectItem value="6">Week 6 (Dec 8-14)</SelectItem>
                                                        <SelectItem value="7">Week 7 (Dec 15-21)</SelectItem>
                                                        <SelectItem value="8">Week 8 (Dec 22-28)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}

                                            {period === 'monthly' && (
                                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Select Month" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="11">November 2025</SelectItem>
                                                        <SelectItem value="12">December 2025</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}

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
                                        <Table className="table-fixed w-full">
                                            <TableHeader className="bg-gray-50">
                                                <TableRow>
                                                    <TableHead className="w-24 px-6">Rank</TableHead>
                                                    <TableHead className="px-4">Business Unit</TableHead>
                                                    <TableHead className="w-40 px-4 text-center">Type</TableHead>
                                                    <TableHead className="w-36 text-right px-4">Transactions</TableHead>
                                                    <TableHead className="w-36 text-right px-6">Total Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                        </Table>
                                        
                                        <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
                                            <Table className="table-fixed w-full">
                                                <TableBody>
                                                    {isLoading ? (
                                                        <TableRow>
                                                            <TableCell colSpan={isAdmin ? 7 : 5} className="h-24 text-center">
                                                                Loading...
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : data.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={isAdmin ? 7 : 5} className="h-24 text-center">
                                                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                                                    <Trophy className="h-12 w-12 text-gray-300" />
                                                                    <p>No rankings found</p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        data.map((entry, index) => (
                                                            <TableRow 
                                                                key={entry.unit_id}
                                                                className={`${getRankClass(entry.rank)} ${index % 2 === 0 ? '' : 'bg-gray-50/50'} hover:bg-gray-100/50 transition-colors`}
                                                            >
                                                                <TableCell className="w-24 font-bold px-6">
                                                                    <div className="flex items-center gap-2">
                                                                        {getRankIcon(entry.rank)}
                                                                        <span className={entry.rank <= 3 ? 'text-lg' : ''}>#{entry.rank}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-medium px-4">
                                                                    {entry.entrepreneur_unit?.business_name}
                                                                </TableCell>
                                                                <TableCell className="w-40 text-center px-4">
                                                                    {entry.entrepreneur_unit?.business_location === 'physical' ? (
                                                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Physical</Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Online</Badge>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className={`w-36 text-right font-bold px-4 ${entry.rank <= 3 ? 'text-xl' : 'text-lg'}`}>
                                                                    <span className={
                                                                        entry.rank === 1 ? 'text-yellow-600' :
                                                                        entry.rank === 2 ? 'text-gray-600' :
                                                                        entry.rank === 3 ? 'text-amber-600' : ''
                                                                    }>
                                                                        {entry.transaction_count}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="w-36 text-right px-6 font-medium text-gray-600">
                                                                    RM {entry.total_amount ? parseFloat(entry.total_amount).toFixed(2) : '0.00'}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        
                                        {/* Fixed Footer - Current User's Unit Rank */}
                                        {unitPosition && !isAdmin && (
                                            <div className="bg-indigo-50 border-t-2 border-indigo-300">
                                                <Table className="table-fixed w-full">
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell className="w-24 font-bold px-6">
                                                                #{unitPosition.rank !== null && unitPosition.rank !== undefined ? unitPosition.rank : '-'}
                                                            </TableCell>
                                                            <TableCell className="font-bold px-4" colSpan={2}>
                                                                Your Business Unit
                                                            </TableCell>
                                                            <TableCell className="w-36 text-right font-bold text-lg px-4">
                                                                {unitPosition.transaction_count || 0}
                                                            </TableCell>
                                                            <TableCell className="w-36 text-right font-medium text-gray-700 px-6">
                                                                RM {unitPosition.total_amount ? parseFloat(unitPosition.total_amount).toFixed(2) : '0.00'}
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

                                                    {/* Page numbers block... condensed for brevity as per phase 1 logic */}
                                                    {(() => {
                                                        const pages = [];
                                                        const currentPage = pagination.pageIndex + 1;
                                                        
                                                        if (totalPages > 0) {
                                                            pages.push(
                                                                <PaginationItem key={1}>
                                                                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }} isActive={currentPage === 1}>{1}</PaginationLink>
                                                                </PaginationItem>
                                                            );
                                                        }

                                                        if (currentPage > 3) pages.push(<PaginationItem key="ellipsis-1"><PaginationEllipsis /></PaginationItem>);

                                                        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                                            pages.push(
                                                                <PaginationItem key={i}>
                                                                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>{i}</PaginationLink>
                                                                </PaginationItem>
                                                            );
                                                        }

                                                        if (currentPage < totalPages - 2) pages.push(<PaginationItem key="ellipsis-2"><PaginationEllipsis /></PaginationItem>);

                                                        if (totalPages > 1) {
                                                            pages.push(
                                                                <PaginationItem key={totalPages}>
                                                                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }} isActive={currentPage === totalPages}>{totalPages}</PaginationLink>
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
