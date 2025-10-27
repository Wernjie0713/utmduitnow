# Deployment Guide

This guide covers deploying the UTM DuitNow Transaction Tracking Platform to production.

---

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All features tested locally
- [ ] No debug statements or console.logs in code
- [ ] Git repository clean (no uncommitted changes)
- [ ] `.env.example` updated with all required variables
- [ ] Dependencies locked (composer.lock, package-lock.json committed)

### 2. Environment Setup
- [ ] Production server ready (PHP 8.2+, PostgreSQL/MySQL)
- [ ] Domain configured and pointing to server
- [ ] SSL certificate installed (HTTPS required)
- [ ] Azure Computer Vision API account created
- [ ] OpenAI API account created with payment method

### 3. Security
- [ ] Change admin password from default
- [ ] API keys secured (not in code)
- [ ] Database credentials strong and unique
- [ ] Debug mode disabled (`APP_DEBUG=false`)
- [ ] Application key generated for production

---

## Deployment Steps

### Step 1: Server Requirements

**Minimum Requirements:**
- **PHP**: 8.2 or higher
- **Database**: PostgreSQL 13+ or MySQL 8+
- **Storage**: 10GB minimum (for receipt images)
- **Memory**: 512MB minimum, 1GB recommended
- **Node.js**: 18+ (for building assets)

**Recommended Hosting Options:**
- Laravel Forge + DigitalOcean
- AWS EC2 + RDS
- Heroku (for quick deployment)
- VPS (DigitalOcean, Linode, Vultr)

### Step 2: Upload Code

**Option A: Git Deployment (Recommended)**
```bash
# On server
git clone <your-repository-url> /var/www/utmduitnow
cd /var/www/utmduitnow
```

**Option B: FTP/SFTP**
- Upload all files except:
  - `node_modules/`
  - `vendor/`
  - `.env`
  - `storage/` contents

### Step 3: Install Dependencies

```bash
# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Install Node dependencies
npm install

# Build production assets
npm run build
```

### Step 4: Environment Configuration

Create production `.env`:

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

**Critical Production Settings:**

```env
APP_NAME="UTM DuitNow Leaderboard"
APP_ENV=production
APP_DEBUG=false  # IMPORTANT!
APP_URL=https://your-domain.com

# Database (Production)
DB_CONNECTION=pgsql
DB_HOST=your_production_db_host
DB_PORT=5432
DB_DATABASE=utmduitnow_prod
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password
DB_SSLMODE=require

# Azure Computer Vision
AZURE_VISION_ENDPOINT=https://your-production-resource.cognitiveservices.azure.com/
AZURE_VISION_KEY=your_production_key

# OpenAI API
OPENAI_API_KEY=sk-your_production_key

# Submission Limits
MAX_SUBMISSIONS_PER_DAY=100

# Session & Cache (use database or redis)
SESSION_DRIVER=database
CACHE_STORE=database

# Queue (for async processing if needed)
QUEUE_CONNECTION=database
```

### Step 5: Generate Application Key

```bash
php artisan key:generate
```

### Step 6: Set Permissions

```bash
# Storage and cache directories
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Or for Nginx
chown -R nginx:nginx storage bootstrap/cache
```

### Step 7: Run Migrations

```bash
php artisan migrate --force
```

**⚠️ The `--force` flag is required in production mode.**

### Step 8: Run Seeders

```bash
php artisan db:seed --force
```

This creates:
- Admin and student roles
- 12 faculties
- Admin user (admin@utmduitnow.com)

### Step 9: Create Storage Link

```bash
php artisan storage:link
```

### Step 10: Optimize for Production

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Cache events
php artisan event:cache
```

### Step 11: Configure Web Server

**For Apache (.htaccess already included):**

Ensure `public` is your document root.

**For Nginx:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    root /var/www/utmduitnow/public;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Step 12: Set Up Supervisor (For Queue Workers)

If using queues:

```bash
sudo nano /etc/supervisor/conf.d/utmduitnow-worker.conf
```

```ini
[program:utmduitnow-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/utmduitnow/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/utmduitnow/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start utmduitnow-worker:*
```

---

## Post-Deployment

### Step 1: Create Admin Account

1. Login at `https://your-domain.com/login`
2. Use credentials:
   - Email: admin@utmduitnow.com
   - Password: password

3. **IMMEDIATELY change the password:**
   - Go to Profile
   - Update password to something secure

### Step 2: Test Core Functionality

1. ✅ Register a test student account
2. ✅ Submit a test receipt
3. ✅ Check leaderboard displays
4. ✅ Login as admin
5. ✅ Test CSV export
6. ✅ Verify email notifications (if configured)

### Step 3: Monitor Initial Usage

Watch logs for:
```bash
# Real-time log monitoring
tail -f storage/logs/laravel.log

# Check for errors
grep "ERROR" storage/logs/laravel.log
grep "CRITICAL" storage/logs/laravel.log
```

### Step 4: Set Up Automated Backups

**Database Backup Script** (cron job):

```bash
#!/bin/bash
# /var/www/backup-db.sh

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/var/www/backups"
DB_NAME="utmduitnow_prod"

pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /var/www/backup-db.sh
```

**File Storage Backup:**
```bash
# Backup receipt images weekly
0 3 * * 0 tar -czf /var/www/backups/receipts_$(date +\%Y-\%m-\%d).tar.gz /var/www/utmduitnow/storage/app/receipts
```

---

## Monitoring & Maintenance

### Application Monitoring

**Install Laravel Telescope (Dev Only):**
```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

**Install Sentry (Production Error Tracking):**
```bash
composer require sentry/sentry-laravel
php artisan sentry:publish --dsn=your_sentry_dsn
```

### API Usage Monitoring

**Azure:**
- Portal → Your Resource → Metrics
- Set up alerts for > 4,000 requests/month

**OpenAI:**
- Platform → Usage
- Set up spending alerts at $15 and $25

### Database Monitoring

Monitor:
- Table sizes (transactions will grow)
- Query performance
- Connection pool usage

```bash
# Check database size
php artisan tinker
> DB::select("SELECT pg_size_pretty(pg_database_size('utmduitnow_prod'));");
```

### Storage Monitoring

```bash
# Check receipt storage size
du -sh storage/app/receipts

# Set up alert when > 5GB
```

---

## Scaling Considerations

### When You Have 1000+ Students

1. **Implement Queue Workers**
   - Move OCR/AI processing to background jobs
   - Prevents timeout on heavy loads

2. **Add Redis Caching**
   - Cache leaderboard results (refresh every 5 minutes)
   - Cache faculty data
   - Reduce database queries

3. **CDN for Static Assets**
   - Serve receipt images via CDN
   - Faster load times

4. **Database Optimization**
   - Add more indexes if needed
   - Consider read replicas
   - Implement connection pooling

---

## Troubleshooting Production Issues

### Issue: 500 Internal Server Error

**Check:**
1. Storage permissions: `chmod -R 775 storage`
2. Logs: `tail -f storage/logs/laravel.log`
3. PHP error logs: `/var/log/php-fpm/error.log`

### Issue: Images Not Uploading

**Check:**
1. `post_max_size` and `upload_max_filesize` in `php.ini`
2. Storage permissions
3. Disk space: `df -h`

**Recommended php.ini settings:**
```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 60
memory_limit = 256M
```

### Issue: Slow Leaderboard Loading

**Solutions:**
1. Add caching:
```php
// In LeaderboardController
$weeklyLeaderboard = Cache::remember('leaderboard:weekly', 300, function () {
    return $this->leaderboardService->getWeeklyLeaderboard();
});
```

2. Add database indexes (already included in migrations)

3. Paginate results if > 100 entries

### Issue: API Costs Too High

**Solutions:**
1. Implement request caching
2. Reduce retry attempts
3. Batch process submissions
4. Consider switching to Tesseract OCR (free)

---

## Rollback Plan

If deployment fails:

### 1. Database Rollback
```bash
php artisan migrate:rollback
```

### 2. Code Rollback
```bash
git revert HEAD
# or
git reset --hard previous_commit_hash
```

### 3. Full Rollback
- Restore database from last backup
- Deploy previous stable version
- Clear all caches
- Restart services

---

## Production Checklist

Before going live:

### Environment
- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` set to production domain
- [ ] HTTPS enabled (force SSL in production)

### Security
- [ ] Admin password changed
- [ ] API keys are production keys (not dev keys)
- [ ] Database password is strong
- [ ] All secrets in `.env` only (not in code)
- [ ] `.env` file permissions: `chmod 600 .env`

### Performance
- [ ] Config cached
- [ ] Routes cached
- [ ] Views cached
- [ ] Opcache enabled
- [ ] Assets minified and versioned

### Monitoring
- [ ] Error tracking configured (Sentry, Bugsnag)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] API usage alerts set up
- [ ] Database backup automated
- [ ] Log rotation configured

### Documentation
- [ ] Admin user guide provided
- [ ] Student user guide provided
- [ ] API setup documented
- [ ] Troubleshooting guide available

---

## Going Live

### Launch Day Checklist

**Morning of Launch:**
1. ✅ Verify all systems operational
2. ✅ Test registration flow end-to-end
3. ✅ Test submission and approval
4. ✅ Verify leaderboards working
5. ✅ Check admin dashboard accessible

**During Launch:**
1. 👀 Monitor error logs continuously
2. 👀 Watch API usage dashboards
3. 👀 Monitor database connections
4. 👀 Check storage space
5. 👀 Be ready to scale if needed

**First 24 Hours:**
1. 📊 Collect user feedback
2. 📊 Monitor for unexpected errors
3. 📊 Track submission volumes
4. 📊 Verify leaderboard accuracy
5. 📊 Check API costs

---

## Maintenance Schedule

### Daily
- Check error logs for critical issues
- Monitor API usage and costs
- Verify backup ran successfully

### Weekly
- Review leaderboard accuracy
- Check disk space (receipt storage)
- Review rejected transactions (improve OCR if needed)
- Update documentation if needed

### Monthly
- Review API costs vs budget
- Optimize slow queries
- Archive old transactions (if needed)
- Security updates (composer update, npm update)

---

## Emergency Contacts

**Technical Issues:**
- Laravel Error: Check logs first
- Database Issue: Contact DB admin
- API Outage: Check Azure/OpenAI status pages

**Azure Status:** https://status.azure.com/
**OpenAI Status:** https://status.openai.com/

---

## Success Metrics

Track these KPIs:

1. **User Engagement**
   - Daily active users
   - Average submissions per user
   - Leaderboard view count

2. **System Performance**
   - Average response time (< 2s)
   - Error rate (< 1%)
   - Uptime (> 99%)

3. **Verification Accuracy**
   - Auto-approval rate (target: > 90%)
   - Rejection rate (target: < 10%)
   - False positive rate (target: < 1%)

4. **Costs**
   - Monthly API costs
   - Cost per student
   - Cost per transaction

---

## Post-Competition Cleanup

After the 3-month competition ends:

1. **Archive Data**
```bash
php artisan tinker
> Transaction::chunk(1000, function($transactions) {
    // Export to CSV or archive database
  });
```

2. **Generate Final Reports**
- Final leaderboard for all periods
- Participation statistics by faculty
- Transaction volume trends

3. **Clean Up Storage**
```bash
# Archive receipt images
tar -czf receipts_archive_2025.tar.gz storage/app/receipts/

# Optional: Clear old receipts after archiving
rm -rf storage/app/receipts/*
```

4. **Deactivate API Keys**
- Delete or disable Azure resource (if not needed)
- Deactivate OpenAI API key
- Stop incurring costs

---

## Cost Tracking Spreadsheet

Create a monthly tracking sheet:

| Month | Students | Submissions | Azure Cost | OpenAI Cost | Total | Notes |
|-------|----------|-------------|------------|-------------|-------|-------|
| Oct 2025 | 150 | 7,500 | $2.50 | $15.00 | $17.50 | Soft launch |
| Nov 2025 | 200 | 10,000 | $5.00 | $20.00 | $25.00 | Peak activity |
| Dec 2025 | 180 | 9,000 | $4.00 | $18.00 | $22.00 | Finals week |
| **Total** | | **26,500** | **$11.50** | **$53.00** | **$64.50** | 3 months |

---

## Deployment Tools

### Laravel Forge (Recommended for Beginners)

**Pros:**
- One-click deployment
- Automatic SSL
- Server management GUI
- Built for Laravel

**Costs:**
- Forge: $12/month
- Server (DigitalOcean): $6-12/month
- **Total: ~$18-24/month** + API costs

### Laravel Envoyer (Zero-Downtime Deployments)

For advanced users:
- Deploy without downtime
- Health checks before switching
- Automatic rollback

---

## Quick Deploy with Laravel Forge

1. **Sign up** at forge.laravel.com
2. **Connect** your DigitalOcean/AWS account
3. **Create Server** (PHP 8.2, PostgreSQL)
4. **Create Site** (your domain)
5. **Connect Git** repository
6. **Deploy** via Git push
7. **Set Environment** variables via Forge UI
8. **Run Migrations** via Forge terminal
9. **Enable SSL** (Let's Encrypt - free)

Done! Your site is live.

---

## Manual Deployment Checklist

If deploying manually without Forge:

- [ ] Server provisioned (Ubuntu 22.04+ recommended)
- [ ] Nginx or Apache installed and configured
- [ ] PHP 8.2 with required extensions installed
- [ ] PostgreSQL or MySQL installed and secured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall configured (allow 80, 443, SSH only)
- [ ] Code deployed to `/var/www/utmduitnow`
- [ ] Dependencies installed (`composer install`)
- [ ] Environment configured (`.env` file)
- [ ] Migrations ran (`php artisan migrate --force`)
- [ ] Seeders ran (`php artisan db:seed --force`)
- [ ] Permissions set correctly
- [ ] Storage link created
- [ ] Caches built (`config:cache`, `route:cache`, `view:cache`)
- [ ] Frontend assets built (`npm run build`)
- [ ] Supervisor configured (for queues)
- [ ] Cron configured (for scheduled tasks, if any)
- [ ] Log rotation configured
- [ ] Monitoring tools installed
- [ ] Backup script configured
- [ ] Tested end-to-end

---

## Support & Maintenance

### Getting Help

1. **Laravel Errors**: Check [Laravel Documentation](https://laravel.com/docs)
2. **Inertia Issues**: Check [Inertia.js Docs](https://inertiajs.com)
3. **Azure API**: Check [Azure Docs](https://docs.microsoft.com/azure/cognitive-services/)
4. **OpenAI**: Check [OpenAI Docs](https://platform.openai.com/docs)

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Update dependencies
composer install --no-dev
npm install
npm run build

# Run new migrations (if any)
php artisan migrate --force

# Clear and rebuild caches
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart workers (if using queues)
php artisan queue:restart
```

---

## Production URL Structure

Recommended URL structure:

- **Homepage**: `https://duitnow.utm.my` or `https://leaderboard.utm.my`
- **Leaderboard**: `https://yourdomain.com/leaderboard`
- **Student Portal**: `https://yourdomain.com/dashboard`
- **Admin**: `https://yourdomain.com/admin/dashboard`

Consider using subdomain for admin:
- `admin.yourdomain.com` → Admin dashboard
- Easier to secure and monitor

---

## Final Notes

✅ **The system is production-ready** once:
1. Database is properly configured
2. API keys are added
3. All tests pass
4. Admin password changed
5. Monitoring is in place

🎯 **Expected Performance:**
- Handle 200+ concurrent users
- Process submissions in < 5 seconds
- Leaderboard loads in < 1 second
- 99.9% uptime

💰 **Expected Costs:**
- Server: $10-20/month
- APIs: $20-30/month
- Total: **$30-50/month** for 200 students

Good luck with your deployment! 🚀

