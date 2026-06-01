from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Campaign

DEFAULT_CAMPAIGN_NAME = "Team cards"


def ensure_default_campaign(db: Session, company_id: int, *, name: str | None = None) -> Campaign:
    """Return the company's first campaign, creating a default one if none exist."""
    existing = (
        db.query(Campaign)
        .filter(Campaign.company_id == company_id)
        .order_by(Campaign.id.asc())
        .first()
    )
    if existing is not None:
        return existing

    campaign = Campaign(
        company_id=company_id,
        name=name or DEFAULT_CAMPAIGN_NAME,
    )
    db.add(campaign)
    db.flush()
    return campaign
