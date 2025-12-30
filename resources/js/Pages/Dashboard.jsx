import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/animate-ui/components/radix/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/animate-ui/components/buttons/button';
import UserAvatar from '@/Components/UserAvatar';
import CompetitionAnnouncementModal from '@/Components/CompetitionAnnouncementModal';
import { Trophy, Medal, Award, Upload, CheckCircle, Clock, XCircle, TrendingUp, ListOrdered, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';

export default function Dashboard({ auth, stats, leaderboards, isExtendedPeriod = false, extendedSubmissionEnd, showCompetitionAnnouncement = false }) {
    // Check if user is admin
    const isAdmin = auth.user?.roles?.some(role => role.name === 'admin') || false;

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
                <Table className="table-fixed w-full">
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-24 px-6">Rank</TableHead>
                            <TableHead className="w-20 px-4">Avatar</TableHead>
                            <TableHead className="px-4">Name</TableHead>
                            <TableHead className="w-36 text-right px-6">Transactions</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
                
                {/* Scrollable Body - Fixed height for 10 rows (520px) */}
                <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
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
                
                {/* Fixed Footer - Current User's Rank */}
                {user_position && (
                    <div className="bg-gray-100 border-t-2 border-gray-300">
                        <Table className="table-fixed w-full">
                            <TableBody>
                                <TableRow>
                                    <TableCell className="w-24 font-bold px-6">
                                        #{user_position.rank !== null && user_position.rank !== undefined ? user_position.rank : '-'}
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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            {/* Competition Announcement Modal */}
            <CompetitionAnnouncementModal 
                show={showCompetitionAnnouncement}
            />

            <div className="p-6 space-y-6">
                {/* Personal Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Submissions
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_submissions}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                All time submissions
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Weekly Ranking
                            </CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold">
                                    #{stats.weekly_rank !== null && stats.weekly_rank !== undefined ? stats.weekly_rank : '-'}
                                </div>
                                {(stats.weekly_rank !== null && stats.weekly_rank !== undefined) && (
                                    <span className="text-sm text-muted-foreground">
                                        of {stats.weekly_total || 0}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                This week's position
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Monthly Ranking
                            </CardTitle>
                            <Medal className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold">
                                    #{stats.monthly_rank !== null && stats.monthly_rank !== undefined ? stats.monthly_rank : '-'}
                                </div>
                                {(stats.monthly_rank !== null && stats.monthly_rank !== undefined) && (
                                    <span className="text-sm text-muted-foreground">
                                        of {stats.monthly_total || 0}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                This month's position
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                All-Time Ranking
                            </CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold">
                                    #{stats.alltime_rank !== null && stats.alltime_rank !== undefined ? stats.alltime_rank : '-'}
                                </div>
                                {(stats.alltime_rank !== null && stats.alltime_rank !== undefined) && (
                                    <span className="text-sm text-muted-foreground">
                                        of {stats.alltime_total || 0}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {isAdmin ? 'Overall position' : 'Since Nov 1, 2025'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's Submission Limit */}
                {/* <Card>
                    <CardHeader>
                        <CardTitle>Daily Submission Limit</CardTitle>
                        <CardDescription>
                            Track your daily submission progress
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {stats.today_submissions} / {stats.max_submissions_per_day}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Submissions today
                                </p>
                            </div>
                            <div>
                                {stats.can_submit_today ? (
                                    // <Link href={route('transactions.submit')}>
                                    //     <Button className="gap-2">
                                    //         <Upload className="h-4 w-4" />
                                    //         Submit Transaction
                                    //     </Button>
                                    // </Link>
                                    <Button disabled>
                                        Submissions Closed
                                    </Button>
                                ) : (
                                    <Button disabled>
                                        Daily Limit Reached
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all" 
                                style={{ width: `${(stats.today_submissions / stats.max_submissions_per_day) * 100}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card> */}

                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-blue-900">Event Ended</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-blue-800">
                            The event has ended. Thank you for your participation! You can still view your rankings and transaction history. Stay tuned for future events!
                        </p>
                    </CardContent>
                </Card>

                {/* Leaderboard Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Transaction Leaderboard - Top 20</CardTitle>
                                <CardDescription>
                                    See where you rank among fellow students!
                                </CardDescription>
                            </div>
                            <Link href={route('leaderboard.full')}>
                                <Button variant="outline">
                                    <ListOrdered className="h-4 w-4 mr-2" />
                                    View Full Rankings
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
                                    {renderLeaderboard(leaderboards.week3)}
                                </TabsContent>

                                <TabsContent value="week4" className="mt-6">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold">Week 4: November 24 - 30, 2025</h3>
                                        <p className="text-sm text-gray-600">
                                            Current week
                                        </p>
                                    </div>
                                    {renderLeaderboard(leaderboards.week4)}
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
                                    {renderLeaderboard(leaderboards.monthly)}
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
                                    {renderLeaderboard(leaderboards.allTime)}
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
                                    {renderLeaderboard(leaderboards.weekly)}
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
                                    {renderLeaderboard(leaderboards.monthly)}
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
                                    {renderLeaderboard(leaderboards.allTime)}
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
