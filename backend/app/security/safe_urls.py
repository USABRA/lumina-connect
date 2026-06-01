from __future__ import annotations

from urllib.parse import urlparse


def validate_safe_http_url(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    parsed = urlparse(trimmed)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("URL must use http or https")
    if not parsed.netloc:
        raise ValueError("Invalid URL host")
    if "@" in parsed.netloc.split("@")[-1]:
        raise ValueError("Invalid URL")
    return trimmed
