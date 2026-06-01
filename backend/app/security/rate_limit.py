from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass
from threading import Lock
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.config import settings
from app.services.request_meta import get_client_ip

_lock = Lock()
_buckets: dict[str, list[float]] = defaultdict(list)


@dataclass
class RateLimitRule:
    max_requests: int
    window_seconds: int


# Per-endpoint limits (requests per window per client IP)
PUBLIC_RATE_LIMITS: dict[str, RateLimitRule] = {
    "leads_submit": RateLimitRule(30, 60),
    "track_scan": RateLimitRule(120, 60),
    "meeting_join": RateLimitRule(20, 60),
    "auth_login": RateLimitRule(10, 60),
    "auth_register": RateLimitRule(5, 60),
}


def _prune(timestamps: list[float], now: float, window: int) -> list[float]:
    cutoff = now - window
    return [t for t in timestamps if t > cutoff]


def check_rate_limit(key: str, rule: RateLimitRule) -> None:
    if not settings.rate_limit_enabled:
        return

    now = time.monotonic()
    bucket_key = f"{key}:{rule.window_seconds}"

    with _lock:
        timestamps = _prune(_buckets[bucket_key], now, rule.window_seconds)
        if len(timestamps) >= rule.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
        timestamps.append(now)
        _buckets[bucket_key] = timestamps


def rate_limit_dependency(limit_key: str):
    def _dependency(request: Request) -> None:
        rule = PUBLIC_RATE_LIMITS[limit_key]
        client_ip = get_client_ip(request) or "unknown"
        check_rate_limit(f"{limit_key}:{client_ip}", rule)

    return _dependency


def RateLimit(limit_key: str):
    return Annotated[None, Depends(rate_limit_dependency(limit_key))]


def reset_rate_limits_for_tests() -> None:
    with _lock:
        _buckets.clear()
