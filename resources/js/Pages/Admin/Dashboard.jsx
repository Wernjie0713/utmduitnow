import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/Components/animate-ui/components/radix/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/Components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';
import { DateRangePicker } from '@/Components/ui/date-range-picker';
import UserAvatar from '@/Components/UserAvatar';
import { Users, FileCheck, FileX, DollarSign, Download, Trophy, Medal, Award, ChevronDown, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import TransactionTrendsChart from '@/Components/Admin/Charts/TransactionTrendsChart';
import FacultyComparisonChart from '@/Components/Admin/Charts/FacultyComparisonChart';
import StatusDistributionChart from '@/Components/Admin/Charts/StatusDistributionChart';
import YearParticipationChart from '@/Components/Admin/Charts/YearParticipationChart';

export default function Dashboard({ 
    stats, 
    leaderboards,
    analyticsData
}) {
    const [selectedChart, setSelectedChart] = useState('trends');
    const [selectedChartPeriod, setSelectedChartPeriod] = useState('weekly');
    const [selectedLeaderboardTab, setSelectedLeaderboardTab] = useState('weekly');
    
    // Separate date range states for Leaderboard and Analytics
    const [leaderboardDateRange, setLeaderboardDateRange] = useState({ from: undefined, to: undefined });
    const [analyticsDateRange, setAnalyticsDateRange] = useState({ from: undefined, to: undefined });
    
    const [customData, setCustomData] = useState(null);
    const [analyticsCustomData, setAnalyticsCustomData] = useState(null);
    const [isLoadingCustom, setIsLoadingCustom] = useState(false);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

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

    const renderLeaderboard = (leaderboard) => {
        if (!leaderboard || leaderboard.length === 0) {
            return (
                <div className="text-center py-16 text-gray-500">
                    <div className="flex flex-col items-center gap-4">
                        <Trophy className="h-16 w-16 text-gray-300" />
                        <div>
                            <p className="text-lg font-medium text-gray-700">No rankings yet</p>
                            <p className="text-sm">No transactions for this period yet.</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Show top 20 entries
        const top20 = leaderboard.slice(0, 20);

        return (
            <div className="border rounded-lg overflow-hidden">
                {/* Fixed Header */}
                <Table className="table-fixed w-full">
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-24 px-6">Rank</TableHead>
                            <TableHead className="w-20 px-4">Avatar</TableHead>
                            <TableHead className="px-4">Name</TableHead>
                            <TableHead className="w-32 px-4">Matric No</TableHead>
                            <TableHead className="w-36 px-4">Phone Number</TableHead>
                            <TableHead className="w-24 px-4">Faculty</TableHead>
                            <TableHead className="w-20 px-4">Year</TableHead>
                            <TableHead className="w-36 text-right px-6">Transactions</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
                
                {/* Scrollable Body - Fixed height for ~10 rows (520px) */}
                <div className="overflow-y-auto pb-6" style={{ maxHeight: '520px' }}>
                    <Table className="table-fixed w-full">
                        <TableBody>
                            {top20.map((entry, index) => (
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
                                    <TableCell className="w-32 font-mono text-sm px-4">
                                        {entry.user?.matric_no}
                                    </TableCell>
                                    <TableCell className="w-36 text-sm px-4">
                                        {entry.user?.phone_number || 'N/A'}
                                    </TableCell>
                                    <TableCell className="w-24 px-4">
                                        <Badge variant="outline">
                                            {entry.user?.faculty?.short_name || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="w-20 px-4">
                                        Year {entry.user?.year_of_study || 'N/A'}
                                    </TableCell>
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
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    const exportLeaderboard = (period, limit = 20, startDate = null, endDate = null) => {
        const params = new URLSearchParams({ period, limit });
        if (startDate && endDate) {
            params.append('start_date', startDate);
            params.append('end_date', endDate);
        }
        window.location.href = route('admin.export') + '?' + params.toString();
    };

    const fetchCustomRangeData = async () => {
        if (!leaderboardDateRange || !leaderboardDateRange.from || !leaderboardDateRange.to) {
            toast.error('Please select both start and end dates');
            return;
        }

        if (leaderboardDateRange.from > leaderboardDateRange.to) {
            toast.error('Start date must be before or equal to end date');
            return;
        }

        setIsLoadingCustom(true);
        try {
            const response = await axios.get(route('admin.dashboard.custom'), {
                params: {
                    start_date: format(leaderboardDateRange.from, 'yyyy-MM-dd'),
                    end_date: format(leaderboardDateRange.to, 'yyyy-MM-dd'),
                }
            });

            setCustomData(response.data);
            toast.success('Custom range data loaded successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load custom range data');
            console.error('Error fetching custom range data:', error);
        } finally {
            setIsLoadingCustom(false);
        }
    };

    const fetchAnalyticsCustomData = async () => {
        if (!analyticsDateRange || !analyticsDateRange.from || !analyticsDateRange.to) {
            toast.error('Please select both start and end dates for analytics');
            return;
        }

        if (analyticsDateRange.from > analyticsDateRange.to) {
            toast.error('Start date must be before or equal to end date');
            return;
        }

        setIsLoadingAnalytics(true);
        try {
            const response = await axios.get(route('admin.dashboard.custom'), {
                params: {
                    start_date: format(analyticsDateRange.from, 'yyyy-MM-dd'),
                    end_date: format(analyticsDateRange.to, 'yyyy-MM-dd'),
                }
            });

            setAnalyticsCustomData(response.data);
            // Auto-switch to custom period
            setSelectedChartPeriod('custom');
            toast.success('Analytics custom range loaded successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load analytics data');
            console.error('Error fetching analytics custom data:', error);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="p-6">
                <div className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_users}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                                <FileCheck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_transactions + stats.rejected_transactions}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">RM {parseFloat(stats.total_amount).toFixed(2)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Leaderboard Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-yellow-500" />
                                        Transaction Leaderboard
                                    </CardTitle>
                                    <CardDescription>
                                        View top performing students across different time periods
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Export CSV
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => exportLeaderboard('weekly')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Weekly (Top 20)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => exportLeaderboard('monthly')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Monthly (Top 20)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => exportLeaderboard('all_time')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            All-Time (Top 20)
                                        </DropdownMenuItem>
                                        {customData && leaderboardDateRange && leaderboardDateRange.from && leaderboardDateRange.to && (
                                            <DropdownMenuItem onClick={() => exportLeaderboard(
                                                'custom',
                                                20,
                                                format(leaderboardDateRange.from, 'yyyy-MM-dd'),
                                                format(leaderboardDateRange.to, 'yyyy-MM-dd')
                                            )}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Custom Range (Top 20)
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => exportLeaderboard('all')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            All Periods (Top 20 Each)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="weekly" value={selectedLeaderboardTab} onValueChange={setSelectedLeaderboardTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                    <TabsTrigger value="all-time">All-Time</TabsTrigger>
                                    <TabsTrigger value="custom">Custom</TabsTrigger>
                                </TabsList>

                                <TabsContents>
                                    <TabsContent value="weekly" className="mt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold">This Week</h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date().toLocaleDateString('en-MY', { 
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        {renderLeaderboard(leaderboards?.weekly)}
                                    </TabsContent>

                                    <TabsContent value="monthly" className="mt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold">This Month</h3>
                                            <p className="text-sm text-gray-600">
                                                {new Date().toLocaleDateString('en-MY', {
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        {renderLeaderboard(leaderboards?.monthly)}
                                    </TabsContent>

                                    <TabsContent value="all-time" className="mt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold">All-Time Champions</h3>
                                            <p className="text-sm text-gray-600">
                                                Since the beginning of the competition
                                            </p>
                                        </div>
                                        {renderLeaderboard(leaderboards?.allTime)}
                                    </TabsContent>

                                    <TabsContent value="custom" className="mt-6">
                                        <div className="space-y-4">
                                            <div className="flex items-end gap-4">
                                                <div className="flex-1">
                                                    <Label className="mb-2 block">Select Date Range</Label>
                                                    <DateRangePicker 
                                                        value={leaderboardDateRange}
                                                        onChange={setLeaderboardDateRange}
                                                    />
                                                </div>
                                                <Button 
                                                    onClick={fetchCustomRangeData}
                                                    disabled={!leaderboardDateRange || !leaderboardDateRange.from || !leaderboardDateRange.to || isLoadingCustom}
                                                >
                                                    {isLoadingCustom ? 'Loading...' : 'Apply'}
                                                </Button>
                                            </div>
                                            
                                            {customData && (
                                                <>
                                                    <div className="mb-4">
                                                        <h3 className="text-lg font-semibold">Custom Range</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {leaderboardDateRange && leaderboardDateRange.from && leaderboardDateRange.to ? (
                                                                `${format(leaderboardDateRange.from, 'PPP')} - ${format(leaderboardDateRange.to, 'PPP')}`
                                                            ) : (
                                                                'Date range selected'
                                                            )}
                                                        </p>
                                                    </div>
                                                    {renderLeaderboard(customData.leaderboard)}
                                                </>
                                            )}
                                            
                                            {!customData && (
                                                <div className="text-center py-16 text-gray-500">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <Trophy className="h-16 w-16 text-gray-300" />
                                                        <div>
                                                            <p className="text-lg font-medium text-gray-700">Select a date range</p>
                                                            <p className="text-sm">Choose your start and end dates, then click Apply to view the leaderboard.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </TabsContents>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Analytics Section */}
                    <Card className="mt-6">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-blue-500" />
                                        Analytics Dashboard
                                    </CardTitle>
                                    <CardDescription>
                                        Comprehensive insights into competition data
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Custom Date Range Picker for Analytics */}
                                    {['trends', 'faculty', 'years'].includes(selectedChart) && selectedChartPeriod === 'custom' && (
                                        <div className="flex items-end gap-2">
                                            <div className="w-[280px]">
                                                <Label className="text-xs mb-1 block">Analytics Date Range</Label>
                                                <DateRangePicker 
                                                    value={analyticsDateRange}
                                                    onChange={setAnalyticsDateRange}
                                                />
                                            </div>
                                            <Button 
                                                size="sm"
                                                onClick={fetchAnalyticsCustomData}
                                                disabled={!analyticsDateRange || !analyticsDateRange.from || !analyticsDateRange.to || isLoadingAnalytics}
                                            >
                                                {isLoadingAnalytics ? 'Loading...' : 'Apply'}
                                            </Button>
                                        </div>
                                    )}
                                    {/* Time Period Dropdown - Only show for charts that support it */}
                                    {['trends', 'faculty', 'years'].includes(selectedChart) && (
                                        <Select value={selectedChartPeriod} onValueChange={setSelectedChartPeriod}>
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="all_time">All Time</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="trends" onValueChange={setSelectedChart}>
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="trends">
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        Trends
                                    </TabsTrigger>
                                    <TabsTrigger value="faculty">
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Faculty
                                    </TabsTrigger>
                                    <TabsTrigger value="status">
                                        <PieChart className="h-4 w-4 mr-2" />
                                        Status
                                    </TabsTrigger>
                                    <TabsTrigger value="years">
                                        <Users className="h-4 w-4 mr-2" />
                                        Years
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="trends" className="mt-6">
                                    <TransactionTrendsChart 
                                        data={
                                            selectedChartPeriod === 'custom' && analyticsCustomData
                                                ? analyticsCustomData.analytics?.trends || []
                                                : analyticsData?.trends?.[selectedChartPeriod] || []
                                        }
                                        period={selectedChartPeriod}
                                    />
                                </TabsContent>

                                <TabsContent value="faculty" className="mt-6">
                                    <FacultyComparisonChart 
                                        data={
                                            selectedChartPeriod === 'custom' && analyticsCustomData
                                                ? analyticsCustomData.analytics?.faculty || []
                                                : analyticsData?.faculty?.[selectedChartPeriod] || []
                                        }
                                        period={selectedChartPeriod}
                                    />
                                </TabsContent>

                                <TabsContent value="status" className="mt-6">
                                    <StatusDistributionChart 
                                        data={analyticsData?.status || {}}
                                    />
                                </TabsContent>

                                <TabsContent value="years" className="mt-6">
                                    <YearParticipationChart 
                                        data={
                                            selectedChartPeriod === 'custom' && analyticsCustomData
                                                ? analyticsCustomData.analytics?.years || []
                                                : analyticsData?.years?.[selectedChartPeriod] || []
                                        }
                                        period={selectedChartPeriod}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

