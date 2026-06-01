"""Platform admin API tests."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app

client = TestClient(app)


def test_platform_companies_requires_admin(local_auth_only, monkeypatch):
    monkeypatch.setattr(settings, "platform_admin_emails", "platform-admin@test.com")

    suffix = uuid.uuid4().hex[:8]
    email = f"regular-{suffix}@example.com"
    register = client.post(
        "/auth/register",
        json={
            "name": "Regular User",
            "email": email,
            "password": "secret123",
            "company_name": "Regular Co",
        },
    )
    assert register.status_code == 200
    token = register.json()["access_token"]

    denied = client.get(
        "/platform/companies",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert denied.status_code == 403

    admin_suffix = uuid.uuid4().hex[:8]
    admin_email = f"platform-admin-{admin_suffix}@test.com"
    monkeypatch.setattr(settings, "platform_admin_emails", admin_email)

    admin_register = client.post(
        "/auth/register",
        json={
            "name": "Platform Admin",
            "email": admin_email,
            "password": "secret123",
            "company_name": "Platform Admin Co",
        },
    )
    assert admin_register.status_code == 200
    admin_data = admin_register.json()
    assert admin_data["is_platform_admin"] is True

    me = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {admin_data['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["is_platform_admin"] is True

    listed = client.get(
        "/platform/companies",
        headers={"Authorization": f"Bearer {admin_data['access_token']}"},
    )
    assert listed.status_code == 200
    companies = listed.json()
    assert len(companies) >= 2
    names = {c["company_name"] for c in companies}
    assert "Regular Co" in names
    assert "Platform Admin Co" in names
    for row in companies:
        assert "product_count" in row
        assert "sample_card_codes" in row
        assert "landing_base_url" in row
        assert "email" not in row
