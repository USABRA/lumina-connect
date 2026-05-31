from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Campaign, Company, Interaction, Lead, Product, User


def get_db_stats(db: Session) -> dict:
    return {
        "companies": db.scalar(select(func.count()).select_from(Company)) or 0,
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "campaigns": db.scalar(select(func.count()).select_from(Campaign)) or 0,
        "products": db.scalar(select(func.count()).select_from(Product)) or 0,
        "interactions": db.scalar(select(func.count()).select_from(Interaction)) or 0,
        "leads": db.scalar(select(func.count()).select_from(Lead)) or 0,
    }
