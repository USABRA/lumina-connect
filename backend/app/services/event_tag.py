from __future__ import annotations

from typing import Optional


def normalize_event_tag(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    if not stripped:
        return None
    return stripped[:100]


def resolve_event_tag(url_event: Optional[str], product_event_tag: Optional[str]) -> Optional[str]:
    """URL ?event= wins; otherwise use the card's default event_tag."""
    from_url = normalize_event_tag(url_event)
    if from_url:
        return from_url
    return normalize_event_tag(product_event_tag)
