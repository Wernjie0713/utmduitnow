# Manual Testing Guide

This guide provides a comprehensive checklist for testing all Phase 1 features.

---

## Prerequisites

Before testing, ensure:
- ✅ Database is connected and migrations ran successfully
- ✅ Seeders executed (roles, faculties, admin user created)
- ✅ Frontend assets built (`npm run dev` or `npm run build`)
- ✅ Application running (`php artisan serve`)
- ✅ Storage link created (`php artisan storage:link`)

---

## Test 1: Student Registration ✅

### Test Case 1.1: Successful Registration

1. Navigate to `/register`
2. Fill in all fields:
   - **Name**: John Doe
   - **Email**: john@student.utm.my
   - **Matric Number**: A21EC0001
   - **Faculty**: Select "Faculty of Computing"
   - **Year of Study**: Select "Year 3"
   - **DuitNow ID**: 0123456789 (optional)
   - **Password**: password123
   - **Confirm Password**: password123
3. Click **"Register"**

**Expected Result:**
- ✅ User created successfully
- ✅ Redirected to dashboard
- ✅ Student role assigned automatically
- ✅ Can see user name in header

### Test Case 1.2: Validation Errors

Try registering with:
- Duplicate matric number → Should show error
- Invalid email format → Should show error
- Password mismatch → Should show error
- Missing required fields → Should show errors

**Expected Result:**
- ✅ Appropriate error messages displayed
- ✅ Form data retained (don't have to re-enter everything)

---

## Test 2: Admin Login ✅

### Test Case 2.1: Admin Authentication

1. Logout if logged in
2. Navigate to `/login`
3. Enter credentials:
   - **Email**: admin@utmduitnow.com
   - **Password**: password
4. Click **"Log in"**

**Expected Result:**
- ✅ Admin logged in successfully
- ✅ Can access admin dashboard
- ✅ Has different UI/permissions than student

---

## Test 3: Transaction Submission ✅

### Test Case 3.1: First Submission (Success)

1. Login as a student
2. Navigate to `/transactions/submit`
3. Check the submission counter shows **"0/100"**
4. Upload a receipt image (any image for testing)
5. Click **"Submit Transaction"**

**Expected Result:**
- ✅ Processing indicator shows
- ✅ Success message: "Transaction approved!"
- ✅ Counter updates to "1/100"
- ✅ Can view transaction in "My Transactions"

### Test Case 3.2: Duplicate Rejection

1. Submit the **same receipt** again
2. Click "Submit Transaction"

**Expected Result:**
- ✅ Transaction rejected
- ✅ Error message: "Duplicate transaction detected" or "This exact image has already been submitted"
- ✅ Counter still increments (2/100) - even rejected submissions count

### Test Case 3.3: Daily Limit

To test the 100/day limit (don't actually do 100 submissions):

**Option A: Temporarily Lower Limit**
1. Edit `.env`: `MAX_SUBMISSIONS_PER_DAY=2`
2. Run: `php artisan config:clear`
3. Submit 2 transactions
4. Try to submit a 3rd

**Expected Result:**
- ✅ 3rd submission blocked
- ✅ Error message: "Daily submission limit reached"
- ✅ Submit button disabled
- ✅ Counter shows "2/2"

**Option B: Manually Update Database**
```sql
UPDATE daily_submission_limits 
SET submission_count = 100 
WHERE user_id = [your_user_id] 
AND date = CURRENT_DATE;
```

### Test Case 3.4: Image Validation

Try uploading:
- **Very small image** (< 200x200 pixels) → Should be rejected
- **Non-image file** (.txt, .pdf) → Should show validation error
- **Very large image** (> 5MB) → Should show validation error

---

## Test 4: OCR & Parsing 🤖

### With Mock Data (No API Keys)

1. Submit any image
2. Check database: `Transaction::latest()->first()`
3. Check the `ocr_raw_text` and `parsed_data` columns

**Expected Result:**
- ✅ `ocr_raw_text` contains mock receipt text
- ✅ `parsed_data` is valid JSON with:
  - reference_id (e.g., "DN1234567890")
  - date (Y-m-d format)
  - time (H:i:s format)
  - amount (decimal)
  - transaction_type ("Payment")

### With Real API Keys

1. Configure Azure and OpenAI keys
2. Upload a **real DuitNow receipt screenshot**
3. Submit

**Expected Result:**
- ✅ Real OCR text extracted from image
- ✅ Correct reference ID identified
- ✅ Correct date and time extracted
- ✅ Correct amount parsed
- ✅ Transaction type identified

---

## Test 5: Fraud Detection 🛡️

### Test Case 5.1: Duplicate Reference ID

1. Manually create a transaction:
```php
Transaction::create([
    'user_id' => 1,
    'reference_id' => 'TEST123456',
    'transaction_date' => now(),
    'transaction_time' => now(),
    'amount' => 50.00,
    'receipt_image_path' => 'test.jpg',
    'status' => 'approved',
    'approved_at' => now(),
]);
```

2. Submit a receipt that will generate reference ID "TEST123456"

**Expected Result:**
- ✅ Rejected due to duplicate
- ✅ Reason: "Duplicate transaction detected"

### Test Case 5.2: Image Tampering Detection

Test with an image edited in Photoshop (if EXIF data preserved):

**Expected Result:**
- ✅ Rejected with reason: "Image shows signs of editing"

### Test Case 5.3: Date Validation

Submit a receipt with transaction date from:
- **Last week** (if this week) → Should be rejected
- **Last month** (if this month) → Should be rejected
- **Future date** → Should be rejected
- **Current week** → Should be approved

---

## Test 6: Leaderboards 🏆

### Test Case 6.1: Weekly Leaderboard

1. Create test transactions for 3 different users this week
2. Navigate to `/leaderboard`
3. Check **Weekly** tab

**Expected Result:**
- ✅ Shows all 3 users
- ✅ Sorted by transaction count (DESC)
- ✅ Rank 1, 2, 3 highlighted with icons
- ✅ Faculty and year displayed correctly

### Test Case 6.2: Tie-Breaking

1. Create 2 users with **same transaction count**
2. User A's first transaction: 10:00 AM
3. User B's first transaction: 11:00 AM

**Expected Result:**
- ✅ User A ranks higher (earlier timestamp)
- ✅ Both show same rank number

### Test Case 6.3: Monthly Leaderboard

1. Switch to **Monthly** tab
2. Check current month displayed
3. If available, select different month from dropdown

**Expected Result:**
- ✅ Shows current month data by default
- ✅ Can switch between available months
- ✅ Data updates when month changes

### Test Case 6.4: All-Time Leaderboard

1. Switch to **All-Time** tab

**Expected Result:**
- ✅ Shows all approved transactions
- ✅ Cumulative counts since beginning

### Test Case 6.5: Public Access

1. Logout
2. Navigate to `/leaderboard`

**Expected Result:**
- ✅ Can view leaderboard without login
- ✅ Layout adjusts for guest users

---

## Test 7: My Transactions Page 📋

### Test Case 7.1: View Submission History

1. Login as student with multiple submissions
2. Navigate to `/transactions/my`

**Expected Result:**
- ✅ Table shows all transactions
- ✅ Receipt thumbnails display
- ✅ Status badges show correct colors:
  - Green badge for "Approved"
  - Red badge for "Rejected"
  - Yellow badge for "Pending"
- ✅ Reference IDs displayed in monospace font
- ✅ Dates and times formatted correctly
- ✅ Amounts shown with RM prefix

### Test Case 7.2: Pagination

1. If you have > 20 transactions, check pagination

**Expected Result:**
- ✅ Only 20 transactions per page
- ✅ Pagination links at bottom
- ✅ Can navigate between pages

### Test Case 7.3: Rejection Reasons

1. Submit a transaction that will be rejected
2. Go to "My Transactions"
3. Find the rejected transaction

**Expected Result:**
- ✅ Red "Rejected" badge displayed
- ✅ Rejection reason shown clearly
- ✅ Can still see receipt image

---

## Test 8: Admin Dashboard 👨‍💼

### Test Case 8.1: Statistics Display

1. Login as admin
2. Navigate to `/admin/dashboard`

**Expected Result:**
- ✅ Statistics cards show:
  - Total Students count
  - Approved Transactions count
  - Rejected Transactions count
  - Total Amount (sum)
- ✅ Numbers are accurate

### Test Case 8.2: Weekly/Monthly Winners

**Expected Result:**
- ✅ Top 3 weekly winners displayed with ranks
- ✅ Top 3 monthly winners displayed
- ✅ Names, matric numbers, and counts shown
- ✅ If no data, shows "No data for this week/month"

### Test Case 8.3: Faculty Filter

1. Select a specific faculty from dropdown
2. Click "Apply Filters"

**Expected Result:**
- ✅ User table filters to show only students from that faculty
- ✅ URL updates with query parameter
- ✅ Statistics update (if implemented)

### Test Case 8.4: Year Filter

1. Select a specific year (e.g., "Year 3")
2. Click "Apply Filters"

**Expected Result:**
- ✅ User table filters to show only Year 3 students
- ✅ Can combine with faculty filter

### Test Case 8.5: CSV Export

1. Click "Weekly" export button
2. Click "Monthly" export button
3. Click "All-Time" export button

**Expected Result:**
- ✅ CSV file downloads automatically
- ✅ Filename includes period and timestamp
- ✅ CSV contains:
  - Rank, Matric No, Name, Faculty, Year, Transaction Count, First Transaction
- ✅ Data is accurate and complete
- ✅ Can open in Excel/Google Sheets

---

## Test 9: Edge Cases & Error Handling 🚨

### Test Case 9.1: Simultaneous Submissions

Have 2 users submit the **same receipt** at the same time.

**Expected Result:**
- ✅ First submission approved
- ✅ Second submission rejected (duplicate reference_id)

### Test Case 9.2: Invalid Image Upload

Upload:
- Corrupted image file
- Empty file
- Non-image file with .jpg extension

**Expected Result:**
- ✅ Appropriate error message
- ✅ No database record created
- ✅ Submission count not incremented

### Test Case 9.3: API Failure Handling

Temporarily set incorrect API keys:
```env
AZURE_VISION_KEY=invalid_key
```

Submit a receipt.

**Expected Result:**
- ✅ Falls back to mock OCR
- ✅ Warning logged but system continues
- ✅ Transaction still processed
- ✅ User doesn't see error

### Test Case 9.4: Large Volume Test

Submit 10 transactions in quick succession.

**Expected Result:**
- ✅ All processed successfully
- ✅ Daily counter accurate
- ✅ No performance issues
- ✅ Leaderboard updates correctly

---

## Test 10: Security & Permissions 🔒

### Test Case 10.1: Student Can't Access Admin

1. Login as student
2. Try to navigate to `/admin/dashboard`

**Expected Result:**
- ✅ Access denied (403 or redirect)
- ✅ Student can't see admin routes

### Test Case 10.2: Guest Can't Submit

1. Logout
2. Try to navigate to `/transactions/submit`

**Expected Result:**
- ✅ Redirected to login page
- ✅ Can't submit without authentication

### Test Case 10.3: Student Can Only View Own Transactions

1. Login as Student A (ID: 1)
2. Try to access `/transactions/[student_b_transaction_id]`

**Expected Result:**
- ✅ 404 or 403 error
- ✅ Can only see own transactions

---

## Performance Testing 📊

### Test Case: Leaderboard Performance

1. Create 50+ test users with transactions
2. Navigate to `/leaderboard`
3. Check page load time

**Expected Result:**
- ✅ Page loads in < 2 seconds
- ✅ No N+1 query issues
- ✅ Smooth tab switching

**Debug Performance:**
```bash
php artisan debugbar:publish  # If using debugbar
```

Check the queries tab for:
- Number of queries (should be < 10 per page)
- Query time (should be < 100ms total)

---

## Database Verification

After testing, verify data integrity:

```bash
php artisan tinker
```

### Check Transaction Counts
```php
// Total transactions
Transaction::count();

// By status
Transaction::where('status', 'approved')->count();
Transaction::where('status', 'rejected')->count();

// Check for duplicate reference IDs (should be 0)
Transaction::select('reference_id')
    ->groupBy('reference_id')
    ->havingRaw('COUNT(*) > 1')
    ->count();
```

### Check Daily Limits
```php
// Today's submissions per user
DB::table('daily_submission_limits')
    ->where('date', now()->toDateString())
    ->get();
```

### Check Leaderboard Accuracy
```php
$service = app(App\Services\LeaderboardService::class);

// Weekly
$weekly = $service->getWeeklyLeaderboard();
$weekly->each(function($entry) {
    echo "Rank {$entry->rank}: {$entry->user->name} - {$entry->transaction_count} transactions\n";
});

// Verify tie-breaking
$weekly->where('transaction_count', $weekly->first()->transaction_count)->each(function($entry) {
    echo "{$entry->user->name}: First transaction at {$entry->first_transaction_at}\n";
});
```

---

## Automated Test Creation (Future)

Consider creating PHPUnit tests for:

### Feature Tests

```php
// tests/Feature/TransactionSubmissionTest.php
public function test_student_can_submit_transaction()
{
    $user = User::factory()->create();
    $this->actingAs($user);
    
    $response = $this->post('/transactions', [
        'receipt_image' => UploadedFile::fake()->image('receipt.jpg')
    ]);
    
    $response->assertRedirect();
    $this->assertDatabaseHas('transactions', [
        'user_id' => $user->id,
        'status' => 'approved',
    ]);
}

public function test_daily_limit_enforced()
{
    $user = User::factory()->create();
    
    // Simulate 100 submissions today
    DB::table('daily_submission_limits')->insert([
        'user_id' => $user->id,
        'date' => now()->toDateString(),
        'submission_count' => 100,
    ]);
    
    $this->actingAs($user);
    
    $response = $this->post('/transactions', [
        'receipt_image' => UploadedFile::fake()->image('receipt.jpg')
    ]);
    
    $response->assertSessionHasErrors();
    $transaction = Transaction::latest()->first();
    $this->assertEquals('rejected', $transaction->status);
}
```

### Unit Tests

```php
// tests/Unit/LeaderboardServiceTest.php
public function test_tie_breaking_works()
{
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    // Both have 5 transactions
    Transaction::factory()->count(5)->create([
        'user_id' => $user1->id,
        'approved_at' => now()->subHours(2),
        'status' => 'approved',
    ]);
    
    Transaction::factory()->count(5)->create([
        'user_id' => $user2->id,
        'approved_at' => now()->subHour(),
        'status' => 'approved',
    ]);
    
    $leaderboard = app(LeaderboardService::class)->getWeeklyLeaderboard();
    
    // User1 should rank higher (earlier timestamp)
    $this->assertEquals($user1->id, $leaderboard->first()->user_id);
}
```

---

## Testing Checklist Summary

### 📝 Registration & Auth
- [ ] Student registration with all fields
- [ ] Validation errors display correctly
- [ ] Admin login works
- [ ] Student role assigned automatically
- [ ] Faculty dropdown populated

### 📤 Transaction Submission
- [ ] File upload works
- [ ] Daily counter displays (X/100)
- [ ] Image preview shows
- [ ] Submission processes successfully
- [ ] Success/error messages display
- [ ] Daily limit enforced (100/day)
- [ ] Cannot submit when limit reached

### 🤖 Verification System
- [ ] OCR extraction works (mock or real)
- [ ] AI parsing works (mock or real)
- [ ] Duplicate reference ID detected
- [ ] Image tampering checks run
- [ ] Date validation works
- [ ] Auto-approval/rejection works
- [ ] Rejection reasons are specific and helpful

### 📊 Leaderboards
- [ ] Weekly leaderboard calculates correctly
- [ ] Monthly leaderboard calculates correctly
- [ ] All-time leaderboard calculates correctly
- [ ] Tie-breaking works (timestamp-based)
- [ ] Top 3 highlighted with special icons
- [ ] Faculty and year display correctly
- [ ] Public access works (no login required)
- [ ] Tab switching is smooth

### 📜 Transaction History
- [ ] "My Transactions" page displays all submissions
- [ ] Receipt thumbnails load
- [ ] Status badges show correct colors
- [ ] Rejection reasons visible for rejected transactions
- [ ] Pagination works (if > 20 transactions)

### 👨‍💼 Admin Dashboard
- [ ] Statistics cards display accurate data
- [ ] Weekly top 3 displayed
- [ ] Monthly top 3 displayed
- [ ] Faculty filter works
- [ ] Year filter works
- [ ] Combined filters work
- [ ] User table displays with pagination
- [ ] CSV export works for all periods
- [ ] Downloaded CSV is properly formatted

### 🔒 Security
- [ ] Students can't access admin routes
- [ ] Guests can't submit transactions
- [ ] Students can only view own transactions
- [ ] SQL injection protected (Eloquent ORM)
- [ ] XSS protected (Inertia auto-escaping)
- [ ] CSRF protection enabled

### ⚡ Performance
- [ ] Page load times < 2 seconds
- [ ] No N+1 query issues
- [ ] Images load efficiently
- [ ] Leaderboard queries optimized

---

## Reporting Issues

If you find bugs during testing, check:

1. **Laravel Logs**: `storage/logs/laravel.log`
2. **Browser Console**: For JavaScript errors
3. **Network Tab**: For failed API calls
4. **Database**: Verify data was saved correctly

Common log locations:
- OCR errors: Search for "Azure OCR"
- Parsing errors: Search for "OpenAI parsing"
- Tampering detection: Search for "Image tampering"

---

## Production Testing Checklist

Before deploying to production:

- [ ] Test with 50+ real receipt screenshots
- [ ] Verify OCR accuracy rate (should be > 90%)
- [ ] Test concurrent submissions (10+ users at once)
- [ ] Verify no memory leaks (monitor `php artisan serve`)
- [ ] Test file storage limits (ensure enough disk space)
- [ ] Verify backup systems working
- [ ] Test recovery from API failures
- [ ] Load test leaderboard with 200+ users
- [ ] Test CSV export with large datasets (1000+ records)
- [ ] Verify email notifications (if implemented)

---

## Success Criteria ✅

Phase 1 is considered successful when:

1. ✅ Students can register and login
2. ✅ Students can submit receipts (100/day limit)
3. ✅ Verification system auto-approves/rejects correctly
4. ✅ Duplicate detection works 100% of the time
5. ✅ Leaderboards calculate accurately with tie-breaking
6. ✅ Admin can view analytics and export data
7. ✅ System handles 200+ concurrent users
8. ✅ OCR accuracy > 85% (with real APIs)
9. ✅ No critical bugs in production
10. ✅ User satisfaction with UI/UX

---

## Post-Launch Monitoring

After launch, monitor:

- **Daily submission rates** (to predict API costs)
- **Rejection rates** (to improve OCR/validation)
- **Error logs** (to catch issues early)
- **Leaderboard accuracy** (verify no calculation bugs)
- **User feedback** (improve UX based on complaints)

**Recommended Tools:**
- Laravel Telescope (development debugging)
- Sentry or Bugsnag (production error tracking)
- Google Analytics (user behavior)

