<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Faculty;
use App\Models\EntrepreneurUnit;
use App\Models\EntrepreneurTransaction;
use App\Services\LeaderboardService;
use App\Services\EntrepreneurLeaderboardService;
use App\Services\AnalyticsService;
use App\Helpers\CompetitionWeekHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    protected $leaderboardService;
    protected $entrepreneurLeaderboardService;
    protected $analyticsService;

    public function __construct(LeaderboardService $leaderboardService, EntrepreneurLeaderboardService $entrepreneurLeaderboardService, AnalyticsService $analyticsService)
    {
        $this->leaderboardService = $leaderboardService;
        $this->entrepreneurLeaderboardService = $entrepreneurLeaderboardService;
        $this->analyticsService = $analyticsService;
    }

    /**
     * Show the admin dashboard
     */
    public function index(Request $request)
    {
        // Get statistics (cached for 10 minutes)
        $stats = Cache::remember('admin:dashboard_stats', now()->addHours(2), function () {
            return [
                'total_users' => User::whereHas('roles', function ($q) {
                    $q->where('name', 'student');
                })->count(),
                'total_transactions' => Transaction::where('status', 'approved')->count(),
                'pending_transactions' => Transaction::where('status', 'pending')->count(),
                'rejected_transactions' => Transaction::where('status', 'rejected')->count(),
                'total_amount' => Transaction::where('status', 'approved')->sum('amount'),
            ];
        });

        // Get leaderboard data
        $weeklyLeaderboard = $this->leaderboardService->getWeeklyLeaderboard()->take(20)->values();
        $weeklyLeaderboard->load('user.faculty');
        $monthlyLeaderboard = $this->leaderboardService->getMonthlyLeaderboard()->take(20)->values();
        $monthlyLeaderboard->load('user.faculty');
        $allTimeLeaderboard = $this->leaderboardService->getAllTimeLeaderboard()->take(20)->values();
        $allTimeLeaderboard->load('user.faculty');

        // Get entrepreneur leaderboard data
        $entrepreneurWeeklyLeaderboard = $this->entrepreneurLeaderboardService->getWeeklyLeaderboard()->take(20)->values();
        $entrepreneurWeeklyLeaderboard->load(['entrepreneurUnit' => function ($q) {
            $q->withCount('teamMembers');
        }]);
        $entrepreneurMonthlyLeaderboard = $this->entrepreneurLeaderboardService->getMonthlyLeaderboard()->take(20)->values();
        $entrepreneurMonthlyLeaderboard->load(['entrepreneurUnit' => function ($q) {
            $q->withCount('teamMembers');
        }]);
        $entrepreneurAllTimeLeaderboard = $this->entrepreneurLeaderboardService->getAllTimeLeaderboard()->take(20)->values();
        $entrepreneurAllTimeLeaderboard->load(['entrepreneurUnit' => function ($q) {
            $q->withCount('teamMembers');
        }]);

        $currentWeek = CompetitionWeekHelper::getCurrentWeekNumber() ?? 1;
        $currentMonth = \Carbon\Carbon::now()->month;

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'currentWeek' => $currentWeek,
            'currentMonth' => $currentMonth,
            'leaderboards' => [
                'weekly' => $weeklyLeaderboard,
                'monthly' => $monthlyLeaderboard,
                'allTime' => $allTimeLeaderboard,
            ],
            'analyticsData' => [
                'trends' => [
                    'weekly' => $this->analyticsService->getTransactionTrends('weekly'),
                    'monthly' => $this->analyticsService->getTransactionTrends('monthly'),
                    'all_time' => $this->analyticsService->getTransactionTrends('all_time'),
                ],
                'faculty' => [
                    'weekly' => $this->analyticsService->getFacultyComparison('weekly'),
                    'monthly' => $this->analyticsService->getFacultyComparison('monthly'),
                    'all_time' => $this->analyticsService->getFacultyComparison('all_time'),
                ],
                'status' => $this->analyticsService->getStatusDistribution(),
                'years' => [
                    'weekly' => $this->analyticsService->getYearParticipation('weekly'),
                    'monthly' => $this->analyticsService->getYearParticipation('monthly'),
                    'all_time' => $this->analyticsService->getYearParticipation('all_time'),
                ],
            ],
            'entrepreneurStats' => Cache::remember('admin:entrepreneur_stats', now()->addHours(2), function () {
                return [
                    'total_units' => EntrepreneurUnit::count(),
                    'total_transactions' => EntrepreneurTransaction::count(),
                    'total_amount' => EntrepreneurTransaction::sum('amount'),
                ];
            }),
            'entrepreneurLeaderboards' => [
                'weekly' => $entrepreneurWeeklyLeaderboard,
                'monthly' => $entrepreneurMonthlyLeaderboard,
                'allTime' => $entrepreneurAllTimeLeaderboard,
            ],
        ]);
    }

    /**
     * Get custom date range data for leaderboard and analytics
     */
    public function getCustomRangeData(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date|date_format:Y-m-d',
            'end_date' => 'required|date|date_format:Y-m-d|after_or_equal:start_date',
        ]);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $mode = $request->input('mode', 'personal');

        if ($mode === 'entrepreneur') {
            $leaderboard = $this->entrepreneurLeaderboardService->getCustomRangeLeaderboard($startDate, $endDate)->take(20)->values();
            $leaderboard->load(['entrepreneurUnit' => function ($q) {
                $q->withCount('teamMembers');
            }]);
            $analyticsData = []; // Entrepreneur specific charts can be added here if needed in future
        } else {
            // Get leaderboard for custom range
            $leaderboard = $this->leaderboardService->getCustomRangeLeaderboard($startDate, $endDate)->take(20)->values();
            $leaderboard->load('user.faculty');

            // Get analytics data for custom range
            $analyticsData = [
                'trends' => $this->analyticsService->getTransactionTrendsCustom($startDate, $endDate),
                'faculty' => $this->analyticsService->getFacultyComparisonCustom($startDate, $endDate),
                'years' => $this->analyticsService->getYearParticipationCustom($startDate, $endDate),
            ];
        }

        return response()->json([
            'leaderboard' => $leaderboard,
            'analytics' => $analyticsData,
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Get period specific data for leaderboard (weekly or monthly)
     */
    public function getPeriodData(Request $request)
    {
        $request->validate([
            'period' => 'required|in:weekly,monthly',
            'value' => 'required|numeric',
            'mode' => 'nullable|in:personal,entrepreneur',
            'include_analytics' => 'nullable|boolean',
        ]);

        $period = $request->input('period');
        $value = $request->input('value');
        $mode = $request->input('mode', 'personal');
        $year = $request->input('year', 2025); // defaulting to competition year
        $includeAnalytics = $request->boolean('include_analytics', false);

        $analyticsData = null;

        if ($period === 'weekly') {
            if ($mode === 'entrepreneur') {
                $leaderboard = $this->entrepreneurLeaderboardService->getWeekLeaderboard($value)->take(20)->values();
                $leaderboard->load(['entrepreneurUnit' => function ($q) {
                    $q->withCount('teamMembers');
                }]);
            } else {
                $leaderboard = $this->leaderboardService->getWeekLeaderboard($value)->take(20)->values();
                $leaderboard->load('user.faculty');

                if ($includeAnalytics) {
                    $dates = CompetitionWeekHelper::getWeekBoundaries($value);
                    if ($dates) {
                        $start = $dates['start']->format('Y-m-d');
                        $end = $dates['end']->format('Y-m-d');
                        $analyticsData = [
                            'trends' => $this->analyticsService->getTransactionTrendsCustom($start, $end),
                            'faculty' => $this->analyticsService->getFacultyComparisonCustom($start, $end),
                            'years' => $this->analyticsService->getYearParticipationCustom($start, $end),
                        ];
                    }
                }
            }
        } else { // monthly
            if ($mode === 'entrepreneur') {
                $leaderboard = $this->entrepreneurLeaderboardService->getMonthlyLeaderboard($value, $year)->take(20)->values();
                $leaderboard->load(['entrepreneurUnit' => function ($q) {
                    $q->withCount('teamMembers');
                }]);
            } else {
                $leaderboard = $this->leaderboardService->getMonthlyLeaderboard($value, $year)->take(20)->values();
                $leaderboard->load('user.faculty');

                if ($includeAnalytics) {
                    $startDate = \Carbon\Carbon::create($year, $value, 1)->startOfMonth()->format('Y-m-d');
                    $endDate = \Carbon\Carbon::create($year, $value, 1)->endOfMonth()->format('Y-m-d');
                    $analyticsData = [
                        'trends' => $this->analyticsService->getTransactionTrendsCustom($startDate, $endDate),
                        'faculty' => $this->analyticsService->getFacultyComparisonCustom($startDate, $endDate),
                        'years' => $this->analyticsService->getYearParticipationCustom($startDate, $endDate),
                    ];
                }
            }
        }

        return response()->json([
            'leaderboard' => $leaderboard,
            'analytics' => $analyticsData,
        ]);
    }

    /**
     * Generate reports with filters
     */
    public function reports(Request $request)
    {
        $facultyId = $request->input('faculty_id');
        $year = $request->input('year');
        $period = $request->input('period', 'all_time');

        // Build query based on filters
        $query = Transaction::with(['user.faculty'])
            ->where('status', 'approved');

        if ($facultyId) {
            $query->whereHas('user', function ($q) use ($facultyId) {
                $q->where('faculty_id', $facultyId);
            });
        }

        if ($year) {
            $query->whereHas('user', function ($q) use ($year) {
                $q->where('year_of_study', $year);
            });
        }

        // Apply period filter
        if ($period === 'weekly') {
            $boundaries = CompetitionWeekHelper::getCurrentWeekBoundaries();
            if ($boundaries !== null) {
                $query->whereBetween('approved_at', [
                    $boundaries['start'],
                    $boundaries['end']
                ]);
            } else {
                // Competition hasn't started, return no results
                $query->whereRaw('1 = 0');
            }
        } elseif ($period === 'monthly') {
            $query->whereMonth('approved_at', now()->month)
                ->whereYear('approved_at', now()->year);
        }

        $transactions = $query->orderBy('approved_at', 'desc')->get();

        // Calculate participation rates by faculty
        $participationByFaculty = User::with('faculty')
            ->select('faculty_id', DB::raw('COUNT(*) as user_count'))
            ->groupBy('faculty_id')
            ->get();

        return response()->json([
            'transactions' => $transactions,
            'participation_by_faculty' => $participationByFaculty,
            'filters' => [
                'faculty_id' => $facultyId,
                'year' => $year,
                'period' => $period,
            ],
        ]);
    }

    /**
     * Export leaderboard to CSV
     */
    public function exportLeaderboard(Request $request)
    {
        $period = $request->input('period', 'all_time');
        $limit = $request->input('limit', 20); // Default to top 20
        $month = $request->input('month');
        $year = $request->input('year');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $filename = "leaderboard_{$period}_top{$limit}_" . now()->format('Y-m-d_His') . ".csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        // Handle 'all' period - export all three periods
        if ($period === 'all') {
            $callback = function () use ($limit) {
                $file = fopen('php://output', 'w');

                // Weekly Leaderboard
                fputcsv($file, ['=== WEEKLY LEADERBOARD (Top ' . $limit . ') ===']);
                fputcsv($file, ['Rank', 'Matric No', 'Name', 'Phone Number', 'Faculty', 'Year', 'Transaction Count']);

                $weeklyLeaderboard = $this->leaderboardService->getWeeklyLeaderboard()->take($limit)->values();
                $weeklyLeaderboard->load('user.faculty');
                foreach ($weeklyLeaderboard as $entry) {
                    fputcsv($file, [
                        $entry->rank,
                        $entry->user->matric_no,
                        $entry->user->name,
                        $entry->user->phone_number ?? 'N/A',
                        $entry->user->faculty->short_name ?? 'N/A',
                        $entry->user->year_of_study ?? 'N/A',
                        $entry->transaction_count,
                    ]);
                }

                fputcsv($file, []); // Empty row separator

                // Monthly Leaderboard
                fputcsv($file, ['=== MONTHLY LEADERBOARD (Top ' . $limit . ') ===']);
                fputcsv($file, ['Rank', 'Matric No', 'Name', 'Phone Number', 'Faculty', 'Year', 'Transaction Count']);

                $monthlyLeaderboard = $this->leaderboardService->getMonthlyLeaderboard()->take($limit)->values();
                $monthlyLeaderboard->load('user.faculty');
                foreach ($monthlyLeaderboard as $entry) {
                    fputcsv($file, [
                        $entry->rank,
                        $entry->user->matric_no,
                        $entry->user->name,
                        $entry->user->phone_number ?? 'N/A',
                        $entry->user->faculty->short_name ?? 'N/A',
                        $entry->user->year_of_study ?? 'N/A',
                        $entry->transaction_count,
                    ]);
                }

                fputcsv($file, []); // Empty row separator

                // All-Time Leaderboard
                fputcsv($file, ['=== ALL-TIME LEADERBOARD (Top ' . $limit . ') ===']);
                fputcsv($file, ['Rank', 'Matric No', 'Name', 'Phone Number', 'Faculty', 'Year', 'Transaction Count']);

                $allTimeLeaderboard = $this->leaderboardService->getAllTimeLeaderboard()->take($limit)->values();
                $allTimeLeaderboard->load('user.faculty');
                foreach ($allTimeLeaderboard as $entry) {
                    fputcsv($file, [
                        $entry->rank,
                        $entry->user->matric_no,
                        $entry->user->name,
                        $entry->user->phone_number ?? 'N/A',
                        $entry->user->faculty->short_name ?? 'N/A',
                        $entry->user->year_of_study ?? 'N/A',
                        $entry->transaction_count,
                    ]);
                }

                fclose($file);
            };
        } else {
            // Single period export
            $leaderboard = match ($period) {
                'weekly' => $this->leaderboardService->getWeeklyLeaderboard(),
                'monthly' => $this->leaderboardService->getMonthlyLeaderboard($month, $year),
                'custom' => $this->leaderboardService->getCustomRangeLeaderboard($startDate, $endDate),
                default => $this->leaderboardService->getAllTimeLeaderboard(),
            };

            // Limit to top N entries
            $leaderboard = $leaderboard->take($limit)->values();
            $leaderboard->load('user.faculty');

            $callback = function () use ($period, $leaderboard) {
                $file = fopen('php://output', 'w');

                // Add CSV headers
                fputcsv($file, ['Rank', 'Matric No', 'Name', 'Phone Number', 'Faculty', 'Year', 'Transaction Count']);

                // Add data rows
                foreach ($leaderboard as $entry) {
                    fputcsv($file, [
                        $entry->rank,
                        $entry->user->matric_no,
                        $entry->user->name,
                        $entry->user->phone_number ?? 'N/A',
                        $entry->user->faculty->short_name ?? 'N/A',
                        $entry->user->year_of_study ?? 'N/A',
                        $entry->transaction_count,
                    ]);
                }

                fclose($file);
            };
        }

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Display user management page
     */
    public function users(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('per_page', 10);

        $query = User::with('faculty')
            ->where('id', '!=', Auth::id()) // Exclude current admin
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'shop');
            });

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%")
                    ->orWhere('matric_no', 'LIKE', "%{$search}%")
                    ->orWhere('phone_number', 'LIKE', "%{$search}%")
                    ->orWhere('duitnow_id', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Export all users to CSV
     */
    public function exportUsers(Request $request)
    {
        $search = $request->input('search');

        $query = User::with('faculty')
            ->where('id', '!=', Auth::id()) // Exclude current admin
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'shop');
            });

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%")
                    ->orWhere('matric_no', 'LIKE', "%{$search}%")
                    ->orWhere('phone_number', 'LIKE', "%{$search}%")
                    ->orWhere('duitnow_id', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        $filename = "users_" . now()->format('Y-m-d_His') . ".csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');

            // Add CSV headers
            fputcsv($file, [
                'Name',
                'Email',
                'Phone Number',
                'Matric No',
                'DuitNow ID',
                'Faculty',
                'Year',
                'Email Verified',
                'Registered At'
            ]);

            // Add data rows
            foreach ($users as $user) {
                fputcsv($file, [
                    $user->name,
                    $user->email,
                    $user->phone_number ?? 'N/A',
                    $user->matric_no ?? 'N/A',
                    $user->duitnow_id ?? 'N/A',
                    $user->faculty->short_name ?? 'N/A',
                    $user->year_of_study ?? 'N/A',
                    $user->email_verified_at ? 'Verified' : 'Unverified',
                    $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
