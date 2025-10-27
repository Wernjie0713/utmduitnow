# Phase 2: Entrepreneur Leaderboard (Demo System)

## Overview

Phase 2 builds a demonstration entrepreneur leaderboard system that showcases student-run business units competing separately from individual students. This is a **demo-only system** that uses machine learning to generate realistic synthetic transaction data based on patterns learned from the real Personal Leaderboard (Phase 1) data.

## Key Differences from Phase 1

| Aspect | Personal Leaderboard (Phase 1) | Entrepreneur Leaderboard (Phase 2) |
|--------|-------------------------------|-----------------------------------|
| **Purpose** | Real competition tracking | Demonstration/showcase only |
| **Data Source** | Real student submissions | ML-generated synthetic data |
| **Participants** | Individual students | Student business units/teams |
| **Verification** | Full OCR + fraud detection | No verification needed |
| **Transaction Proofs** | Required receipt uploads | Auto-generated (no uploads) |

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│           Phase 1: Personal Leaderboard             │
│              (Real Transaction Data)                │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Training Data
                   ▼
┌─────────────────────────────────────────────────────┐
│      ML Model: Synthetic Data Generator             │
│   (Learns patterns from real transactions)          │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Generated Transactions
                   ▼
┌─────────────────────────────────────────────────────┐
│        Phase 2: Entrepreneur Leaderboard            │
│            (Demo Business Units)                     │
└─────────────────────────────────────────────────────┘
```

## Machine Learning Model

### Model Purpose: Synthetic Transaction Generator

**Goal**: Generate realistic transaction patterns for demo business units that mimic real student transaction behavior.

**Input Features** (from Phase 1 data):
- Transaction frequency patterns (daily, weekly, monthly)
- Transaction amount distributions
- Time-of-day patterns
- Day-of-week patterns
- Faculty-specific transaction behaviors
- Seasonal trends (if data available)

**Output**: Synthetic transaction records for entrepreneur units containing:
- Reference ID (auto-generated, unique)
- Transaction Date/Time
- Transaction Amount
- Associated Business Unit

### Model Architecture Options

1. **Time Series Forecasting Model (LSTM/GRU)**
   - Learn temporal patterns from real transactions
   - Generate time-series of transactions for each business unit
   - Maintains realistic timing and frequency

2. **Generative Adversarial Network (GAN)**
   - Generator creates fake transactions
   - Discriminator validates they look realistic
   - Produces highly realistic synthetic data

3. **Statistical Simulation (Simpler Approach)**
   - Analyze distributions from Phase 1 data
   - Use statistical sampling to generate transactions
   - Less ML-heavy, easier to implement

**Recommendation**: Start with Option 3 (Statistical Simulation) for MVP, upgrade to Option 1/2 if more sophistication needed.

## Database Schema

### New Tables

#### 1. `entrepreneur_units` Table

```php
Schema::create('entrepreneur_units', function (Blueprint $table) {
    $table->id();
    $table->string('business_name');
    $table->enum('business_location', ['online', 'physical']);
    $table->unsignedBigInteger('manager_id'); // primary student manager
    $table->timestamps();
    
    $table->foreign('manager_id')->references('id')->on('users');
});
```

#### 2. `entrepreneur_team_members` Table

```php
Schema::create('entrepreneur_team_members', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('entrepreneur_unit_id');
    $table->unsignedBigInteger('user_id');
    $table->timestamps();
    
    $table->foreign('entrepreneur_unit_id')->references('id')->on('entrepreneur_units');
    $table->foreign('user_id')->references('id')->on('users');
    $table->unique(['entrepreneur_unit_id', 'user_id']);
});
```

#### 3. `entrepreneur_duitnow_ids` Table

```php
Schema::create('entrepreneur_duitnow_ids', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('entrepreneur_unit_id');
    $table->string('duitnow_id');
    $table->timestamps();
    
    $table->foreign('entrepreneur_unit_id')->references('id')->on('entrepreneur_units');
});
```

#### 4. `entrepreneur_transactions` Table (Demo Data)

```php
Schema::create('entrepreneur_transactions', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('entrepreneur_unit_id');
    $table->string('reference_id')->unique();
    $table->date('transaction_date');
    $table->time('transaction_time');
    $table->decimal('amount', 10, 2);
    $table->timestamp('generated_at'); // when ML generated this
    $table->timestamps();
    
    $table->foreign('entrepreneur_unit_id')->references('id')->on('entrepreneur_units');
    $table->index(['entrepreneur_unit_id', 'transaction_date']);
    $table->index('generated_at');
});
```

## Implementation Steps

### 1. Entrepreneur Unit Registration

**Registration Flow**:
1. Student creates entrepreneur account (separate from personal)
2. Provides business details:
   - Business Name
   - Business Location (Online/Physical)
3. Adds team members (Name, Matric No, Faculty, Year for each)
4. Designates one member as primary manager
5. Adds one or more DuitNow IDs for the business

**Controller**: `EntrepreneurUnitController@register`

**UI Page**: `resources/js/Pages/Entrepreneur/Register.jsx`

### 2. Entrepreneur Unit Profile Management

Manager can:
- Edit business name and location
- Add/remove team members
- Add/remove DuitNow IDs

**Controller**: `EntrepreneurUnitController@update`

**UI Page**: `resources/js/Pages/Entrepreneur/Profile.jsx`

### 3. ML Data Generation Service

**Service**: `app/Services/SyntheticDataGeneratorService.php`

**Methods**:

```php
class SyntheticDataGeneratorService
{
    /**
     * Analyze Phase 1 transaction patterns
     */
    public function analyzeRealTransactions()
    {
        // Calculate distributions from real data:
        // - Average transactions per day/week/month
        // - Amount distribution (mean, std dev, min, max)
        // - Time-of-day distribution
        // - Day-of-week patterns
        
        return [
            'daily_avg' => 5.2,
            'amount_mean' => 25.50,
            'amount_std' => 15.30,
            'time_distribution' => [...],
            'day_distribution' => [...],
        ];
    }
    
    /**
     * Generate synthetic transactions for an entrepreneur unit
     */
    public function generateTransactionsForUnit($entrepreneurUnitId, $startDate, $endDate)
    {
        $patterns = $this->analyzeRealTransactions();
        
        // Generate realistic transactions:
        // 1. Determine number of transactions (sample from distribution)
        // 2. Generate dates (weighted by day-of-week patterns)
        // 3. Generate times (weighted by time-of-day patterns)
        // 4. Generate amounts (sample from normal distribution)
        // 5. Generate unique reference IDs
        
        $transactions = [];
        // ... generation logic ...
        
        // Bulk insert into entrepreneur_transactions table
        EntrepreneurTransaction::insert($transactions);
    }
    
    /**
     * Refresh demo data (regenerate for current period)
     */
    public function refreshDemoData()
    {
        // Clear old demo transactions
        // Generate new ones for all entrepreneur units
    }
}
```

### 4. Entrepreneur Leaderboard Service

**Service**: `app/Services/EntrepreneurLeaderboardService.php`

Similar to Phase 1 LeaderboardService, but queries `entrepreneur_transactions` table:

```php
class EntrepreneurLeaderboardService
{
    public function getWeeklyLeaderboard()
    {
        return EntrepreneurTransaction::whereBetween('transaction_date', [
                $weekStart, $weekEnd
            ])
            ->select('entrepreneur_unit_id', DB::raw('COUNT(*) as count'))
            ->groupBy('entrepreneur_unit_id')
            ->orderByDesc('count')
            ->orderBy('generated_at', 'asc') // tie-breaker
            ->with('entrepreneurUnit')
            ->get();
    }
    
    // Similar methods for monthly and all-time
}
```

### 5. Controllers

#### `EntrepreneurUnitController`
- `register()`: Unit registration form
- `store()`: Create new entrepreneur unit with team members
- `edit()`: Edit unit profile
- `update()`: Update unit details
- `manageDuitnowIds()`: Add/remove DuitNow IDs
- `manageTeam()`: Add/remove team members

#### `EntrepreneurLeaderboardController`
- `index()`: Show entrepreneur leaderboards (Weekly, Monthly, All-Time)
- `weekly()`: Weekly leaderboard data
- `monthly()`: Monthly leaderboard data
- `allTime()`: All-time leaderboard data

#### `Admin/EntrepreneurDataController`
- `regenerateData()`: Manually trigger ML data generation
- `viewUnits()`: View all entrepreneur units
- `analytics()`: View synthetic data quality metrics

### 6. Frontend Pages

#### Entrepreneur Registration Page
**File**: `resources/js/Pages/Entrepreneur/Register.jsx`

Form sections:
1. Business Information
   - Business Name
   - Location (Online/Physical)
2. Team Members (dynamic form - add multiple)
   - Name, Matric No, Faculty, Year
   - Designate primary manager
3. DuitNow IDs (dynamic form - add multiple)
4. Submit button

#### Entrepreneur Profile Page
**File**: `resources/js/Pages/Entrepreneur/Profile.jsx`

Manage:
- Business details (editable)
- Team members (add/remove)
- DuitNow IDs (add/remove)

#### Entrepreneur Leaderboard Page
**File**: `resources/js/Pages/Entrepreneur/Leaderboard.jsx`

Three tabs:
- Weekly
- Monthly
- All-Time

Display:
- Rank
- Business Name
- Location
- Transaction Count
- Manager Name
- Team Size
- Special badge: "DEMO DATA" indicator

### 7. Routes

```php
// Entrepreneur Registration (Public/Guest)
Route::middleware('guest')->group(function () {
    Route::get('/entrepreneur/register', [EntrepreneurUnitController::class, 'register'])
        ->name('entrepreneur.register');
    Route::post('/entrepreneur', [EntrepreneurUnitController::class, 'store'])
        ->name('entrepreneur.store');
});

// Entrepreneur Management (Authenticated Manager)
Route::middleware(['auth', 'entrepreneur-manager'])->prefix('entrepreneur')->group(function () {
    Route::get('/profile', [EntrepreneurUnitController::class, 'edit'])
        ->name('entrepreneur.profile');
    Route::put('/profile', [EntrepreneurUnitController::class, 'update'])
        ->name('entrepreneur.update');
    Route::post('/team', [EntrepreneurUnitController::class, 'addTeamMember'])
        ->name('entrepreneur.team.add');
    Route::delete('/team/{memberId}', [EntrepreneurUnitController::class, 'removeTeamMember'])
        ->name('entrepreneur.team.remove');
    Route::post('/duitnow', [EntrepreneurUnitController::class, 'addDuitnowId'])
        ->name('entrepreneur.duitnow.add');
    Route::delete('/duitnow/{id}', [EntrepreneurUnitController::class, 'removeDuitnowId'])
        ->name('entrepreneur.duitnow.remove');
});

// Entrepreneur Leaderboard (Public)
Route::get('/entrepreneur/leaderboard', [EntrepreneurLeaderboardController::class, 'index'])
    ->name('entrepreneur.leaderboard');

// Admin - Entrepreneur Data Management
Route::middleware(['auth', 'role:admin'])->prefix('admin/entrepreneur')->group(function () {
    Route::post('/regenerate', [Admin\EntrepreneurDataController::class, 'regenerateData'])
        ->name('admin.entrepreneur.regenerate');
    Route::get('/units', [Admin\EntrepreneurDataController::class, 'viewUnits'])
        ->name('admin.entrepreneur.units');
});
```

## ML Training & Data Generation

### Training Data Pipeline

1. **Data Collection** (from Phase 1):
   ```php
   // Extract features from approved transactions
   $features = Transaction::where('status', 'approved')
       ->select([
           'transaction_date',
           'transaction_time', 
           'amount',
           'approved_at'
       ])
       ->get();
   ```

2. **Feature Engineering**:
   - Extract day of week, hour of day
   - Calculate moving averages
   - Identify peak transaction periods
   - Analyze amount distributions by faculty/time

3. **Model Training** (Python Script - if using ML approach):
   ```python
   # Example: Time series forecasting for transaction counts
   from statsmodels.tsa.arima.model import ARIMA
   import pandas as pd
   
   # Load Phase 1 data
   df = pd.read_csv('phase1_transactions.csv')
   
   # Train ARIMA model for transaction frequency
   model = ARIMA(df['daily_count'], order=(5,1,0))
   model_fit = model.fit()
   
   # Generate forecasts for entrepreneur units
   forecast = model_fit.forecast(steps=90)  # 90 days of demo data
   ```

4. **Statistical Simulation** (Simpler PHP approach):
   ```php
   // Sample from learned distributions
   $transactionCount = $this->samplePoisson($patterns['daily_avg']);
   $amount = $this->sampleNormal($patterns['amount_mean'], $patterns['amount_std']);
   $hour = $this->sampleFromDistribution($patterns['time_distribution']);
   ```

### Data Generation Schedule

**Laravel Scheduled Command**:
```php
// app/Console/Commands/GenerateEntrepreneurData.php

protected function handle()
{
    $generator = new SyntheticDataGeneratorService();
    
    // Generate data for current week/month
    $units = EntrepreneurUnit::all();
    
    foreach ($units as $unit) {
        $generator->generateTransactionsForUnit(
            $unit->id,
            now()->startOfWeek(),
            now()->endOfWeek()
        );
    }
    
    $this->info('Entrepreneur demo data generated successfully!');
}
```

**Schedule** (in `app/Console/Kernel.php`):
```php
protected function schedule(Schedule $schedule)
{
    // Regenerate demo data weekly (Mondays at midnight)
    $schedule->command('entrepreneur:generate-data')
        ->weekly()
        ->mondays()
        ->at('00:00');
}
```

## Data Quality & Validation

### Ensuring Realistic Demo Data

1. **Reference ID Uniqueness**: Always generate unique IDs
2. **Amount Realism**: Stay within observed ranges from Phase 1
3. **Temporal Consistency**: Maintain realistic timing patterns
4. **Volume Scaling**: Entrepreneur units should have ~2-5x more transactions than individuals (they're businesses)

### Demo Data Indicators

Always clearly mark demo data:
- Badge/tag on entrepreneur leaderboard: "DEMO DATA"
- Disclaimer at top of entrepreneur leaderboard page
- Different color scheme for entrepreneur vs personal leaderboards

## Implementation Phases

### Phase 2A: Basic Setup (Week 1-2)
- [ ] Create database migrations for entrepreneur tables
- [ ] Create models and relationships
- [ ] Build entrepreneur registration UI
- [ ] Build entrepreneur profile management

### Phase 2B: Data Generation (Week 3-4)
- [ ] Implement statistical analysis of Phase 1 data
- [ ] Build synthetic data generator service
- [ ] Create admin interface for data regeneration
- [ ] Test data quality and realism

### Phase 2C: Leaderboard Display (Week 5-6)
- [ ] Create entrepreneur leaderboard service
- [ ] Build entrepreneur leaderboard UI
- [ ] Add demo data indicators
- [ ] Implement tie-breaking logic

### Phase 2D: Polish & Integration (Week 7-8)
- [ ] Add scheduled data generation
- [ ] Create admin analytics for demo data
- [ ] Final testing and refinement
- [ ] Documentation

## Technical Considerations

### Performance
- Pre-generate data in batches (not real-time)
- Index heavily queried columns (entrepreneur_unit_id, transaction_date)
- Cache leaderboard results (refresh every 5 minutes)

### Data Storage
- Keep demo data separate from real data (different tables)
- Archive old demo data after 6 months
- Monitor storage usage

### Maintenance
- Review and update ML patterns quarterly
- Adjust generation parameters based on Phase 1 growth
- Monitor for anomalies in generated data

## Success Metrics

1. **Data Realism**: Generated data should be statistically indistinguishable from real data
2. **System Stability**: Demo system should not impact Phase 1 performance
3. **User Understanding**: Clear differentiation between real and demo leaderboards
4. **Demonstration Value**: Effectively showcases entrepreneur competition concept

## Future Enhancements (Phase 3+)

1. **Real Entrepreneur Competition**: Convert demo system to accept real submissions
2. **Advanced ML**: Implement deep learning models for even more realistic data
3. **Business Categories**: Segment by business type (food, services, retail, etc.)
4. **Team Analytics**: Show contribution of each team member
5. **Business Growth Metrics**: Track month-over-month growth trends

## Appendix

### Python ML Script Example (Optional)

If implementing advanced ML approach, create a separate Python service:

**File**: `ml_services/synthetic_data_generator.py`

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

class SyntheticDataGenerator:
    def __init__(self, phase1_data_path):
        self.df = pd.read_csv(phase1_data_path)
        self.patterns = self._analyze_patterns()
    
    def _analyze_patterns(self):
        # Analyze Phase 1 data
        return {
            'daily_mean': self.df.groupby('date').size().mean(),
            'daily_std': self.df.groupby('date').size().std(),
            'amount_dist': {
                'mean': self.df['amount'].mean(),
                'std': self.df['amount'].std(),
            },
            'hourly_probs': self._get_hourly_distribution(),
            'dow_probs': self._get_day_of_week_distribution(),
        }
    
    def generate(self, unit_id, start_date, end_date, multiplier=3.0):
        # Generate transactions for entrepreneur unit
        # multiplier: businesses generate ~3x more than individuals
        
        transactions = []
        current_date = start_date
        
        while current_date <= end_date:
            # Sample daily transaction count
            daily_count = int(np.random.normal(
                self.patterns['daily_mean'] * multiplier,
                self.patterns['daily_std'] * multiplier
            ))
            
            for _ in range(max(0, daily_count)):
                transaction = {
                    'entrepreneur_unit_id': unit_id,
                    'reference_id': self._generate_ref_id(),
                    'transaction_date': current_date.strftime('%Y-%m-%d'),
                    'transaction_time': self._sample_time(),
                    'amount': self._sample_amount(),
                }
                transactions.append(transaction)
            
            current_date += timedelta(days=1)
        
        return transactions
    
    def _generate_ref_id(self):
        # Generate unique reference ID
        timestamp = datetime.now().timestamp()
        random_part = np.random.randint(1000, 9999)
        return f"ENT{int(timestamp)}{random_part}"
    
    def _sample_time(self):
        # Sample hour from learned distribution
        hour = np.random.choice(24, p=self.patterns['hourly_probs'])
        minute = np.random.randint(0, 60)
        second = np.random.randint(0, 60)
        return f"{hour:02d}:{minute:02d}:{second:02d}"
    
    def _sample_amount(self):
        # Sample from truncated normal distribution
        amount = np.random.normal(
            self.patterns['amount_dist']['mean'],
            self.patterns['amount_dist']['std']
        )
        return max(1.0, round(amount, 2))  # Minimum RM1.00

# Usage
if __name__ == '__main__':
    generator = SyntheticDataGenerator('phase1_transactions.csv')
    
    transactions = generator.generate(
        unit_id=1,
        start_date=datetime(2025, 10, 1),
        end_date=datetime(2025, 10, 31),
        multiplier=3.5
    )
    
    # Export to JSON for Laravel import
    with open('generated_transactions.json', 'w') as f:
        json.dump(transactions, f, indent=2)
```

### Laravel Command to Import ML-Generated Data

**File**: `app/Console/Commands/ImportGeneratedData.php`

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EntrepreneurTransaction;

class ImportGeneratedData extends Command
{
    protected $signature = 'entrepreneur:import-ml-data {file}';
    protected $description = 'Import ML-generated transaction data';

    public function handle()
    {
        $file = $this->argument('file');
        $data = json_decode(file_get_contents($file), true);
        
        $this->info('Importing ' . count($data) . ' transactions...');
        
        foreach (array_chunk($data, 1000) as $chunk) {
            EntrepreneurTransaction::insert($chunk);
        }
        
        $this->info('Import completed successfully!');
    }
}
```

## Notes

- Phase 2 is intentionally **demo-only** to avoid complexity of dual verification systems
- All entrepreneur data is clearly marked as "DEMO" to users
- If real entrepreneur competition is desired later, Phase 2 can be converted by:
  1. Adding receipt upload capability
  2. Integrating with Phase 1 verification pipeline
  3. Removing demo data generation
  4. Switching to real transaction storage

