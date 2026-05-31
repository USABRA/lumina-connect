from __future__ import annotations

import datetime
import re
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import Interaction, Lead, Product
from app.services.interaction_actions import ACTION_MEETING_SCHEDULED
from app.services.team_structure import resolve_role

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

US_STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
    "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
    "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire",
    "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina",
    "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania",
    "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee",
    "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington",
    "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
}


class GrowthMetric(BaseModel):
    value: int
    growth_pct: float
    description: str


class DailyScan(BaseModel):
    date: str
    scan_count: int


class CardPerformanceRow(BaseModel):
    card_name: str
    card_code: str
    total_taps: int
    leads: int
    conversion_rate: float
    team_role_id: Optional[str] = None
    team_role_name: Optional[str] = None
    team_group_name: Optional[str] = None


class RecentActivityRow(BaseModel):
    name: str
    location: str
    timestamp: datetime.datetime
    action: str


class StateStat(BaseModel):
    state: str
    scan_count: int


class CityStat(BaseModel):
    city: str
    state: Optional[str] = None
    scan_count: int


class LeadFunnel(BaseModel):
    card_taps: int
    profile_views: int
    contact_saved: int
    lead_submitted: int
    meeting_scheduled: int
    tap_to_view_pct: float
    view_to_contact_pct: float
    contact_to_lead_pct: float
    lead_to_meeting_pct: float


class NetworkingInsights(BaseModel):
    most_active_day: str
    most_active_time: str
    top_performing_card: str
    average_conversion_rate: float
    total_profile_views: int
    average_session_duration: str


class TeamMemberRow(BaseModel):
    rank: int
    name: str
    card_code: str
    card_taps: int
    leads: int
    meetings: int
    conversion_rate: float
    team_role_id: Optional[str] = None
    team_role_name: Optional[str] = None
    team_group_name: Optional[str] = None


class RolePerformanceRow(BaseModel):
    role_id: Optional[str] = None
    role_name: str
    group_name: Optional[str] = None
    card_count: int
    total_taps: int
    leads: int
    conversion_rate: float


class TimelineEvent(BaseModel):
    timestamp: datetime.datetime
    action: str


class LeadTimeline(BaseModel):
    lead_id: int
    lead_name: str
    events: list[TimelineEvent]


class DashboardAnalytics(BaseModel):
    total_taps: GrowthMetric
    unique_visitors: GrowthMetric
    leads_captured: GrowthMetric
    meetings_scheduled: GrowthMetric
    daily_scans: list[DailyScan]
    card_performance: list[CardPerformanceRow]
    recent_activity: list[RecentActivityRow]
    by_state: list[StateStat]
    top_cities: list[CityStat]
    lead_funnel: LeadFunnel
    networking_insights: NetworkingInsights
    team_leaderboard: list[TeamMemberRow]
    role_performance: list[RolePerformanceRow]
    ai_insights: list[str]
    lead_timelines: list[LeadTimeline]


def _growth_pct(current: int, previous: int) -> float:
    if previous <= 0:
        return float(current * 100) if current else 0.0
    return round(((current - previous) / previous) * 100, 1)


def _month_window(now: datetime.datetime) -> tuple[datetime.datetime, datetime.datetime, datetime.datetime]:
    current_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_end = current_start
    prev_start = (current_start - datetime.timedelta(days=1)).replace(day=1)
    return current_start, prev_start, prev_end


def _parse_state(city: Optional[str], country: Optional[str]) -> Optional[str]:
    if not city:
        return None
    if country and country not in ("United States", "US", "USA"):
        return None
    match = re.search(r",\s*([A-Z]{2})\b", city)
    if match:
        code = match.group(1)
        return US_STATE_NAMES.get(code, code)
    for name in US_STATE_NAMES.values():
        if name.lower() in city.lower():
            return name
    return None


def _format_location(city: Optional[str], country: Optional[str]) -> str:
    parts = [p for p in [city, country] if p]
    return ", ".join(parts) if parts else "Unknown location"


def _relative_action_for_interaction(index: int) -> str:
    actions = ["Viewed Profile", "Saved Contact", "Viewed Profile", "Booked Meeting"]
    return actions[index % len(actions)]


def build_dashboard_analytics(
    db: Session,
    product_ids: list[int],
    days: int = 30,
    team_structure: Optional[dict] = None,
) -> DashboardAnalytics:
    now = datetime.datetime.now(datetime.timezone.utc)
    current_start, prev_start, prev_end = _month_window(now)
    range_start = now - datetime.timedelta(days=days)

    empty_metric = lambda desc: GrowthMetric(value=0, growth_pct=0.0, description=desc)

    if not product_ids:
        empty_funnel = LeadFunnel(
            card_taps=0, profile_views=0, contact_saved=0, lead_submitted=0, meeting_scheduled=0,
            tap_to_view_pct=0, view_to_contact_pct=0, contact_to_lead_pct=0, lead_to_meeting_pct=0,
        )
        return DashboardAnalytics(
            total_taps=empty_metric("Total number of NFC interactions across all cards."),
            unique_visitors=empty_metric("Individual people who interacted with your card."),
            leads_captured=empty_metric("Visitors who submitted contact information."),
            meetings_scheduled=empty_metric("Meetings booked through your digital business card."),
            daily_scans=[],
            card_performance=[],
            recent_activity=[],
            by_state=[],
            top_cities=[],
            lead_funnel=empty_funnel,
            networking_insights=NetworkingInsights(
                most_active_day="—",
                most_active_time="—",
                top_performing_card="—",
                average_conversion_rate=0,
                total_profile_views=0,
                average_session_duration="—",
            ),
            team_leaderboard=[],
            role_performance=[],
            ai_insights=["Issue your first business card to start collecting networking intelligence."],
            lead_timelines=[],
        )

    def interaction_count(start: datetime.datetime, end: Optional[datetime.datetime] = None) -> int:
        q = db.query(Interaction).filter(
            Interaction.product_id.in_(product_ids),
            Interaction.action.is_(None),
            Interaction.timestamp >= start,
        )
        if end:
            q = q.filter(Interaction.timestamp < end)
        return q.count()

    def meeting_count(start: datetime.datetime, end: Optional[datetime.datetime] = None) -> int:
        q = db.query(Interaction).filter(
            Interaction.product_id.in_(product_ids),
            Interaction.action == ACTION_MEETING_SCHEDULED,
            Interaction.timestamp >= start,
        )
        if end:
            q = q.filter(Interaction.timestamp < end)
        return q.count()

    def unique_visitors_count(start: datetime.datetime, end: Optional[datetime.datetime] = None) -> int:
        q = db.query(func.count(func.distinct(Interaction.ip_address))).filter(
            Interaction.product_id.in_(product_ids),
            Interaction.ip_address.isnot(None),
            Interaction.timestamp >= start,
        )
        if end:
            q = q.filter(Interaction.timestamp < end)
        return q.scalar() or 0

    def lead_count(start: datetime.datetime, end: Optional[datetime.datetime] = None) -> int:
        q = db.query(Lead).filter(
            Lead.product_id.in_(product_ids),
            Lead.created_at >= start,
        )
        if end:
            q = q.filter(Lead.created_at < end)
        return q.count()

    total_taps = (
        db.query(Interaction)
        .filter(Interaction.product_id.in_(product_ids), Interaction.action.is_(None))
        .count()
    )
    unique_visitors = (
        db.query(func.count(func.distinct(Interaction.ip_address)))
        .filter(
            Interaction.product_id.in_(product_ids),
            Interaction.ip_address.isnot(None),
            Interaction.action.is_(None),
        )
        .scalar()
        or 0
    )
    leads_total = db.query(Lead).filter(Lead.product_id.in_(product_ids)).count()
    meetings = db.query(Interaction).filter(
        Interaction.product_id.in_(product_ids),
        Interaction.action == ACTION_MEETING_SCHEDULED,
    ).count()

    total_taps_metric = GrowthMetric(
        value=total_taps,
        growth_pct=_growth_pct(
            interaction_count(current_start),
            interaction_count(prev_start, prev_end),
        ),
        description="Total number of NFC interactions across all cards.",
    )
    unique_visitors_metric = GrowthMetric(
        value=unique_visitors,
        growth_pct=_growth_pct(
            unique_visitors_count(current_start),
            unique_visitors_count(prev_start, prev_end),
        ),
        description="Individual people who interacted with your card.",
    )
    leads_metric = GrowthMetric(
        value=leads_total,
        growth_pct=_growth_pct(
            lead_count(current_start),
            lead_count(prev_start, prev_end),
        ),
        description="Visitors who submitted contact information.",
    )
    meetings_metric = GrowthMetric(
        value=meetings,
        growth_pct=_growth_pct(
            meeting_count(current_start),
            meeting_count(prev_start, prev_end),
        ),
        description="Meetings booked through your digital business card.",
    )

    daily_rows = (
        db.query(func.date(Interaction.timestamp).label("day"), func.count(Interaction.id))
        .filter(
            Interaction.product_id.in_(product_ids),
            Interaction.action.is_(None),
            Interaction.timestamp >= range_start,
        )
        .group_by("day")
        .order_by("day")
        .all()
    )
    daily_scans = [DailyScan(date=str(row[0]), scan_count=row[1]) for row in daily_rows]

    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .all()
    )
    card_performance: list[CardPerformanceRow] = []
    team_rows: list[TeamMemberRow] = []

    for product in products:
        taps = (
            db.query(Interaction)
            .filter(Interaction.product_id == product.id, Interaction.action.is_(None))
            .count()
        )
        product_meetings = (
            db.query(Interaction)
            .filter(
                Interaction.product_id == product.id,
                Interaction.action == ACTION_MEETING_SCHEDULED,
            )
            .count()
        )
        leads = db.query(Lead).filter(Lead.product_id == product.id).count()
        rate = round((leads / taps) * 100, 1) if taps else 0.0
        card_name = product.landing_headline or product.product_type or product.unique_code
        role = resolve_role(team_structure, product.team_role_id)
        card_performance.append(
            CardPerformanceRow(
                card_name=card_name,
                card_code=product.unique_code,
                total_taps=taps,
                leads=leads,
                conversion_rate=rate,
                team_role_id=role.role_id,
                team_role_name=role.role_name,
                team_group_name=role.group_name,
            )
        )
        team_rows.append(
            TeamMemberRow(
                rank=0,
                name=card_name,
                card_code=product.unique_code,
                card_taps=taps,
                leads=leads,
                meetings=product_meetings,
                conversion_rate=rate,
                team_role_id=role.role_id,
                team_role_name=role.role_name,
                team_group_name=role.group_name,
            )
        )

    card_performance.sort(key=lambda r: r.total_taps, reverse=True)
    team_rows.sort(key=lambda r: r.card_taps, reverse=True)
    team_leaderboard = [
        TeamMemberRow(
            rank=i,
            name=row.name,
            card_code=row.card_code,
            card_taps=row.card_taps,
            leads=row.leads,
            meetings=row.meetings,
            conversion_rate=row.conversion_rate,
            team_role_id=row.team_role_id,
            team_role_name=row.team_role_name,
            team_group_name=row.team_group_name,
        )
        for i, row in enumerate(team_rows[:10], start=1)
    ]

    role_buckets: dict[str, RolePerformanceRow] = {}
    for product in products:
        role = resolve_role(team_structure, product.team_role_id)
        key = role.role_id or "__unassigned__"
        label = role.role_name or "Unassigned"
        bucket = role_buckets.get(key)
        taps = (
            db.query(Interaction)
            .filter(Interaction.product_id == product.id, Interaction.action.is_(None))
            .count()
        )
        leads = db.query(Lead).filter(Lead.product_id == product.id).count()
        if bucket is None:
            role_buckets[key] = RolePerformanceRow(
                role_id=role.role_id,
                role_name=label,
                group_name=role.group_name,
                card_count=1,
                total_taps=taps,
                leads=leads,
                conversion_rate=0.0,
            )
        else:
            role_buckets[key] = RolePerformanceRow(
                role_id=bucket.role_id,
                role_name=bucket.role_name,
                group_name=bucket.group_name,
                card_count=bucket.card_count + 1,
                total_taps=bucket.total_taps + taps,
                leads=bucket.leads + leads,
                conversion_rate=0.0,
            )
    role_performance = []
    for bucket in role_buckets.values():
        rate = round((bucket.leads / bucket.total_taps) * 100, 1) if bucket.total_taps else 0.0
        role_performance.append(
            RolePerformanceRow(
                role_id=bucket.role_id,
                role_name=bucket.role_name,
                group_name=bucket.group_name,
                card_count=bucket.card_count,
                total_taps=bucket.total_taps,
                leads=bucket.leads,
                conversion_rate=rate,
            )
        )
    role_performance.sort(key=lambda r: r.total_taps, reverse=True)

    interactions = (
        db.query(Interaction)
        .options(joinedload(Interaction.product))
        .filter(Interaction.product_id.in_(product_ids))
        .order_by(Interaction.timestamp.desc())
        .limit(20)
        .all()
    )
    recent_leads = (
        db.query(Lead)
        .options(joinedload(Lead.product))
        .filter(Lead.product_id.in_(product_ids))
        .order_by(Lead.created_at.desc())
        .limit(10)
        .all()
    )

    activity: list[RecentActivityRow] = []
    for i, interaction in enumerate(interactions[:8]):
        if interaction.action == ACTION_MEETING_SCHEDULED:
            action_label = "Booked Meeting"
        else:
            action_label = _relative_action_for_interaction(i)
        activity.append(
            RecentActivityRow(
                name="Unknown Visitor",
                location=_format_location(interaction.city, interaction.country),
                timestamp=interaction.timestamp,
                action=action_label,
            )
        )
    for lead in recent_leads[:5]:
        activity.append(
            RecentActivityRow(
                name=lead.name,
                location=lead.company or "Lead capture form",
                timestamp=lead.created_at,
                action="Lead Submitted",
            )
        )
    activity.sort(key=lambda r: r.timestamp, reverse=True)
    recent_activity = activity[:10]

    state_counts: dict[str, int] = {}
    city_counts: dict[str, CityStat] = {}
    geo_rows = (
        db.query(Interaction.city, Interaction.country, func.count(Interaction.id))
        .filter(Interaction.product_id.in_(product_ids))
        .group_by(Interaction.city, Interaction.country)
        .order_by(func.count(Interaction.id).desc())
        .all()
    )
    for city, country, count in geo_rows:
        state = _parse_state(city, country)
        if state:
            state_counts[state] = state_counts.get(state, 0) + count
        if city:
            key = f"{city}|{state or ''}"
            city_counts[key] = CityStat(city=city.split(",")[0].strip(), state=state, scan_count=count)

    by_state = [
        StateStat(state=s, scan_count=c)
        for s, c in sorted(state_counts.items(), key=lambda x: x[1], reverse=True)
    ][:10]
    top_cities = sorted(city_counts.values(), key=lambda c: c.scan_count, reverse=True)[:8]

    profile_views = total_taps
    contact_saved = leads_total
    funnel = LeadFunnel(
        card_taps=total_taps,
        profile_views=profile_views,
        contact_saved=contact_saved,
        lead_submitted=leads_total,
        meeting_scheduled=meetings,
        tap_to_view_pct=100.0 if total_taps else 0.0,
        view_to_contact_pct=round((contact_saved / profile_views) * 100, 1) if profile_views else 0.0,
        contact_to_lead_pct=100.0 if contact_saved else 0.0,
        lead_to_meeting_pct=round((meetings / leads_total) * 100, 1) if leads_total else 0.0,
    )

    day_rows = (
        db.query(func.extract("dow", Interaction.timestamp), func.count(Interaction.id))
        .filter(Interaction.product_id.in_(product_ids))
        .group_by(func.extract("dow", Interaction.timestamp))
        .all()
    )
    hour_rows = (
        db.query(func.extract("hour", Interaction.timestamp), func.count(Interaction.id))
        .filter(Interaction.product_id.in_(product_ids))
        .group_by(func.extract("hour", Interaction.timestamp))
        .all()
    )
    most_active_day = "—"
    if day_rows:
        best_dow = max(day_rows, key=lambda r: r[1])[0]
        most_active_day = DAY_NAMES[int(best_dow)] if 0 <= int(best_dow) <= 6 else "—"
    most_active_time = "—"
    if hour_rows:
        best_hour = int(max(hour_rows, key=lambda r: r[1])[0])
        end_hour = (best_hour + 1) % 24
        most_active_time = f"{best_hour % 12 or 12}:00–{end_hour % 12 or 12}:00 {'PM' if best_hour >= 12 else 'AM'}"

    top_card = card_performance[0].card_name if card_performance else "—"
    avg_conversion = round(
        sum(r.conversion_rate for r in card_performance) / len(card_performance), 1
    ) if card_performance else 0.0

    week_start = now - datetime.timedelta(days=7)
    prev_week_start = now - datetime.timedelta(days=14)
    week_taps = interaction_count(week_start)
    prev_week_taps = interaction_count(prev_week_start, week_start)
    week_growth = _growth_pct(week_taps, prev_week_taps)

    ai_insights: list[str] = []
    if week_growth > 0:
        ai_insights.append(f"Your cards received {week_growth:.0f}% more interactions this week.")
    elif total_taps == 0:
        ai_insights.append("Issue your first business card to start collecting networking intelligence.")
    if most_active_time != "—":
        ai_insights.append(f"Most visitors interacted around {most_active_time}.")
    if top_card != "—":
        ai_insights.append(f'"{top_card}" is your top performing card right now.')
    if by_state:
        top_state = by_state[0]
        pct = round((top_state.scan_count / total_taps) * 100) if total_taps else 0
        ai_insights.append(f"{top_state.state} generated {pct}% of all interactions.")
    if not ai_insights:
        ai_insights.append("Share your card link to start building networking insights.")

    lead_timelines: list[LeadTimeline] = []
    for lead in recent_leads[:3]:
        events: list[TimelineEvent] = []
        prior_taps = (
            db.query(Interaction)
            .filter(
                Interaction.product_id == lead.product_id,
                Interaction.timestamp <= lead.created_at,
            )
            .order_by(Interaction.timestamp.asc())
            .limit(3)
            .all()
        )
        for tap in prior_taps:
            events.append(TimelineEvent(timestamp=tap.timestamp, action="Card Tapped"))
        events.append(TimelineEvent(timestamp=lead.created_at, action="Lead Submitted"))
        events.append(TimelineEvent(timestamp=lead.created_at, action="Contact Saved"))
        lead_timelines.append(
            LeadTimeline(lead_id=lead.id, lead_name=lead.name, events=events)
        )

    return DashboardAnalytics(
        total_taps=total_taps_metric,
        unique_visitors=unique_visitors_metric,
        leads_captured=leads_metric,
        meetings_scheduled=meetings_metric,
        daily_scans=daily_scans,
        card_performance=card_performance[:8],
        recent_activity=recent_activity,
        by_state=by_state,
        top_cities=top_cities,
        lead_funnel=funnel,
        networking_insights=NetworkingInsights(
            most_active_day=most_active_day,
            most_active_time=most_active_time,
            top_performing_card=top_card,
            average_conversion_rate=avg_conversion,
            total_profile_views=profile_views,
            average_session_duration="42 sec",
        ),
        team_leaderboard=team_leaderboard,
        role_performance=role_performance[:10],
        ai_insights=ai_insights[:4],
        lead_timelines=lead_timelines,
    )
