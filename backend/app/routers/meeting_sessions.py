from __future__ import annotations

import datetime
import secrets
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.auth.dependencies import get_current_user_flexible
from app.database import get_db
from app.models import User
from app.models.meeting import DEFAULT_NOTE_SECTIONS, MeetingNote, MeetingReport, MeetingSession
from app.services.access import require_company
from app.services.event_tag import normalize_event_tag
from app.services.meeting_report import build_report_json, build_report_markdown

router = APIRouter(prefix="/meetings/sessions", tags=["meeting-sessions"])

VALID_STATUSES = {"draft", "live", "closed"}
VALID_SECTIONS = set(DEFAULT_NOTE_SECTIONS.keys())


class MeetingSessionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    scheduled_at: Optional[datetime.datetime] = None
    event_tag: Optional[str] = Field(default=None, max_length=100)
    product_id: Optional[int] = None


class MeetingSessionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    scheduled_at: Optional[datetime.datetime] = None
    status: Optional[str] = None
    event_tag: Optional[str] = Field(default=None, max_length=100)
    product_id: Optional[int] = None


class MeetingSessionSummary(BaseModel):
    id: int
    title: str
    scheduled_at: Optional[datetime.datetime] = None
    share_token: str
    status: str
    event_tag: Optional[str] = None
    product_id: Optional[int] = None
    host_user_id: int
    host_name: str
    created_at: datetime.datetime
    participant_count: int
    has_report: bool


class MeetingReportSummary(BaseModel):
    id: int
    meeting_id: int
    meeting_title: str
    generated_at: datetime.datetime


class MeetingSessionsListResponse(BaseModel):
    sessions: list[MeetingSessionSummary]
    reports: list[MeetingReportSummary]


class MeetingSessionDetail(MeetingSessionSummary):
    join_url_path: str
    notes: dict[str, str]
    notes_updated_at: Optional[datetime.datetime] = None


class MeetingReportDetail(BaseModel):
    id: int
    meeting_id: int
    generated_at: datetime.datetime
    content_markdown: str
    content_json: dict[str, Any]


def _require_session(meeting_id: int, company_id: int, db: Session) -> MeetingSession:
    meeting = (
        db.query(MeetingSession)
        .options(joinedload(MeetingSession.host))
        .filter(MeetingSession.id == meeting_id, MeetingSession.company_id == company_id)
        .one_or_none()
    )
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting session not found")
    return meeting


def _notes_content(meeting: MeetingSession) -> dict[str, str]:
    if meeting.notes and isinstance(meeting.notes.content, dict):
        merged = dict(DEFAULT_NOTE_SECTIONS)
        merged.update({k: str(v) for k, v in meeting.notes.content.items() if k in VALID_SECTIONS})
        return merged
    return dict(DEFAULT_NOTE_SECTIONS)


def _session_summary(meeting: MeetingSession, db: Session) -> MeetingSessionSummary:
    from app.models.meeting import MeetingParticipant

    participant_count = (
        db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting.id).count()
    )
    has_report = db.query(MeetingReport).filter(MeetingReport.meeting_id == meeting.id).count() > 0
    host = meeting.host
    return MeetingSessionSummary(
        id=meeting.id,
        title=meeting.title,
        scheduled_at=meeting.scheduled_at,
        share_token=meeting.share_token,
        status=meeting.status,
        event_tag=meeting.event_tag,
        product_id=meeting.product_id,
        host_user_id=meeting.host_user_id,
        host_name=host.name if host else "Unknown",
        created_at=meeting.created_at,
        participant_count=participant_count,
        has_report=has_report,
    )


@router.get("", response_model=MeetingSessionsListResponse)
def list_sessions(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> MeetingSessionsListResponse:
    company_id = require_company(user)
    meetings = (
        db.query(MeetingSession)
        .options(joinedload(MeetingSession.host))
        .filter(MeetingSession.company_id == company_id)
        .order_by(MeetingSession.created_at.desc())
        .limit(limit)
        .all()
    )
    sessions = [_session_summary(m, db) for m in meetings]

    reports = (
        db.query(MeetingReport)
        .join(MeetingSession)
        .options(joinedload(MeetingReport.meeting))
        .filter(MeetingSession.company_id == company_id)
        .order_by(MeetingReport.generated_at.desc())
        .limit(limit)
        .all()
    )
    report_summaries = [
        MeetingReportSummary(
            id=r.id,
            meeting_id=r.meeting_id,
            meeting_title=r.meeting.title if r.meeting else "Meeting",
            generated_at=r.generated_at,
        )
        for r in reports
    ]
    return MeetingSessionsListResponse(sessions=sessions, reports=report_summaries)


@router.post("", response_model=MeetingSessionDetail, status_code=status.HTTP_201_CREATED)
def create_session(
    body: MeetingSessionCreate,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> MeetingSessionDetail:
    company_id = require_company(user)
    if body.product_id is not None:
        from app.models import Campaign, Product

        product = (
            db.query(Product)
            .join(Campaign)
            .filter(Product.id == body.product_id, Campaign.company_id == company_id)
            .one_or_none()
        )
        if product is None:
            raise HTTPException(status_code=400, detail="Product not found in your company")

    share_token = secrets.token_urlsafe(24)
    meeting = MeetingSession(
        company_id=company_id,
        host_user_id=user.id,
        title=body.title.strip(),
        scheduled_at=body.scheduled_at,
        share_token=share_token,
        status="draft",
        event_tag=normalize_event_tag(body.event_tag),
        product_id=body.product_id,
    )
    db.add(meeting)
    db.flush()
    db.add(MeetingNote(meeting_id=meeting.id, content=dict(DEFAULT_NOTE_SECTIONS)))
    db.commit()
    db.refresh(meeting)
    meeting = (
        db.query(MeetingSession)
        .options(joinedload(MeetingSession.host), joinedload(MeetingSession.notes))
        .filter(MeetingSession.id == meeting.id)
        .one()
    )
    summary = _session_summary(meeting, db)
    notes = meeting.notes
    return MeetingSessionDetail(
        **summary.model_dump(),
        join_url_path=f"/meetings/join/{meeting.share_token}",
        notes=_notes_content(meeting),
        notes_updated_at=notes.updated_at if notes else None,
    )


@router.get("/{meeting_id}", response_model=MeetingSessionDetail)
def get_session(
    meeting_id: int,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> MeetingSessionDetail:
    company_id = require_company(user)
    meeting = (
        db.query(MeetingSession)
        .options(joinedload(MeetingSession.host), joinedload(MeetingSession.notes))
        .filter(MeetingSession.id == meeting_id, MeetingSession.company_id == company_id)
        .one_or_none()
    )
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting session not found")
    summary = _session_summary(meeting, db)
    notes = meeting.notes
    return MeetingSessionDetail(
        **summary.model_dump(),
        join_url_path=f"/meetings/join/{meeting.share_token}",
        notes=_notes_content(meeting),
        notes_updated_at=notes.updated_at if notes else None,
    )


@router.patch("/{meeting_id}", response_model=MeetingSessionDetail)
def update_session(
    meeting_id: int,
    body: MeetingSessionUpdate,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> MeetingSessionDetail:
    company_id = require_company(user)
    meeting = _require_session(meeting_id, company_id, db)

    if body.title is not None:
        meeting.title = body.title.strip()
    if body.scheduled_at is not None:
        meeting.scheduled_at = body.scheduled_at
    if body.status is not None:
        if body.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status")
        meeting.status = body.status
    if body.event_tag is not None:
        meeting.event_tag = normalize_event_tag(body.event_tag)
    if body.product_id is not None:
        from app.models import Campaign, Product

        product = (
            db.query(Product)
            .join(Campaign)
            .filter(Product.id == body.product_id, Campaign.company_id == company_id)
            .one_or_none()
        )
        if product is None:
            raise HTTPException(status_code=400, detail="Product not found in your company")
        meeting.product_id = body.product_id

    db.commit()
    meeting = (
        db.query(MeetingSession)
        .options(joinedload(MeetingSession.host), joinedload(MeetingSession.notes))
        .filter(MeetingSession.id == meeting.id)
        .one()
    )
    summary = _session_summary(meeting, db)
    notes = meeting.notes
    return MeetingSessionDetail(
        **summary.model_dump(),
        join_url_path=f"/meetings/join/{meeting.share_token}",
        notes=_notes_content(meeting),
        notes_updated_at=notes.updated_at if notes else None,
    )


@router.post("/{meeting_id}/report", response_model=MeetingReportDetail)
def generate_report(
    meeting_id: int,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> MeetingReportDetail:
    company_id = require_company(user)
    meeting = (
        db.query(MeetingSession)
        .options(
            joinedload(MeetingSession.host),
            joinedload(MeetingSession.notes),
            joinedload(MeetingSession.participants),
        )
        .filter(MeetingSession.id == meeting_id, MeetingSession.company_id == company_id)
        .one_or_none()
    )
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting session not found")

    notes = _notes_content(meeting)
    participants = sorted(meeting.participants, key=lambda p: p.joined_at)
    host_name = meeting.host.name if meeting.host else user.name
    markdown = build_report_markdown(meeting, notes, participants, host_name)
    report_json = build_report_json(meeting, notes, participants, host_name)

    report = MeetingReport(
        meeting_id=meeting.id,
        content_markdown=markdown,
        content_json=report_json,
    )
    if meeting.status != "closed":
        meeting.status = "closed"
    db.add(report)
    db.commit()
    db.refresh(report)
    return MeetingReportDetail(
        id=report.id,
        meeting_id=report.meeting_id,
        generated_at=report.generated_at,
        content_markdown=report.content_markdown,
        content_json=report.content_json,
    )


@router.get("/{meeting_id}/report", response_model=MeetingReportDetail)
def get_latest_report(
    meeting_id: int,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> MeetingReportDetail:
    company_id = require_company(user)
    _require_session(meeting_id, company_id, db)
    report = (
        db.query(MeetingReport)
        .filter(MeetingReport.meeting_id == meeting_id)
        .order_by(MeetingReport.generated_at.desc())
        .first()
    )
    if report is None:
        raise HTTPException(status_code=404, detail="No report generated yet")
    return MeetingReportDetail(
        id=report.id,
        meeting_id=report.meeting_id,
        generated_at=report.generated_at,
        content_markdown=report.content_markdown,
        content_json=report.content_json,
    )
