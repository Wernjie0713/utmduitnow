"""
Zero-Activity User Transaction Generator
=========================================
Generates synthetic transactions for registered users who have complete
profiles but 0 transactions. Each user gets 50-150 transactions spread
across Sep-Dec 2025, learning realistic patterns from active users.

Usage:
    python generate_zero_activity_data.py           # Dry-run (default)
    python generate_zero_activity_data.py --execute  # Actually insert
"""

import mysql.connector
import numpy as np
import random
import string
import json
import argparse
from datetime import datetime, date, timedelta
from collections import defaultdict
from dataclasses import dataclass, field

# ── DB config ─────────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "database": "utmduitnow",
    "user": "root",
    "password": "",
}

# ── Competition period: Sep 1 – Dec 28, 2025 (17 weeks, Mon-Sun) ─────────────
COMPETITION_START = date(2025, 9, 1)
COMPETITION_END = date(2025, 12, 28)
NUM_WEEKS = 17

TARGET_MIN = 50
TARGET_MAX = 150

BANK_CODES = [
    "RHBBMYKL", "TNGDMYNB", "MBBEMYKL", "PBBEMYKL",
    "CIBBMYKL", "HLBBMYKL", "BIMBMYKL", "AFBQMYKL",
]

# Month-to-week mapping (0-indexed week indices)
MONTH_WEEKS = {
    "Sep": [0, 1, 2, 3],
    "Oct": [4, 5, 6, 7],
    "Nov": [8, 9, 10, 11, 12],
    "Dec": [13, 14, 15, 16],
}


# ── Build competition weeks ──────────────────────────────────────────────────
def build_competition_weeks():
    weeks = []
    for w in range(NUM_WEEKS):
        ws = COMPETITION_START + timedelta(weeks=w)
        we = ws + timedelta(days=6)
        weeks.append((ws, we))
    return weeks

COMPETITION_WEEKS = build_competition_weeks()


@dataclass
class GlobalPatterns:
    hour_distribution: np.ndarray
    dow_distribution: np.ndarray
    amounts: list
    ref_id_format_probs: dict
    active_user_count: int = 0
    total_transactions_learned: int = 0


# ── Helpers ──────────────────────────────────────────────────────────────────

def classify_ref_id_format(ref_id):
    if not ref_id:
        return "other"
    for code in BANK_CODES:
        if code in ref_id:
            return code
    if ref_id.startswith("P"):
        return "P_prefix"
    if ref_id.startswith("QR"):
        return "QR_prefix"
    if ref_id.isdigit():
        return "numeric"
    return "other"


def normalize_distribution(arr):
    total = arr.sum()
    if total == 0:
        return np.ones(len(arr)) / len(arr)
    return arr / total


def random_digits(n):
    return ''.join(random.choices(string.digits, k=n))


def random_hex(n):
    return ''.join(random.choices('0123456789abcdef', k=n))


def pick_ref_format(format_probs):
    formats = list(format_probs.keys())
    probs = list(format_probs.values())
    return np.random.choice(formats, p=probs)


def generate_ref_id(txn_date, format_type, used_ref_ids):
    date_str = txn_date.strftime("%Y%m%d")
    for _ in range(100):
        if format_type == "RHBBMYKL":
            ref_id = f"{date_str}RHBBMYKL040OQR{random_digits(8)}"
        elif format_type == "TNGDMYNB":
            variant = random.choice(["010ORM", "01OORM", "0100RM", "0300QR", "040OQR"])
            ref_id = f"{date_str}TNGDMYNB{variant}{random_digits(8)}"
        elif format_type in BANK_CODES:
            ref_id = f"{date_str}{format_type}040OQR{random_digits(8)}"
        elif format_type == "P_prefix":
            ref_id = f"P{txn_date.strftime('%y%m%d')}{random_digits(9)}"
        elif format_type == "QR_prefix":
            ref_id = f"QR{random_digits(8)}"
        elif format_type == "numeric":
            ref_id = random_digits(random.randint(6, 12))
        else:
            ref_id = f"{date_str}{random.choice(BANK_CODES)}040OQR{random_digits(8)}"
        if ref_id not in used_ref_ids:
            used_ref_ids.add(ref_id)
            return ref_id
    ref_id = f"ZERO{date_str}{random_digits(12)}"
    used_ref_ids.add(ref_id)
    return ref_id


def generate_receipt_path(user_id, txn_datetime):
    ts = int(txn_datetime.timestamp()) + random.randint(0, 999)
    ext = "jpg" if random.random() < 0.7 else "png"
    return f"receipts/receipt_{user_id}_{ts}_{random_hex(13)}.{ext}"


def generate_ocr_text(ref_id, txn_dt, amount):
    templates = [
        (f"Status\nSuccessful\n{txn_dt.strftime('%I:%M')}AM "
         f"{txn_dt.strftime('%A, %d %B %Y')} MYT\nAmount\nMYR {amount:.2f}\n"
         f"DuitNow\nQR\nReference ID {ref_id}\nFrom\nSavings Account\n"
         f"To\nMerchant Payment\nPayment Type\nDuitNow QR P2P\nShare Receipt"),
        (f"{txn_dt.strftime('%H:%M')}\nSuccessful\nRM {amount:.2f}\n"
         f"{txn_dt.strftime('%d %b %Y, %I:%M %p')}\nDuit Now\nPaid from\n"
         f"Main Account\nReference ID\n{ref_id}\nDone\nShare receipt"),
        (f"Transaction Successful\n{txn_dt.strftime('%d/%m/%Y')}\n"
         f"{txn_dt.strftime('%H:%M:%S')}\nAmount: RM {amount:.2f}\n"
         f"Reference: {ref_id}\nStatus: Completed"),
        (f"{txn_dt.strftime('%d/%m/%Y %H:%M')}\nTransfer Amount\n"
         f"RM {amount:.2f}\nReference No.\n{ref_id}\nTransaction Date\n"
         f"{txn_dt.strftime('%d/%m/%Y')}\nTime\n{txn_dt.strftime('%H:%M:%S')}\n"
         f"Status: Success"),
    ]
    return random.choice(templates)


def generate_parsed_data(ref_id, txn_dt, amount):
    txn_types = [
        "DuitNow QR", "DuitNow Transfer", "Bank Transfer",
        "Online Payment", "P2P Transfer",
    ]
    return json.dumps({
        "reference_id": ref_id,
        "date": txn_dt.strftime("%Y-%m-%d"),
        "time": txn_dt.strftime("%H:%M:%S"),
        "amount": amount,
        "transaction_type": random.choice(txn_types),
    })


def dates_in_range(start, end):
    days = []
    current = start
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days


# ── Phase 1: Identify Zero-Transaction Users ────────────────────────────────

def identify_target_users(cursor):
    """Find users with complete profiles but 0 transactions."""
    cursor.execute("""
        SELECT u.id AS user_id, u.name, u.matric_no, u.phone_number
        FROM users u
        LEFT JOIN transactions t ON t.user_id = u.id
        WHERE u.matric_no IS NOT NULL AND u.matric_no != ''
          AND u.matric_no != 'ADMIN00000'
          AND u.phone_number IS NOT NULL AND u.phone_number != ''
          AND u.profile_completed = 1
        GROUP BY u.id, u.name, u.matric_no, u.phone_number
        HAVING COUNT(t.id) = 0
        ORDER BY u.id
    """)

    rows = cursor.fetchall()
    if not rows:
        return []

    # Deduplicate by matric_no (keep lowest ID)
    matric_groups = defaultdict(list)
    for row in rows:
        matric_groups[row['matric_no']].append(row)

    target_users = []
    skipped = []
    for matric, group in matric_groups.items():
        if len(group) > 1:
            group.sort(key=lambda r: r['user_id'])
            target_users.append(group[0])
            for dup in group[1:]:
                skipped.append(dup)
        else:
            target_users.append(group[0])

    if skipped:
        print(f"  Duplicate accounts skipped: {len(skipped)}")
        for s in skipped[:5]:
            print(f"    - #{s['user_id']} {s['name']} ({s['matric_no']})")
        if len(skipped) > 5:
            print(f"    ... and {len(skipped) - 5} more")

    return target_users


# ── Phase 2: Learn Global Patterns ──────────────────────────────────────────

def learn_global_patterns(cursor):
    """Learn hour/dow/amount/ref_id distributions from active users (50+ txns)."""
    cursor.execute("""
        SELECT user_id FROM (
            SELECT user_id, COUNT(*) as cnt
            FROM transactions WHERE status = 'approved'
            GROUP BY user_id HAVING cnt >= 50
        ) active
    """)
    active_ids = [r['user_id'] for r in cursor.fetchall()]
    if not active_ids:
        return None

    placeholders = ','.join(['%s'] * len(active_ids))
    cursor.execute(f"""
        SELECT reference_id, transaction_date, transaction_time, amount
        FROM transactions
        WHERE status = 'approved' AND user_id IN ({placeholders})
    """, active_ids)

    rows = cursor.fetchall()
    hour_hist = np.zeros(24)
    dow_hist = np.zeros(7)
    amounts = []
    ref_formats = defaultdict(int)

    for row in rows:
        txn_date = row['transaction_date']
        if isinstance(txn_date, str):
            txn_date = date.fromisoformat(txn_date)

        txn_time = row['transaction_time']
        if isinstance(txn_time, timedelta):
            hour = int(txn_time.total_seconds() // 3600)
        elif isinstance(txn_time, str):
            hour = int(txn_time.split(':')[0])
        else:
            hour = 12
        hour = min(max(hour, 0), 23)

        hour_hist[hour] += 1
        dow_hist[txn_date.weekday()] += 1
        amounts.append(float(row['amount']))
        ref_formats[classify_ref_id_format(row['reference_id'])] += 1

    # Filter amounts to realistic range (RM 0.50 - RM 500)
    realistic_amounts = [a for a in amounts if 0.50 <= a <= 500.0]
    if len(realistic_amounts) < 100:
        realistic_amounts = amounts  # fallback if too few

    total_refs = sum(ref_formats.values())
    format_probs = {k: v / total_refs for k, v in ref_formats.items()}

    return GlobalPatterns(
        hour_distribution=normalize_distribution(hour_hist),
        dow_distribution=normalize_distribution(dow_hist),
        amounts=realistic_amounts,
        ref_id_format_probs=format_probs,
        active_user_count=len(active_ids),
        total_transactions_learned=len(rows),
    )


# ── Phase 3: Distribute Across Weeks ────────────────────────────────────────

def distribute_across_weeks(to_generate):
    """Distribute N transactions across 17 weeks with month coverage."""
    weights = np.array([1 + min(i, NUM_WEEKS - 1 - i) for i in range(NUM_WEEKS)],
                       dtype=float)
    weights += np.random.uniform(0.5, 1.5, NUM_WEEKS)
    weights = weights / weights.sum()

    weekly = np.random.multinomial(to_generate, weights)

    # Ensure each month has at least some transactions
    min_per_month = min(3, to_generate // 4)
    for month_name, week_indices in MONTH_WEEKS.items():
        month_total = sum(weekly[i] for i in week_indices)
        if month_total < min_per_month:
            deficit = min_per_month - month_total
            all_months = list(MONTH_WEEKS.items())
            all_months.sort(key=lambda m: sum(weekly[i] for i in m[1]), reverse=True)
            for donor_name, donor_indices in all_months:
                if donor_name == month_name:
                    continue
                donor_total = sum(weekly[i] for i in donor_indices)
                steal = min(deficit, donor_total - min_per_month)
                if steal <= 0:
                    continue
                for _ in range(steal):
                    donor_candidates = [i for i in donor_indices if weekly[i] > 0]
                    if donor_candidates:
                        weekly[random.choice(donor_candidates)] -= 1
                        weekly[random.choice(week_indices)] += 1
                        deficit -= 1
                if deficit <= 0:
                    break

    return weekly.tolist()


# ── Phase 4: Generate Transactions ──────────────────────────────────────────

def generate_transactions_for_user(user_id, weekly_counts, patterns, used_ref_ids):
    transactions = []

    for week_idx, count in enumerate(weekly_counts):
        if count == 0:
            continue

        ws, we = COMPETITION_WEEKS[week_idx]
        week_days = dates_in_range(ws, we)
        dow_indices = [d.weekday() for d in week_days]

        day_probs = np.array([patterns.dow_distribution[d] for d in dow_indices])
        day_probs = normalize_distribution(day_probs)
        daily_counts = np.random.multinomial(count, day_probs)

        for day, day_count in zip(week_days, daily_counts):
            if day_count == 0:
                continue

            hours = np.random.choice(24, size=int(day_count),
                                     p=patterns.hour_distribution)
            amounts = random.choices(patterns.amounts, k=int(day_count))

            for h, amt in zip(hours, amounts):
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                txn_dt = datetime(day.year, day.month, day.day,
                                  int(h), minute, second)

                fmt = pick_ref_format(patterns.ref_id_format_probs)
                ref_id = generate_ref_id(day, fmt, used_ref_ids)
                receipt = generate_receipt_path(user_id, txn_dt)
                ocr = generate_ocr_text(ref_id, txn_dt, amt)
                parsed = generate_parsed_data(ref_id, txn_dt, amt)

                submitted_at = txn_dt + timedelta(minutes=random.randint(1, 5))
                approved_at = txn_dt + timedelta(minutes=random.randint(6, 15))

                transactions.append((
                    user_id, ref_id,
                    day.strftime('%Y-%m-%d'),
                    txn_dt.strftime('%H:%M:%S'),
                    round(amt, 2), receipt, ocr, parsed,
                    'approved', submitted_at, approved_at,
                    submitted_at, approved_at,
                ))

    return transactions


def bulk_insert(cursor, conn, all_transactions, dry_run=True):
    if dry_run:
        print(f"  [DRY RUN] Would insert {len(all_transactions):,} transactions.")
        return 0

    insert_sql = """
        INSERT INTO transactions
            (user_id, reference_id, transaction_date, transaction_time,
             amount, receipt_image_path, ocr_raw_text, parsed_data,
             status, submitted_at, approved_at, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    batch_size = 1000
    inserted = 0
    for i in range(0, len(all_transactions), batch_size):
        batch = all_transactions[i:i + batch_size]
        cursor.executemany(insert_sql, batch)
        conn.commit()
        inserted += len(batch)
        print(f"  {inserted:,} / {len(all_transactions):,}", end='\r')
    print(f"  {inserted:,} / {len(all_transactions):,}  Done!")
    return inserted


# ── Phase 5: Validation ─────────────────────────────────────────────────────

def validate_results(cursor, sample_ids):
    """Validate a sample of users to check monthly spread."""
    placeholders = ','.join(['%s'] * len(sample_ids))
    cursor.execute(f"""
        SELECT user_id, COUNT(*) as total,
            SUM(CASE WHEN MONTH(transaction_date) = 9 THEN 1 ELSE 0 END) as sep_ct,
            SUM(CASE WHEN MONTH(transaction_date) = 10 THEN 1 ELSE 0 END) as oct_ct,
            SUM(CASE WHEN MONTH(transaction_date) = 11 THEN 1 ELSE 0 END) as nov_ct,
            SUM(CASE WHEN MONTH(transaction_date) = 12 THEN 1 ELSE 0 END) as dec_ct
        FROM transactions
        WHERE status = 'approved' AND user_id IN ({placeholders})
        GROUP BY user_id
        ORDER BY total DESC
    """, sample_ids)

    rows = cursor.fetchall()
    print(f"\n  {'User':>8}  {'Total':>6}  {'Sep':>5}  {'Oct':>5}  "
          f"{'Nov':>5}  {'Dec':>5}  {'Status':>8}")
    print(f"  {'─'*8}  {'─'*6}  {'─'*5}  {'─'*5}  {'─'*5}  {'─'*5}  {'─'*8}")

    all_ok = True
    for row in rows:
        total = int(row['total'] or 0)
        sep = int(row['sep_ct'] or 0)
        oct_ = int(row['oct_ct'] or 0)
        nov = int(row['nov_ct'] or 0)
        dec = int(row['dec_ct'] or 0)
        ok = TARGET_MIN <= total <= TARGET_MAX
        has_spread = sep > 0 and oct_ > 0 and nov > 0 and dec > 0
        status = "OK" if (ok and has_spread) else "CHECK"
        if not ok or not has_spread:
            all_ok = False
        print(f"  #{row['user_id']:>7}  {total:>6}  {sep:>5}  {oct_:>5}  "
              f"{nov:>5}  {dec:>5}  {status:>8}")

    return all_ok


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate transactions for zero-activity users")
    parser.add_argument("--execute", action="store_true",
                        help="Actually insert (default is dry-run)")
    args = parser.parse_args()
    dry_run = not args.execute

    print("=" * 60)
    print("Zero-Activity User Transaction Generator")
    print(f"Mode: {'DRY RUN' if dry_run else 'EXECUTE'}")
    print(f"Target: {TARGET_MIN}-{TARGET_MAX} txns per user")
    print("=" * 60)

    # Phase 1: Identify targets
    print("\n[1/5] Connecting and identifying zero-transaction users...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    target_users = identify_target_users(cursor)
    print(f"  Found {len(target_users)} zero-transaction users with complete profiles")

    if not target_users:
        print("  No target users found. Exiting.")
        cursor.close()
        conn.close()
        return

    # Phase 2: Learn patterns
    print("\n[2/5] Learning global patterns from active users...")
    patterns = learn_global_patterns(cursor)
    if not patterns:
        print("  No active users found to learn from. Exiting.")
        cursor.close()
        conn.close()
        return

    print(f"  Learned from {patterns.active_user_count} active users, "
          f"{patterns.total_transactions_learned:,} transactions")
    print(f"  Realistic amount pool: {len(patterns.amounts):,} values "
          f"(RM{min(patterns.amounts):.2f} - RM{max(patterns.amounts):.2f})")

    # Compute targets
    generation_plan = []
    for user in target_users:
        target = random.randint(TARGET_MIN, TARGET_MAX)
        generation_plan.append((user['user_id'], user['name'], target))

    total_to_generate = sum(g[2] for g in generation_plan)
    print(f"\n  Users to process : {len(generation_plan)}")
    print(f"  Total transactions: ~{total_to_generate:,}")
    print(f"  Average per user : ~{total_to_generate // len(generation_plan)}")

    # Show first 10 and last 5 as sample
    print(f"\n  Sample (first 10):")
    for uid, name, target in generation_plan[:10]:
        display = (name[:25] + "...") if len(name) > 28 else name
        print(f"    #{uid:>5}  {display:<28}  → {target} txns")
    if len(generation_plan) > 15:
        print(f"    ... {len(generation_plan) - 15} more ...")
    for uid, name, target in generation_plan[-5:]:
        display = (name[:25] + "...") if len(name) > 28 else name
        print(f"    #{uid:>5}  {display:<28}  → {target} txns")

    # Phase 3: Load existing ref IDs
    print(f"\n[3/5] Loading existing reference IDs...")
    cursor.execute("SELECT reference_id FROM transactions")
    used_ref_ids = {row['reference_id'] for row in cursor.fetchall()}
    print(f"  Loaded {len(used_ref_ids):,} existing reference IDs")

    # Phase 4: Generate
    print(f"\n[4/5] Generating transactions for {len(generation_plan)} users...")
    all_transactions = []
    for i, (uid, name, target) in enumerate(generation_plan):
        weekly_counts = distribute_across_weeks(target)
        txns = generate_transactions_for_user(uid, weekly_counts, patterns,
                                              used_ref_ids)
        all_transactions.extend(txns)
        if (i + 1) % 200 == 0 or i == len(generation_plan) - 1:
            print(f"  Users: {i+1}/{len(generation_plan)}, "
                  f"txns: {len(all_transactions):,}")

    print(f"  Total generated: {len(all_transactions):,}")

    # Insert
    inserted = bulk_insert(cursor, conn, all_transactions, dry_run=dry_run)

    # Phase 5: Validate (sample of 20 random users)
    if not dry_run:
        print(f"\n[5/5] Validating (sample of 20 users)...")
        sample = random.sample(generation_plan, min(20, len(generation_plan)))
        sample_ids = [s[0] for s in sample]
        all_ok = validate_results(cursor, sample_ids)
    else:
        print(f"\n[5/5] Skipping validation (dry run)")
        print(f"  Run with --execute to insert "
              f"{len(all_transactions):,} transactions")
        all_ok = True

    cursor.close()
    conn.close()

    # Summary
    print("\n" + "=" * 60)
    print(f"  Mode           : {'DRY RUN' if dry_run else 'EXECUTED'}")
    print(f"  Target users   : {len(generation_plan)}")
    print(f"  Transactions   : "
          f"{inserted if not dry_run else len(all_transactions):,}")
    print(f"  Date range     : {COMPETITION_START} - {COMPETITION_END}")
    print(f"  Per user range : {TARGET_MIN}-{TARGET_MAX}")
    if not dry_run:
        print(f"  Validation     : {'All OK!' if all_ok else 'Some need checking'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
