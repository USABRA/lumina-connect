from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Interaction, Product
from app.services.device import parse_device_type
from app.services.geoip import lookup_geo
from app.services.event_tag import resolve_event_tag
from app.services.interaction_actions import normalize_track_action
from app.services.product_access import require_active_product
from app.services.request_meta import get_client_ip

router = APIRouter(prefix="/track", tags=["tracking"])


class TrackResponse(BaseModel):
    ok: bool
    interaction_id: int
    product_code: str
    campaign_name: str


@router.post("/{unique_code}", response_model=TrackResponse, status_code=status.HTTP_201_CREATED)
def track_scan(
    unique_code: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    event: Annotated[Optional[str], Query(max_length=100)] = None,
    action: Annotated[Optional[str], Query(max_length=50)] = None,
) -> TrackResponse:
    product = (
        db.query(Product)
        .options(joinedload(Product.campaign))
        .filter(Product.unique_code == unique_code.upper())
        .one_or_none()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    require_active_product(product)

    ip = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    city, country = lookup_geo(ip)

    interaction = Interaction(
        product_id=product.id,
        ip_address=ip,
        device_type=parse_device_type(user_agent),
        city=city,
        country=country,
        event_tag=resolve_event_tag(event, product.event_tag),
        action=normalize_track_action(action),
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)

    return TrackResponse(
        ok=True,
        interaction_id=interaction.id,
        product_code=product.unique_code,
        campaign_name=product.campaign.name,
    )
