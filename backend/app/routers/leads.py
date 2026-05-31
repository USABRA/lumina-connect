from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import get_current_user_flexible
from app.database import get_db
from app.models import Campaign, Lead, Product, User
from app.schemas import LeadRead, LeadSubmit
from app.services.access import require_company
from app.services.notifications import notify_new_lead
from app.services.product_access import require_active_product

router = APIRouter(prefix="/leads", tags=["leads"])


class LeadEvent(BaseModel):
    id: int
    product_code: str
    product_type: str
    campaign_name: str
    name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def submit_lead(
    body: LeadSubmit,
    db: Annotated[Session, Depends(get_db)],
) -> LeadRead:
    product = (
        db.query(Product)
        .options(joinedload(Product.campaign))
        .filter(Product.unique_code == body.product_code.upper())
        .one_or_none()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    require_active_product(product)
    if not product.contact_form_enabled:
        raise HTTPException(status_code=403, detail="Contact form is disabled for this product")

    lead = Lead(
        product_id=product.id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        company=body.company,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    notify_new_lead(db, lead, product)
    return LeadRead.model_validate(lead)


@router.get("", response_model=list[LeadEvent])
def list_leads(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[LeadEvent]:
    company_id = require_company(user)
    product_ids = [
        row[0]
        for row in (
            db.query(Product.id)
            .join(Campaign)
            .filter(Campaign.company_id == company_id)
            .all()
        )
    ]
    if not product_ids:
        return []

    leads = (
        db.query(Lead)
        .options(joinedload(Lead.product).joinedload(Product.campaign))
        .filter(Lead.product_id.in_(product_ids))
        .order_by(Lead.id.desc())
        .limit(limit)
        .all()
    )

    return [
        LeadEvent(
            id=lead.id,
            product_code=lead.product.unique_code,
            product_type=lead.product.product_type,
            campaign_name=lead.product.campaign.name,
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
            company=lead.company,
        )
        for lead in leads
    ]
