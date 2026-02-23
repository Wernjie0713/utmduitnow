"""
New Student + Transaction Generator
====================================
Creates 4,000 new Malaysian student users with realistic profiles and
generates 50-150 transactions per user across Sep-Dec 2025.
Learns patterns from existing data (excluding top 20 users).

Usage:
    python generate_new_students.py           # Dry-run (default)
    python generate_new_students.py --execute  # Actually insert
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

# ── Config ───────────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "database": "utmduitnow",
    "user": "root",
    "password": "",
}

NUM_NEW_USERS = 4000
TXN_MIN = 50
TXN_MAX = 150
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

# ── Competition weeks ────────────────────────────────────────────────────────
COMPETITION_WEEKS = []
for _w in range(NUM_WEEKS):
    _ws = COMPETITION_START + timedelta(weeks=_w)
    COMPETITION_WEEKS.append((_ws, _ws + timedelta(days=6)))

# ── Faculty mapping ──────────────────────────────────────────────────────────
FACULTY_CODES = {
    1: "KA", 2: "KT", 3: "KM", 4: "KE", 5: "EC", 6: "AI", 7: "FS",
    8: "AB", 9: "SH", 10: "FM", 11: "JI", 12: "IB", 13: "HP", 14: "SP",
}
FACULTY_WEIGHTS = {
    5: 45, 4: 14, 7: 11, 14: 11, 3: 8, 6: 5,
    1: 4, 2: 4, 8: 4, 9: 3, 13: 2, 10: 2, 11: 2, 12: 1,
}
YEAR_WEIGHTS = {3: 48, 1: 27, 2: 23, 4: 2}
ENTRY_YEARS = {1: "A25", 2: "A24", 3: "A23", 4: "A22"}

# ── Name pools (from MassiveDemoDataSeeder) ──────────────────────────────────
CHINESE_SURNAMES = [
    "LIM", "TAN", "WONG", "LEE", "ONG", "NG", "CHAN", "CHONG", "GOH", "TEO",
    "LOW", "KHOO", "YEO", "KOH", "ANG", "CHIN", "TAY", "SEAH", "SOH", "SIM",
    "OOI", "CHEW", "KOAY", "CHIA", "FONG", "HOO", "LUI", "MAH", "SIA", "YAP",
]
CHINESE_GIVEN = [
    "WEI MING", "XIAO HUI", "KAR WAI", "SHU YI", "YONG KANG", "MEI LING",
    "JIA WEI", "PEI SAN", "WEI JIE", "HUI MIN", "JUN HAO", "YI XUAN",
    "KHAI YANG", "SU YEN", "ZI HAO", "MEI XUAN", "WEN HAO", "YI LING",
    "JUN KIAT", "PEI QI", "KAI XIANG", "YU TING", "WEI XIAN", "MEI YAN",
    "ZI JIAN", "QI XIN", "YONG SHENG", "HUI XIAN", "JIA YI", "SHU EN",
]
MALAY_FIRST = [
    "MUHAMMAD", "AHMAD", "MOHD", "SITI", "NUR", "NURUL", "AISYAH", "FATIMAH",
    "AMIR", "DANIEL", "DANISH", "FAIZ", "HAKIMI", "IRFAN", "SYAFIQ",
    "AINA", "AMIRA", "BALQIS", "HANNAH", "INSYIRAH", "MAISARAH", "QISTINA",
]
MALAY_GIVEN = [
    "AMIN BIN AHMAD", "NURHALIZA BINTI ABDULLAH", "HAKIMI BIN HASSAN",
    "AISYAH BINTI ISMAIL", "FAIZ BIN RAHMAN", "HUDA BINTI YUSOF",
    "DANISH BIN IBRAHIM", "SARAH BINTI OMAR", "SYAFIQ BIN ALI",
    "AZLINA BINTI MOHD", "AZIM BIN ZAKARIA", "IZZAH BINTI HASHIM",
    "ARIFF BIN AZMI", "ZAHRA BINTI KAMAL", "FIRDAUS BIN YUSRI",
    "AISYAH BINTI RAZAK", "HAZIQ BIN ZAINAL", "SYAZWANI BINTI MANSOR",
    "HAKIM BIN SAID", "FARHANA BINTI ZULKIFLI", "IRFAN BIN KADIR",
    "KHADIJAH BINTI HAMID", "FIKRI BIN AZIZ", "SYAHIRAH BINTI ROSLI",
]
INDIAN_GIVEN = ["ARUN", "DINESH", "MUTHU", "PRAKASH", "VENU", "DIVYA", "LAKSHMI", "SHANTI"]
INDIAN_SURNAMES = [
    "KUMAR", "RAJ", "DEVI", "LAKSHMANAN", "SURESH", "RAVI", "SANJAY", "VIJAY",
    "PRIYA", "KAVITHA", "NISHA", "DEEPA", "ARJUN", "KARTHIK", "SELVAM", "GANESH",
]
INDIAN_PARENT = ["RAMAN", "KRISHNAN", "SELVAM", "NAIDU"]


# ── Dataclass ────────────────────────────────────────────────────────────────
@dataclass
class GlobalPatterns:
    hour_distribution: np.ndarray
    dow_distribution: np.ndarray
    amounts: list
    ref_id_format_probs: dict


# ── Utility helpers ──────────────────────────────────────────────────────────

def weighted_choice(weights_dict):
    items = list(weights_dict.keys())
    weights = list(weights_dict.values())
    return random.choices(items, weights=weights, k=1)[0]


def random_digits(n):
    return ''.join(random.choices(string.digits, k=n))


def random_hex(n):
    return ''.join(random.choices('0123456789abcdef', k=n))


def normalize_distribution(arr):
    total = arr.sum()
    if total == 0:
        return np.ones(len(arr)) / len(arr)
    return arr / total


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
    ref_id = f"NEW{date_str}{random_digits(12)}"
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
    txn_types = ["DuitNow QR", "DuitNow Transfer", "Bank Transfer",
                 "Online Payment", "P2P Transfer"]
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


# ── User Generation ──────────────────────────────────────────────────────────

def generate_name():
    """Generate a realistic Malaysian student name."""
    r = random.randint(1, 100)
    if r <= 70:
        return f"{random.choice(CHINESE_SURNAMES)} {random.choice(CHINESE_GIVEN)}"
    elif r <= 90:
        return f"{random.choice(MALAY_FIRST)} {random.choice(MALAY_GIVEN)}"
    else:
        given = random.choice(INDIAN_GIVEN)
        surname = random.choice(INDIAN_SURNAMES)
        parent = random.choice(INDIAN_PARENT)
        return f"{given} {surname} A/L {parent}"


def generate_email(name, used_emails):
    """Generate unique @graduate.utm.my email from name."""
    parts = name.lower().replace("/", "").replace("  ", " ").split()
    base = "".join(p for p in parts[:2] if p not in ("a", "l", "bin", "binti"))
    base = ''.join(c for c in base if c.isalnum())
    email = f"{base}@graduate.utm.my"
    if email not in used_emails:
        used_emails.add(email)
        return email
    for i in range(1, 10000):
        email = f"{base}{i}@graduate.utm.my"
        if email not in used_emails:
            used_emails.add(email)
            return email
    return email


def generate_matric(year_of_study, faculty_id, used_matrics):
    """Generate unique matric number."""
    entry = ENTRY_YEARS[year_of_study]
    code = FACULTY_CODES[faculty_id]
    for _ in range(1000):
        num = random.randint(0, 9999)
        matric = f"{entry}{code}{num:04d}"
        if matric not in used_matrics:
            used_matrics.add(matric)
            return matric
    matric = f"{entry}{code}{random.randint(10000, 99999)}"
    used_matrics.add(matric)
    return matric


def generate_duitnow_id(used_ids):
    """Generate unique DuitNow ID."""
    for _ in range(1000):
        if random.random() < 0.7:
            did = random_digits(12)
        else:
            did = f"+601{random.randint(0,9)}{random.randint(10000000,99999999)}"
        if did not in used_ids:
            used_ids.add(did)
            return did
    did = random_digits(12)
    used_ids.add(did)
    return did


def generate_users(count, used_emails, used_matrics, used_duitnow_ids, password_hash, now_str):
    """Generate user record dicts."""
    users = []
    for _ in range(count):
        name = generate_name()
        faculty_id = weighted_choice(FACULTY_WEIGHTS)
        year = weighted_choice(YEAR_WEIGHTS)

        users.append({
            "name": name.upper(),
            "email": generate_email(name, used_emails),
            "email_verified_at": now_str,
            "password": password_hash,
            "phone_number": f"+601{random.randint(0,9)}{random.randint(10000000,99999999)}",
            "matric_no": generate_matric(year, faculty_id, used_matrics),
            "faculty_id": faculty_id,
            "year_of_study": year,
            "duitnow_id": generate_duitnow_id(used_duitnow_ids),
            "google_id": random_digits(21),
            "avatar_url": None,
            "profile_completed": 1,
            "has_seen_competition_announcement": 0,
            "is_suspicious": 0,
            "is_frozen": 0,
            "created_at": now_str,
            "updated_at": now_str,
        })
    return users


# ── Pattern Learning ─────────────────────────────────────────────────────────

def learn_patterns(cursor):
    """Learn transaction patterns from non-top-20 users."""
    # Find top 20 user IDs by transaction count
    cursor.execute("""
        SELECT user_id FROM (
            SELECT user_id, COUNT(*) as cnt FROM transactions
            WHERE status = 'approved' GROUP BY user_id ORDER BY cnt DESC LIMIT 20
        ) top20
    """)
    top20_ids = {r['user_id'] for r in cursor.fetchall()}

    # Get all other approved transactions
    if top20_ids:
        placeholders = ','.join(['%s'] * len(top20_ids))
        cursor.execute(f"""
            SELECT reference_id, transaction_date, transaction_time, amount
            FROM transactions
            WHERE status = 'approved' AND user_id NOT IN ({placeholders})
        """, list(top20_ids))
    else:
        cursor.execute("""
            SELECT reference_id, transaction_date, transaction_time, amount
            FROM transactions WHERE status = 'approved'
        """)

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

    # Filter to realistic amounts
    realistic = [a for a in amounts if 0.50 <= a <= 500.0]
    if len(realistic) < 100:
        realistic = amounts

    total_refs = sum(ref_formats.values())
    format_probs = {k: v / total_refs for k, v in ref_formats.items()}

    print(f"  Excluded top 20 users: {sorted(top20_ids)}")
    print(f"  Learned from {len(rows):,} transactions")
    print(f"  Realistic amounts: {len(realistic):,} "
          f"(RM{min(realistic):.2f} - RM{max(realistic):.2f})")

    return GlobalPatterns(
        hour_distribution=normalize_distribution(hour_hist),
        dow_distribution=normalize_distribution(dow_hist),
        amounts=realistic,
        ref_id_format_probs=format_probs,
    )


# ── Transaction Distribution & Generation ────────────────────────────────────

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
            all_months = sorted(MONTH_WEEKS.items(),
                                key=lambda m: sum(weekly[i] for i in m[1]),
                                reverse=True)
            for donor_name, donor_indices in all_months:
                if donor_name == month_name:
                    continue
                donor_total = sum(weekly[i] for i in donor_indices)
                steal = min(deficit, donor_total - min_per_month)
                if steal <= 0:
                    continue
                for _ in range(steal):
                    cands = [i for i in donor_indices if weekly[i] > 0]
                    if cands:
                        weekly[random.choice(cands)] -= 1
                        weekly[random.choice(week_indices)] += 1
                        deficit -= 1
                if deficit <= 0:
                    break
    return weekly.tolist()


def generate_transactions_for_user(user_id, target_count, patterns, used_ref_ids):
    weekly_counts = distribute_across_weeks(target_count)
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
                txn_dt = datetime(day.year, day.month, day.day,
                                  int(h), random.randint(0, 59),
                                  random.randint(0, 59))
                fmt = pick_ref_format(patterns.ref_id_format_probs)
                ref_id = generate_ref_id(day, fmt, used_ref_ids)
                receipt = generate_receipt_path(user_id, txn_dt)
                ocr = generate_ocr_text(ref_id, txn_dt, amt)
                parsed = generate_parsed_data(ref_id, txn_dt, amt)
                submitted_at = txn_dt + timedelta(minutes=random.randint(1, 5))
                approved_at = txn_dt + timedelta(minutes=random.randint(6, 15))

                transactions.append((
                    user_id, ref_id, day.strftime('%Y-%m-%d'),
                    txn_dt.strftime('%H:%M:%S'), round(amt, 2),
                    receipt, ocr, parsed, 'approved',
                    submitted_at, approved_at, submitted_at, approved_at,
                ))
    return transactions


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate new students with transactions")
    parser.add_argument("--execute", action="store_true",
                        help="Actually insert (default is dry-run)")
    parser.add_argument("--count", type=int, default=NUM_NEW_USERS,
                        help=f"Number of users to create (default {NUM_NEW_USERS})")
    args = parser.parse_args()
    dry_run = not args.execute
    user_count = args.count

    print("=" * 60)
    print("New Student + Transaction Generator")
    print(f"Mode: {'DRY RUN' if dry_run else 'EXECUTE'}")
    print(f"Users to create: {user_count:,}")
    print(f"Txns per user: {TXN_MIN}-{TXN_MAX}")
    print("=" * 60)

    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    # Phase 1: Load existing unique values
    print("\n[1/7] Loading existing data for uniqueness checks...")
    cursor.execute("SELECT email FROM users")
    used_emails = {r['email'] for r in cursor.fetchall()}
    cursor.execute("SELECT matric_no FROM users WHERE matric_no IS NOT NULL")
    used_matrics = {r['matric_no'] for r in cursor.fetchall()}
    cursor.execute("SELECT duitnow_id FROM users WHERE duitnow_id IS NOT NULL")
    used_duitnow = {r['duitnow_id'] for r in cursor.fetchall()}
    print(f"  Existing: {len(used_emails)} emails, {len(used_matrics)} matrics, "
          f"{len(used_duitnow)} duitnow IDs")

    # Phase 2: Learn patterns
    print("\n[2/7] Learning transaction patterns (excluding top 20)...")
    patterns = learn_patterns(cursor)

    # Phase 3: Generate user records
    print(f"\n[3/7] Generating {user_count:,} user records...")
    # Pre-computed bcrypt hash of 'password123' (compatible with Laravel Hash::make)
    password_hash = '$2y$12$zG32/Osyji/xtcfr3wdU7eZYtS1fL.cQE92pPa6v9DwV.TU9zchX6'
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    users = generate_users(user_count, used_emails, used_matrics,
                           used_duitnow, password_hash, now_str)
    print(f"  Generated {len(users):,} users")

    # Show sample
    for u in users[:5]:
        print(f"    {u['name']:<35} {u['matric_no']}  fac={u['faculty_id']}  "
              f"yr={u['year_of_study']}")
    print(f"    ... and {len(users) - 5} more")

    # Estimate transactions
    txn_targets = [random.randint(TXN_MIN, TXN_MAX) for _ in users]
    total_txns = sum(txn_targets)
    print(f"\n  Estimated transactions: ~{total_txns:,} "
          f"(avg {total_txns // len(users)} per user)")

    if dry_run:
        print(f"\n[DRY RUN] Would insert {len(users):,} users "
              f"and ~{total_txns:,} transactions.")
        print(f"  Run with --execute to proceed.")
        cursor.close()
        conn.close()
        print("\n" + "=" * 60)
        print(f"  Mode        : DRY RUN")
        print(f"  Users       : {len(users):,}")
        print(f"  Transactions: ~{total_txns:,}")
        print("=" * 60)
        return

    # Phase 4: Insert users
    print(f"\n[4/7] Inserting {len(users):,} users...")
    user_insert_sql = """
        INSERT INTO users (name, email, email_verified_at, password,
            phone_number, matric_no, faculty_id, year_of_study,
            duitnow_id, google_id, avatar_url, profile_completed,
            has_seen_competition_announcement, is_suspicious, is_frozen,
            created_at, updated_at)
        VALUES (%(name)s, %(email)s, %(email_verified_at)s, %(password)s,
            %(phone_number)s, %(matric_no)s, %(faculty_id)s, %(year_of_study)s,
            %(duitnow_id)s, %(google_id)s, %(avatar_url)s, %(profile_completed)s,
            %(has_seen_competition_announcement)s, %(is_suspicious)s, %(is_frozen)s,
            %(created_at)s, %(updated_at)s)
    """
    new_user_ids = []
    batch_size = 500
    for i in range(0, len(users), batch_size):
        batch = users[i:i + batch_size]
        for u in batch:
            cursor.execute(user_insert_sql, u)
            new_user_ids.append(cursor.lastrowid)
        conn.commit()
        print(f"  Users: {len(new_user_ids):,} / {len(users):,}", end='\r')
    print(f"  Users: {len(new_user_ids):,} / {len(users):,}  Done!")

    # Phase 5: Assign student roles
    print(f"\n[5/7] Assigning student roles...")
    role_sql = """
        INSERT INTO assigned_roles (role_id, entity_id, entity_type)
        VALUES (2, %s, 'App\\\\Models\\\\User')
    """
    for i in range(0, len(new_user_ids), batch_size):
        batch = new_user_ids[i:i + batch_size]
        cursor.executemany(role_sql, [(uid,) for uid in batch])
        conn.commit()
    print(f"  Assigned {len(new_user_ids):,} student roles")

    # Phase 6: Generate and insert transactions
    print(f"\n[6/7] Generating transactions...")
    cursor.execute("SELECT reference_id FROM transactions")
    used_ref_ids = {r['reference_id'] for r in cursor.fetchall()}
    print(f"  Loaded {len(used_ref_ids):,} existing reference IDs")

    txn_insert_sql = """
        INSERT INTO transactions
            (user_id, reference_id, transaction_date, transaction_time,
             amount, receipt_image_path, ocr_raw_text, parsed_data,
             status, submitted_at, approved_at, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    total_inserted = 0
    txn_batch = []
    for i, uid in enumerate(new_user_ids):
        target = random.randint(TXN_MIN, TXN_MAX)
        txns = generate_transactions_for_user(uid, target, patterns, used_ref_ids)
        txn_batch.extend(txns)

        # Flush batch when large enough
        if len(txn_batch) >= 2000:
            cursor.executemany(txn_insert_sql, txn_batch)
            conn.commit()
            total_inserted += len(txn_batch)
            txn_batch = []

        if (i + 1) % 500 == 0 or i == len(new_user_ids) - 1:
            print(f"  Users: {i+1}/{len(new_user_ids)}, "
                  f"txns inserted: {total_inserted + len(txn_batch):,}",
                  end='\r')

    # Flush remaining
    if txn_batch:
        cursor.executemany(txn_insert_sql, txn_batch)
        conn.commit()
        total_inserted += len(txn_batch)
    print(f"\n  Total transactions inserted: {total_inserted:,}")

    # Phase 7: Validation
    print(f"\n[7/7] Validating (sample of 20 users)...")
    sample_ids = random.sample(new_user_ids, min(20, len(new_user_ids)))
    placeholders = ','.join(['%s'] * len(sample_ids))
    cursor.execute(f"""
        SELECT user_id, COUNT(*) as total,
            SUM(CASE WHEN MONTH(transaction_date) = 9 THEN 1 ELSE 0 END) as sep_ct,
            SUM(CASE WHEN MONTH(transaction_date) = 10 THEN 1 ELSE 0 END) as oct_ct,
            SUM(CASE WHEN MONTH(transaction_date) = 11 THEN 1 ELSE 0 END) as nov_ct,
            SUM(CASE WHEN MONTH(transaction_date) = 12 THEN 1 ELSE 0 END) as dec_ct
        FROM transactions WHERE status = 'approved' AND user_id IN ({placeholders})
        GROUP BY user_id ORDER BY total DESC
    """, sample_ids)

    rows = cursor.fetchall()
    print(f"\n  {'User':>8}  {'Total':>6}  {'Sep':>5}  {'Oct':>5}  "
          f"{'Nov':>5}  {'Dec':>5}")
    print(f"  {'─'*8}  {'─'*6}  {'─'*5}  {'─'*5}  {'─'*5}  {'─'*5}")
    for row in rows:
        print(f"  #{row['user_id']:>7}  {int(row['total']):>6}  "
              f"{int(row['sep_ct'] or 0):>5}  {int(row['oct_ct'] or 0):>5}  "
              f"{int(row['nov_ct'] or 0):>5}  {int(row['dec_ct'] or 0):>5}")

    cursor.close()
    conn.close()

    # Summary
    print("\n" + "=" * 60)
    print(f"  Mode         : EXECUTED")
    print(f"  New users    : {len(new_user_ids):,}")
    print(f"  Transactions : {total_inserted:,}")
    print(f"  Date range   : {COMPETITION_START} - {COMPETITION_END}")
    print(f"  Per user     : {TXN_MIN}-{TXN_MAX}")
    print("=" * 60)


if __name__ == "__main__":
    main()
