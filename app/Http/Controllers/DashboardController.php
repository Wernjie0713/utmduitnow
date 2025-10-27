<?php

namespace App\Http\Controllers;

use App\Services\LeaderboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $leaderboardService;

    public function __construct(LeaderboardService $leaderboardService)
    {
        $this->leaderboardService = $leaderboardService;
    }

    /**
     * Show the dashboard based on user role
     */
    public function index(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        
        // Check if user is admin
        if ($user->isAn('admin')) {
            // Redirect to admin dashboard
            return redirect()->route('admin.dashboard');
        }
        
        // For students, show personal stats + leaderboard
        return $this->studentDashboard($user);
    }

    /**
     * Show student dashboard with personal stats and leaderboard
     */
    private function studentDashboard($user)
    {
        // Get Top 20 leaderboard data with user position
        $weeklyData = $this->leaderboardService->getTop20WithUserPosition($user->id, 'weekly');
        $monthlyData = $this->leaderboardService->getTop20WithUserPosition($user->id, 'monthly');
        $allTimeData = $this->leaderboardService->getTop20WithUserPosition($user->id, 'all_time');
        
        // Get student's personal stats
        $stats = [
            'total_submissions' => $user->transactions()->count(),
            'today_submissions' => $user->getTodaySubmissionCount(),
            'can_submit_today' => $user->canSubmitToday(),
            'max_submissions_per_day' => config('app.max_submissions_per_day'),
            
            // Rankings
            'weekly_rank' => $weeklyData['user_position']['rank'] ?? null,
            'weekly_total' => $weeklyData['total_users'] ?? 0,
            'monthly_rank' => $monthlyData['user_position']['rank'] ?? null,
            'monthly_total' => $monthlyData['total_users'] ?? 0,
            'alltime_rank' => $allTimeData['user_position']['rank'] ?? null,
            'alltime_total' => $allTimeData['total_users'] ?? 0,
        ];
        
        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'leaderboards' => [
                'weekly' => $weeklyData,
                'monthly' => $monthlyData,
                'allTime' => $allTimeData,
            ],
        ]);
    }
    
}

