from __future__ import annotations

from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_flexible
from app.database import get_db
from app.models import Campaign, Product, User
from app.schemas import CampaignCreateBody, CampaignRead
from app.services.access import get_company_campaign, require_company

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CampaignReadWithCount(CampaignRead):
    product_count: int = 0


def _campaign_with_count(campaign: Campaign, db: Session) -> CampaignReadWithCount:
    count = db.query(Product).filter(Product.campaign_id == campaign.id).count()
    data = CampaignRead.model_validate(campaign).model_dump()
    return CampaignReadWithCount(**data, product_count=count)


@router.get("", response_model=list[CampaignReadWithCount])
def list_campaigns(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> list[CampaignReadWithCount]:
    company_id = require_company(user)
    campaigns = (
        db.query(Campaign)
        .filter(Campaign.company_id == company_id)
        .order_by(Campaign.id.desc())
        .all()
    )
    return [_campaign_with_count(c, db) for c in campaigns]


@router.post("", response_model=CampaignReadWithCount, status_code=status.HTTP_201_CREATED)
def create_campaign(
    body: CampaignCreateBody,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> CampaignReadWithCount:
    company_id = require_company(user)
    if body.start_date and body.end_date and body.end_date < body.start_date:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")

    campaign = Campaign(
        company_id=company_id,
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return _campaign_with_count(campaign, db)


@router.get("/{campaign_id}", response_model=CampaignReadWithCount)
def get_campaign(
    campaign_id: int,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> CampaignReadWithCount:
    company_id = require_company(user)
    campaign = get_company_campaign(db, campaign_id, company_id)
    return _campaign_with_count(campaign, db)


@router.put("/{campaign_id}", response_model=CampaignReadWithCount)
def update_campaign(
    campaign_id: int,
    body: CampaignUpdate,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> CampaignReadWithCount:
    company_id = require_company(user)
    campaign = get_company_campaign(db, campaign_id, company_id)

    if body.name is not None:
        campaign.name = body.name
    if body.start_date is not None:
        campaign.start_date = body.start_date
    if body.end_date is not None:
        campaign.end_date = body.end_date

    start = campaign.start_date
    end = campaign.end_date
    if start and end and end < start:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")

    db.commit()
    db.refresh(campaign)
    return _campaign_with_count(campaign, db)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: int,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    company_id = require_company(user)
    campaign = get_company_campaign(db, campaign_id, company_id)
    db.query(Product).filter(Product.campaign_id == campaign.id).delete()
    db.delete(campaign)
    db.commit()
