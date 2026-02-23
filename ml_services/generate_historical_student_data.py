"""
Historical Student Transaction Generator
=========================================
Learns per-user transaction patterns from Nov 1 - Dec 28, 2025 competition
data and generates mirrored synthetic transactions for Sep-Oct 2025, so each
user has exactly the same performance in both periods.

Usage:
    pip install -r requirements.txt
    python generate_historical_student_data.py
"""

import mysql.connector
import numpy as np
import random
import string
import json
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

# ── Source period: Nov 1 – Dec 28, 2025 (8 competition weeks) ────────────────
SOURCE_START = date(2025, 11, 1)
SOURCE_END = date(2025, 12, 28)

SOURCE_WEEKS = [
    (date(2025, 11, 1),  date(2025, 11, 9)),   # Week 1 (9 days, special)
    (date(2025, 11, 10), date(2025, 11, 16)),   # Week 2
    (date(2025, 11, 17), date(2025, 11, 23)),   # Week 3
    (date(2025, 11, 24), date(2025, 11, 30)),   # Week 4
    (date(2025, 12, 1),  date(2025, 12, 7)),    # Week 5
    (date(2025, 12, 8),  date(2025, 12, 14)),   # Week 6
    (date(2025, 12, 15), date(2025, 12, 21)),   # Week 7
    (date(2025, 12, 22), date(2025, 12, 28)),   # Week 8
]

# ── Target period: Sep 1 – Oct 31, 2025 ─────────────────────────────────────
TARGET_START = date(2025, 9, 1)
TARGET_END = date(2025, 10, 31)

TARGET_WEEKS = [
    (date(2025, 9, 1),   date(2025, 9, 7)),    # maps to Source Week 1
    (date(2025, 9, 8),   date(2025, 9, 14)),    # maps to Source Week 2
    (date(2025, 9, 15),  date(2025, 9, 21)),    # maps to Source Week 3
    (date(2025, 9, 22),  date(2025, 9, 28)),    # maps to Source Week 4
    (date(2025, 9, 29),  date(2025, 10, 5)),    # maps to Source Week 5
    (date(2025, 10, 6),  date(2025, 10, 12)),   # maps to Source Week 6
    (date(2025, 10, 13), date(2025, 10, 19)),   # maps to Source Week 7
    (date(2025, 10, 20), date(2025, 10, 26)),   # maps to Source Week 8
    (date(2025, 10, 27), date(2025, 10, 31)),   # remainder (5 days)
]

BANK_CODES = [
    "RHBBMYKL", "TNGDMYNB", "MBBEMYKL", "PBBEMYKL",
    "CIBBMYKL", "HLBBMYKL", "BIMBMYKL", "AFBQMYKL",
]

# ── UserProfile dataclass ────────────────────────────────────────────────────

@dataclass
class UserProfile:
    user_id: int
    total_count: int = 0
    weekly_counts: list = field(default_factory=lambda: [0] * 8)
    hour_distribution: np.ndarray = field(default_factory=lambda: np.ones(24) / 24)
    dow_distribution: np.ndarray = field(default_factory=lambda: np.ones(7) / 7)
    amounts: list = field(default_factory=list)
    ref_id_formats: dict = field(default_factory=dict)


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_source_week_index(txn_date):
    """Return which source week (0-7) a date falls into, or -1."""
    for i, (start, end) in enumerate(SOURCE_WEEKS):
        if start <= txn_date <= end:
            return i
    return -1


def classify_ref_id_format(ref_id):
    """Classify a reference ID into a format bucket."""
    if not ref_id:
        return "other"
    if "RHBBMYKL" in ref_id:
        return "RHBBMYKL"
    if "TNGDMYNB" in ref_id:
        return "TNGDMYNB"
    if "MBBEMYKL" in ref_id:
        return "MBBEMYKL"
    if "PBBEMYKL" in ref_id:
        return "PBBEMYKL"
    if "CIBBMYKL" in ref_id:
        return "CIBBMYKL"
    if "HLBBMYKL" in ref_id:
        return "HLBBMYKL"
    if "BIMBMYKL" in ref_id:
        return "BIMBMYKL"
    if "AFBQMYKL" in ref_id:
        return "AFBQMYKL"
    if ref_id.startswith("P"):
        return "P_prefix"
    if ref_id.startswith("QR"):
        return "QR_prefix"
    if ref_id.isdigit():
        return "numeric"
    return "other"


def normalize_distribution(arr):
    """Normalize array to probability distribution, handling all-zero case."""
    total = arr.sum()
    if total == 0:
        return np.ones(len(arr)) / len(arr)
    return arr / total


# ── Learning Phase ────────────────────────────────────────────────────────────

def learn_user_patterns(cursor):
    """Query Nov-Dec approved transactions and build per-user profiles."""
    cursor.execute("""
        SELECT user_id, reference_id, transaction_date, transaction_time, amount
        FROM transactions
        WHERE status = 'approved'
          AND transaction_date >= %s
          AND transaction_date <= %s
        ORDER BY user_id, transaction_date, transaction_time
    """, (SOURCE_START.isoformat(), SOURCE_END.isoformat()))

    rows = cursor.fetchall()
    if not rows:
        return {}

    # Group rows by user_id
    user_rows = defaultdict(list)
    for row in rows:
        user_rows[row['user_id']].append(row)

    profiles = {}
    for user_id, txns in user_rows.items():
        profile = UserProfile(user_id=user_id)
        profile.total_count = len(txns)

        hour_hist = np.zeros(24)
        dow_hist = np.zeros(7)
        weekly_counts = [0] * 8
        ref_formats = defaultdict(int)

        for txn in txns:
            txn_date = txn['transaction_date']
            if isinstance(txn_date, str):
                txn_date = date.fromisoformat(txn_date)

            txn_time = txn['transaction_time']
            if isinstance(txn_time, timedelta):
                hour = int(txn_time.total_seconds() // 3600)
            elif isinstance(txn_time, str):
                hour = int(txn_time.split(':')[0])
            else:
                hour = 12

            hour_hist[hour] += 1
            dow_hist[txn_date.weekday()] += 1

            week_idx = get_source_week_index(txn_date)
            if week_idx >= 0:
                weekly_counts[week_idx] += 1

            profile.amounts.append(float(txn['amount']))
            ref_formats[classify_ref_id_format(txn['reference_id'])] += 1

        profile.weekly_counts = weekly_counts
        profile.hour_distribution = normalize_distribution(hour_hist)
        profile.dow_distribution = normalize_distribution(dow_hist)

        # Convert ref format counts to probabilities
        total_refs = sum(ref_formats.values())
        profile.ref_id_formats = {k: v / total_refs for k, v in ref_formats.items()}

        profiles[user_id] = profile

    return profiles


# ── Generation Helpers ────────────────────────────────────────────────────────

def random_digits(n):
    return ''.join(random.choices(string.digits, k=n))


def random_hex(n):
    return ''.join(random.choices('0123456789abcdef', k=n))


def pick_ref_format(format_probs):
    """Pick a reference ID format based on learned probabilities."""
    formats = list(format_probs.keys())
    probs = list(format_probs.values())
    return np.random.choice(formats, p=probs)


def generate_ref_id(txn_date, format_type, used_ref_ids):
    """Generate a unique reference ID in the given format."""
    date_str = txn_date.strftime("%Y%m%d")
    max_attempts = 100

    for _ in range(max_attempts):
        if format_type == "RHBBMYKL":
            ref_id = f"{date_str}RHBBMYKL040OQR{random_digits(8)}"
        elif format_type == "TNGDMYNB":
            variant = random.choice(["010ORM", "01OORM", "0100RM", "0300QR", "040OQR"])
            ref_id = f"{date_str}TNGDMYNB{variant}{random_digits(8)}"
        elif format_type in ("MBBEMYKL", "PBBEMYKL", "CIBBMYKL", "HLBBMYKL", "BIMBMYKL", "AFBQMYKL"):
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

    # Fallback: guaranteed unique
    ref_id = f"HIST{date_str}{random_digits(12)}"
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
    data = {
        "reference_id": ref_id,
        "date": txn_dt.strftime("%Y-%m-%d"),
        "time": txn_dt.strftime("%H:%M:%S"),
        "amount": amount,
        "transaction_type": random.choice(txn_types),
    }
    return json.dumps(data)


# ── Per-User Transaction Generation ──────────────────────────────────────────

def dates_in_range(start, end):
    """Return list of dates from start to end inclusive."""
    days = []
    current = start
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days


def generate_transactions_for_user(profile, used_ref_ids):
    """Generate Sep-Oct transactions mirroring this user's Nov-Dec patterns."""
    transactions = []

    for week_idx, (tw_start, tw_end) in enumerate(TARGET_WEEKS):
        # Determine how many transactions for this target week
        if week_idx < 8:
            week_count = profile.weekly_counts[week_idx]
        else:
            # Remainder week (Oct 27-31): proportional from last source week
            last_week_count = profile.weekly_counts[7]
            source_last_days = 7  # Dec 22-28
            target_remainder_days = 5  # Oct 27-31
            week_count = round(last_week_count * target_remainder_days / source_last_days)

        if week_count == 0:
            continue

        # Get days in this target week and their weekday indices
        week_days = dates_in_range(tw_start, tw_end)
        dow_indices = [d.weekday() for d in week_days]

        # Build day-of-week probabilities for just the days in this week
        day_probs = np.array([profile.dow_distribution[d] for d in dow_indices])
        day_probs = normalize_distribution(day_probs)

        # Distribute transactions across days
        daily_counts = np.random.multinomial(week_count, day_probs)

        for day, count in zip(week_days, daily_counts):
            if count == 0:
                continue

            # Sample hours from user's hour distribution
            hours = np.random.choice(24, size=int(count), p=profile.hour_distribution)

            # Sample amounts from user's raw amounts (with replacement)
            amounts = random.choices(profile.amounts, k=int(count))

            # Pick ref_id format for each transaction
            for h, amt in zip(hours, amounts):
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                txn_dt = datetime(day.year, day.month, day.day, int(h), minute, second)

                fmt = pick_ref_format(profile.ref_id_formats)
                ref_id = generate_ref_id(day, fmt, used_ref_ids)
                receipt = generate_receipt_path(profile.user_id, txn_dt)
                ocr = generate_ocr_text(ref_id, txn_dt, amt)
                parsed = generate_parsed_data(ref_id, txn_dt, amt)

                submitted_at = txn_dt + timedelta(minutes=random.randint(1, 5))
                approved_at = txn_dt + timedelta(minutes=random.randint(6, 15))

                transactions.append((
                    profile.user_id,
                    ref_id,
                    day.strftime('%Y-%m-%d'),
                    txn_dt.strftime('%H:%M:%S'),
                    round(amt, 2),
                    receipt,
                    ocr,
                    parsed,
                    'approved',
                    submitted_at,
                    approved_at,
                    submitted_at,  # created_at
                    approved_at,   # updated_at
                ))

    return transactions


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Historical Student Transaction Generator")
    print("Learn from Nov-Dec 2025 → Generate Sep-Oct 2025")
    print("=" * 60)

    # ── Step 1: Connect ──────────────────────────────────────────────────────
    print("\n[1/6] Connecting to database...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    print("  Connected.")

    # ── Step 2: Check & clean existing Sep-Oct data ──────────────────────────
    print("\n[2/6] Checking existing Sep-Oct 2025 data...")
    cursor.execute("""
        SELECT COUNT(*) as cnt FROM transactions
        WHERE transaction_date >= %s AND transaction_date <= %s
    """, (TARGET_START.isoformat(), TARGET_END.isoformat()))
    existing = cursor.fetchone()['cnt']

    if existing > 0:
        print(f"  Found {existing:,} existing transactions in Sep 1 - Oct 31, 2025.")
        answer = input("  Delete them before generating? [y/N]: ").strip().lower()
        if answer == 'y':
            cursor.execute("""
                DELETE FROM transactions
                WHERE transaction_date >= %s AND transaction_date <= %s
            """, (TARGET_START.isoformat(), TARGET_END.isoformat()))
            conn.commit()
            print(f"  Deleted {existing:,} transactions.")
        else:
            print("  Aborted. Cannot generate with existing data (reference_id collisions).")
            cursor.close()
            conn.close()
            return
    else:
        print("  No existing Sep-Oct data found. Good to go.")

    # ── Step 3: Learn patterns ───────────────────────────────────────────────
    print("\n[3/6] Learning patterns from Nov-Dec 2025 data...")
    profiles = learn_user_patterns(cursor)

    if not profiles:
        print("  No approved transactions found in Nov-Dec 2025. Nothing to learn.")
        cursor.close()
        conn.close()
        return

    total_source = sum(p.total_count for p in profiles.values())
    print(f"  Found {total_source:,} transactions across {len(profiles)} users.")
    top_user = max(profiles.values(), key=lambda p: p.total_count)
    print(f"  Top user: #{top_user.user_id} with {top_user.total_count} transactions.")

    # ── Step 4: Generate transactions ────────────────────────────────────────
    print("\n[4/6] Generating Sep-Oct 2025 transactions...")

    # Load all existing reference_ids for uniqueness
    cursor.execute("SELECT reference_id FROM transactions")
    used_ref_ids = {row['reference_id'] for row in cursor.fetchall()}
    print(f"  Loaded {len(used_ref_ids):,} existing reference IDs.")

    all_transactions = []
    for i, (user_id, profile) in enumerate(profiles.items()):
        txns = generate_transactions_for_user(profile, used_ref_ids)
        all_transactions.extend(txns)
        if (i + 1) % 50 == 0 or i == len(profiles) - 1:
            print(f"  Users processed: {i + 1}/{len(profiles)}, "
                  f"transactions so far: {len(all_transactions):,}")

    print(f"  Total generated: {len(all_transactions):,} transactions")

    # ── Step 5: Bulk insert ──────────────────────────────────────────────────
    print("\n[5/6] Inserting into database...")
    batch_size = 1000
    inserted = 0

    insert_sql = """
        INSERT INTO transactions
            (user_id, reference_id, transaction_date, transaction_time,
             amount, receipt_image_path, ocr_raw_text, parsed_data,
             status, submitted_at, approved_at, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    for i in range(0, len(all_transactions), batch_size):
        batch = all_transactions[i:i + batch_size]
        cursor.executemany(insert_sql, batch)
        conn.commit()
        inserted += len(batch)
        print(f"  {inserted:,} / {len(all_transactions):,}", end='\r')

    print(f"  {inserted:,} / {len(all_transactions):,}  Done!")

    # ── Step 6: Validate ─────────────────────────────────────────────────────
    print("\n[6/6] Validating results...")
    cursor.execute("""
        SELECT user_id,
            SUM(CASE WHEN transaction_date >= '2025-11-01'
                      AND transaction_date <= '2025-12-28' THEN 1 ELSE 0 END) as nov_dec,
            SUM(CASE WHEN transaction_date >= '2025-09-01'
                      AND transaction_date <= '2025-10-31' THEN 1 ELSE 0 END) as sep_oct
        FROM transactions
        WHERE status = 'approved'
        GROUP BY user_id
        HAVING nov_dec > 0 OR sep_oct > 0
        ORDER BY nov_dec DESC
        LIMIT 20
    """)

    rows = cursor.fetchall()
    all_match = True
    print(f"\n  {'User':>8}  {'Nov-Dec':>8}  {'Sep-Oct':>8}  {'Match':>6}")
    print(f"  {'─' * 8}  {'─' * 8}  {'─' * 8}  {'─' * 6}")
    for row in rows:
        nd = int(row['nov_dec'] or 0)
        so = int(row['sep_oct'] or 0)
        match = "✓" if abs(nd - so) <= max(1, nd * 0.1) else "~"
        if abs(nd - so) > max(1, nd * 0.1):
            all_match = False
        print(f"  #{row['user_id']:>7}  {nd:>8}  {so:>8}  {match:>6}")

    if len(rows) < len(profiles):
        print(f"  ... and {len(profiles) - len(rows)} more users")

    cursor.close()
    conn.close()

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"  Source users   : {len(profiles)}")
    print(f"  Source txns    : {total_source:,} (Nov-Dec 2025)")
    print(f"  Generated txns : {inserted:,} (Sep-Oct 2025)")
    print(f"  Match status   : {'All match!' if all_match else 'Some variance (expected with remainder week)'}")
    print("=" * 60)
    print("\n  WARNING: The artisan command 'competition:clean-pre-competition-data'")
    print("  deletes transactions with transaction_date < 2025-09-01.")
    print("  Transactions generated by this script will now be preserved as they are >= 2025-09-01.\n")


if __name__ == "__main__":
    main()
