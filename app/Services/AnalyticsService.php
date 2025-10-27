<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsService
{
    /**
     * Get transaction trends for a given period
     * 
     * @param string $period 'weekly', 'monthly', or 'all_time'
     * @return array
     */
    public function getTransactionTrends($period)
    {
        $query = Transaction::selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(amount) as amount')
            ->where('status', 'approved')
            ->groupBy('date')
            ->orderBy('date');

        if ($period === 'weekly') {
            // Last 7 days
            $query->where('created_at', '>=', now()->subDays(7));
        } elseif ($period === 'monthly') {
            // Last 30 days
            $query->where('created_at', '>=', now()->subDays(30));
        } else {
            // All time - group by month for last 12 months
            $query = Transaction::selectRaw("DATE_FORMAT(created_at, '%Y-%m-01') as date, COUNT(*) as count, SUM(amount) as amount")
                ->where('status', 'approved')
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupBy('date')
                ->orderBy('date');
        }

        $results = $query->get();

        // Fill in missing dates with zero values
        if ($period === 'weekly') {
            $results = $this->fillMissingDates($results, 7, 'days');
        } elseif ($period === 'monthly') {
            $results = $this->fillMissingDates($results, 30, 'days');
        } else {
            $results = $this->fillMissingDates($results, 12, 'months');
        }

        return $results->map(function ($item) {
            return [
                'date' => $item['date'],
                'count' => (int) $item['count'],
                'amount' => (float) $item['amount'],
            ];
        })->values()->toArray();
    }

    /**
     * Fill in missing dates with zero values
     */
    private function fillMissingDates($data, $count, $unit)
    {
        $filledData = collect();
        $dataByDate = $data->keyBy('date');

        for ($i = $count - 1; $i >= 0; $i--) {
            if ($unit === 'days') {
                $date = now()->subDays($i)->format('Y-m-d');
            } else {
                $date = now()->subMonths($i)->format('Y-m-01');
            }

            if ($dataByDate->has($date)) {
                $filledData->push($dataByDate->get($date));
            } else {
                $filledData->push([
                    'date' => $date,
                    'count' => 0,
                    'amount' => 0,
                ]);
            }
        }

        return $filledData;
    }

    /**
     * Get faculty comparison data
     * 
     * @param string $period 'weekly', 'monthly', or 'all_time'
     * @return array
     */
    public function getFacultyComparison($period)
    {
        $dateFilter = $this->getDateFilter($period);

        $faculties = Faculty::withCount([
            'users as student_count'
        ])->get();

        $transactionCounts = Transaction::selectRaw('users.faculty_id, COUNT(*) as transaction_count')
            ->join('users', 'transactions.user_id', '=', 'users.id')
            ->where('transactions.status', 'approved')
            ->when($dateFilter, function ($query) use ($dateFilter) {
                return $query->where('transactions.created_at', '>=', $dateFilter);
            })
            ->groupBy('users.faculty_id')
            ->pluck('transaction_count', 'faculty_id');

        return $faculties->map(function ($faculty) use ($transactionCounts) {
            $count = $transactionCounts->get($faculty->id, 0);
            $students = $faculty->student_count;
            $average = $students > 0 ? round($count / $students, 1) : 0;

            return [
                'faculty' => $faculty->short_name,
                'name' => $faculty->name,
                'count' => (int) $count,
                'students' => (int) $students,
                'average' => (float) $average,
            ];
        })->sortByDesc('count')->values()->toArray();
    }

    /**
     * Get transaction status distribution
     * 
     * @return array
     */
    public function getStatusDistribution()
    {
        $statusCounts = Transaction::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'approved' => (int) $statusCounts->get('approved', 0),
            'pending' => (int) $statusCounts->get('pending', 0),
            'rejected' => (int) $statusCounts->get('rejected', 0),
            'total' => (int) $statusCounts->sum(),
        ];
    }

    /**
     * Get year participation data
     * 
     * @param string $period 'weekly', 'monthly', or 'all_time'
     * @return array
     */
    public function getYearParticipation($period)
    {
        $dateFilter = $this->getDateFilter($period);

        $years = [1, 2, 3, 4];
        $result = [];

        foreach ($years as $year) {
            $totalStudents = User::whereHas('roles', function ($q) {
                $q->where('name', 'student');
            })->where('year_of_study', $year)->count();

            $transactionCount = Transaction::join('users', 'transactions.user_id', '=', 'users.id')
                ->where('users.year_of_study', $year)
                ->where('transactions.status', 'approved')
                ->when($dateFilter, function ($query) use ($dateFilter) {
                    return $query->where('transactions.created_at', '>=', $dateFilter);
                })
                ->count();

            $activeStudents = Transaction::join('users', 'transactions.user_id', '=', 'users.id')
                ->where('users.year_of_study', $year)
                ->where('transactions.status', 'approved')
                ->when($dateFilter, function ($query) use ($dateFilter) {
                    return $query->where('transactions.created_at', '>=', $dateFilter);
                })
                ->distinct('users.id')
                ->count('users.id');

            $rate = $totalStudents > 0 ? $activeStudents / $totalStudents : 0;

            $result[] = [
                'year' => $year,
                'count' => (int) $transactionCount,
                'students' => (int) $totalStudents,
                'rate' => (float) round($rate, 2),
            ];
        }

        return $result;
    }

    /**
     * Get date filter based on period
     * 
     * @param string $period
     * @return \Carbon\Carbon|null
     */
    private function getDateFilter($period)
    {
        if ($period === 'weekly') {
            return now()->subDays(7);
        } elseif ($period === 'monthly') {
            return now()->subDays(30);
        }
        
        return null; // All time
    }
}

