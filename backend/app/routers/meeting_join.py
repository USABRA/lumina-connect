from __future__ import annotations

import datetime
import secrets
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Path, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.security.rate_limit import RateLimit
from app.models.meeting import (
    DEFAULT_NOTE_SECTIONS,
    MeetingNote,
    MeetingParticipant,
    MeetingSession,
)

router = APIRouter(prefix="/meetings/join", tags=["meeting-join"])

VALID_SECTIONS = set(DEFAULT_NOTE_SECTIONS.keys())
ACTIVE_WINDOW_SECONDS = 90


class JoinRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: Optional[str] = Field(default=None, max_length=255)
    company: Optional[str] = Field(default=None, max_length=255)


class JoinResponse(BaseModel):
    session_id: str
    participant_id: int
    meeting_title: str
    meeting_status: str
    scheduled_at: Optional[datetime.datetime] = None


class ParticipantInfo(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    company: Optional[str] = None
    is_active: bool


class RoomState(BaseModel):
    meeting_id: int
    title: str
    status: str
    scheduled_at: Optional[datetime.datetime] = None
    event_tag: Optional[str] = None
    notes: dict[str, str]
    notes_updated_at: Optional[datetime.datetime] = None
    participants: list[ParticipantInfo]


class NotesUpdate(BaseModel):
    section: str
    content: str = Field(max_length=20000)


class NotesUpdateResponse(BaseModel):
    notes: dict[str, str]
    notes_updated_at: datetime.datetime


def _get_meeting_by_token(token: str, db: Session) -> MeetingSession:
    meeting = (
        db.query(MeetingSession)
        .options(joinedload(MeetingSession.notes), joinedload(MeetingSession.participants))
        .filter(MeetingSession.share_token == token)
        .one_or_none()
    )
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


def _notes_content(meeting: MeetingSession) -> dict[str, str]:
    if meeting.notes and isinstance(meeting.notes.content, dict):
        merged = dict(DEFAULT_NOTE_SECTIONS)
        merged.update({k: str(v) for k, v in meeting.notes.content.items() if k in VALID_SECTIONS})
        return merged
    return dict(DEFAULT_NOTE_SECTIONS)


def _is_active(participant: MeetingParticipant, now: datetime.datetime) -> bool:
    last_seen = participant.last_seen_at
    if last_seen.tzinfo is None:
        last_seen = last_seen.replace(tzinfo=datetime.timezone.utc)
    return (now - last_seen).total_seconds() <= ACTIVE_WINDOW_SECONDS


def _room_state(meeting: MeetingSession) -> RoomState:
    now = datetime.datetime.now(datetime.timezone.utc)
    participants = sorted(meeting.participants, key=lambda p: p.joined_at)
    notes = meeting.notes
    return RoomState(
        meeting_id=meeting.id,
        title=meeting.title,
        status=meeting.status,
        scheduled_at=meeting.scheduled_at,
        event_tag=meeting.event_tag,
        notes=_notes_content(meeting),
        notes_updated_at=notes.updated_at if notes else None,
        participants=[
            ParticipantInfo(
                id=p.id,
                name=p.name,
                email=p.email,
                company=p.company,
                is_active=_is_active(p, now),
            )
            for p in participants
        ],
    )


def _require_participant(
    meeting: MeetingSession,
    participant_session: str,
    db: Session,
) -> MeetingParticipant:
    participant = (
        db.query(MeetingParticipant)
        .filter(
            MeetingParticipant.meeting_id == meeting.id,
            MeetingParticipant.session_id == participant_session,
        )
        .one_or_none()
    )
    if participant is None:
        raise HTTPException(status_code=403, detail="Invalid participant session")
    return participant


@router.get("/{token}", response_model=RoomState)
def get_room(
    token: str,
    db: Annotated[Session, Depends(get_db)],
) -> RoomState:
    meeting = _get_meeting_by_token(token, db)
    return _room_state(meeting)


@router.post("/{token}/join", response_model=JoinResponse)
def join_room(
    token: Annotated[str, Path(min_length=1, max_length=64)],
    body: JoinRequest,
    db: Annotated[Session, Depends(get_db)],
    _rate_limit: RateLimit("meeting_join"),
) -> JoinResponse:
    meeting = _get_meeting_by_token(token, db)
    if meeting.status == "closed":
        raise HTTPException(status_code=403, detail="This meeting has ended")

    session_id = secrets.token_urlsafe(32)
    participant = MeetingParticipant(
        meeting_id=meeting.id,
        name=body.name.strip(),
        email=body.email.strip() if body.email else None,
        company=body.company.strip() if body.company else None,
        session_id=session_id,
    )
    db.add(participant)
    if meeting.status == "draft":
        meeting.status = "live"
    db.commit()
    db.refresh(participant)
    return JoinResponse(
        session_id=session_id,
        participant_id=participant.id,
        meeting_title=meeting.title,
        meeting_status=meeting.status,
        scheduled_at=meeting.scheduled_at,
    )


@router.patch("/{token}/notes", response_model=NotesUpdateResponse)
def update_notes(
    token: str,
    body: NotesUpdate,
    db: Annotated[Session, Depends(get_db)],
    x_participant_session: Annotated[str, Header()],
) -> NotesUpdateResponse:
    meeting = _get_meeting_by_token(token, db)
    if meeting.status == "closed":
        raise HTTPException(status_code=403, detail="This meeting has ended")
    if body.section not in VALID_SECTIONS:
        raise HTTPException(status_code=400, detail="Invalid section")

    participant = _require_participant(meeting, x_participant_session, db)
    notes = meeting.notes
    if notes is None:
        notes = MeetingNote(meeting_id=meeting.id, content=dict(DEFAULT_NOTE_SECTIONS))
        db.add(notes)
        db.flush()

    content = dict(_notes_content(meeting))
    content[body.section] = body.content
    notes.content = content
    notes.updated_by_participant_id = participant.id
    notes.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(notes)
    return NotesUpdateResponse(notes=content, notes_updated_at=notes.updated_at)


@router.post("/{token}/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
def heartbeat(
    token: str,
    db: Annotated[Session, Depends(get_db)],
    x_participant_session: Annotated[str, Header()],
) -> None:
    meeting = _get_meeting_by_token(token, db)
    participant = _require_participant(meeting, x_participant_session, db)
    participant.last_seen_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
