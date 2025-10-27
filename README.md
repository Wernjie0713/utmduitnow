# UTM DuitNow Transaction Tracking & Leaderboard Platform

A fully automated, web-based platform for students to track DuitNow transaction counts and compete on leaderboards. The system features sophisticated OCR-based verification, fraud detection, and dynamic leaderboards.

## Features

- **Automated Transaction Verification**: Uses Azure Computer Vision OCR and OpenAI GPT-3.5 to automatically verify receipt screenshots
- **Fraud Detection**: Duplicate detection, image tampering detection, and date validation
- **Three Leaderboards**: Weekly, Monthly, and All-Time rankings
- **Student Registration**: Comprehensive registration with academic details
- **Admin Dashboard**: Analytics, reports, and CSV export capabilities
- **Daily Limits**: 100 submissions per user per day

## Tech Stack

- **Backend**: Laravel 11
- **Frontend**: React + Inertia.js
- **Database**: PostgreSQL (Supabase)
- **UI Components**: shadcn/ui + Animate UI
- **OCR**: Azure Computer Vision API
- **AI Parser**: OpenAI GPT-3.5
- **Styling**: Tailwind CSS

## Requirements

- PHP >= 8.2
- Composer
- Node.js >= 18
- PostgreSQL (or configured Supabase instance)
- Azure Computer Vision API account
- OpenAI API account

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd utmduitnow
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

### 5. Configure Environment Variables

Edit `.env` and set the following:

#### Database Configuration
```env
DB_CONNECTION=pgsql
DB_HOST=your_database_host
DB_PORT=5432
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

#### Azure Computer Vision API
```env
AZURE_VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_azure_vision_key
```

**How to get Azure credentials:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a Computer Vision resource
3. Copy the endpoint URL and key from the resource

#### OpenAI API
```env
OPENAI_API_KEY=sk-your_openai_api_key
```

**How to get OpenAI API key:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key from your account settings

#### Application Settings
```env
APP_NAME="UTM DuitNow Leaderboard"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost
MAX_SUBMISSIONS_PER_DAY=100
```

### 6. Generate Application Key

```bash
php artisan key:generate
```

### 7. Run Migrations

```bash
php artisan migrate
```

### 8. Run Seeders

```bash
php artisan db:seed
```

This will create:
- Admin and Student roles
- 12 UTM faculties
- Admin user account

### 9. Create Storage Link

```bash
php artisan storage:link
```

### 10. Build Frontend Assets

```bash
npm run dev
```

For production:
```bash
npm run build
```

### 11. Start the Development Server

```bash
php artisan serve
```

Visit: `http://localhost:8000`

## Default Admin Credentials

- **Email**: admin@utmduitnow.com
- **Password**: password

⚠️ **IMPORTANT**: Change these credentials in production!

## API Costs (Estimated)

Based on 200 students with 50 submissions each per month (10,000 total):

| Service | Free Tier | Cost After Free Tier | Estimated Monthly Cost |
|---------|-----------|---------------------|----------------------|
| Azure Computer Vision | 5,000 requests/month | $1.00/1,000 requests | $5.00 |
| OpenAI GPT-3.5 | None | $0.002/request | $20.00 |
| **Total** | | | **~$25/month** |

## Usage

### For Students

1. **Register** with your UTM details (Matric No, Faculty, Year of Study, DuitNow ID)
2. **Submit Transactions** by uploading clear receipt screenshots
3. **View Your Submissions** in the "My Transactions" page
4. **Check Leaderboard** to see your ranking

### For Administrators

1. **Login** with admin credentials
2. **View Dashboard** for system statistics and analytics
3. **Filter Data** by faculty and year of study
4. **Export Reports** as CSV for analysis

## Project Structure

```
app/
├── Http/Controllers/
│   ├── Auth/RegisteredUserController.php (Enhanced with student fields)
│   ├── TransactionController.php (Receipt submission)
│   ├── LeaderboardController.php (Leaderboard display)
│   └── Admin/AdminDashboardController.php (Admin panel)
├── Models/
│   ├── User.php (Student with faculty relationship)
│   ├── Faculty.php
│   └── Transaction.php (With leaderboard scopes)
└── Services/
    ├── AzureOcrService.php (OCR extraction)
    ├── OpenAiParserService.php (AI-powered parsing)
    ├── ImageTamperingDetectionService.php (Fraud detection)
    ├── TransactionVerificationService.php (Orchestrator)
    └── LeaderboardService.php (Rankings calculation)

resources/js/Pages/
├── Auth/Register.jsx (Student registration)
├── Transactions/
│   ├── Submit.jsx (Receipt upload)
│   └── Index.jsx (Transaction history)
├── Leaderboard/Index.jsx (Three-tab leaderboard)
└── Admin/Dashboard.jsx (Admin analytics)
```

## How It Works

### Transaction Verification Flow

1. **Upload**: Student uploads receipt screenshot
2. **OCR**: Azure Computer Vision extracts text from image
3. **Parse**: OpenAI GPT-3.5 structures the data (Reference ID, Date, Time, Amount)
4. **Validate**: System checks for:
   - Duplicate Reference ID
   - Image tampering (EXIF analysis, hash comparison)
   - Transaction date within acceptable range (current week/month)
   - Transaction type (rejects friend-to-friend transfers)
5. **Decision**: Auto-approve or reject with specific reason
6. **Leaderboard**: Approved transactions update rankings in real-time

### Leaderboard Calculation

- **Weekly**: Monday 00:00:00 - Sunday 23:59:59
- **Monthly**: Calendar month (Oct, Nov, Dec 2025)
- **All-Time**: Since launch
- **Tie-Breaker**: When counts are equal, earlier approval timestamp ranks higher

## Testing Without API Keys

The system includes mock OCR and parsing for development:
- If Azure/OpenAI keys are not configured, mock data will be used
- Mock OCR generates random reference IDs and timestamps
- All validation logic still functions normally

## Troubleshooting

### Images Not Displaying
Ensure storage link is created:
```bash
php artisan storage:link
```

### Database Errors
Check PostgreSQL connection and run migrations:
```bash
php artisan migrate:fresh --seed
```

### Role Assignment Errors
Ensure Bouncer tables exist:
```bash
php artisan migrate
```

### API Errors
Check that API keys are correctly set in `.env` and config cached:
```bash
php artisan config:clear
php artisan config:cache
```

## Phase 2: Entrepreneur Leaderboard

Phase 2 (Entrepreneur Leaderboard with ML-generated demo data) documentation available in:
`docs/PHASE2_ENTREPRENEUR_LEADERBOARD.md`

## Contributing

This is a student project for UTM. For questions or issues, contact the development team.

## License

This project is proprietary and confidential. Not for redistribution.
