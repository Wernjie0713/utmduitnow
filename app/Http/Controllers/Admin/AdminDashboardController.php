<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Faculty;
use App\Services\LeaderboardService;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    protected $leaderboardService;
    protected $analyticsService;

    public function __construct(LeaderboardService $leaderboardService, AnalyticsService $analyticsService)
    {
        $this->leaderboardService = $leaderboardService;
        $this->analyticsService = $analyticsService;
    }

    /**
     * Show the admin dashboard
     */
    public function index(Request $request)
    {
        // Get statistics
        $stats = [
            'total_users' => User::whereHas('roles', function ($q) {
                $q->where('name', 'student');
            })->count(),
            'total_transactions' => Transaction::where('status', 'approved')->count(),
            'pending_transactions' => Transaction::where('status', 'pending')->count(),
            'rejected_transactions' => Transaction::where('status', 'rejected')->count(),
            'total_amount' => Transaction::where('status', 'approved')->sum('amount'),
        ];

        // Get leaderboard data
        $weeklyLeaderboard = $this->leaderboardService->getWeeklyLeaderboard();
        $monthlyLeaderboard = $this->leaderboardService->getMonthlyLeaderboard();
        $allTimeLeaderboard = $this->leaderboardService->getAllTimeLeaderboard();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
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
            $query->whereBetween('approved_at', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ]);
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
                
                $weeklyLeaderboard = $this->leaderboardService->getWeeklyLeaderboard()->take($limit);
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
                
                $monthlyLeaderboard = $this->leaderboardService->getMonthlyLeaderboard()->take($limit);
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
                
                $allTimeLeaderboard = $this->leaderboardService->getAllTimeLeaderboard()->take($limit);
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
                default => $this->leaderboardService->getAllTimeLeaderboard(),
            };

            // Limit to top N entries
            $leaderboard = $leaderboard->take($limit);

            $callback = function () use ($leaderboard) {
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
            ->where('id', '!=', Auth::id()); // Exclude current admin
        
        if ($search) {
            $query->where(function($q) use ($search) {
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
            ->where('id', '!=', Auth::id()); // Exclude current admin
        
        if ($search) {
            $query->where(function($q) use ($search) {
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
