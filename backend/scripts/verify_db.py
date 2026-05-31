"""Verify Phase 2 database setup — migrations applied and Lumina Precision seed."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import inspect, text

from app.database import SessionLocal, engine
from app.models import Campaign, Company, Interaction, Lead, Product, User

EXPECTED_TABLES = {
    "companies",
    "users",
    "campaigns",
    "products",
    "interactions",
    "leads",
}

EXPECTED_COUNTS = {
    "companies": 1,
    "users": 1,
    "campaigns": 1,
    "products": 0,
    "interactions": 0,
    "leads": 0,
}


def verify() -> None:
    errors: list[str] = []

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    tables = set(inspect(engine).get_table_names())
    missing = EXPECTED_TABLES - tables
    if missing:
        errors.append(f"Missing tables: {sorted(missing)}")

    version = None
    with engine.connect() as conn:
        if "alembic_version" in tables:
            version = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
    if version != "003":
        errors.append(f"Expected migration 003, got {version!r}")

    db = SessionLocal()
    try:
        counts = {
            "companies": db.query(Company).count(),
            "users": db.query(User).count(),
            "campaigns": db.query(Campaign).count(),
            "products": db.query(Product).count(),
            "interactions": db.query(Interaction).count(),
            "leads": db.query(Lead).count(),
        }

        company = db.query(Company).first()
        if company and company.company_name != "Lumina Precision":
            errors.append(f"Expected company Lumina Precision, got {company.company_name!r}")
    finally:
        db.close()

    for table, expected in EXPECTED_COUNTS.items():
        actual = counts.get(table, 0)
        if actual != expected:
            errors.append(f"{table}: expected {expected}, got {actual}")

    if errors:
        print("Phase 2 verification FAILED:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)

    print("Phase 2 verification passed.")
    print(f"  Migration: {version}")
    print(f"  Tables: {len(tables & EXPECTED_TABLES)}/{len(EXPECTED_TABLES)}")
    for table, count in counts.items():
        print(f"  {table}: {count}")


if __name__ == "__main__":
    verify()
