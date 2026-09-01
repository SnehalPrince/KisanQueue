"""
seed.py — Seed the KisanQueue database with demo data from docs/22_MOCK_DATA.md.

Run:
    alembic upgrade head
    python seed.py

Environment variables required:
    DATABASE_URL — PostgreSQL connection string
    SEED_ADMIN_PASSWORD — (optional) override; defaults to "Demo@1234" for dev
"""
from __future__ import annotations

import asyncio
import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

# Make sure backend/ is on the path when run directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from core.security import hash_password

# ── Inline env loading ────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DATABASE_URL = os.environ.get("ALEMBIC_DATABASE_URL") or os.environ["DATABASE_URL"]
OFFICER_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "Demo@1234")

from sqlalchemy.pool import NullPool

engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    poolclass=NullPool,
)
Session = async_sessionmaker(engine, expire_on_commit=False)


# ── Helpers ───────────────────────────────────────────────────────────────────
def uid() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def today_at(hour: int, minute: int = 0) -> datetime:
    t = now_utc().replace(hour=hour, minute=minute, second=0, microsecond=0)
    return t


# ── Seed data ─────────────────────────────────────────────────────────────────
CENTRES = [
    {
        "id": "centre-001",
        "name": "Rajgarh Procurement Centre",
        "hindi_name": "राजगढ़ उपार्जन केंद्र",
        "state": "Madhya Pradesh",
        "district": "Rajgarh",
        "avg_processing_minutes": 25,
        "daily_capacity": 100,
        "active_counters_default": 2,
        "supported_crops": json.dumps(["Wheat", "Soybean"]),
        "msp_rates": json.dumps({"Wheat": 2275.0, "Soybean": 4600.0}),
        "is_active": True,
    },
    {
        "id": "centre-002",
        "name": "Hisar HAFED Centre",
        "hindi_name": "हिसार हैफेड केंद्र",
        "state": "Haryana",
        "district": "Hisar",
        "avg_processing_minutes": 30,
        "daily_capacity": 80,
        "active_counters_default": 2,
        "supported_crops": json.dumps(["Wheat", "Barley"]),
        "msp_rates": json.dumps({"Wheat": 2275.0, "Barley": 1735.0}),
        "is_active": True,
    },
    {
        "id": "centre-003",
        "name": "Patiala Anaaj Kharid Centre",
        "hindi_name": "पटियाला अनाज खरीद केंद्र",
        "state": "Punjab",
        "district": "Patiala",
        "avg_processing_minutes": 20,
        "daily_capacity": 120,
        "active_counters_default": 3,
        "supported_crops": json.dumps(["Paddy", "Wheat"]),
        "msp_rates": json.dumps({"Paddy": 2300.0, "Wheat": 2275.0}),
        "is_active": True,
    },
]

# 10 farmer users (IDs match frontend fixtures)
FARMERS = [
    {"id": "farmer-001", "name": "Ramesh Kumar", "hindi_name": "रमेश कुमार", "phone": "+919876543210",
     "language": "hi", "village": "Biaora", "district": "Rajgarh", "state": "Madhya Pradesh",
     "crop": "Wheat", "aadhaar": "4521", "whatsapp": True},
    {"id": "farmer-002", "name": "Sunita Devi", "hindi_name": "सुनीता देवी", "phone": "+919876543211",
     "language": "hi", "village": "Khilchipur", "district": "Rajgarh", "state": "Madhya Pradesh",
     "crop": "Soybean", "aadhaar": "8834", "whatsapp": True},
    {"id": "farmer-003", "name": "Mahesh Yadav", "hindi_name": "महेश यादव", "phone": "+919876543212",
     "language": "hi", "village": "Narsinghgarh", "district": "Rajgarh", "state": "Madhya Pradesh",
     "crop": "Wheat", "aadhaar": "2291", "whatsapp": True},
    {"id": "farmer-004", "name": "Gurjeet Singh", "hindi_name": "गुरजीत सिंह", "phone": "+919876543213",
     "language": "hi", "village": "Adampur", "district": "Hisar", "state": "Haryana",
     "crop": "Wheat", "aadhaar": "7732", "whatsapp": False},
    {"id": "farmer-005", "name": "Balwant Kaur", "hindi_name": "बलवंत कौर", "phone": "+919876543214",
     "language": "hi", "village": "Jakhal", "district": "Hisar", "state": "Haryana",
     "crop": "Barley", "aadhaar": "1190", "whatsapp": True},
    {"id": "farmer-006", "name": "Amarjit Singh", "hindi_name": "अमरजीत सिंह", "phone": "+919876543215",
     "language": "hi", "village": "Samana", "district": "Patiala", "state": "Punjab",
     "crop": "Paddy", "aadhaar": "5567", "whatsapp": True},
    {"id": "farmer-007", "name": "Priya Bai", "hindi_name": "प्रिया बाई", "phone": "+919876543216",
     "language": "hi", "village": "Sehore", "district": "Rajgarh", "state": "Madhya Pradesh",
     "crop": "Wheat", "aadhaar": "3314", "whatsapp": True},
    {"id": "farmer-008", "name": "Devendra Patel", "hindi_name": "देवेन्द्र पटेल", "phone": "+919876543217",
     "language": "hi", "village": "Rajgarh", "district": "Rajgarh", "state": "Madhya Pradesh",
     "crop": "Wheat", "aadhaar": "9921", "whatsapp": False},
    {"id": "farmer-009", "name": "Ramkishan", "hindi_name": "रामकिशन", "phone": "+919876543218",
     "language": "hi", "village": "Biaora", "district": "Rajgarh", "state": "Madhya Pradesh",
     "crop": "Soybean", "aadhaar": "6678", "whatsapp": True},
    {"id": "farmer-010", "name": "Kamlesh Singh", "hindi_name": "कमलेश सिंह", "phone": "+919876543219",
     "language": "hi", "village": "Rajgarh", "district": "Rajgarh", "state": "Madhya Pradesh",
     "crop": "Wheat", "aadhaar": "4410", "whatsapp": True},
]

OFFICERS = [
    {"id": "officer-001", "name": "Suresh Patel", "employee_id": "officer_rajgarh", "centre_id": "centre-001"},
    {"id": "officer-002", "name": "Harpreet Singh", "employee_id": "officer_hisar", "centre_id": "centre-002"},
    {"id": "officer-003", "name": "Gurpreet Kaur", "employee_id": "officer_patiala", "centre_id": "centre-003"},
]

# Queue entries for Rajgarh (centre-001) per docs/22_MOCK_DATA.md
# Ramesh (farmer-001) is at position 5 after entries for farmers 3, A, B, C
QUEUE_ENTRIES = [
    # COMPLETED (tokens 39-42)
    {"token_num": 39, "token_code": "KQ-39", "farmer_id": "farmer-007", "crop": "Wheat",
     "qty": 22.0, "status": "COMPLETED", "position": None},
    {"token_num": 40, "token_code": "KQ-40", "farmer_id": "farmer-008", "crop": "Wheat",
     "qty": 55.0, "status": "COMPLETED", "position": None},
    {"token_num": 41, "token_code": "KQ-41", "farmer_id": "farmer-009", "crop": "Soybean",
     "qty": 18.5, "status": "COMPLETED", "position": None},
    {"token_num": 42, "token_code": "KQ-42", "farmer_id": "farmer-010", "crop": "Wheat",
     "qty": 30.0, "status": "COMPLETED", "position": None},
    # PROCESSING (token 43)
    {"token_num": 43, "token_code": "KQ-43", "farmer_id": "farmer-003", "crop": "Wheat",
     "qty": 45.0, "status": "PROCESSING", "position": 1},
    # WAITING (farmer-001 at position 5, others are seed positions)
    {"token_num": 47, "token_code": "KQ-47", "farmer_id": "farmer-001", "crop": "Wheat",
     "qty": 40.5, "status": "WAITING", "position": 5},
    {"token_num": 52, "token_code": "KQ-52", "farmer_id": "farmer-002", "crop": "Soybean",
     "qty": 14.0, "status": "WAITING", "position": 10},
]

# Procurement records for completed tokens
PROCUREMENT_RECORDS = [
    {"queue_code": "KQ-39", "crop": "Wheat", "declared": 22.0, "actual": 22.0,
     "grade": "A", "msp": 2275.0, "total": 50050.0},
    {"queue_code": "KQ-40", "crop": "Wheat", "declared": 55.0, "actual": 55.0,
     "grade": "B", "msp": 2275.0, "total": 125125.0},
    {"queue_code": "KQ-41", "crop": "Soybean", "declared": 18.5, "actual": 18.5,
     "grade": "A", "msp": 4600.0, "total": 85100.0},
]

PAYMENT_STATUS_DATA = [
    {"queue_code": "KQ-39", "status": "PAID", "amount": 50050.0, "utr": "IMPS202609150001"},
    {"queue_code": "KQ-40", "status": "PROCESSING", "amount": 125125.0, "utr": None},
    {"queue_code": "KQ-41", "status": "PENDING", "amount": 85100.0, "utr": None},
]


# ── Main seed function ─────────────────────────────────────────────────────────
async def seed() -> None:
    from sqlalchemy import text

    async with Session() as db:
        print("Seeding centres...")
        for c in CENTRES:
            await db.execute(
                text("""
                    INSERT INTO centres (id, name, hindi_name, state, district,
                        avg_processing_minutes, daily_capacity, active_counters_default,
                        supported_crops, msp_rates, is_active)
                    VALUES (:id, :name, :hindi_name, :state, :district,
                        :avg_processing_minutes, :daily_capacity, :active_counters_default,
                        :supported_crops, :msp_rates, :is_active)
                    ON CONFLICT (id) DO NOTHING
                """),
                c,
            )

        print("Seeding farmers + users...")
        for f in FARMERS:
            # User row
            await db.execute(
                text("""
                    INSERT INTO users (id, phone, name, role, preferred_language, is_active)
                    VALUES (:id, :phone, :name, 'FARMER', :lang, TRUE)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": f["id"], "phone": f["phone"], "name": f["name"], "lang": f["language"]},
            )
            # Farmer row
            await db.execute(
                text("""
                    INSERT INTO farmers (id, user_id, aadhaar_last4, village, district, state,
                        primary_crop, is_whatsapp_linked)
                    VALUES (:fid, :uid, :aadhaar, :village, :district, :state, :crop, :wa)
                    ON CONFLICT (user_id) DO NOTHING
                """),
                {
                    "fid": uid(), "uid": f["id"], "aadhaar": f["aadhaar"],
                    "village": f["village"], "district": f["district"],
                    "state": f["state"], "crop": f["crop"], "wa": f["whatsapp"],
                },
            )

        print("Seeding officers + users...")
        pw_hash = hash_password(OFFICER_PASSWORD)
        for o in OFFICERS:
            officer_user_id = o["id"] + "-user"
            await db.execute(
                text("""
                    INSERT INTO users (id, phone, name, role, preferred_language, is_active)
                    VALUES (:id, NULL, :name, 'OFFICER', 'hi', TRUE)
                    ON CONFLICT (id) DO NOTHING
                """),
                {"id": officer_user_id, "name": o["name"]},
            )
            await db.execute(
                text("""
                    INSERT INTO officers (id, user_id, employee_id, centre_id, password_hash)
                    VALUES (:id, :uid, :eid, :cid, :pw)
                    ON CONFLICT (employee_id) DO NOTHING
                """),
                {
                    "id": o["id"], "uid": officer_user_id,
                    "eid": o["employee_id"], "cid": o["centre_id"], "pw": pw_hash,
                },
            )

        print("Seeding capacity updates...")
        await db.execute(
            text("""
                INSERT INTO capacity_updates (id, centre_id, status, capacity_factor,
                    active_counters, note, effective_from)
                VALUES (:id, 'centre-001', 'NORMAL', 1.0, 2,
                    'Start of day — normal operations', :eff)
            """),
            {"id": uid(), "eff": today_at(7, 0)},
        )
        await db.execute(
            text("""
                INSERT INTO capacity_updates (id, centre_id, status, capacity_factor,
                    active_counters, note, effective_from)
                VALUES (:id, 'centre-002', 'BUSY', 0.8, 2,
                    'High congestion', :eff)
            """),
            {"id": uid(), "eff": today_at(8, 0)},
        )
        await db.execute(
            text("""
                INSERT INTO capacity_updates (id, centre_id, status, capacity_factor,
                    active_counters, note, effective_from)
                VALUES (:id, 'centre-003', 'PAUSED', 0.0, 0,
                    'Operations paused today', :eff)
            """),
            {"id": uid(), "eff": today_at(6, 0)},
        )

        print("Seeding queue entries...")
        qe_id_map: dict[str, str] = {}
        for i, qe in enumerate(QUEUE_ENTRIES):
            qeid = f"qe-mock-{qe['token_code']}"
            qe_id_map[qe["token_code"]] = qeid
            joined_hour = 6 + i
            await db.execute(
                text("""
                    INSERT INTO queue_entries (id, centre_id, farmer_user_id, token_number,
                        token_code, queue_position, eta_minutes, crop, quantity_quintals,
                        status, joined_at, valid_until)
                    VALUES (:id, 'centre-001', :fid, :tn, :tc, :pos, :eta,
                        :crop, :qty, :status, :joined, :valid)
                    ON CONFLICT DO NOTHING
                """),
                {
                    "id": qeid, "fid": qe["farmer_id"], "tn": qe["token_num"],
                    "tc": qe["token_code"], "pos": qe["position"],
                    "eta": None,
                    "crop": qe["crop"], "qty": qe["qty"], "status": qe["status"],
                    "joined": today_at(joined_hour, 0),
                    "valid": today_at(joined_hour, 0) + timedelta(hours=8),
                },
            )

        print("Seeding procurement records + payment status...")
        for pr in PROCUREMENT_RECORDS:
            qe_id = qe_id_map.get(pr["queue_code"])
            if not qe_id:
                continue
            proc_id = f"proc-mock-{pr['queue_code']}"
            await db.execute(
                text("""
                    INSERT INTO procurement_records (id, queue_entry_id, crop, declared_quantity_q,
                        actual_quantity_q, grade, msp_rate, total_amount, is_verified, is_mock, source_system)
                    VALUES (:id, :qeid, :crop, :decl, :actual, :grade, :msp, :total, FALSE, TRUE, 'MOCK')
                    ON CONFLICT DO NOTHING
                """),
                {
                    "id": proc_id, "qeid": qe_id, "crop": pr["crop"],
                    "decl": pr["declared"], "actual": pr["actual"],
                    "grade": pr["grade"], "msp": pr["msp"], "total": pr["total"],
                },
            )
            # Payment status
            ps = next((p for p in PAYMENT_STATUS_DATA if p["queue_code"] == pr["queue_code"]), None)
            if ps:
                await db.execute(
                    text("""
                        INSERT INTO payment_status (id, procurement_record_id, status, amount,
                            utr_number, is_mock)
                        VALUES (:id, :prid, :status, :amount, :utr, TRUE)
                        ON CONFLICT DO NOTHING
                    """),
                    {
                        "id": f"pay-mock-{pr['queue_code']}", "prid": proc_id,
                        "status": ps["status"], "amount": ps["amount"], "utr": ps["utr"],
                    },
                )

        await db.commit()
        print("Seed complete!")
        print(f"Officer password used: {OFFICER_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
