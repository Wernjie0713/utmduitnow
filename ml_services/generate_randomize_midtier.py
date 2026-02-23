"""
Randomize Mid-Tier Rankings (Ranks #15-100+)
=============================================
Adds random extra transactions to users ranked #15 onwards so they don't
all have identical counts (1200, 150, 149). Creates a natural-looking
descending curve with random variation.

Usage:
    python generate_randomize_midtier.py           # Dry-run (default)
    python generate_randomize_midtier.py --execute  # Actually insert
"""

import mysql.connector
import numpy as np
import random
import string
import json
import argparse
from datetime import datetime, date, timedelta
from collections import defaultdict
from dataclasses import dataclass

# ── DB config ─────────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "database": "utmduitnow",
    "user": "root",
    "password": "",
}

# ── Competition period ────────────────────────────────────────────────────────
COMPETITION_START = date(2025, 9, 1)
COMPETITION_END = date(2025, 12, 28)
NUM_WEEKS = 17

BANK_CODES = [
    "RHBBMYKL", "TNGDMYNB", "MBBEMYKL", "PBBEMYKL",
    "CIBBMYKL", "HLBBMYKL", "BIMBMYKL", "AFBQMYKL",
]

MONTH_WEEKS = {
    "Sep": [0, 1, 2, 3],
    "Oct": [4, 5, 6, 7],
    "Nov": [8, 9, 10, 11, 12],
    "Dec": [13, 14, 15, 16],
}


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
    ref_id = f"MIDTIER{date_str}{random_digits(12)}"
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


def distribute_across_weeks(to_generate):
    weights = np.array([1 + min(i, NUM_WEEKS - 1 - i) for i in range(NUM_WEEKS)],
                       dtype=float)
    weights += np.random.uniform(0.5, 1.5, NUM_WEEKS)
    weights = weights / weights.sum()
    weekly = np.random.multinomial(to_generate, weights)

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
                        src = random.choice(donor_candidates)
                        dst = random.choice(week_indices)
                        weekly[src] -= 1
                        weekly[dst] += 1
                        deficit -= 1
                if deficit <= 0:
                    break
    return weekly.tolist()


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
            hours = np.random.choice(24, size=int(day_count), p=patterns.hour_distribution)
            amounts = random.choices(patterns.amounts, k=int(day_count))
            for h, amt in zip(hours, amounts):
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                txn_dt = datetime(day.year, day.month, day.day, int(h), minute, second)
                fmt = pick_ref_format(patterns.ref_id_format_probs)
                ref_id = generate_ref_id(day, fmt, used_ref_ids)
                receipt = generate_receipt_path(user_id, txn_dt)
                ocr = generate_ocr_text(ref_id, txn_dt, amt)
                parsed = generate_parsed_data(ref_id, txn_dt, amt)
                submitted_at = txn_dt + timedelta(minutes=random.randint(1, 5))
                approved_at = txn_dt + timedelta(minutes=random.randint(6, 15))
                transactions.append((
                    user_id, ref_id,
                    day.strftime('%Y-%m-%d'), txn_dt.strftime('%H:%M:%S'),
                    round(amt, 2), receipt, ocr, parsed, 'approved',
                    submitted_at, approved_at, submitted_at, approved_at,
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


# ── Phase 1: Identify target users (ranks #15 onwards) ──────────────────────

def identify_target_users(cursor, skip_top=14):
    """Get all ranked users from rank #15 onwards."""
    cursor.execute("""
        SELECT u.id AS user_id, u.name, u.matric_no,
               COUNT(t.id) AS txn_count
        FROM users u
        INNER JOIN transactions t ON t.user_id = u.id AND t.status = 'approved'
        WHERE u.matric_no IS NOT NULL AND u.matric_no != ''
          AND u.matric_no != 'ADMIN00000'
        GROUP BY u.id, u.name, u.matric_no
        ORDER BY txn_count DESC
    """)
    rows = cursor.fetchall()
    if len(rows) <= skip_top:
        return []
    return rows[skip_top:]


# ── Phase 2: Learn Global Patterns ──────────────────────────────────────────

def learn_global_patterns(cursor):
    cursor.execute("""
        SELECT user_id, COUNT(*) as cnt
        FROM transactions WHERE status = 'approved'
        GROUP BY user_id HAVING cnt >= 50
    """)
    active_users = cursor.fetchall()
    active_ids = [r['user_id'] for r in active_users]
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

    total_refs = sum(ref_formats.values())
    format_probs = {k: v / total_refs for k, v in ref_formats.items()}

    return GlobalPatterns(
        hour_distribution=normalize_distribution(hour_hist),
        dow_distribution=normalize_distribution(dow_hist),
        amounts=amounts,
        ref_id_format_probs=format_probs,
        active_user_count=len(active_ids),
        total_transactions_learned=len(rows),
    )


# ── Phase 3: Compute random boost targets ────────────────────────────────────

def compute_random_targets(target_users):
    """
    Assign random extra transactions so rankings look natural.
    Strategy: sort by current count desc, then for each user assign a
    random new total that's higher than current but decreasing overall.

    - Ranks 15-53 (currently ~1200): boost to 1200-1800 with random spread
    - Ranks 54-82 (currently ~150): boost to 400-1100 with descending trend
    - Ranks 83+ (currently ~149): boost to 160-400 with descending trend
    """
    plan = []
    n = len(target_users)

    for i, user in enumerate(target_users):
        existing = user['txn_count']
        rank = i + 15  # actual rank (0-indexed i + skip_top + 1)

        if existing >= 1000:
            # Ranks 15-53 cluster (currently all 1200)
            # Give each a random boost of 0-600 extra, with slight downward trend
            position_factor = 1.0 - (i / max(39, 1)) * 0.5  # 1.0 down to 0.5
            extra = int(random.randint(50, 600) * position_factor)
            # Add noise so not perfectly ordered
            extra += random.randint(-30, 30)
            extra = max(10, extra)
        elif existing >= 148:
            # Ranks 54-82+ cluster (currently 149-150)
            # Boost to somewhere between 400-1100, descending
            cluster_start = i - 39 if i >= 39 else 0  # position within this cluster
            cluster_size = n - 39 if n > 39 else n
            # Descending from ~1100 to ~160
            base_target = int(1100 - (cluster_start / max(cluster_size, 1)) * 900)
            noise = random.randint(-80, 80)
            target_total = max(existing + 20, base_target + noise)
            extra = target_total - existing
        else:
            # Very low users, small random boost
            extra = random.randint(10, 100)

        if extra > 0:
            plan.append((
                user['user_id'],
                user['name'],
                existing,
                existing + extra,
                extra,
            ))

    return plan


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Randomize mid-tier rankings (ranks #15+)")
    parser.add_argument("--execute", action="store_true",
                        help="Actually insert (default is dry-run)")
    args = parser.parse_args()
    dry_run = not args.execute

    print("=" * 60)
    print("Mid-Tier Rankings Randomizer")
    print(f"Mode: {'DRY RUN' if dry_run else 'EXECUTE'}")
    print("=" * 60)

    print("\n[1/6] Connecting and identifying target users (ranks #15+)...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    target_users = identify_target_users(cursor)
    print(f"  Found {len(target_users)} users from rank #15 onwards")

    if not target_users:
        print("  No target users found. Exiting.")
        cursor.close()
        conn.close()
        return

    print("\n[2/6] Learning global patterns from active users...")
    patterns = learn_global_patterns(cursor)
    if not patterns:
        print("  No active users found to learn from. Exiting.")
        cursor.close()
        conn.close()
        return
    print(f"  Learned from {patterns.active_user_count} active users, "
          f"{patterns.total_transactions_learned:,} transactions")

    print("\n[3/6] Computing random boost targets...")
    generation_plan = compute_random_targets(target_users)
    total_to_generate = sum(g[4] for g in generation_plan)
    print(f"  Will generate {total_to_generate:,} new transactions for "
          f"{len(generation_plan)} users")

    # Show first 30 and last 10
    print(f"\n  {'Rank':>4}  {'User ID':>8}  {'Name':>30}  {'Current':>8}  "
          f"{'New Total':>9}  {'+ Extra':>8}")
    print(f"  {'─'*4}  {'─'*8}  {'─'*30}  {'─'*8}  {'─'*9}  {'─'*8}")
    for idx, (uid, name, existing, target, extra) in enumerate(generation_plan):
        rank = idx + 15
        if idx < 30 or idx >= len(generation_plan) - 10:
            display_name = (name[:27] + "...") if len(name) > 30 else name
            print(f"  {rank:>4}  {uid:>8}  {display_name:>30}  {existing:>8}  "
                  f"{target:>9}  +{extra:>7}")
        elif idx == 30:
            print(f"  ... ({len(generation_plan) - 40} more users) ...")

    print(f"\n[4/6] Loading existing reference IDs...")
    cursor.execute("SELECT reference_id FROM transactions")
    used_ref_ids = {row['reference_id'] for row in cursor.fetchall()}
    print(f"  Loaded {len(used_ref_ids):,} existing reference IDs")

    print(f"\n[5/6] Generating transactions...")
    all_transactions = []
    for i, (uid, name, existing, target, extra) in enumerate(generation_plan):
        weekly_counts = distribute_across_weeks(extra)
        txns = generate_transactions_for_user(uid, weekly_counts, patterns,
                                              used_ref_ids)
        all_transactions.extend(txns)
        if (i + 1) % 50 == 0 or i == len(generation_plan) - 1:
            print(f"  Users: {i+1}/{len(generation_plan)}, "
                  f"txns so far: {len(all_transactions):,}")

    print(f"  Total generated: {len(all_transactions):,}")

    inserted = bulk_insert(cursor, conn, all_transactions, dry_run=dry_run)

    if not dry_run:
        print(f"\n[6/6] Validating sample results...")
        # Show top 20 of our targets after insert
        sample_ids = [g[0] for g in generation_plan[:20]]
        placeholders = ','.join(['%s'] * len(sample_ids))
        cursor.execute(f"""
            SELECT user_id, COUNT(*) as total
            FROM transactions WHERE status = 'approved' AND user_id IN ({placeholders})
            GROUP BY user_id ORDER BY total DESC
        """, sample_ids)
        rows = cursor.fetchall()
        print(f"\n  Sample verification (first 20 users):")
        for row in rows:
            print(f"    User #{row['user_id']}: {row['total']} txns")
    else:
        print(f"\n[6/6] Skipping validation (dry run)")
        print(f"  Run with --execute to insert "
              f"{len(all_transactions):,} transactions")

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print(f"  Mode           : {'DRY RUN' if dry_run else 'EXECUTED'}")
    print(f"  Target users   : {len(generation_plan)} (ranks #15+)")
    print(f"  Transactions   : "
          f"{inserted if not dry_run else len(all_transactions):,}")
    print(f"  Date range     : {COMPETITION_START} - {COMPETITION_END}")
    print("=" * 60)


if __name__ == "__main__":
    main()
