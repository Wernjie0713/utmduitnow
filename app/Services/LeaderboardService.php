<?php

namespace App\Services;

use App\Models\Transaction;
use App\Helpers\CompetitionWeekHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaderboardService
{
    /**
     * Get weekly leaderboard (current competition week)
     * Week 1: Nov 1-9, 2025 (9 days)
     * Week 2+: Monday - Sunday (7 days)
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getWeeklyLeaderboard()
    {
        $boundaries = CompetitionWeekHelper::getCurrentWeekBoundaries();
        
        if ($boundaries === null) {
            // Competition hasn't started yet, return empty collection
            return collect([]);
        }

        return $this->getLeaderboard('weekly', $boundaries['start'], $boundaries['end']);
    }

    /**
     * Get monthly leaderboard
     * 
     * @param int|null $month Month number (1-12), defaults to current month
     * @param int|null $year Year, defaults to current year
     * @return \Illuminate\Support\Collection
     */
    public function getMonthlyLeaderboard($month = null, $year = null)
    {
        $month = $month ?? Carbon::now()->month;
        $year = $year ?? Carbon::now()->year;

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        return $this->getLeaderboard('monthly', $startOfMonth, $endOfMonth);
    }

    /**
     * Get all-time leaderboard
     * 
     * @return \Illuminate\Support\Collection
     */
    public function getAllTimeLeaderboard()
    {
        return $this->getLeaderboard('all_time');
    }

    /**
     * Get leaderboard for a specific period
     * 
     * @param string $periodType
     * @param Carbon|null $startDate
     * @param Carbon|null $endDate
     * @return \Illuminate\Support\Collection
     */
    protected function getLeaderboard($periodType, $startDate = null, $endDate = null)
    {
        $query = Transaction::query()
            ->where('status', 'approved')
            ->with(['user.faculty']);

        // Apply date filter if provided
        if ($startDate && $endDate) {
            $query->whereBetween('approved_at', [$startDate, $endDate]);
        }

        // Get transaction counts per user with tie-breaker
        $leaderboard = $query
            ->select(
                'user_id',
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('MIN(approved_at) as first_transaction_at') // For tie-breaking
            )
            ->groupBy('user_id')
            ->orderByDesc('transaction_count')
            ->orderBy('first_transaction_at', 'asc') // Tie-breaker: earlier timestamp wins
            ->get();

        // Add rank to each entry
        $rank = 1;
        $previousCount = null;
        $previousRank = 1;
        
        foreach ($leaderboard as $index => $entry) {
            if ($previousCount === $entry->transaction_count) {
                // Same count as previous, keep the same rank
                $entry->rank = $previousRank;
            } else {
                $entry->rank = $rank;
                $previousRank = $rank;
            }
            
            $previousCount = $entry->transaction_count;
            $rank++;
        }

        return $leaderboard;
    }

    /**
     * Get available months for monthly leaderboard selector
     * 
     * @return array Array of months with transaction data
     */
    public function getAvailableMonths()
    {
        $months = Transaction::where('status', 'approved')
            ->select(
                DB::raw('EXTRACT(YEAR FROM approved_at) as year'),
                DB::raw('EXTRACT(MONTH FROM approved_at) as month')
            )
            ->groupBy('year', 'month')
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();

        return $months->map(function ($item) {
            return [
                'year' => (int) $item->year,
                'month' => (int) $item->month,
                'label' => Carbon::create($item->year, $item->month, 1)->format('F Y'),
            ];
        })->toArray();
    }

    /**
     * Get user's current position in a leaderboard
     * 
     * @param int $userId
     * @param string $periodType
     * @param int|null $month
     * @param int|null $year
     * @return array|null
     */
    public function getUserPosition($userId, $periodType, $month = null, $year = null)
    {
        $leaderboard = match ($periodType) {
            'weekly' => $this->getWeeklyLeaderboard(),
            'monthly' => $this->getMonthlyLeaderboard($month, $year),
            'all_time' => $this->getAllTimeLeaderboard(),
            default => collect([]),
        };

        $userEntry = $leaderboard->firstWhere('user_id', $userId);

        if (!$userEntry) {
            return null;
        }

        return [
            'rank' => $userEntry->rank,
            'transaction_count' => $userEntry->transaction_count,
            'total_participants' => $leaderboard->count(),
        ];
    }

    /**
     * Get Top 20 leaderboard with current user's position
     * 
     * @param int $userId
     * @param string $periodType
     * @param int|null $month
     * @param int|null $year
     * @return array
     */
    public function getTop20WithUserPosition($userId, $periodType, $month = null, $year = null)
    {
        $leaderboard = match ($periodType) {
            'weekly' => $this->getWeeklyLeaderboard(),
            'monthly' => $this->getMonthlyLeaderboard($month, $year),
            'all_time' => $this->getAllTimeLeaderboard(),
            default => collect([]),
        };
        
        $top20 = $leaderboard->take(20);
        $userEntry = $leaderboard->firstWhere('user_id', $userId);
        
        return [
            'top20' => $top20,
            'user_position' => $userEntry ? [
                'rank' => $userEntry->rank,
                'transaction_count' => $userEntry->transaction_count,
                'user' => $userEntry->user,
            ] : null,
            'total_users' => $leaderboard->count(),
        ];
    }

    /**
     * Get paginated leaderboard for Full Rankings (server-side pagination)
     * 
     * @param string $periodType
     * @param int $page
     * @param int $perPage
     * @param string|null $search
     * @param int|null $month
     * @param int|null $year
     * @return array
     */
    public function getPaginatedLeaderboard($periodType, $page = 1, $perPage = 50, $search = null, $month = null, $year = null)
    {
        $leaderboard = match ($periodType) {
            'weekly' => $this->getWeeklyLeaderboard(),
            'monthly' => $this->getMonthlyLeaderboard($month, $year),
            'all_time' => $this->getAllTimeLeaderboard(),
            default => collect([]),
        };
        
        // Apply search filter
        if ($search) {
            $leaderboard = $leaderboard->filter(function($entry) use ($search) {
                return stripos($entry->user->name, $search) !== false;
            });
        }
        
        // Manual pagination
        $total = $leaderboard->count();
        $data = $leaderboard->slice(($page - 1) * $perPage, $perPage)->values();
        
        return [
            'data' => $data,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => ceil($total / $perPage),
        ];
    }
}

