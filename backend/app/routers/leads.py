from __future__ import annotations

import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import get_current_user_flexible
from app.database import get_db
from app.models import Campaign, Company, Interaction, Lead, Product, User
from app.schemas import LeadRead, LeadSubmit
from app.services.access import require_company
from app.services.permissions import scoped_product_ids
from app.services.device import parse_device_type
from app.services.event_tag import normalize_event_tag, resolve_event_tag
from app.services.geoip import lookup_geo
from app.services.notifications import notify_new_lead
from app.services.product_access import require_active_product
from app.services.request_meta import get_client_ip
from app.services.team_structure import filter_product_ids_by_team, resolve_role

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
    created_at: Optional[datetime.datetime] = None
    team_role_id: Optional[str] = None
    team_role_name: Optional[str] = None
    team_group_id: Optional[str] = None
    team_group_name: Optional[str] = None
    event_tag: Optional[str] = None


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def submit_lead(
    body: LeadSubmit,
    request: Request,
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

    ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    city, country = lookup_geo(ip)

    event_tag = resolve_event_tag(body.event_tag, product.event_tag)

    lead = Lead(
        product_id=product.id,
        name=body.name,
        email=body.email or "",
        phone=body.phone,
        company=body.company,
        event_tag=event_tag,
    )
    db.add(lead)
    db.add(
        Interaction(
            product_id=product.id,
            ip_address=ip,
            device_type=parse_device_type(user_agent),
            city=city,
            country=country,
            event_tag=event_tag,
        )
    )
    db.commit()
    db.refresh(lead)
    notify_new_lead(db, lead, product)
    return LeadRead.model_validate(lead)


def _lead_event(lead: Lead, team_structure: Optional[dict]) -> LeadEvent:
    role = resolve_role(team_structure, lead.product.team_role_id)
    return LeadEvent(
        id=lead.id,
        product_code=lead.product.unique_code,
        product_type=lead.product.product_type,
        campaign_name=lead.product.campaign.name,
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        company=lead.company,
        created_at=lead.created_at,
        team_role_id=role.role_id,
        team_role_name=role.role_name,
        team_group_id=role.group_id,
        team_group_name=role.group_name,
        event_tag=lead.event_tag,
    )


@router.get("", response_model=list[LeadEvent])
def list_leads(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    role_id: Annotated[Optional[str], Query(max_length=100)] = None,
    group_id: Annotated[Optional[str], Query(max_length=100)] = None,
    event_tag: Annotated[Optional[str], Query(max_length=100)] = None,
) -> list[LeadEvent]:
    company_id = require_company(user)
    company = db.query(Company).filter(Company.id == company_id).one()
    team_structure = company.team_structure

    products = (
        db.query(Product)
        .join(Campaign)
        .filter(Campaign.company_id == company_id)
        .all()
    )
    products_by_id = {p.id: p for p in products}
    product_ids = list(products_by_id.keys())
    if not product_ids:
        return []

    product_ids = filter_product_ids_by_team(
        product_ids, products_by_id, team_structure, role_id=role_id, group_id=group_id
    )
    product_ids = scoped_product_ids(user, product_ids, products_by_id)
    if not product_ids:
        return []

    lead_query = (
        db.query(Lead)
        .options(joinedload(Lead.product).joinedload(Product.campaign))
        .filter(Lead.product_id.in_(product_ids))
    )
    normalized_event = normalize_event_tag(event_tag)
    if normalized_event:
        lead_query = lead_query.filter(Lead.event_tag == normalized_event)

    leads = lead_query.order_by(Lead.id.desc()).limit(limit).all()

    return [_lead_event(lead, team_structure) for lead in leads]
