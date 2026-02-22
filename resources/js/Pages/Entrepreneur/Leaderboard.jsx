import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/animate-ui/components/radix/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { Trophy, Medal, Award, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';

export default function Leaderboard({ 
    auth,
    weeklyData,
    monthlyData,
    allTimeData,
    activeTab = 'weekly',
}) {
    const [currentTab, setCurrentTab] = useState(activeTab);

    // Update currentTab when activeTab prop changes
    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab]);

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
                return 'bg-yellow-50 border-l-4 border-yellow-400';
            case 2:
                return 'bg-gray-50 border-l-4 border-gray-400';
            case 3:
                return 'bg-amber-50 border-l-4 border-amber-400';
            default:
                return '';
        }
    };

    const renderLeaderboard = (data) => {
        const { top20, unit_position } = data || {};
        
        if (!top20 || top20.length === 0) {
            return (
                <div className="text-center py-16 text-gray-500">
                    <div className="flex flex-col items-center gap-4">
                        <Trophy className="h-16 w-16 text-gray-300" />
                        <div>
                            <p className="text-lg font-medium text-gray-700">No rankings yet</p>
                            <p className="text-sm">Data generation is pending.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="border rounded-lg overflow-hidden relative">
                
                {/* Fixed Header */}
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-20">Rank</TableHead>
                            <TableHead>Business Unit</TableHead>
                            <TableHead className="w-32 text-right">Transactions</TableHead>
                            <TableHead className="w-32 text-right">Total Amount (RM)</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
                
                {/* Scrollable Body - Fixed height for 10 rows (520px) */}
                <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
                    <Table>
                        <TableBody>
                            {top20.map((entry) => (
                                <TableRow key={entry.unit_id} className={getRankClass(entry.rank)}>
                                    <TableCell className="w-20 font-bold">
                                        <div className="flex items-center gap-2">
                                            {getRankIcon(entry.rank)}
                                            <span className={entry.rank <= 3 ? 'text-lg' : ''}>#{entry.rank}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {entry.entrepreneur_unit?.business_name}
                                        {entry.entrepreneur_unit?.business_location === 'physical' && (
                                            <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-200">Physical</Badge>
                                        )}
                                        {entry.entrepreneur_unit?.business_location === 'online' && (
                                            <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">Online</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className={`w-32 text-right font-bold ${entry.rank <= 3 ? 'text-xl' : 'text-lg'}`}>
                                        <span className={
                                            entry.rank === 1 ? 'text-yellow-600' :
                                            entry.rank === 2 ? 'text-gray-600' :
                                            entry.rank === 3 ? 'text-amber-600' : ''
                                        }>
                                            {entry.transaction_count}
                                        </span>
                                    </TableCell>
                                    <TableCell className="w-32 text-right text-gray-600">
                                        {entry.total_amount 
                                            ? parseFloat(entry.total_amount).toFixed(2) 
                                            : '0.00'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Fixed Footer - Current User's Unit Rank */}
                {auth?.user && unit_position && (
                    <div className="bg-indigo-50 border-t-2 border-indigo-300">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-20 font-bold">
                                        #{unit_position.rank !== null && unit_position.rank !== undefined ? unit_position.rank : '-'}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        Your Business Unit
                                    </TableCell>
                                    <TableCell className="w-32 text-right font-bold text-lg">
                                        {unit_position.transaction_count || 0}
                                    </TableCell>
                                    <TableCell className="w-32 text-right text-gray-700 font-medium">
                                        {unit_position.total_amount 
                                            ? parseFloat(unit_position.total_amount).toFixed(2) 
                                            : '0.00'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                   <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Entrepreneur Leaderboard
                    </h2>
                    <Badge variant="destructive" className="uppercase font-bold tracking-wider relative top-[1px]">Demo Data</Badge>
                </div>
            }
        >
            <Head title="Entrepreneur Leaderboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Entrepreneur Leaderboard - Top 20</CardTitle>
                                    <CardDescription>
                                        Compete with other business units for the top spot!
                                    </CardDescription>
                                </div>
                                <Link href={route('shop.leaderboard.full')}>
                                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                                        View Full Rankings
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-6 border-blue-200 bg-blue-50">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-900 font-bold">Demo Mode Active</AlertTitle>
                                <AlertDescription className="text-blue-800 text-sm">
                                    Notice: The data shown on this board is generated via internal systems for demonstration purposes. This is separate from the physical receipts dashboard phase.
                                </AlertDescription>
                            </Alert>

                            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                    <TabsTrigger value="all-time">All-Time</TabsTrigger>
                                </TabsList>

                                <TabsContent value="weekly" className="mt-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold">This Week</h3>
                                    </div>
                                    {renderLeaderboard(weeklyData)}
                                </TabsContent>

                                <TabsContent value="monthly" className="mt-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold">This Month</h3>
                                    </div>
                                    {renderLeaderboard(monthlyData)}
                                </TabsContent>

                                <TabsContent value="all-time" className="mt-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold">All-Time Champions</h3>
                                    </div>
                                    {renderLeaderboard(allTimeData)}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
