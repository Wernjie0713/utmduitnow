<?php

namespace App\Services;

use App\Models\EntrepreneurTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EntrepreneurLeaderboardService
{
    public function getWeeklyLeaderboard()
    {
        $boundaries = \App\Helpers\CompetitionWeekHelper::getCurrentWeekBoundaries();

        if ($boundaries === null) {
            return collect([]);
        }

        return $this->getLeaderboard('weekly', $boundaries['start'], $boundaries['end']);
    }

    public function getWeekLeaderboard(int $weekNumber)
    {
        $boundaries = \App\Helpers\CompetitionWeekHelper::getWeekBoundaries($weekNumber);
        return $this->getLeaderboard('weekly', $boundaries['start'], $boundaries['end']);
    }

    public function getMonthlyLeaderboard($month = null, $year = null)
    {
        $month = $month ?? Carbon::now()->month;
        $year = $year ?? Carbon::now()->year;

        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = Carbon::create($year, $month, 1)->endOfMonth();

        return $this->getLeaderboard('monthly', $start, $end);
    }

    public function getAllTimeLeaderboard()
    {
        return $this->getLeaderboard('all_time');
    }

    public function getCustomRangeLeaderboard($startDate, $endDate)
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        return $this->getLeaderboard('custom', $start, $end);
    }

    protected function getLeaderboard($periodType, $startDate = null, $endDate = null)
    {
        $query = EntrepreneurTransaction::query()
            ->with(['entrepreneurUnit' => function ($query) {
                $query->withCount('teamMembers');
            }]);

        if ($startDate && $endDate) {
            $query->whereBetween('transaction_date', [
                $startDate->toDateString(),
                $endDate->toDateString(),
            ]);
        } elseif ($startDate) {
            $query->where('transaction_date', '>=', $startDate->toDateString());
        }

        $leaderboard = $query
            ->select(
                'entrepreneur_unit_id',
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('MIN(generated_at) as first_transaction_at')
            )
            ->groupBy('entrepreneur_unit_id')
            ->orderByDesc('transaction_count')
            ->orderBy('first_transaction_at', 'asc')
            ->get();

        // Add rank with tie handling
        $rank = 1;
        $previousCount = null;
        $previousRank = 1;

        foreach ($leaderboard as $entry) {
            if ($previousCount === $entry->transaction_count) {
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

    public function getUnitPosition($unitId, $periodType, $month = null, $year = null, $week = null)
    {
        $leaderboard = match ($periodType) {
            'weekly' => $week ? $this->getWeekLeaderboard($week) : $this->getWeeklyLeaderboard(),
            'monthly' => $this->getMonthlyLeaderboard($month, $year),
            'all_time' => $this->getAllTimeLeaderboard(),

            default => collect([]),
        };

        $entry = $leaderboard->firstWhere('entrepreneur_unit_id', $unitId);

        if (!$entry) {
            return null;
        }

        return [
            'rank' => $entry->rank,
            'transaction_count' => $entry->transaction_count,
            'total_amount' => $entry->total_amount,
            'total_participants' => $leaderboard->count(),
        ];
    }

    public function getTop20WithUnitPosition($unitId, $periodType, $month = null, $year = null, $week = null)
    {
        $leaderboard = match ($periodType) {
            'weekly' => $week ? $this->getWeekLeaderboard($week) : $this->getWeeklyLeaderboard(),
            'monthly' => $this->getMonthlyLeaderboard($month, $year),
            'all_time' => $this->getAllTimeLeaderboard(),
            default => collect([]),
        };

        $top20 = $leaderboard->take(20);
        $unitEntry = $leaderboard->firstWhere('entrepreneur_unit_id', $unitId);

        return [
            'top20' => $top20,
            'unit_position' => $unitEntry ? [
                'rank' => $unitEntry->rank,
                'transaction_count' => $unitEntry->transaction_count,
                'total_amount' => $unitEntry->total_amount,
                'entrepreneur_unit' => $unitEntry->entrepreneurUnit,
            ] : null,
            'total_units' => $leaderboard->count(),
        ];
    }

    public function getPaginatedLeaderboard($periodType, $page = 1, $perPage = 50, $search = null, $month = null, $year = null, $week = null)
    {
        $leaderboard = match ($periodType) {
            'weekly' => $week ? $this->getWeekLeaderboard($week) : $this->getWeeklyLeaderboard(),
            'monthly' => $this->getMonthlyLeaderboard($month, $year),
            'all_time' => $this->getAllTimeLeaderboard(),
            default => collect([]),
        };

        if ($search) {
            $leaderboard = $leaderboard->filter(function ($entry) use ($search) {
                return stripos($entry->entrepreneurUnit->business_name, $search) !== false;
            });
        }

        $total = $leaderboard->count();
        $data = $leaderboard->slice(($page - 1) * $perPage, $perPage)->values();

        return [
            'data' => $data,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => max(1, ceil($total / $perPage)),
        ];
    }
}
