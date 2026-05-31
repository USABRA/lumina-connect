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
from app.models import Campaign, Company, Interaction, Lead, Product, User
from app.services.access import require_company
from app.services.permissions import is_admin, scoped_product_ids
from app.services.dashboard_analytics import DashboardAnalytics, build_dashboard_analytics
from app.services.event_tag import normalize_event_tag
from app.services.team_structure import filter_product_ids_by_team, resolve_role

router = APIRouter(prefix="/analytics", tags=["analytics"])


class TopProduct(BaseModel):
    unique_code: str
    product_type: str
    scan_count: int
    team_role_id: Optional[str] = None
    team_role_name: Optional[str] = None
    team_group_name: Optional[str] = None


class CountryStat(BaseModel):
    country: str
    scan_count: int


class DailyScan(BaseModel):
    date: str
    scan_count: int


class DailyLead(BaseModel):
    date: str
    lead_count: int


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
    team_role_id: Optional[str] = None
    team_role_name: Optional[str] = None
    team_group_name: Optional[str] = None
    event_tag: Optional[str] = None


class EventStat(BaseModel):
    event_tag: str
    scan_count: int
    lead_count: int


class TopCampaign(BaseModel):
    campaign_name: str
    scan_count: int
    lead_count: int
    conversion_rate: float


class LeadsByCampaign(BaseModel):
    campaign_name: str
    lead_count: int


class TopRole(BaseModel):
    role_id: Optional[str] = None
    role_name: str
    group_name: Optional[str] = None
    scan_count: int
    lead_count: int
    conversion_rate: float


class LeadsByRole(BaseModel):
    role_id: Optional[str] = None
    role_name: str
    group_name: Optional[str] = None
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
    top_roles: list[TopRole]
    leads_by_role: list[LeadsByRole]
    by_country: list[CountryStat]
    by_device: list[DeviceStat]
    geo_points: list[GeoPoint]
    daily_scans: list[DailyScan]
    daily_leads: list[DailyLead]
    top_events: list[EventStat] = []


def _interaction_filters(product_ids: list[int], event_tag: Optional[str]) -> list:
    filters = [Interaction.product_id.in_(product_ids)]
    if event_tag:
        filters.append(Interaction.event_tag == event_tag)
    return filters


def _lead_filters(product_ids: list[int], event_tag: Optional[str]) -> list:
    filters = [Lead.product_id.in_(product_ids)]
    if event_tag:
        filters.append(Lead.event_tag == event_tag)
    return filters


def _company_products(
    db: Session, company_id: int, user: User
) -> tuple[list[int], dict[int, Product], Optional[dict]]:
    company = db.query(Company).filter(Company.id == company_id).one()
    products = (
        db.query(Product)
        .join(Campaign)
        .filter(Campaign.company_id == company_id)
        .all()
    )
    products_by_id = {p.id: p for p in products}
    product_ids = list(products_by_id.keys())
    product_ids = scoped_product_ids(user, product_ids, products_by_id)
    if not is_admin(user):
        products_by_id = {pid: products_by_id[pid] for pid in product_ids}
    return product_ids, products_by_id, company.team_structure


def _role_stats(
    db: Session,
    product_ids: list[int],
    products_by_id: dict[int, Product],
    team_structure: Optional[dict],
) -> tuple[list[TopRole], list[LeadsByRole]]:
    buckets: dict[str, dict] = {}
    for pid in product_ids:
        product = products_by_id[pid]
        role = resolve_role(team_structure, product.team_role_id)
        key = role.role_id or "__unassigned__"
        if key not in buckets:
            buckets[key] = {
                "role_id": role.role_id,
                "role_name": role.role_name or "Unassigned",
                "group_name": role.group_name,
                "scans": 0,
                "leads": 0,
            }
        buckets[key]["scans"] += db.query(Interaction).filter(Interaction.product_id == pid).count()
        buckets[key]["leads"] += db.query(Lead).filter(Lead.product_id == pid).count()

    top_roles: list[TopRole] = []
    leads_by_role: list[LeadsByRole] = []
    for bucket in buckets.values():
        scans = bucket["scans"]
        leads = bucket["leads"]
        rate = round((leads / scans) * 100, 2) if scans else 0.0
        top_roles.append(
            TopRole(
                role_id=bucket["role_id"],
                role_name=bucket["role_name"],
                group_name=bucket["group_name"],
                scan_count=scans,
                lead_count=leads,
                conversion_rate=rate,
            )
        )
        if leads > 0:
            leads_by_role.append(
                LeadsByRole(
                    role_id=bucket["role_id"],
                    role_name=bucket["role_name"],
                    group_name=bucket["group_name"],
                    lead_count=leads,
                )
            )
    top_roles.sort(key=lambda r: r.scan_count, reverse=True)
    leads_by_role.sort(key=lambda r: r.lead_count, reverse=True)
    return top_roles, leads_by_role


def _company_campaigns(db: Session, company_id: int) -> list[Campaign]:
    return db.query(Campaign).filter(Campaign.company_id == company_id).all()


def _campaign_stats(
    db: Session, campaign: Campaign, allowed_product_ids: set[int] | None = None
) -> tuple[int, int]:
    product_ids = [p.id for p in campaign.products]
    if allowed_product_ids is not None:
        product_ids = [pid for pid in product_ids if pid in allowed_product_ids]
    if not product_ids:
        return 0, 0
    scans = db.query(Interaction).filter(Interaction.product_id.in_(product_ids)).count()
    leads = db.query(Lead).filter(Lead.product_id.in_(product_ids)).count()
    return scans, leads


@router.get("/dashboard", response_model=DashboardAnalytics)
def dashboard_analytics(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    days: Annotated[int, Query(ge=7, le=365)] = 30,
) -> DashboardAnalytics:
    company_id = require_company(user)
    product_ids, _, team_structure = _company_products(db, company_id, user)
    return build_dashboard_analytics(db, product_ids, days=days, team_structure=team_structure)


@router.get("/overview", response_model=AnalyticsOverview)
def analytics_overview(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    role_id: Annotated[Optional[str], Query(max_length=100)] = None,
    group_id: Annotated[Optional[str], Query(max_length=100)] = None,
    event_tag: Annotated[Optional[str], Query(max_length=100)] = None,
    days: Annotated[int, Query(ge=7, le=365)] = 30,
) -> AnalyticsOverview:
    company_id = require_company(user)
    product_ids, products_by_id, team_structure = _company_products(db, company_id, user)
    product_ids = filter_product_ids_by_team(
        product_ids, products_by_id, team_structure, role_id=role_id, group_id=group_id
    )

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
            top_roles=[],
            leads_by_role=[],
            by_country=[],
            by_device=[],
            geo_points=[],
            daily_scans=[],
            daily_leads=[],
            top_events=[],
        )

    normalized_event = normalize_event_tag(event_tag)
    interaction_filters = _interaction_filters(product_ids, normalized_event)
    lead_filters = _lead_filters(product_ids, normalized_event)

    range_start = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)

    total_scans = db.query(Interaction).filter(*interaction_filters).count()
    total_leads = db.query(Lead).filter(*lead_filters).count()
    conversion_rate = round((total_leads / total_scans) * 100, 2) if total_scans else 0.0

    today_start = datetime.datetime.now(datetime.timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    scans_today = (
        db.query(Interaction)
        .filter(*interaction_filters, Interaction.timestamp >= today_start)
        .count()
    )

    unique_products_scanned = (
        db.query(func.count(func.distinct(Interaction.product_id)))
        .filter(*interaction_filters)
        .scalar()
        or 0
    )

    top_rows = (
        db.query(
            Product.id,
            Product.unique_code,
            Product.product_type,
            Product.team_role_id,
            func.count(Interaction.id).label("scan_count"),
        )
        .join(Interaction, Interaction.product_id == Product.id)
        .filter(Product.id.in_(product_ids), *interaction_filters)
        .group_by(Product.id, Product.unique_code, Product.product_type, Product.team_role_id)
        .order_by(func.count(Interaction.id).desc())
        .limit(5)
        .all()
    )
    top_products = []
    for row in top_rows:
        role = resolve_role(team_structure, row[3])
        top_products.append(
            TopProduct(
                unique_code=row[1],
                product_type=row[2],
                scan_count=row[4],
                team_role_id=role.role_id,
                team_role_name=role.role_name,
                team_group_name=role.group_name,
            )
        )

    country_rows = (
        db.query(Interaction.country, func.count(Interaction.id))
        .filter(*interaction_filters, Interaction.country.isnot(None))
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
        .filter(*interaction_filters, Interaction.timestamp >= range_start)
        .group_by("day")
        .order_by("day")
        .all()
    )
    daily_scans = [
        DailyScan(date=str(row[0]), scan_count=row[1]) for row in daily_rows
    ]

    daily_lead_rows = (
        db.query(
            func.date(Lead.created_at).label("day"),
            func.count(Lead.id),
        )
        .filter(*lead_filters, Lead.created_at >= range_start)
        .group_by("day")
        .order_by("day")
        .all()
    )
    daily_leads = [
        DailyLead(date=str(row[0]), lead_count=row[1]) for row in daily_lead_rows
    ]

    campaigns = _company_campaigns(db, company_id)
    allowed_ids: set[int] | None = set(product_ids) if not is_admin(user) else None
    if allowed_ids is not None:
        campaigns = [c for c in campaigns if any(p.id in allowed_ids for p in c.products)]
    campaign_stats: list[TopCampaign] = []
    leads_by_campaign: list[LeadsByCampaign] = []
    for campaign in campaigns:
        scans, leads = _campaign_stats(db, campaign, allowed_ids)
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

    top_roles, leads_by_role = _role_stats(db, product_ids, products_by_id, team_structure)

    device_rows = (
        db.query(Interaction.device_type, func.count(Interaction.id))
        .filter(*interaction_filters, Interaction.device_type.isnot(None))
        .group_by(Interaction.device_type)
        .order_by(func.count(Interaction.id).desc())
        .all()
    )
    by_device = [
        DeviceStat(device_type=row[0] or "unknown", scan_count=row[1]) for row in device_rows
    ]

    geo_rows = (
        db.query(Interaction.city, Interaction.country, func.count(Interaction.id))
        .filter(*interaction_filters, Interaction.country.isnot(None))
        .group_by(Interaction.city, Interaction.country)
        .order_by(func.count(Interaction.id).desc())
        .limit(20)
        .all()
    )
    geo_points = [
        GeoPoint(city=row[0], country=row[1] or "Unknown", scan_count=row[2])
        for row in geo_rows
    ]

    scan_by_event = (
        db.query(Interaction.event_tag, func.count(Interaction.id))
        .filter(*interaction_filters, Interaction.event_tag.isnot(None))
        .group_by(Interaction.event_tag)
        .all()
    )
    lead_by_event = (
        db.query(Lead.event_tag, func.count(Lead.id))
        .filter(*lead_filters, Lead.event_tag.isnot(None))
        .group_by(Lead.event_tag)
        .all()
    )
    event_scan_counts = {row[0]: row[1] for row in scan_by_event if row[0]}
    event_lead_counts = {row[0]: row[1] for row in lead_by_event if row[0]}
    all_event_tags = set(event_scan_counts) | set(event_lead_counts)
    top_events = [
        EventStat(
            event_tag=tag,
            scan_count=event_scan_counts.get(tag, 0),
            lead_count=event_lead_counts.get(tag, 0),
        )
        for tag in all_event_tags
    ]
    top_events.sort(key=lambda row: row.scan_count, reverse=True)

    return AnalyticsOverview(
        total_scans=total_scans,
        scans_today=scans_today,
        unique_products_scanned=unique_products_scanned,
        total_leads=total_leads,
        conversion_rate=conversion_rate,
        top_products=top_products,
        top_campaigns=campaign_stats[:5],
        leads_by_campaign=leads_by_campaign,
        top_roles=top_roles[:5],
        leads_by_role=leads_by_role,
        by_country=by_country,
        by_device=by_device,
        geo_points=geo_points,
        daily_scans=daily_scans,
        daily_leads=daily_leads,
        top_events=top_events[:10],
    )


@router.get("/interactions", response_model=list[InteractionEvent])
def list_interactions(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    role_id: Annotated[Optional[str], Query(max_length=100)] = None,
    group_id: Annotated[Optional[str], Query(max_length=100)] = None,
    event_tag: Annotated[Optional[str], Query(max_length=100)] = None,
) -> list[InteractionEvent]:
    company_id = require_company(user)
    product_ids, products_by_id, team_structure = _company_products(db, company_id, user)
    product_ids = filter_product_ids_by_team(
        product_ids, products_by_id, team_structure, role_id=role_id, group_id=group_id
    )

    if not product_ids:
        return []

    normalized_event = normalize_event_tag(event_tag)
    interaction_query = (
        db.query(Interaction)
        .options(joinedload(Interaction.product).joinedload(Product.campaign))
        .filter(Interaction.product_id.in_(product_ids))
    )
    if normalized_event:
        interaction_query = interaction_query.filter(Interaction.event_tag == normalized_event)

    interactions = interaction_query.order_by(Interaction.timestamp.desc()).limit(limit).all()

    events: list[InteractionEvent] = []
    for i in interactions:
        role = resolve_role(team_structure, i.product.team_role_id)
        events.append(
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
                team_role_id=role.role_id,
                team_role_name=role.role_name,
                team_group_name=role.group_name,
                event_tag=i.event_tag,
            )
        )
    return events


@router.get("/export")
def export_analytics_csv(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> StreamingResponse:
    company_id = require_company(user)
    product_ids, _, team_structure = _company_products(db, company_id, user)

    def generate() -> Iterator[str]:
        buffer = io.StringIO()
        writer = csv.writer(buffer)

        writer.writerow(["=== SCANS ==="])
        writer.writerow(
            [
                "timestamp",
                "product_code",
                "campaign",
                "role",
                "department",
                "device",
                "city",
                "country",
                "ip",
            ]
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
                role = resolve_role(team_structure, row.product.team_role_id)
                writer.writerow([
                    row.timestamp.isoformat(),
                    row.product.unique_code,
                    row.product.campaign.name,
                    role.role_name or "",
                    role.group_name or "",
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
        writer.writerow(
            [
                "name",
                "email",
                "phone",
                "company",
                "product_code",
                "campaign",
                "role",
                "department",
            ]
        )
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
                role = resolve_role(team_structure, lead.product.team_role_id)
                writer.writerow([
                    lead.name,
                    lead.email,
                    lead.phone or "",
                    lead.company or "",
                    lead.product.unique_code,
                    lead.product.campaign.name,
                    role.role_name or "",
                    role.group_name or "",
                ])
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=lumina-analytics.csv"},
    )
