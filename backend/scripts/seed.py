"""Seed the database with Lumina Precision baseline (no demo metrics)."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.enums import SubscriptionPlan, UserRole
from app.models import Campaign, Company, User


def seed(db: Session) -> None:
    if db.query(Company).first():
        print("Database already seeded — skipping.")
        return

    company = Company(
        company_name="Lumina Precision",
        subscription_plan=SubscriptionPlan.STARTER,
    )
    db.add(company)
    db.flush()

    admin = User(
        name="Lumina Precision",
        email="admin@luminaprecision.com",
        company_id=company.id,
        role=UserRole.ADMIN,
    )
    db.add(admin)

    campaign = Campaign(
        company_id=company.id,
        name="Lumina Precision",
        start_date=None,
        end_date=None,
    )
    db.add(campaign)

    db.commit()
    print("Seed complete:")
    print(f"  Company: {company.company_name} (id={company.id})")
    print(f"  Campaign: {campaign.name} (id={campaign.id})")
    print("  Products: 0")
    print("  Interactions: 0")
    print("  Leads: 0")


def main() -> None:
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
