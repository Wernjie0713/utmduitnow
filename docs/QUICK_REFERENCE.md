# Quick Reference Card

One-page cheat sheet for the UTM DuitNow platform.

---

## 🚀 Quick Start Commands

```bash
# Initial Setup
php artisan migrate                    # Create database tables
php artisan db:seed                    # Create roles, faculties, admin
php artisan storage:link               # Link storage for images
npm run build                          # Build frontend assets
php artisan serve                      # Start development server

# Clear Caches
php artisan optimize:clear             # Clear all caches
php artisan config:clear               # Clear config cache
php artisan route:clear                # Clear route cache
php artisan view:clear                 # Clear view cache

# Database
php artisan migrate:fresh --seed       # Fresh start (drops all tables!)
php artisan migrate:rollback           # Undo last migration
php artisan db:seed --class=FacultySeeder  # Run specific seeder

# Production
php artisan config:cache               # Cache config
php artisan route:cache                # Cache routes
php artisan view:cache                 # Cache views
```

---

## 👥 User Accounts

### Admin
- Email: `admin@utmduitnow.com`
- Password: `password`
- Role: Admin (everything access)

### Student (Register New)
- Requires: Name, Email, Matric No, Faculty, Year, Password
- Auto-assigned role: Student
- Can submit transactions and view leaderboard

---

## 🗂️ Important File Locations

### Backend
```
app/Services/                    # Business logic
├── AzureOcrService.php         # OCR extraction
├── OpenAiParserService.php     # AI parsing  
├── ImageTamperingDetectionService.php  # Fraud detection
├── TransactionVerificationService.php  # Main pipeline
└── LeaderboardService.php      # Rankings

app/Models/
├── User.php                    # With student fields
├── Faculty.php                 # Faculties
└── Transaction.php             # With leaderboard scopes

app/Http/Controllers/
├── TransactionController.php   # Submit & view
├── LeaderboardController.php   # Rankings
└── Admin/AdminDashboardController.php  # Analytics
```

### Frontend
```
resources/js/Pages/
├── Auth/Register.jsx           # Enhanced registration
├── Transactions/
│   ├── Submit.jsx             # Upload receipts
│   └── Index.jsx              # View history
├── Leaderboard/Index.jsx      # 3-tab leaderboard
└── Admin/Dashboard.jsx        # Admin analytics
```

### Configuration
```
.env                           # API keys, database credentials
config/services.php            # Azure & OpenAI config
config/app.php                 # Max submissions (line 135)
routes/web.php                 # All routes
```

---

## 🔗 Important Routes

| Route | URL | Access | Purpose |
|-------|-----|--------|---------|
| Register | `/register` | Guest | Student registration |
| Login | `/login` | Guest | Login page |
| Dashboard | `/dashboard` | Auth | Student dashboard |
| Submit | `/transactions/submit` | Student | Upload receipt |
| My Transactions | `/transactions/my` | Student | View history |
| Leaderboard | `/leaderboard` | Public | View rankings |
| Admin Dashboard | `/admin/dashboard` | Admin | Analytics |
| Export CSV | `/admin/export?period=weekly` | Admin | Download data |

---

## 🔧 Configuration

### Environment Variables

```env
# API Keys (Required for Production)
AZURE_VISION_ENDPOINT=https://xxx.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_key
OPENAI_API_KEY=sk-your_key

# Limits
MAX_SUBMISSIONS_PER_DAY=100

# Database
DB_CONNECTION=pgsql  # or mysql
DB_HOST=your_host
DB_DATABASE=utmduitnow
DB_USERNAME=your_user
DB_PASSWORD=your_password
```

### Key Config Values

- Max submissions: `config('app.max_submissions_per_day')` → 100
- Azure endpoint: `config('services.azure.vision_endpoint')`
- OpenAI key: `config('services.openai.api_key')`

---

## 📊 Database Schema (Quick View)

```
users                          faculties
├── matric_no (unique)        ├── full_name
├── faculty_id (FK) ─────────►├── short_name
├── year_of_study
└── duitnow_id

transactions
├── user_id (FK) ───────────► users
├── reference_id (unique)      ← Duplicate check
├── transaction_date           ← Date validation
├── amount
├── status (approved/rejected)
├── approved_at               ← Leaderboard timestamp
└── rejection_reason

daily_submission_limits
├── user_id (FK)
├── date
└── submission_count          ← 100/day limit
```

---

## 🤖 Verification Pipeline

```
Upload → OCR → Parse → Validate → Approve/Reject
         ↓      ↓       ↓          ↓
      Azure  OpenAI  Multiple   Update DB
                     Checks     & Notify
```

**Validation Checks (in order):**
1. Daily limit (< 100)
2. File is valid image
3. OCR extracts text
4. AI parses required fields
5. Image not tampered
6. Reference ID unique
7. Date within current period
8. Not friend-to-friend transfer

---

## 📈 Leaderboard Logic

```php
// Dynamic calculation (no stored counters)
Transaction::approved()
    ->thisWeek()  // or thisMonth() or all
    ->groupBy('user_id')
    ->select('user_id', 'COUNT(*) as count', 'MIN(approved_at) as first_at')
    ->orderByDesc('count')
    ->orderBy('first_at')  // Tie-breaker
    ->get();
```

**Periods:**
- Weekly: Monday 00:00 - Sunday 23:59
- Monthly: 1st - 31st (calendar month)
- All-Time: Since launch

**Tie-Breaking**: Same count → earlier `approved_at` wins

---

## 🛠️ Useful Tinker Commands

```bash
php artisan tinker
```

```php
// Check statistics
User::count();
Transaction::where('status', 'approved')->count();
Faculty::all();

// Test leaderboard
$service = app(App\Services\LeaderboardService::class);
$weekly = $service->getWeeklyLeaderboard();
$weekly->take(5);

// Check user submissions today
$user = User::first();
$user->getTodaySubmissionCount();
$user->canSubmitToday();

// Manually approve/reject
$transaction = Transaction::find(1);
$transaction->status = 'approved';
$transaction->approved_at = now();
$transaction->save();

// Reset daily limit (for testing)
DB::table('daily_submission_limits')
    ->where('user_id', 1)
    ->update(['submission_count' => 0]);
```

---

## 🐛 Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| "Base table not found" | `php artisan migrate` |
| "Class not found" | `composer dump-autoload` |
| Config not updating | `php artisan config:clear` |
| Routes not working | `php artisan route:clear` |
| Images not loading | `php artisan storage:link` |
| Permission denied | `chmod -R 775 storage` |
| Validation errors | Check `.env` has all required values |

---

## 📱 API Endpoints (For JS Fetch)

```javascript
// Get weekly leaderboard
fetch('/leaderboard/weekly')
    .then(r => r.json())
    .then(data => console.log(data));

// Get monthly leaderboard
fetch('/leaderboard/monthly?month=10&year=2025')
    .then(r => r.json())
    .then(data => console.log(data));

// Get all-time leaderboard
fetch('/leaderboard/all-time')
    .then(r => r.json())
    .then(data => console.log(data));
```

---

## 📦 Package Info

### Required PHP Packages
- `laravel/framework: ^11.0`
- `inertiajs/inertia-laravel`
- `silber/bouncer` (roles & permissions)
- Built-in: `guzzlehttp/guzzle` (HTTP client for APIs)

### Required NPM Packages
- `react`
- `@inertiajs/react`
- `@radix-ui/*` (UI components)
- `tailwindcss`
- `lucide-react` (icons)

---

## 🔐 Security Notes

**Never commit:**
- `.env` file
- `storage/` contents
- `vendor/` directory
- API keys in code

**Always:**
- Use environment variables
- Hash passwords with `bcrypt`
- Validate all inputs
- Use CSRF protection (auto-enabled)
- Enable HTTPS in production

---

## 📞 Support Resources

### Documentation
1. `README.md` - Start here
2. `docs/GETTING_STARTED.md` - Quick setup
3. `docs/DATABASE_SETUP.md` - DB issues
4. `docs/API_SETUP_GUIDE.md` - API setup
5. `docs/TESTING_GUIDE.md` - How to test
6. `docs/DEPLOYMENT_GUIDE.md` - Go to production

### Code Structure
- **Models**: Data & relationships
- **Services**: Business logic (OCR, verification, rankings)
- **Controllers**: Handle HTTP requests
- **Pages**: React components (UI)

### Laravel Docs
- Eloquent: https://laravel.com/docs/eloquent
- Validation: https://laravel.com/docs/validation
- Routing: https://laravel.com/docs/routing

---

## 💡 Pro Tips

1. **Development**: Always use mock mode (free, fast testing)
2. **Caching**: Clear caches when config changes
3. **Debugging**: Check `storage/logs/laravel.log` first
4. **Testing**: Use `php artisan tinker` for quick queries
5. **Performance**: Use `php artisan telescope:install` for profiling

---

## 🎯 Success Metrics

Track these:
- Daily active users
- Submission rate (avg per student)
- Auto-approval rate (should be > 90%)
- Leaderboard accuracy (verify manually)
- API costs (should stay < $30/month)

---

## 🏁 You're All Set!

Everything you need is implemented and documented. Just:

1. Connect database
2. Run migrations
3. Run seeders
4. Test
5. Launch! 🚀

**Questions?** Check the docs folder - everything is explained in detail.

