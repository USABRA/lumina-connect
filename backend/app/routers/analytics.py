from __future__ import annotations

import csv
import datetime
import io
from typing import Annotated, Iterator, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import get_current_user_flexible
from app.database import get_db
from app.models import Campaign, Interaction, Lead, Product, User
from app.services.access import require_company

router = APIRouter(prefix="/analytics", tags=["analytics"])


class TopProduct(BaseModel):
    unique_code: str
    product_type: str
    scan_count: int


class CountryStat(BaseModel):
    country: str
    scan_count: int


class DailyScan(BaseModel):
    date: str
    scan_count: int


class InteractionEvent(BaseModel):
    id: int
    timestamp: datetime.datetime
    product_code: str
    product_type: str
    campaign_name: str
    city: Optional[str] = None
    country: Optional[str] = None
    device_type: Optional[str] = None
    ip_address: Optional[str] = None


class TopCampaign(BaseModel):
    campaign_name: str
    scan_count: int
    lead_count: int
    conversion_rate: float


class LeadsByCampaign(BaseModel):
    campaign_name: str
    lead_count: int


class DeviceStat(BaseModel):
    device_type: str
    scan_count: int


class GeoPoint(BaseModel):
    city: Optional[str] = None
    country: str
    scan_count: int


class AnalyticsOverview(BaseModel):
    total_scans: int
    scans_today: int
    unique_products_scanned: int
    total_leads: int
    conversion_rate: float
    top_products: list[TopProduct]
    top_campaigns: list[TopCampaign]
    leads_by_campaign: list[LeadsByCampaign]
    by_country: list[CountryStat]
    by_device: list[DeviceStat]
    geo_points: list[GeoPoint]
    daily_scans: list[DailyScan]


def _company_product_ids(db: Session, company_id: int) -> list[int]:
    return [
        row[0]
        for row in (
            db.query(Product.id)
            .join(Campaign)
            .filter(Campaign.company_id == company_id)
            .all()
        )
    ]


def _company_campaigns(db: Session, company_id: int) -> list[Campaign]:
    return db.query(Campaign).filter(Campaign.company_id == company_id).all()


def _campaign_stats(db: Session, campaign: Campaign) -> tuple[int, int]:
    product_ids = [p.id for p in campaign.products]
    if not product_ids:
        return 0, 0
    scans = db.query(Interaction).filter(Interaction.product_id.in_(product_ids)).count()
    leads = db.query(Lead).filter(Lead.product_id.in_(product_ids)).count()
    return scans, leads


@router.get("/overview", response_model=AnalyticsOverview)
def analytics_overview(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> AnalyticsOverview:
    company_id = require_company(user)
    product_ids = _company_product_ids(db, company_id)

    if not product_ids:
        return AnalyticsOverview(
            total_scans=0,
            scans_today=0,
            unique_products_scanned=0,
            total_leads=0,
            conversion_rate=0.0,
            top_products=[],
            top_campaigns=[],
            leads_by_campaign=[],
            by_country=[],
            by_device=[],
            geo_points=[],
            daily_scans=[],
        )

    total_scans = (
        db.query(Interaction).filter(Interaction.product_id.in_(product_ids)).count()
    )
    total_leads = db.query(Lead).filter(Lead.product_id.in_(product_ids)).count()
    conversion_rate = round((total_leads / total_scans) * 100, 2) if total_scans else 0.0

    today_start = datetime.datetime.now(datetime.timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    scans_today = (
        db.query(Interaction)
        .filter(
            Interaction.product_id.in_(product_ids),
            Interaction.timestamp >= today_start,
        )
        .count()
    )

    unique_products_scanned = (
        db.query(func.count(func.distinct(Interaction.product_id)))
        .filter(Interaction.product_id.in_(product_ids))
        .scalar()
        or 0
    )

    top_rows = (
        db.query(
            Product.unique_code,
            Product.product_type,
            func.count(Interaction.id).label("scan_count"),
        )
        .join(Interaction, Interaction.product_id == Product.id)
        .filter(Product.id.in_(product_ids))
        .group_by(Product.id, Product.unique_code, Product.product_type)
        .order_by(func.count(Interaction.id).desc())
        .limit(5)
        .all()
    )
    top_products = [
        TopProduct(unique_code=row[0], product_type=row[1], scan_count=row[2])
        for row in top_rows
    ]

    country_rows = (
        db.query(Interaction.country, func.count(Interaction.id))
        .filter(Interaction.product_id.in_(product_ids), Interaction.country.isnot(None))
        .group_by(Interaction.country)
        .order_by(func.count(Interaction.id).desc())
        .limit(10)
        .all()
    )
    by_country = [
        CountryStat(country=row[0] or "Unknown", scan_count=row[1]) for row in country_rows
    ]

    daily_rows = (
        db.query(
            func.date(Interaction.timestamp).label("day"),
            func.count(Interaction.id),
        )
        .filter(Interaction.product_id.in_(product_ids))
        .group_by("day")
        .order_by("day")
        .limit(14)
        .all()
    )
    daily_scans = [
        DailyScan(date=str(row[0]), scan_count=row[1]) for row in daily_rows
    ]

    campaigns = _company_campaigns(db, company_id)
    campaign_stats: list[TopCampaign] = []
    leads_by_campaign: list[LeadsByCampaign] = []
    for campaign in campaigns:
        scans, leads = _campaign_stats(db, campaign)
        rate = round((leads / scans) * 100, 2) if scans else 0.0
        campaign_stats.append(
            TopCampaign(
                campaign_name=campaign.name,
                scan_count=scans,
                lead_count=leads,
                conversion_rate=rate,
            )
        )
        if leads > 0:
            leads_by_campaign.append(
                LeadsByCampaign(campaign_name=campaign.name, lead_count=leads)
            )
    campaign_stats.sort(key=lambda row: row.scan_count, reverse=True)
    leads_by_campaign.sort(key=lambda row: row.lead_count, reverse=True)

    device_rows = (
        db.query(Interaction.device_type, func.count(Interaction.id))
        .filter(
            Interaction.product_id.in_(product_ids),
            Interaction.device_type.isnot(None),
        )
        .group_by(Interaction.device_type)
        .order_by(func.count(Interaction.id).desc())
        .all()
    )
    by_device = [
        DeviceStat(device_type=row[0] or "unknown", scan_count=row[1]) for row in device_rows
    ]

    geo_rows = (
        db.query(Interaction.city, Interaction.country, func.count(Interaction.id))
        .filter(Interaction.product_id.in_(product_ids), Interaction.country.isnot(None))
        .group_by(Interaction.city, Interaction.country)
        .order_by(func.count(Interaction.id).desc())
        .limit(20)
        .all()
    )
    geo_points = [
        GeoPoint(city=row[0], country=row[1] or "Unknown", scan_count=row[2])
        for row in geo_rows
    ]

    return AnalyticsOverview(
        total_scans=total_scans,
        scans_today=scans_today,
        unique_products_scanned=unique_products_scanned,
        total_leads=total_leads,
        conversion_rate=conversion_rate,
        top_products=top_products,
        top_campaigns=campaign_stats[:5],
        leads_by_campaign=leads_by_campaign,
        by_country=by_country,
        by_device=by_device,
        geo_points=geo_points,
        daily_scans=daily_scans,
    )


@router.get("/interactions", response_model=list[InteractionEvent])
def list_interactions(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[InteractionEvent]:
    company_id = require_company(user)
    product_ids = _company_product_ids(db, company_id)

    if not product_ids:
        return []

    interactions = (
        db.query(Interaction)
        .options(joinedload(Interaction.product).joinedload(Product.campaign))
        .filter(Interaction.product_id.in_(product_ids))
        .order_by(Interaction.timestamp.desc())
        .limit(limit)
        .all()
    )

    return [
        InteractionEvent(
            id=i.id,
            timestamp=i.timestamp,
            product_code=i.product.unique_code,
            product_type=i.product.product_type,
            campaign_name=i.product.campaign.name,
            city=i.city,
            country=i.country,
            device_type=i.device_type,
            ip_address=i.ip_address,
        )
        for i in interactions
    ]


@router.get("/export")
def export_analytics_csv(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> StreamingResponse:
    company_id = require_company(user)
    product_ids = _company_product_ids(db, company_id)

    def generate() -> Iterator[str]:
        buffer = io.StringIO()
        writer = csv.writer(buffer)

        writer.writerow(["=== SCANS ==="])
        writer.writerow(
            ["timestamp", "product_code", "campaign", "device", "city", "country", "ip"]
        )
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)

        if product_ids:
            interactions = (
                db.query(Interaction)
                .options(joinedload(Interaction.product).joinedload(Product.campaign))
                .filter(Interaction.product_id.in_(product_ids))
                .order_by(Interaction.timestamp.desc())
                .all()
            )
            for row in interactions:
                writer.writerow([
                    row.timestamp.isoformat(),
                    row.product.unique_code,
                    row.product.campaign.name,
                    row.device_type or "",
                    row.city or "",
                    row.country or "",
                    row.ip_address or "",
                ])
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)

        writer.writerow([])
        writer.writerow(["=== LEADS ==="])
        writer.writerow(["name", "email", "phone", "company", "product_code", "campaign"])
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)

        if product_ids:
            lead_rows = (
                db.query(Lead)
                .options(joinedload(Lead.product).joinedload(Product.campaign))
                .filter(Lead.product_id.in_(product_ids))
                .order_by(Lead.id.desc())
                .all()
            )
            for lead in lead_rows:
                writer.writerow([
                    lead.name,
                    lead.email,
                    lead.phone or "",
                    lead.company or "",
                    lead.product.unique_code,
                    lead.product.campaign.name,
                ])
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=lumina-analytics.csv"},
    )
