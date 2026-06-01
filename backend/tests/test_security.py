"""Security middleware, rate limiting, and access control tests."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.security.rate_limit import PUBLIC_RATE_LIMITS, reset_rate_limits_for_tests

client = TestClient(app)


def test_security_headers_on_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_hsts_only_in_production(monkeypatch):
    monkeypatch.setattr(settings, "environment", "development")
    dev = client.get("/health")
    assert "Strict-Transport-Security" not in dev.headers

    monkeypatch.setattr(settings, "environment", "production")
    prod = client.get("/health")
    assert "Strict-Transport-Security" in prod.headers


def test_auth_login_rate_limit_returns_429(local_auth_only, monkeypatch):
    from app.security.rate_limit import RateLimitRule

    monkeypatch.setitem(
        PUBLIC_RATE_LIMITS,
        "auth_login",
        RateLimitRule(max_requests=2, window_seconds=60),
    )

    suffix = uuid.uuid4().hex[:8]
    email = f"rate-{suffix}@example.com"
    client.post(
        "/auth/register",
        json={
            "name": "Rate User",
            "email": email,
            "password": "secret123",
            "company_name": "Rate Co",
        },
    )

    payload = {"email": email, "password": "wrong"}
    for _ in range(2):
        response = client.post("/auth/login", json=payload)
        assert response.status_code == 401

    blocked = client.post("/auth/login", json=payload)
    assert blocked.status_code == 429
    assert "Too many" in blocked.json()["detail"]


def test_platform_companies_forbidden_for_regular_user(local_auth_only, monkeypatch):
    monkeypatch.setattr(settings, "platform_admin_emails", "owner@example.com")

    suffix = uuid.uuid4().hex[:8]
    register = client.post(
        "/auth/register",
        json={
            "name": "Regular",
            "email": f"user-{suffix}@example.com",
            "password": "secret123",
            "company_name": "User Co",
        },
    )
    token = register.json()["access_token"]

    response = client.get(
        "/platform/companies",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_public_login_error_sanitized_in_production(local_auth_only, monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")

    response = client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "bad"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Unauthorized"
