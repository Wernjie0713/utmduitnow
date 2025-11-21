import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/animate-ui/components/radix/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import UserAvatar from '@/Components/UserAvatar';
import { Trophy, Medal, Award, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

export default function Index({ 
    auth,
    isExtendedPeriod = false,
    weeklyData,
    week3Data,
    week4Data,
    monthlyData,
    allTimeData,
    extendedSubmissionEnd,
}) {
    // Check if user is admin
    const isAdmin = auth?.user?.roles?.some(role => role.name === 'admin') || false;

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
        const { top20, user_position } = data || {};
        
        if (!top20 || top20.length === 0) {
            return (
                <div className="text-center py-16 text-gray-500">
                    <div className="flex flex-col items-center gap-4">
                        <Trophy className="h-16 w-16 text-gray-300" />
                        <div>
                            <p className="text-lg font-medium text-gray-700">No rankings yet</p>
                            <p className="text-sm">Be the first to submit a transaction!</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="border rounded-lg overflow-hidden">
                {/* Fixed Header */}
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-20">Rank</TableHead>
                            <TableHead className="w-16">Avatar</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="w-32 text-right">Transactions</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
                
                {/* Scrollable Body - Fixed height for 10 rows (520px) */}
                <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
                    <Table>
                        <TableBody>
                            {top20.map((entry, index) => (
                                <TableRow key={entry.user_id} className={getRankClass(entry.rank)}>
                                    <TableCell className="w-20 font-bold">
                                        <div className="flex items-center gap-2">
                                            {getRankIcon(entry.rank)}
                                            <span className={entry.rank <= 3 ? 'text-lg' : ''}>#{entry.rank}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-16">
                                        <UserAvatar user={entry.user} size="sm" />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {entry.user?.name}
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Fixed Footer - Current User's Rank */}
                {auth?.user && user_position && (
                    <div className="bg-blue-50 border-t-2 border-blue-300">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-20 font-bold">
                                        #{user_position.rank !== null && user_position.rank !== undefined ? user_position.rank : '-'}
                                    </TableCell>
                                    <TableCell className="w-16">
                                        <UserAvatar user={auth.user} size="sm" />
                                    </TableCell>
                                    <TableCell className="font-bold">
                                        You
                                    </TableCell>
                                    <TableCell className="w-32 text-right font-bold text-lg">
                                        {user_position.transaction_count || 0}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        );
    };

    // Use appropriate layout based on auth status
    const Layout = auth?.user ? AuthenticatedLayout : GuestLayout;
    const layoutProps = auth?.user ? {
        header: (
            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                Leaderboard
            </h2>
        )
    } : {};

    return (
        <Layout {...layoutProps}>
            <Head title="Leaderboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Transaction Leaderboard - Top 20</CardTitle>
                                    <CardDescription>
                                        Compete with fellow students to reach the top of the leaderboard!
                                    </CardDescription>
                                </div>
                                <Link href={route('dashboard')}>
                                    <Button variant="outline">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Extended Period Notice */}
                            {isExtendedPeriod && (
                                <Alert className="mb-6 border-blue-200 bg-blue-50">
                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-blue-900">Week 3 Extended Submission Period</AlertTitle>
                                    <AlertDescription className="text-blue-800">
                                        Due to server downtime earlier this week, Week 3 submissions have been extended until{' '}
                                        <strong>{extendedSubmissionEnd}</strong>. You can submit both Week 3 (Nov 17-23) and Week 4 (Nov 24-30) transactions during this period.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {isExtendedPeriod ? (
                                <Tabs defaultValue="week3" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="week3">Week 3</TabsTrigger>
                                        <TabsTrigger value="week4">Week 4</TabsTrigger>
                                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                        <TabsTrigger value="all-time">All-Time</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="week3" className="mt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold">Week 3: November 17 - 23, 2025</h3>
                                            <p className="text-sm text-gray-600">
                                                Extended submission until {extendedSubmissionEnd}
                                            </p>
                                        </div>
                                        {renderLeaderboard(week3Data)}
                                    </TabsContent>

                                    <TabsContent value="week4" className="mt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold">Week 4: November 24 - 30, 2025</h3>
                                            <p className="text-sm text-gray-600">
                                                Current week
                                            </p>
                                        </div>
                                        {renderLeaderboard(week4Data)}
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
                                        {renderLeaderboard(monthlyData)}
                                    </TabsContent>

                                    <TabsContent value="all-time" className="mt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold">All-Time Champions</h3>
                                            <p className="text-sm text-gray-600">
                                                {isAdmin 
                                                    ? 'Since the beginning of the competition' 
                                                    : 'Since November 1, 2025'
                                                }
                                            </p>
                                        </div>
                                        {renderLeaderboard(allTimeData)}
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <Tabs defaultValue="weekly" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                        <TabsTrigger value="all-time">All-Time</TabsTrigger>
                                    </TabsList>

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
                                        {renderLeaderboard(weeklyData)}
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
                                        {renderLeaderboard(monthlyData)}
                                    </TabsContent>

                                    <TabsContent value="all-time" className="mt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold">All-Time Champions</h3>
                                            <p className="text-sm text-gray-600">
                                                {isAdmin 
                                                    ? 'Since the beginning of the competition' 
                                                    : 'Since November 1, 2025'
                                                }
                                            </p>
                                        </div>
                                        {renderLeaderboard(allTimeData)}
                                    </TabsContent>
                                </Tabs>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
