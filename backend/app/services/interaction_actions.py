from __future__ import annotations

ACTION_MEETING_SCHEDULED = "meeting_scheduled"

ALLOWED_TRACK_ACTIONS = {ACTION_MEETING_SCHEDULED}


def normalize_track_action(action: str | None) -> str | None:
    if not action:
        return None
    value = action.strip().lower()
    if value in ALLOWED_TRACK_ACTIONS:
        return value
    return None
