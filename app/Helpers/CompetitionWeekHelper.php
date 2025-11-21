<?php

namespace App\Helpers;

use Carbon\Carbon;
use App\Helpers\DateHelper;

class CompetitionWeekHelper
{
    /**
     * Competition start date (November 1, 2025 - Saturday)
     * Week 1 is special: runs from Nov 1 (Sat) to Nov 9 (Sun) 11:59 PM - 9 days
     * After that, all weeks follow normal Monday-Sunday pattern
     */
    const COMPETITION_START_DATE = '2025-11-01 00:00:00';

    /**
     * Competition end date (December 28, 2025 - Saturday)
     * No receipts will be accepted after this date and time
     */
    const COMPETITION_END_DATE = '2025-12-28 23:59:59';

    /**
     * Week 3 extended submission period
     * Due to server downtime, Week 3 submissions are extended until Nov 26, 2025 11:59 PM
     */
    const WEEK_3_EXTENDED_SUBMISSION_END = '2025-11-26 23:59:59';

    /**
     * Get the current competition week number
     * 
     * @param Carbon|null $date The date to check (defaults to now)
     * @return int|null Week number (1, 2, 3, etc.) or null if before competition starts
     */
    public static function getCurrentWeekNumber(?Carbon $date = null): ?int
    {
        $date = $date ?? DateHelper::now('Asia/Kuala_Lumpur');
        $competitionStart = Carbon::parse(self::COMPETITION_START_DATE, 'Asia/Kuala_Lumpur');

        // Before competition starts
        if ($date->lt($competitionStart)) {
            return null;
        }

        // Week 1 ends on Nov 9, 2025 23:59:59 (Sunday)
        $week1End = Carbon::parse('2025-11-09 23:59:59', 'Asia/Kuala_Lumpur');

        if ($date->lte($week1End)) {
            return 1;
        }

        // After Week 1, calculate based on Monday-Sunday weeks
        $week2Start = Carbon::parse('2025-11-10 00:00:00', 'Asia/Kuala_Lumpur');
        $daysSinceWeek2Start = $date->diffInDays($week2Start, false);

        if ($daysSinceWeek2Start < 0) {
            // Date is after week 2 start
            $weekNumber = 2 + floor(abs($daysSinceWeek2Start) / 7);
            return (int) $weekNumber;
        }

        return 2;
    }

    /**
     * Get the start and end dates for the current competition week
     * 
     * @param Carbon|null $date The date to check (defaults to now)
     * @return array|null ['start' => Carbon, 'end' => Carbon, 'week_number' => int] or null if before competition
     */
    public static function getCurrentWeekBoundaries(?Carbon $date = null): ?array
    {
        $date = $date ?? DateHelper::now('Asia/Kuala_Lumpur');
        $weekNumber = self::getCurrentWeekNumber($date);

        if ($weekNumber === null) {
            return null;
        }

        return self::getWeekBoundaries($weekNumber);
    }

    /**
     * Get the start and end dates for a specific competition week
     * 
     * @param int $weekNumber The week number (1, 2, 3, etc.)
     * @return array ['start' => Carbon, 'end' => Carbon, 'week_number' => int]
     */
    public static function getWeekBoundaries(int $weekNumber): array
    {
        if ($weekNumber === 1) {
            // Week 1: Nov 1 (Sat) 00:00:00 to Nov 9 (Sun) 23:59:59
            return [
                'start' => Carbon::parse('2025-11-01 00:00:00', 'Asia/Kuala_Lumpur'),
                'end' => Carbon::parse('2025-11-09 23:59:59', 'Asia/Kuala_Lumpur'),
                'week_number' => 1,
            ];
        }

        // Week 2 and onwards: Monday 00:00:00 to Sunday 23:59:59
        $week2Start = Carbon::parse('2025-11-10 00:00:00', 'Asia/Kuala_Lumpur'); // Monday, Nov 10
        
        // Calculate the start of the requested week
        $weeksAfterWeek2 = $weekNumber - 2;
        $weekStart = $week2Start->copy()->addWeeks($weeksAfterWeek2);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        return [
            'start' => $weekStart,
            'end' => $weekEnd,
            'week_number' => $weekNumber,
        ];
    }

    /**
     * Check if a given date is within the current competition week
     * 
     * @param Carbon $date The date to check
     * @return bool
     */
    public static function isInCurrentWeek(Carbon $date): bool
    {
        $boundaries = self::getCurrentWeekBoundaries();

        if ($boundaries === null) {
            return false;
        }

        return $date->between($boundaries['start'], $boundaries['end']);
    }

    /**
     * Get formatted week range string for display
     * 
     * @param int|null $weekNumber Week number or null for current week
     * @return string e.g., "Week 1: Nov 1 - Nov 9, 2025"
     */
    public static function getWeekRangeString(?int $weekNumber = null): string
    {
        if ($weekNumber === null) {
            $boundaries = self::getCurrentWeekBoundaries();
            if ($boundaries === null) {
                return 'Competition has not started yet';
            }
        } else {
            $boundaries = self::getWeekBoundaries($weekNumber);
        }

        $weekNum = $boundaries['week_number'];
        $startFormatted = $boundaries['start']->format('M d');
        $endFormatted = $boundaries['end']->format('M d, Y');

        return "Week {$weekNum}: {$startFormatted} - {$endFormatted}";
    }

    /**
     * Check if the competition has ended
     * 
     * @param Carbon|null $date The date to check (defaults to now)
     * @return bool
     */
    public static function hasCompetitionEnded(?Carbon $date = null): bool
    {
        $date = $date ?? DateHelper::now('Asia/Kuala_Lumpur');
        $competitionEnd = Carbon::parse(self::COMPETITION_END_DATE, 'Asia/Kuala_Lumpur');

        return $date->gt($competitionEnd);
    }

    /**
     * Check if a date is within the competition period (between start and end dates)
     * 
     * @param Carbon $date The date to check
     * @return bool
     */
    public static function isWithinCompetitionPeriod(Carbon $date): bool
    {
        $competitionStart = Carbon::parse(self::COMPETITION_START_DATE, 'Asia/Kuala_Lumpur');
        $competitionEnd = Carbon::parse(self::COMPETITION_END_DATE, 'Asia/Kuala_Lumpur');

        return $date->between($competitionStart, $competitionEnd);
    }

    /**
     * Get the competition end date as a formatted string
     * 
     * @return string e.g., "December 28, 2025 at 11:59 PM"
     */
    public static function getCompetitionEndDateString(): string
    {
        $competitionEnd = Carbon::parse(self::COMPETITION_END_DATE, 'Asia/Kuala_Lumpur');
        return $competitionEnd->format('F d, Y \a\t g:i A');
    }

    /**
     * Check if we are currently in the Week 3 extended submission period
     * Week 3 extended submission: Nov 24 - Nov 26, 2025 11:59 PM
     * 
     * @param Carbon|null $date The date to check (defaults to now)
     * @return bool
     */
    public static function isInWeek3ExtendedSubmissionPeriod(?Carbon $date = null): bool
    {
        $date = $date ?? DateHelper::now('Asia/Kuala_Lumpur');
        $week3ExtendedStart = Carbon::parse('2025-11-24 00:00:00', 'Asia/Kuala_Lumpur');
        $week3ExtendedEnd = Carbon::parse(self::WEEK_3_EXTENDED_SUBMISSION_END, 'Asia/Kuala_Lumpur');

        return $date->between($week3ExtendedStart, $week3ExtendedEnd);
    }

    /**
     * Check if a transaction date is valid for Week 3 extended submission
     * Week 3 period: Nov 17-23, 2025
     * Extended submission allowed until: Nov 26, 2025 11:59 PM
     * 
     * @param Carbon $transactionDate The transaction date from the receipt
     * @param Carbon|null $currentDate The current date (defaults to now)
     * @return bool
     */
    public static function isValidForWeek3ExtendedSubmission(Carbon $transactionDate, ?Carbon $currentDate = null): bool
    {
        $currentDate = $currentDate ?? DateHelper::now('Asia/Kuala_Lumpur');
        
        // Check if we're still in the extended submission period
        if (!$currentDate->lte(Carbon::parse(self::WEEK_3_EXTENDED_SUBMISSION_END, 'Asia/Kuala_Lumpur'))) {
            return false;
        }

        // Check if transaction date is within Week 3 period (Nov 17-23)
        $week3Boundaries = self::getWeekBoundaries(3);
        return $transactionDate->between($week3Boundaries['start'], $week3Boundaries['end']);
    }

    /**
     * Get Week 3 extended submission end date as a formatted string
     * 
     * @return string e.g., "November 26, 2025 at 11:59 PM"
     */
    public static function getWeek3ExtendedSubmissionEndString(): string
    {
        $endDate = Carbon::parse(self::WEEK_3_EXTENDED_SUBMISSION_END, 'Asia/Kuala_Lumpur');
        return $endDate->format('F d, Y \a\t g:i A');
    }
}

