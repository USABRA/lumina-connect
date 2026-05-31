from __future__ import annotations

import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import get_current_user_flexible
from app.database import get_db
from app.models import Campaign, Company, Interaction, Product, User
from app.services.access import require_company
from app.services.event_tag import normalize_event_tag
from app.services.interaction_actions import ACTION_MEETING_SCHEDULED
from app.services.permissions import scoped_product_ids
from app.services.team_structure import filter_product_ids_by_team, resolve_role

router = APIRouter(prefix="/meetings", tags=["meetings"])


class MeetingEvent(BaseModel):
    id: int
    timestamp: datetime.datetime
    product_code: str
    product_type: str
    campaign_name: str
    card_name: str
    city: Optional[str] = None
    country: Optional[str] = None
    device_type: Optional[str] = None
    team_role_id: Optional[str] = None
    team_role_name: Optional[str] = None
    team_group_name: Optional[str] = None
    event_tag: Optional[str] = None


class MeetingSummary(BaseModel):
    total_clicks: int
    unique_cards: int
    cards_with_meeting_link: int


class MeetingsListResponse(BaseModel):
    summary: MeetingSummary
    events: list[MeetingEvent]


def _meeting_event(interaction: Interaction, team_structure: Optional[dict]) -> MeetingEvent:
    role = resolve_role(team_structure, interaction.product.team_role_id)
    card_name = (
        interaction.product.landing_headline
        or interaction.product.product_type
        or interaction.product.unique_code
    )
    return MeetingEvent(
        id=interaction.id,
        timestamp=interaction.timestamp,
        product_code=interaction.product.unique_code,
        product_type=interaction.product.product_type,
        campaign_name=interaction.product.campaign.name,
        card_name=card_name,
        city=interaction.city,
        country=interaction.country,
        device_type=interaction.device_type,
        team_role_id=role.role_id,
        team_role_name=role.role_name,
        team_group_name=role.group_name,
        event_tag=interaction.event_tag,
    )


@router.get("", response_model=MeetingsListResponse)
def list_meetings(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    days: Annotated[int, Query(ge=7, le=365)] = 90,
    role_id: Annotated[Optional[str], Query(max_length=100)] = None,
    group_id: Annotated[Optional[str], Query(max_length=100)] = None,
    event_tag: Annotated[Optional[str], Query(max_length=100)] = None,
) -> MeetingsListResponse:
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
        return MeetingsListResponse(
            summary=MeetingSummary(total_clicks=0, unique_cards=0, cards_with_meeting_link=0),
            events=[],
        )

    product_ids = filter_product_ids_by_team(
        product_ids, products_by_id, team_structure, role_id=role_id, group_id=group_id
    )
    product_ids = scoped_product_ids(user, product_ids, products_by_id)
    if not product_ids:
        return MeetingsListResponse(
            summary=MeetingSummary(total_clicks=0, unique_cards=0, cards_with_meeting_link=0),
            events=[],
        )

    range_start = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
    normalized_event = normalize_event_tag(event_tag)

    meeting_filters = [
        Interaction.product_id.in_(product_ids),
        Interaction.action == ACTION_MEETING_SCHEDULED,
        Interaction.timestamp >= range_start,
    ]
    if normalized_event:
        meeting_filters.append(Interaction.event_tag == normalized_event)

    total_clicks = db.query(Interaction).filter(*meeting_filters).count()
    unique_cards = (
        db.query(Interaction.product_id)
        .filter(*meeting_filters)
        .distinct()
        .count()
    )

    cards_with_meeting = sum(
        1
        for pid in product_ids
        if products_by_id[pid].meeting_url and products_by_id[pid].meeting_url.strip()
    )

    interactions = (
        db.query(Interaction)
        .options(joinedload(Interaction.product).joinedload(Product.campaign))
        .filter(*meeting_filters)
        .order_by(Interaction.timestamp.desc())
        .limit(limit)
        .all()
    )

    return MeetingsListResponse(
        summary=MeetingSummary(
            total_clicks=total_clicks,
            unique_cards=unique_cards,
            cards_with_meeting_link=cards_with_meeting,
        ),
        events=[_meeting_event(i, team_structure) for i in interactions],
    )
