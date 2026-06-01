from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_flexible
from app.config import settings
from app.database import get_db
from app.models import Campaign, Company, Product, User
from app.services.platform import is_platform_admin, require_platform_admin

router = APIRouter(prefix="/platform", tags=["platform"])


class PlatformStatusResponse(BaseModel):
    is_platform_admin: bool


class PlatformCompanySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    brand_display_name: Optional[str] = None
    brand_logo_url: Optional[str] = None
    brand_color: Optional[str] = None
    brand_tagline: Optional[str] = None
    white_label_enabled: bool = False
    hide_platform_branding: bool = False
    product_count: int = 0
    sample_card_codes: list[str] = []
    landing_base_url: str


def _landing_base() -> str:
    return settings.landing_base_url.rstrip("/")


def _sample_card_codes(db: Session, company_id: int, limit: int = 3) -> list[str]:
    rows = (
        db.query(Product.unique_code)
        .join(Campaign, Campaign.id == Product.campaign_id)
        .filter(Campaign.company_id == company_id)
        .order_by(Product.id.desc())
        .limit(limit)
        .all()
    )
    return [row[0] for row in rows]


@router.get("/me", response_model=PlatformStatusResponse)
def platform_me(
    user: Annotated[User, Depends(get_current_user_flexible)],
) -> PlatformStatusResponse:
    return PlatformStatusResponse(is_platform_admin=is_platform_admin(user))


@router.get("/companies", response_model=list[PlatformCompanySummary])
def list_platform_companies(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> list[PlatformCompanySummary]:
    require_platform_admin(user)

    counts = dict(
        db.query(Campaign.company_id, func.count(Product.id))
        .join(Product, Product.campaign_id == Campaign.id)
        .group_by(Campaign.company_id)
        .all()
    )

    companies = db.query(Company).order_by(Company.company_name).all()
    base = _landing_base()

    return [
        PlatformCompanySummary(
            id=company.id,
            company_name=company.company_name,
            brand_display_name=company.brand_display_name,
            brand_logo_url=company.brand_logo_url,
            brand_color=company.brand_color,
            brand_tagline=company.brand_tagline,
            white_label_enabled=company.white_label_enabled,
            hide_platform_branding=company.hide_platform_branding,
            product_count=counts.get(company.id, 0),
            sample_card_codes=_sample_card_codes(db, company.id),
            landing_base_url=base,
        )
        for company in companies
    ]
