"""Tests for collaborative meeting report generation."""

import datetime

from app.models.meeting import MeetingParticipant, MeetingSession
from app.services.meeting_report import build_report_json, build_report_markdown


def _sample_meeting() -> MeetingSession:
    meeting = MeetingSession(
        id=1,
        company_id=1,
        host_user_id=1,
        title="Product sync",
        scheduled_at=datetime.datetime(2026, 6, 1, 14, 0, tzinfo=datetime.timezone.utc),
        share_token="abc123",
        status="live",
        event_tag="expo-2026",
    )
    return meeting


def test_build_report_markdown_includes_sections():
    meeting = _sample_meeting()
    notes = {
        "discussed": "Roadmap priorities",
        "decisions": "Ship v1 in June",
        "action_items": "Alice — finalize designs by Friday",
        "next_steps": "Follow-up next week",
    }
    participants = [
        MeetingParticipant(
            id=1,
            meeting_id=1,
            name="Alice",
            email="alice@test.com",
            session_id="s1",
            joined_at=datetime.datetime(2026, 6, 1, 13, 55, tzinfo=datetime.timezone.utc),
            last_seen_at=datetime.datetime(2026, 6, 1, 14, 30, tzinfo=datetime.timezone.utc),
        )
    ]
    md = build_report_markdown(meeting, notes, participants, "Host User")
    assert "# Meeting Report: Product sync" in md
    assert "Roadmap priorities" in md
    assert "Alice — alice@test.com" in md
    assert "expo-2026" in md


def test_build_report_json_shape():
    meeting = _sample_meeting()
    notes = {"discussed": "Hi", "decisions": "", "action_items": "", "next_steps": ""}
    data = build_report_json(meeting, notes, [], "Host")
    assert data["title"] == "Product sync"
    assert data["host_name"] == "Host"
    assert "discussed" in data["sections"]
