from __future__ import annotations

import datetime
from typing import Any, Optional

from app.models.meeting import DEFAULT_NOTE_SECTIONS, MeetingParticipant, MeetingSession


SECTION_LABELS = {
    "discussed": "What we discussed",
    "decisions": "Decisions made",
    "action_items": "Action items",
    "next_steps": "Next steps",
}


def _format_when(dt: Optional[datetime.datetime]) -> str:
    if dt is None:
        return "Not scheduled"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


def _participant_line(p: MeetingParticipant) -> str:
    parts = [p.name]
    if p.email:
        parts.append(p.email)
    if p.company:
        parts.append(p.company)
    return " — ".join(parts)


def build_report_markdown(
    meeting: MeetingSession,
    notes: dict[str, str],
    participants: list[MeetingParticipant],
    host_name: str,
) -> str:
    lines = [
        f"# Meeting Report: {meeting.title}",
        "",
        f"**Status:** {meeting.status}",
        f"**Scheduled:** {_format_when(meeting.scheduled_at)}",
        f"**Host:** {host_name}",
    ]
    if meeting.event_tag:
        lines.append(f"**Event tag:** {meeting.event_tag}")
    lines.extend(["", "## Participants", ""])
    if participants:
        for p in participants:
            lines.append(f"- {_participant_line(p)}")
    else:
        lines.append("_No participants recorded._")
    for key, label in SECTION_LABELS.items():
        body = (notes.get(key) or "").strip()
        lines.extend(["", f"## {label}", ""])
        lines.append(body if body else "_No notes._")
    lines.append("")
    return "\n".join(lines)


def build_report_json(
    meeting: MeetingSession,
    notes: dict[str, str],
    participants: list[MeetingParticipant],
    host_name: str,
) -> dict[str, Any]:
    return {
        "title": meeting.title,
        "status": meeting.status,
        "scheduled_at": meeting.scheduled_at.isoformat() if meeting.scheduled_at else None,
        "host_name": host_name,
        "event_tag": meeting.event_tag,
        "participants": [
            {
                "name": p.name,
                "email": p.email,
                "company": p.company,
                "joined_at": p.joined_at.isoformat(),
            }
            for p in participants
        ],
        "sections": {key: notes.get(key, "") for key in DEFAULT_NOTE_SECTIONS},
        "section_labels": SECTION_LABELS,
    }
