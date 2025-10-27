# Database Setup Guide

## Current Issue

The Supabase PostgreSQL connection is not resolving. This could be due to:
- Network/DNS issues
- Supabase project paused or deleted
- Incorrect credentials

## Solution Options

### Option 1: Use Local PostgreSQL (Recommended for Development)

#### Install PostgreSQL Locally

**Windows (Laragon Users):**
Laragon likely has PostgreSQL available. Enable it through Laragon menu.

**Or Download PostgreSQL:**
1. Visit https://www.postgresql.org/download/
2. Install PostgreSQL 14 or later
3. Remember the password you set during installation

#### Configure Local Database

1. Create a new database:
```sql
CREATE DATABASE utmduitnow;
```

2. Update `.env`:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=utmduitnow
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_SSLMODE=prefer
```

3. Run migrations:
```bash
php artisan migrate
```

4. Run seeders:
```bash
php artisan db:seed
```

### Option 2: Use MySQL Instead

If PostgreSQL is problematic, Laravel supports MySQL:

#### Install MySQL

Laragon comes with MySQL by default.

#### Configure MySQL

1. Create database via Laragon or phpMyAdmin

2. Update `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=utmduitnow
DB_USERNAME=root
DB_PASSWORD=
```

3. Run migrations:
```bash
php artisan migrate
```

4. Run seeders:
```bash
php artisan db:seed
```

### Option 3: Fix Supabase Connection

If you want to continue using Supabase:

1. **Check Supabase Project Status**
   - Login to https://supabase.com
   - Ensure project is active and not paused

2. **Get Fresh Credentials**
   - Go to Project Settings → Database
   - Copy the connection string for "Direct Connection"
   - Update `.env` with new credentials

3. **Test Connection**
```bash
php artisan tinker
> DB::connection()->getPdo();
```

If successful, you'll see a PDO object. If not, you'll see an error.

---

## Migration Order

Migrations will run in this order:

1. `create_bouncer_tables` (Already exists - Bouncer package)
2. `create_users_table` (Modified with student fields)
3. `create_faculties_table` (New)
4. `create_transactions_table` (New)
5. `create_daily_submission_limits_table` (New)

**Important**: Faculties must be created before users (due to foreign key).

---

## Running Migrations

### Fresh Migration (Drops All Tables)
```bash
php artisan migrate:fresh --seed
```

### Regular Migration
```bash
php artisan migrate
```

### Rollback Last Migration
```bash
php artisan migrate:rollback
```

### Check Migration Status
```bash
php artisan migrate:status
```

---

## Seeder Execution Order

Defined in `database/seeders/DatabaseSeeder.php`:

1. **RolesSeeder** - Creates admin and student roles
2. **FacultySeeder** - Creates 12 UTM faculties
3. **AdminUserSeeder** - Creates admin account

### Run All Seeders
```bash
php artisan db:seed
```

### Run Specific Seeder
```bash
php artisan db:seed --class=FacultySeeder
```

---

## Verifying Database Setup

After migrations and seeds, verify the setup:

```bash
php artisan tinker
```

Then run:

```php
// Check faculties
Faculty::count();
Faculty::all();

// Check admin user
User::where('email', 'admin@utmduitnow.com')->first();

// Check roles
Bouncer::role()->all();
```

---

## Common Issues

### Issue: "Unknown host" or DNS Error
**Solution**: Use local database or check network connectivity

### Issue: "SQLSTATE[42P01]: Undefined table"
**Solution**: Run migrations first
```bash
php artisan migrate
```

### Issue: "Foreign key constraint fails"
**Solution**: Ensure migration order is correct. Faculties must exist before users.

### Issue: "Class 'Bouncer' not found"
**Solution**: Ensure Bouncer is installed and published
```bash
composer require silber/bouncer
php artisan bouncer:table
php artisan migrate
```

### Issue: Admin can't login
**Solution**: Ensure seeders ran and admin user exists
```bash
php artisan db:seed --class=AdminUserSeeder
```

---

## Production Database Recommendations

1. **Use Supabase or Managed PostgreSQL** for production
2. **Enable SSL** connections
3. **Set up automated backups**
4. **Monitor database size** (receipts will grow over time)
5. **Index optimization** already included in migrations
6. **Connection pooling** for better performance

---

## Database Schema Diagram

```
┌─────────────┐
│  faculties  │
├─────────────┤
│ id          │
│ full_name   │
│ short_name  │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────────────┐
│        users            │
├─────────────────────────┤
│ id                      │
│ name                    │
│ email                   │
│ matric_no (unique)      │
│ faculty_id (FK)         │◄────────┐
│ year_of_study           │         │
│ duitnow_id              │         │
│ password                │         │
└──────┬──────────────────┘         │
       │                            │
       │ 1:N                        │
       │                            │
┌──────▼──────────────────┐         │
│    transactions         │         │
├─────────────────────────┤         │
│ id                      │         │
│ user_id (FK)            │─────────┘
│ reference_id (unique)   │
│ transaction_date        │
│ transaction_time        │
│ amount                  │
│ receipt_image_path      │
│ ocr_raw_text            │
│ parsed_data (JSON)      │
│ status                  │
│ rejection_reason        │
│ submitted_at            │
│ approved_at             │
└─────────────────────────┘

┌──────────────────────────┐
│ daily_submission_limits  │
├──────────────────────────┤
│ id                       │
│ user_id (FK)             │
│ date                     │
│ submission_count         │
└──────────────────────────┘
```

---

## Testing Database Without Full Setup

You can test queries with SQLite for quick testing:

```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

Then:
```bash
touch database/database.sqlite
php artisan migrate --seed
```

This is useful for quick local testing without PostgreSQL.

