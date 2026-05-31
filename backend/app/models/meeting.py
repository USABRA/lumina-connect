from __future__ import annotations

import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


DEFAULT_NOTE_SECTIONS: dict[str, str] = {
    "discussed": "",
    "decisions": "",
    "action_items": "",
    "next_steps": "",
}


class MeetingSession(Base):
    __tablename__ = "meeting_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    host_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    scheduled_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    share_token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False, index=True)
    event_tag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    product_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    host: Mapped["User"] = relationship(foreign_keys=[host_user_id])
    participants: Mapped[list["MeetingParticipant"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    notes: Mapped[Optional["MeetingNote"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        uselist=False,
    )
    reports: Mapped[list["MeetingReport"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    session_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    joined_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    last_seen_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    meeting: Mapped["MeetingSession"] = relationship(back_populates="participants")


class MeetingNote(Base):
    __tablename__ = "meeting_notes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    content: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    updated_by_participant_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("meeting_participants.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )

    meeting: Mapped["MeetingSession"] = relationship(back_populates="notes")


class MeetingReport(Base):
    __tablename__ = "meeting_reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meeting_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    generated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
    )
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    content_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    meeting: Mapped["MeetingSession"] = relationship(back_populates="reports")
