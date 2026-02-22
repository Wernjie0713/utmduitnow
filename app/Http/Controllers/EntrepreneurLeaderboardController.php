<?php

namespace App\Http\Controllers;

use App\Services\EntrepreneurLeaderboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EntrepreneurLeaderboardController extends Controller
{
    protected $leaderboardService;

    public function __construct(EntrepreneurLeaderboardService $leaderboardService)
    {
        $this->leaderboardService = $leaderboardService;
    }

    public function index(Request $request)
    {
        $unitId = Auth::user()->entrepreneurUnit?->id;
        $selectedMonth = $request->input('month');
        $selectedYear = $request->input('year');
        $selectedWeek = $request->input('week');

        $weeklyData = $this->leaderboardService->getTop20WithUnitPosition($unitId, 'weekly', null, null, $selectedWeek);
        $monthlyData = $this->leaderboardService->getTop20WithUnitPosition($unitId, 'monthly', $selectedMonth, $selectedYear);
        $allTimeData = $this->leaderboardService->getTop20WithUnitPosition($unitId, 'all_time');

        return Inertia::render('Entrepreneur/Leaderboard', [
            'weeklyData' => $weeklyData,
            'monthlyData' => $monthlyData,
            'allTimeData' => $allTimeData,
            'selectedMonth' => $selectedMonth,
            'activeTab' => $selectedMonth ? 'monthly' : 'weekly',
        ]);
    }

    public function fullRankingsPage()
    {
        return Inertia::render('Entrepreneur/FullRankings');
    }

    public function fullRankings(Request $request)
    {
        $unitId = Auth::user()->entrepreneurUnit?->id;
        $periodType = $request->input('period', 'all_time');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 50);
        $search = $request->input('search', null);
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        $week = $request->input('week');

        $paginatedData = $this->leaderboardService->getPaginatedLeaderboard(
            $periodType,
            $page,
            $perPage,
            $search,
            $month,
            $year,
            $week
        );

        $unitPosition = $this->leaderboardService->getUnitPosition($unitId, $periodType, $month, $year, $week);

        return response()->json([
            ...$paginatedData,
            'unit_position' => $unitPosition,
        ]);
    }

    public function exportFullRankings(Request $request)
    {
        $period = $request->input('period', 'all_time');
        $month = $request->input('month');
        $year = $request->input('year');
        $week = $request->input('week');

        $filename = "entrepreneur_leaderboard_{$period}_" . now()->format('Y-m-d_His') . ".csv";

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        if ($period === 'all') {
            $callback = function () {
                $file = fopen('php://output', 'w');

                // Weekly Leaderboard
                fputcsv($file, ['=== WEEKLY LEADERBOARD (Full List) ===']);
                fputcsv($file, ['Rank', 'Business Name', 'Business Type', 'Manager Name', 'Team Members Count', 'Transaction Count', 'Total Amount']);

                $weeklyLeaderboard = $this->leaderboardService->getWeeklyLeaderboard();
                foreach ($weeklyLeaderboard as $entry) {
                    $unit = $entry->entrepreneurUnit;
                    fputcsv($file, [
                        $entry->rank,
                        $unit->business_name ?? 'N/A',
                        ucfirst($unit->business_location ?? 'N/A'),
                        $unit->manager->name ?? 'N/A',
                        $unit->teamMembers()->count(),
                        $entry->transaction_count,
                        number_format($entry->total_amount, 2),
                    ]);
                }

                fputcsv($file, []); // Empty row separator

                // Monthly Leaderboard
                fputcsv($file, ['=== MONTHLY LEADERBOARD (Full List) ===']);
                fputcsv($file, ['Rank', 'Business Name', 'Business Type', 'Manager Name', 'Team Members Count', 'Transaction Count', 'Total Amount']);

                $monthlyLeaderboard = $this->leaderboardService->getMonthlyLeaderboard();
                foreach ($monthlyLeaderboard as $entry) {
                    $unit = $entry->entrepreneurUnit;
                    fputcsv($file, [
                        $entry->rank,
                        $unit->business_name ?? 'N/A',
                        ucfirst($unit->business_location ?? 'N/A'),
                        $unit->manager->name ?? 'N/A',
                        $unit->teamMembers()->count(),
                        $entry->transaction_count,
                        number_format($entry->total_amount, 2),
                    ]);
                }

                fputcsv($file, []); // Empty row separator

                // All-Time Leaderboard
                fputcsv($file, ['=== ALL-TIME LEADERBOARD (Full List) ===']);
                fputcsv($file, ['Rank', 'Business Name', 'Business Type', 'Manager Name', 'Team Members Count', 'Transaction Count', 'Total Amount']);

                $allTimeLeaderboard = $this->leaderboardService->getAllTimeLeaderboard();
                foreach ($allTimeLeaderboard as $entry) {
                    $unit = $entry->entrepreneurUnit;
                    fputcsv($file, [
                        $entry->rank,
                        $unit->business_name ?? 'N/A',
                        ucfirst($unit->business_location ?? 'N/A'),
                        $unit->manager->name ?? 'N/A',
                        $unit->teamMembers()->count(),
                        $entry->transaction_count,
                        number_format($entry->total_amount, 2),
                    ]);
                }

                fclose($file);
            };
        } else {
            $callback = function () use ($period, $month, $year, $week) {
                $file = fopen('php://output', 'w');

                $title = match ($period) {
                    'weekly' => '=== WEEKLY LEADERBOARD (Full List) ===',
                    'monthly' => "=== MONTHLY LEADERBOARD ({$month}/{$year}) ===",
                    'all_time' => '=== ALL-TIME LEADERBOARD ===',
                    default => '=== LEADERBOARD ===',
                };

                fputcsv($file, [$title]);
                fputcsv($file, ['Rank', 'Business Name', 'Business Type', 'Manager Name', 'Team Members Count', 'Transaction Count', 'Total Amount']);

                $leaderboard = match ($period) {
                    'weekly' => $week ? $this->leaderboardService->getWeekLeaderboard($week) : $this->leaderboardService->getWeeklyLeaderboard(),
                    'monthly' => $this->leaderboardService->getMonthlyLeaderboard($month, $year),
                    'all_time' => $this->leaderboardService->getAllTimeLeaderboard(),
                    default => collect([]),
                };

                foreach ($leaderboard as $entry) {
                    $unit = $entry->entrepreneurUnit;
                    fputcsv($file, [
                        $entry->rank,
                        $unit->business_name ?? 'N/A',
                        ucfirst($unit->business_location ?? 'N/A'),
                        $unit->manager->name ?? 'N/A',
                        $unit->teamMembers()->count(),
                        $entry->transaction_count,
                        number_format($entry->total_amount, 2),
                    ]);
                }

                fclose($file);
            };
        }

        return response()->stream($callback, 200, $headers);
    }
}
