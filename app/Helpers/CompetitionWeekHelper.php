<?php

namespace App\Helpers;

use Carbon\Carbon;
use App\Helpers\DateHelper;

class CompetitionWeekHelper
{
    /**
     * Competition start date (September 1, 2025 - Monday)
     * All weeks follow normal Monday-Sunday pattern (17 weeks total)
     */
    const COMPETITION_START_DATE = '2025-09-01 00:00:00';

    /**
     * Competition end date (December 28, 2025 - Sunday)
     * No receipts will be accepted after this date and time
     */
    const COMPETITION_END_DATE = '2025-12-28 23:59:59';

    /**
     * Week 12 extended submission period (formerly Week 3)
     * Due to server downtime, Week 12 submissions are extended until Nov 26, 2025 11:59 PM
     */
    const WEEK_12_EXTENDED_SUBMISSION_END = '2025-11-26 23:59:59';

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

        $daysSinceStart = $competitionStart->diffInDays($date, false);
        return 1 + (int) floor($daysSinceStart / 7);
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
        $competitionStart = Carbon::parse(self::COMPETITION_START_DATE, 'Asia/Kuala_Lumpur');

        $weekStart = $competitionStart->copy()->addWeeks($weekNumber - 1);
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
     * @return string e.g., "Week 1: Sep 1 - Sep 7, 2025"
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
     * Check if we are currently in the Week 12 extended submission period
     * Week 12 extended submission: Nov 24 - Nov 26, 2025 11:59 PM
     * 
     * @param Carbon|null $date The date to check (defaults to now)
     * @return bool
     */
    public static function isInWeek12ExtendedSubmissionPeriod(?Carbon $date = null): bool
    {
        $date = $date ?? DateHelper::now('Asia/Kuala_Lumpur');
        $week12ExtendedStart = Carbon::parse('2025-11-24 00:00:00', 'Asia/Kuala_Lumpur');
        $week12ExtendedEnd = Carbon::parse(self::WEEK_12_EXTENDED_SUBMISSION_END, 'Asia/Kuala_Lumpur');

        return $date->between($week12ExtendedStart, $week12ExtendedEnd);
    }

    /**
     * Check if a transaction date is valid for Week 12 extended submission
     * Week 12 period: Nov 17-23, 2025
     * Extended submission allowed until: Nov 26, 2025 11:59 PM
     * 
     * @param Carbon $transactionDate The transaction date from the receipt
     * @param Carbon|null $currentDate The current date (defaults to now)
     * @return bool
     */
    public static function isValidForWeek12ExtendedSubmission(Carbon $transactionDate, ?Carbon $currentDate = null): bool
    {
        $currentDate = $currentDate ?? DateHelper::now('Asia/Kuala_Lumpur');

        // Check if we're still in the extended submission period
        if (!$currentDate->lte(Carbon::parse(self::WEEK_12_EXTENDED_SUBMISSION_END, 'Asia/Kuala_Lumpur'))) {
            return false;
        }

        // Check if transaction date is within Week 12 period (Nov 17-23)
        $week12Boundaries = self::getWeekBoundaries(12);
        return $transactionDate->between($week12Boundaries['start'], $week12Boundaries['end']);
    }

    /**
     * Get Week 12 extended submission end date as a formatted string
     * 
     * @return string e.g., "November 26, 2025 at 11:59 PM"
     */
    public static function getWeek12ExtendedSubmissionEndString(): string
    {
        $endDate = Carbon::parse(self::WEEK_12_EXTENDED_SUBMISSION_END, 'Asia/Kuala_Lumpur');
        return $endDate->format('F d, Y \a\t g:i A');
    }
}
