"""
Synthetic Entrepreneur Transaction Generator
============================================
Learns time/day patterns from real Phase 1 transactions, creates 70 realistic
student entrepreneur business units, and generates synthetic transactions
that look like real DuitNow payment data. Top units get ~1K transactions
with total amount capped at RM 4K per unit.

Usage:
    pip install -r requirements.txt
    python generate_entrepreneur_data.py
"""

import mysql.connector
import numpy as np
import random
import string
from datetime import datetime, date, timedelta

# ── DB config ─────────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "database": "utmduitnow",
    "user": "root",
    "password": "",
}

# ── Business units ────────────────────────────────────────────────────────────
# 18 real student entrepreneur names + 17 generated in the same creative style
BUSINESSES = [
    # Real student businesses
    ("FlameyNeko", "online"),
    ("GoGeng", "online"),
    ("LemonCraft", "online"),
    ("FruitSeek", "online"),
    ("Trovebox", "online"),
    ("Thaispoon", "online"),
    ("ChipKind", "online"),
    ("Wheeliesweet", "online"),
    ("BunnyBox", "online"),
    ("Grab n Go", "online"),
    ("El Dorado", "online"),
    ("Legit Kitchen", "online"),
    ("Chill4Hope", "online"),
    ("Jigle Joy Gifts", "online"),
    ("Sabal Bilis Kruk", "online"),
    ("Maneehtingting", "online"),
    ("Quick Bites", "online"),
    ("Gebupop", "online"),
    # Generated in same creative branded style and localized flavor
    ("KopiKacang", "online"),
    ("AyamGuntingZip", "online"),
    ("ManisHati", "online"),
    ("CendolChill", "online"),
    ("NasiLemakBox", "online"),
    ("TakoyakiOppa", "online"),
    ("BurgerBro", "online"),
    ("MatchaMonyet", "online"),
    ("SatayStation", "online"),
    ("KuehKombi", "online"),
    ("Zestbox", "online"),
    ("Mellowbrew", "online"),
    ("Puffnest", "online"),
    ("Doughfolk", "online"),
    ("BobaBros", "online"),
    ("ChocoChurp", "online"),
    ("Snackwave", "online"),
    # Generated batch 2 (35 more)
    ("RotiRocket", "online"),
    ("MeeGorengMojo", "online"),
    ("PisangPeace", "online"),
    ("LaksamLove", "online"),
    ("KeropokKing", "online"),
    ("AirKatuk", "online"),
    ("NasiKandaqKrew", "online"),
    ("MurtabakMagic", "online"),
    ("PopiahPop", "online"),
    ("CurryPuffClub", "online"),
    ("IceBatu", "online"),
    ("WaffleLab", "online"),
    ("CrepeCorner", "online"),
    ("SmoothieSurf", "online"),
    ("PancakeParty", "online"),
    ("DonutDash", "online"),
    ("KayaToast Co", "online"),
    ("TehTarikTown", "online"),
    ("ApamBalikBoss", "online"),
    ("PutuPiring Co", "online"),
    ("OndehOndeh", "online"),
    ("KuihLapisLane", "online"),
    ("CheeseNaan Hub", "online"),
    ("RajaBeriani", "online"),
    ("SotoSensation", "online"),
    ("RendangRush", "online"),
    ("LemangLounge", "online"),
    ("KetupakKrew", "online"),
    ("AyamPercikPal", "online"),
    ("IkanBakarBay", "online"),
    ("SambalStation", "online"),
    ("TempeBites", "online"),
    ("JellyJoy", "online"),
    ("FrozenFiesta", "online"),
    ("SnackSiesta", "online"),
]

# Price profile per business type: (min, max, mean, std)
# Lower amounts so ~1K transactions stays under RM 4K total (avg ~RM 3-4/txn)
PRICE_PROFILES = {
    "snack":   (1.0,  6.0,  2.5,  1.0),
    "meal":    (2.0,  8.0,  4.0,  1.5),
    "drink":   (1.0,  5.0,  2.0,  0.8),
    "dessert": (1.5,  7.0,  3.0,  1.2),
    "frozen":  (2.0, 10.0,  5.0,  2.0),
    "gift":    (2.0,  8.0,  4.0,  2.0),
}

BUSINESS_PROFILES = [
    # Real 18
    "snack", "snack", "drink", "drink", "gift",
    "meal", "snack", "dessert", "gift", "meal",
    "meal", "meal", "drink", "gift", "snack",
    "snack", "meal", "dessert",
    # Generated 17
    "snack", "snack", "snack", "drink", "snack",
    "frozen", "snack", "snack", "snack", "meal",
    "drink", "drink", "dessert", "dessert", "dessert",
    "snack", "snack",
    # Generated batch 2 (35 more)
    "snack", "meal", "snack", "meal", "snack", "drink", "meal", "meal", "snack",
    "snack", "drink", "dessert", "dessert", "drink", "dessert", "dessert", "snack",
    "drink", "snack", "dessert", "dessert", "snack", "meal", "meal", "meal",
    "meal", "snack", "snack", "meal", "meal", "snack", "snack", "dessert",
    "frozen", "snack",
]

# Real hour-of-day counts from Phase 1 (learned from production data)
REAL_HOUR_COUNTS = [
    1009, 795, 565, 570, 623, 522,   # 0–5
    1605, 1608, 2081, 2684, 2373, 2632,  # 6–11
    2607, 3110, 2699, 2885, 2703, 2731,  # 12–17
    2570, 2985, 2638, 2570, 4158, 2931,  # 18–23
]

# Real day-of-week counts (MySQL DAYOFWEEK: 1=Sun,2=Mon,...,7=Sat)
REAL_DOW_COUNTS = {1: 6541, 2: 7947, 3: 7236, 4: 7827, 5: 7802, 6: 7933, 7: 6368}

BANK_CODES = [
    "RHBBMYKL", "TNGDMYNB", "MBBEMYKL", "PBBEMYKL",
    "CIBBMYKL", "HLBBMYKL", "BIMBMYKL", "AFBQMYKL",
]

COURSE_CODES = ["ULRS 3032"]
SECTIONS = ["40", "41", "42", "43", "44", "45"]

FIRST_NAMES = [
    "Ahmad", "Muhammad", "Nur", "Siti", "Nurul", "Amirul", "Hafiz",
    "Farah", "Liyana", "Aisyah", "Razif", "Azri", "Hana", "Sofea",
    "Izzat", "Nadia", "Fatin", "Anis", "Dina", "Rina",
]
LAST_NAMES = [
    "bin Abdullah", "binti Razak", "bin Ismail", "binti Hassan",
    "bin Zulkifli", "binti Aziz", "bin Kamaruddin", "binti Yusof",
    "bin Ibrahim", "binti Othman",
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def build_hourly_probs():
    arr = np.array(REAL_HOUR_COUNTS, dtype=float) + 1
    return arr / arr.sum()

def build_dow_probs():
    # Convert MySQL DOW (1=Sun..7=Sat) to Python weekday (0=Mon..6=Sun)
    # MySQL: 1=Sun,2=Mon,3=Tue,4=Wed,5=Thu,6=Fri,7=Sat
    # Python weekday: 0=Mon,1=Tue,2=Wed,3=Thu,4=Fri,5=Sat,6=Sun
    mapping = {2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6}
    arr = np.zeros(7)
    for mysql_dow, count in REAL_DOW_COUNTS.items():
        arr[mapping[mysql_dow]] = count
    arr += 1
    return arr / arr.sum()

def generate_ref_id(txn_date: date) -> str:
    """Match real format: YYYYMMDDBANKCODExxOQR/ORMxxxxxxxxxxx"""
    date_str = txn_date.strftime("%Y%m%d")
    bank = random.choice(BANK_CODES)
    prefix = f"{random.randint(10,99):02d}0"
    suffix = random.choice(["OQR", "ORM"])
    tail = ''.join(random.choices(string.digits, k=11))
    return f"{date_str}{bank}{prefix}{suffix}{tail}"

def generate_phone():
    prefix = random.choice(["011", "012", "013", "014", "016", "017", "018", "019"])
    return f"{prefix}{random.randint(10000000, 99999999)}"

def generate_matric():
    year = random.choice(["A22", "A23", "A24"])
    faculty = random.choice(["EC", "CS", "SE", "IS"])
    return f"{year}{faculty}{random.randint(1000, 9999):04d}"

def random_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}".upper()

def sample_amount(profile_key: str) -> float:
    mn, mx, mean, std = PRICE_PROFILES[profile_key]
    return round(float(np.clip(np.random.normal(mean, std), mn, mx)), 2)

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    now = datetime.now()

    print("=" * 60)
    print("Synthetic Entrepreneur Transaction Generator")
    print("=" * 60)

    # ── Step 1: Build probability distributions ───────────────────────────────
    print("\n[1/5] Building distributions from real Phase 1 patterns...")

    hourly_probs = build_hourly_probs()
    dow_probs = build_dow_probs()

    # Get date range from real data
    cursor.execute("""
        SELECT MIN(transaction_date) as mn, MAX(transaction_date) as mx
        FROM transactions WHERE status = 'approved'
    """)
    dr = cursor.fetchone()
    date_min = dr['mn'] if isinstance(dr['mn'], date) else date.fromisoformat(str(dr['mn']))
    date_max = dr['mx'] if isinstance(dr['mx'], date) else date.fromisoformat(str(dr['mx']))

    print(f"  Date range  : {date_min} → {date_max}")
    print(f"  Peak hours  : 13:00, 15:00–19:00, 22:00")
    print(f"  Busiest days: Mon–Sat (Sun slightly lower)")

    # ── Step 2: Resolve Bouncer shop role ─────────────────────────────────────
    print("\n[2/5] Resolving Bouncer 'shop' role...")
    cursor.execute("SELECT id FROM roles WHERE name = 'shop' LIMIT 1")
    role_row = cursor.fetchone()
    if not role_row:
        cursor.execute("INSERT INTO roles (name, title) VALUES ('shop', 'Shop')")
        conn.commit()
        shop_role_id = cursor.lastrowid
    else:
        shop_role_id = role_row['id']
    print(f"  shop role id={shop_role_id}")

    cursor.execute("SELECT id FROM faculties LIMIT 1")
    fac = cursor.fetchone()
    default_faculty_id = fac['id'] if fac else 1

    # ── Step 3: Create entrepreneur units ─────────────────────────────────────
    print(f"\n[3/5] Creating {len(BUSINESSES)} entrepreneur units...")

    # TRUNCATE all entrepreneur tables (IDs restart from 1)
    cursor.execute("SET FOREIGN_KEY_CHECKS=0")
    cursor.execute("TRUNCATE TABLE entrepreneur_transactions")
    cursor.execute("TRUNCATE TABLE entrepreneur_team_members")
    cursor.execute("TRUNCATE TABLE entrepreneur_duitnow_ids")
    cursor.execute("TRUNCATE TABLE entrepreneur_units")
    cursor.execute("SET FOREIGN_KEY_CHECKS=1")
    conn.commit()
    # Clean up generated shop users + their assigned_roles
    cursor.execute("DELETE FROM assigned_roles WHERE entity_id IN (SELECT id FROM users WHERE matric_no LIKE 'GEN%') AND entity_type = 'App\\\\Models\\\\User'")
    cursor.execute("DELETE FROM users WHERE matric_no LIKE 'GEN%'")
    conn.commit()

    unit_ids = []
    unit_profiles = []

    for i, (biz_name, biz_location) in enumerate(BUSINESSES):
        # Email: business name (lowercase, no spaces) + @gmail.com
        email_prefix = biz_name.lower().replace(" ", "").replace("'", "")
        email = f"{email_prefix}@gmail.com"
        phone = generate_phone()

        cursor.execute("""
            INSERT INTO users (name, email, password, matric_no, faculty_id, year_of_study,
                               duitnow_id, phone_number, email_verified_at, profile_completed,
                               created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            biz_name, email,
            "$2y$12$FAKEHASHDEMOONLYDOESNOTWORK.xxxxx",
            f"GEN{i+1:05d}", default_faculty_id, random.randint(1, 4),
            phone, phone, now, True, now, now
        ))
        user_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO assigned_roles (role_id, entity_id, entity_type, scope)
            VALUES (%s, %s, 'App\\\\Models\\\\User', NULL)
        """, (shop_role_id, user_id))

        cursor.execute("""
            INSERT INTO entrepreneur_units (business_name, business_location, course_code, section,
                                           manager_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (biz_name, biz_location, random.choice(COURSE_CODES), random.choice(SECTIONS), user_id, now, now))
        unit_id = cursor.lastrowid
        unit_ids.append(unit_id)
        unit_profiles.append(BUSINESS_PROFILES[i])

        # 5–10 team members
        for _ in range(random.randint(5, 10)):
            cursor.execute("""
                INSERT INTO entrepreneur_team_members (entrepreneur_unit_id, member_name, matric_no,
                                                       created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (unit_id, random_name(), generate_matric(), now, now))

        cursor.execute("""
            INSERT INTO entrepreneur_duitnow_ids (entrepreneur_unit_id, duitnow_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s)
        """, (unit_id, generate_phone(), now, now))

    conn.commit()
    print(f"  Total units: {len(unit_ids)}")

    # ── Step 4: Generate synthetic transactions ───────────────────────────────
    # Constraints:
    # - Date range from real approved transactions
    # - 70 units, top 1 ~1K txns, amounts capped at RM 4K per unit
    # - Distributed by real day-of-week weights
    # - Amounts: RM1–RM10 based on product type
    # - Reference IDs match real format
    print(f"\n[4/5] Generating synthetic transactions ({date_min} → {date_max})...")

    # Already truncated in Step 3

    # Build list of all dates with their dow index
    day_list = []
    current = date_min
    while current <= date_max:
        day_list.append(current)
        current += timedelta(days=1)

    # Precompute day weights
    day_weights = np.array([dow_probs[d.weekday()] for d in day_list])
    day_weights /= day_weights.sum()

    all_transactions = []
    used_ref_ids = set()

    # Assign transaction targets — more transactions, lower amounts
    # Top 1: ~1K txns × RM3-4 avg = ~RM3K-4K
    # Top 2-3: ~600-850 txns
    # Top 4-10: ~300-550 txns
    # Rest: 50-280 txns
    targets = []
    for i in range(len(unit_ids)):
        if i == 0:
            targets.append(random.randint(900, 1100))   # Top 1: ~1K txns
        elif i < 3:
            targets.append(random.randint(600, 850))     # Top 2-3
        elif i < 10:
            targets.append(random.randint(300, 550))     # Top 4-10
        else:
            targets.append(random.randint(50, 280))      # Rest
    random.shuffle(targets)  # randomize which units end up on top

    for unit_id, profile, total_target in zip(unit_ids, unit_profiles, targets):

        unit_start_idx = len(all_transactions)

        # Distribute across days by dow weight
        daily_counts = np.random.multinomial(total_target, day_weights)

        for txn_date, count in zip(day_list, daily_counts):
            for _ in range(int(count)):
                hour = int(np.random.choice(24, p=hourly_probs))
                txn_time = f"{hour:02d}:{random.randint(0,59):02d}:{random.randint(0,59):02d}"
                amount = sample_amount(profile)

                ref_id = generate_ref_id(txn_date)
                while ref_id in used_ref_ids:
                    ref_id = generate_ref_id(txn_date)
                used_ref_ids.add(ref_id)

                all_transactions.append((
                    unit_id, ref_id,
                    txn_date.strftime('%Y-%m-%d'), txn_time,
                    amount, now, now, now
                ))

        # Enforce RM 4K amount cap per unit
        unit_txns = all_transactions[unit_start_idx:]
        total_amount = sum(t[4] for t in unit_txns)
        if total_amount > 4000:
            scale = 4000.0 / total_amount
            for j in range(unit_start_idx, len(all_transactions)):
                t = all_transactions[j]
                all_transactions[j] = (t[0], t[1], t[2], t[3],
                                       round(t[4] * scale, 2),
                                       t[5], t[6], t[7])

    print(f"  Generated {len(all_transactions):,} transactions across {len(unit_ids)} units")
    print(f"  Avg per unit: {len(all_transactions) // len(unit_ids):,}")

    # ── Step 5: Bulk insert ───────────────────────────────────────────────────
    print(f"\n[5/5] Inserting into entrepreneur_transactions...")
    batch_size = 1000
    inserted = 0
    for i in range(0, len(all_transactions), batch_size):
        batch = all_transactions[i:i + batch_size]
        cursor.executemany("""
            INSERT INTO entrepreneur_transactions
                (entrepreneur_unit_id, reference_id, transaction_date, transaction_time,
                 amount, generated_at, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, batch)
        conn.commit()
        inserted += len(batch)
        print(f"  {inserted:,} / {len(all_transactions):,}", end='\r')

    cursor.close()
    conn.close()

    print(f"\n  Done!")
    print("\n" + "=" * 60)
    print(f"  Units created : {len(unit_ids)}")
    print(f"  Transactions  : {inserted:,}")
    print(f"  Date range    : {date_min} → {date_max}")
    print(f"  Avg per unit  : {inserted // len(unit_ids):,}")
    print(f"  Amount range  : RM1 – RM10 (capped at RM4K per unit)")
    print(f"  Ref ID format : YYYYMMDDBANKCODExxOQR/ORMxxxxxxxxxxx")
    print("=" * 60)
    print("\nLogin: shop@utmduitnow.com / password")


if __name__ == "__main__":
    main()
