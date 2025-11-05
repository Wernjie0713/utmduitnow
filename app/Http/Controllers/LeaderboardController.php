<?php

namespace App\Http\Controllers;

use App\Services\LeaderboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    protected $leaderboardService;

    public function __construct(LeaderboardService $leaderboardService)
    {
        $this->leaderboardService = $leaderboardService;
    }

    /**
     * Show the main leaderboard page with Top 20 and user position
     */
    public function index(Request $request)
    {
        $userId = Auth::id();
        $isAdmin = Auth::user()->roles->contains('name', 'admin');
        
        $weeklyData = $this->leaderboardService->getTop20WithUserPosition($userId, 'weekly');
        $monthlyData = $this->leaderboardService->getTop20WithUserPosition($userId, 'monthly');
        $allTimeData = $this->leaderboardService->getTop20WithUserPosition($userId, 'all_time', null, null, $isAdmin);

        return Inertia::render('Leaderboard/Index', [
            'weeklyData' => $weeklyData,
            'monthlyData' => $monthlyData,
            'allTimeData' => $allTimeData,
        ]);
    }

    /**
     * Get weekly leaderboard data (API endpoint)
     */
    public function weekly()
    {
        $leaderboard = $this->leaderboardService->getWeeklyLeaderboard();
        
        return response()->json([
            'leaderboard' => $leaderboard,
            'period' => 'weekly',
        ]);
    }

    /**
     * Get monthly leaderboard data (API endpoint)
     */
    public function monthly(Request $request)
    {
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        
        $leaderboard = $this->leaderboardService->getMonthlyLeaderboard($month, $year);
        
        return response()->json([
            'leaderboard' => $leaderboard,
            'period' => 'monthly',
            'month' => $month,
            'year' => $year,
        ]);
    }

    /**
     * Get all-time leaderboard data (API endpoint)
     */
    public function allTime()
    {
        $isAdmin = Auth::user()->roles->contains('name', 'admin');
        $leaderboard = $this->leaderboardService->getAllTimeLeaderboard($isAdmin);
        
        return response()->json([
            'leaderboard' => $leaderboard,
            'period' => 'all_time',
        ]);
    }

    /**
     * Show the Full Rankings page
     */
    public function fullRankingsPage()
    {
        return Inertia::render('Leaderboard/FullRankings');
    }

    /**
     * Get paginated full rankings data (API endpoint for Full Rankings page)
     */
    public function fullRankings(Request $request)
    {
        $userId = Auth::id();
        $isAdmin = Auth::user()->roles->contains('name', 'admin');
        $periodType = $request->input('period', 'all_time');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 50);
        $search = $request->input('search', null);
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        
        $paginatedData = $this->leaderboardService->getPaginatedLeaderboard(
            $periodType, $page, $perPage, $search, $month, $year, $isAdmin
        );
        
        $userPosition = $this->leaderboardService->getUserPosition($userId, $periodType, $month, $year, $isAdmin);
        
        return response()->json([
            ...$paginatedData,
            'user_position' => $userPosition,
        ]);
    }

    /**
     * Export full leaderboard to CSV (no limit, full data)
     */
    public function exportFullRankings(Request $request)
    {
        $period = $request->input('period', 'all_time');
        $month = $request->input('month');
        $year = $request->input('year');

        $filename = "full_leaderboard_{$period}_" . now()->format('Y-m-d_His') . ".csv";
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        // Handle 'all' period - export all three periods
        if ($period === 'all') {
            $callback = function () {
                $file = fopen('php://output', 'w');
                
                // Weekly Leaderboard
                fputcsv($file, ['=== WEEKLY LEADERBOARD (Full List) ===']);
                fputcsv($file, ['Rank', 'Matric No', 'Name', 'Phone Number', 'Faculty', 'Year', 'Transaction Count']);
                
                $weeklyLeaderboard = $this->leaderboardService->getWeeklyLeaderboard();
                foreach ($weeklyLeaderboard as $entry) {
                    fputcsv($file, [
                        $entry->rank,
                        $entry->user->matric_no ?? 'N/A',
                        $entry->user->name,
                        $entry->user->phone_number ?? 'N/A',
                        $entry->user->faculty->short_name ?? 'N/A',
                        $entry->user->year_of_study ?? 'N/A',
                        $entry->transaction_count,
                    ]);
                }
                
                fputcsv($file, []); // Empty row separator
                
                // Monthly Leaderboard
                fputcsv($file, ['=== MONTHLY LEADERBOARD (Full List) ===']);
                fputcsv($file, ['Rank', 'Matric No', 'Name', 'Phone Number', 'Faculty', 'Year', 'Transaction Count']);
                
                $monthlyLeaderboard = $this->leaderboardService->getMonthlyLeaderboard();
                foreach ($monthlyLeaderboard as $entry) {
                    fputcsv($file, [
                        $entry->rank,
                        $entry->user->matric_no ?? 'N/A',
                        $entry->user->name,
                        $entry->user->phone_number ?? 'N/A',
                        $entry->user->faculty->short_name ?? 'N/A',
                        $entry->user->year_of_study ?? 'N/A',
                        $entry->transaction_count,
                    ]);
                }
                
                fputcsv($file, []); // Empty row separator
                
                // All-Time Leaderboard
                fputcsv($file, ['=== ALL-TIME LEADERBOARD (Full List) ===']);
                fputcsv($file, ['Rank', 'Matric No', 'Name', 'Phone Number', 'Faculty', 'Year', 'Transaction Count']);
                
                $allTimeLeaderboard = $this->leaderboardService->getAllTimeLeaderboard();
                foreach ($allTimeLeaderboard as $entry) {
                    fputcsv($file, [
                        $entry->rank,
                        $entry->user->matric_no ?? 'N/A',
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
            // Single period export (no limit, full data)
            $leaderboard = match ($period) {
                'weekly' => $this->leaderboardService->getWeeklyLeaderboard(),
                'monthly' => $this->leaderboardService->getMonthlyLeaderboard($month, $year),
                default => $this->leaderboardService->getAllTimeLeaderboard(),
            };

            $callback = function () use ($leaderboard) {
                $file = fopen('php://output', 'w');
                
                // Add CSV headers
                fputcsv($file, ['Rank', 'Matric No', 'Name', 'Phone Number', 'Faculty', 'Year', 'Transaction Count']);
                
                // Add data rows (all entries, no limit)
                foreach ($leaderboard as $entry) {
                    fputcsv($file, [
                        $entry->rank,
                        $entry->user->matric_no ?? 'N/A',
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
}
