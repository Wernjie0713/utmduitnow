# Competition Week Logic

## Overview
The UTM DuitNow Competition uses a special week calculation system where Week 1 is extended to 9 days, and all subsequent weeks follow the standard Monday-Sunday pattern.

## Competition Period

### Start Date
**November 1, 2025 (Saturday) 00:00:00 Malaysia Time (Asia/Kuala_Lumpur)**

### End Date
**December 28, 2025 (Saturday) 23:59:59 Malaysia Time (Asia/Kuala_Lumpur)**

⚠️ **No receipts will be accepted after the competition end date.**

## Week Structure

### Week 1 (Special - 9 Days)
- **Start**: Saturday, November 1, 2025 at 00:00:00
- **End**: Sunday, November 9, 2025 at 23:59:59
- **Duration**: 9 days (Sat, Sun, Mon, Tue, Wed, Thu, Fri, Sat, Sun)

### Week 2 and Beyond (Standard - 7 Days Each)
- **Week 2**: Monday, Nov 10 - Sunday, Nov 16, 2025
- **Week 3**: Monday, Nov 17 - Sunday, Nov 23, 2025
- **Week 4**: Monday, Nov 24 - Sunday, Nov 30, 2025
- And so on... (Monday 00:00:00 to Sunday 23:59:59)

## Important Rules

### Transaction Date Validation
1. **Before Competition Start** (Before Nov 1, 2025)
   - Status: ❌ Rejected
   - Message: "The competition has not started yet. Competition starts on November 1, 2025."

2. **October 31, 2025 (Friday)**
   - Status: ❌ Rejected (Not in Week 1)
   - Message: "Only receipts from the current competition week are accepted. Week 1: Nov 1 - Nov 9, 2025."

3. **During Week 1** (Nov 1-9, 2025)
   - Status: ✅ Accepted
   - All transactions dated between Nov 1-9 are valid for Week 1

4. **After Week 1** (Nov 10 onwards - During Competition)
   - Status: ✅ Accepted only if within the current week
   - Each week runs Monday 00:00:00 to Sunday 23:59:59

5. **After Competition End** (After Dec 28, 2025 11:59 PM)
   - Status: ❌ Rejected (Competition has ended)
   - Message: "The competition has ended on December 28, 2025 at 11:59 PM. No more receipts can be submitted."

6. **Transaction Dated After Dec 28, 2025**
   - Status: ❌ Rejected (Receipt date is after competition period)
   - Message: "Only receipts dated before December 28, 2025 at 11:59 PM are accepted. The competition has ended."

### Leaderboard Calculation
- **Weekly Leaderboard**: Shows rankings for the current competition week only
- **Monthly Leaderboard**: Standard calendar month (e.g., November 2025)
- **All-Time Leaderboard**: All approved transactions since competition start

## Implementation

### Helper Class
`App\Helpers\CompetitionWeekHelper`

#### Key Methods

1. **`getCurrentWeekNumber(?Carbon $date = null): ?int`**
   - Returns the current week number (1, 2, 3, etc.)
   - Returns `null` if before competition starts

2. **`getCurrentWeekBoundaries(?Carbon $date = null): ?array`**
   - Returns `['start' => Carbon, 'end' => Carbon, 'week_number' => int]`
   - Returns `null` if before competition starts

3. **`getWeekBoundaries(int $weekNumber): array`**
   - Returns boundaries for a specific week number

4. **`isInCurrentWeek(Carbon $date): bool`**
   - Checks if a date is within the current competition week

5. **`getWeekRangeString(?int $weekNumber = null): string`**
   - Returns formatted string like "Week 1: Nov 1 - Nov 9, 2025"

6. **`hasCompetitionEnded(?Carbon $date = null): bool`**
   - Checks if the competition has ended
   - Returns `true` if current date/time is after Dec 28, 2025 11:59 PM

7. **`isWithinCompetitionPeriod(Carbon $date): bool`**
   - Checks if a date is within the competition period (Nov 1 - Dec 28, 2025)
   - Returns `true` if date is between start and end dates

8. **`getCompetitionEndDateString(): string`**
   - Returns formatted string like "December 28, 2025 at 11:59 PM"

### Files Updated

1. **`app/Services/LeaderboardService.php`**
   - `getWeeklyLeaderboard()` now uses `CompetitionWeekHelper`

2. **`app/Models/Transaction.php`**
   - `scopeThisWeek()` now uses `CompetitionWeekHelper`

3. **`app/Services/TransactionVerificationService.php`**
   - `validateTransactionDate()` now uses `CompetitionWeekHelper`

4. **`app/Http/Controllers/Admin/AdminDashboardController.php`**
   - Analytics period filter now uses `CompetitionWeekHelper`

## Testing Scenarios

### Scenario 1: Before Competition
- **Date**: October 30, 2025
- **Expected**: Rejection with message about competition not started

### Scenario 2: Week 1 Transactions
- **Dates**: Nov 1, 2, 3, 4, 5, 6, 7, 8, 9, 2025
- **Expected**: All accepted as Week 1 transactions

### Scenario 3: October 31 Transaction (Friday before Week 1)
- **Date**: October 31, 2025
- **Expected**: Rejected - not in Week 1

### Scenario 4: Week 2 Transactions
- **Dates**: Nov 10-16, 2025 (Monday to Sunday)
- **Expected**: All accepted as Week 2 transactions

### Scenario 5: Late Sunday Submission
- **Date**: Nov 9, 2025 at 23:59:59
- **Expected**: Accepted as Week 1

### Scenario 6: Early Monday Submission (Week 2)
- **Date**: Nov 10, 2025 at 00:00:00
- **Expected**: Accepted as Week 2

### Scenario 7: Last Day of Competition
- **Date**: Dec 28, 2025 at 23:59:59
- **Expected**: Accepted as last valid transaction

### Scenario 8: After Competition End
- **Date**: Dec 29, 2025 at 00:00:00
- **Expected**: Rejected - competition has ended

### Scenario 9: Receipt Dated After Competition
- **Receipt Date**: Dec 29, 2025 (submitted during competition)
- **Expected**: Rejected - receipt date is after competition end date

## Example Usage

```php
use App\Helpers\CompetitionWeekHelper;
use Carbon\Carbon;

// Get current week number
$weekNumber = CompetitionWeekHelper::getCurrentWeekNumber();
// Returns: 1 (if today is Nov 1-9), 2 (if Nov 10-16), etc.

// Get current week boundaries
$boundaries = CompetitionWeekHelper::getCurrentWeekBoundaries();
// Returns: ['start' => Carbon, 'end' => Carbon, 'week_number' => 1]

// Check if a date is in current week
$date = Carbon::parse('2025-11-01');
$isCurrentWeek = CompetitionWeekHelper::isInCurrentWeek($date);
// Returns: true (if we're in Week 1)

// Get formatted week range
$weekRange = CompetitionWeekHelper::getWeekRangeString();
// Returns: "Week 1: Nov 1 - Nov 9, 2025"

// Check if competition has ended
$hasEnded = CompetitionWeekHelper::hasCompetitionEnded();
// Returns: true (if after Dec 28, 2025 11:59 PM)

// Check if date is within competition period
$date = Carbon::parse('2025-12-29');
$isWithin = CompetitionWeekHelper::isWithinCompetitionPeriod($date);
// Returns: false (date is after competition end)

// Get competition end date string
$endDateString = CompetitionWeekHelper::getCompetitionEndDateString();
// Returns: "December 28, 2025 at 11:59 PM"
```

## Timezone
All date/time calculations are performed in **Asia/Kuala_Lumpur** timezone to ensure consistency across all users.

