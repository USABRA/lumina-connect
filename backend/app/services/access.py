from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Campaign, Product, User


def require_company(user: User) -> int:
    if user.company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not linked to a company",
        )
    return user.company_id


def get_company_campaign(db: Session, campaign_id: int, company_id: int) -> Campaign:
    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.company_id == company_id)
        .one_or_none()
    )
    if campaign is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
    return campaign


def get_company_product(db: Session, product_id: int, company_id: int) -> Product:
    product = (
        db.query(Product)
        .join(Campaign)
        .filter(Product.id == product_id, Campaign.company_id == company_id)
        .one_or_none()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
