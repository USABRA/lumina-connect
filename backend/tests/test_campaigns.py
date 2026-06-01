"""Default campaign bootstrap for companies."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_register_creates_default_campaign(local_auth_only):
    suffix = uuid.uuid4().hex[:8]
    email = f"campaign-reg-{suffix}@example.com"

    register = client.post(
        "/auth/register",
        json={
            "name": "Campaign Test",
            "email": email,
            "password": "secret123",
            "company_name": "Campaign Test Co",
        },
    )
    assert register.status_code == 200, register.text
    token = register.json()["access_token"]

    campaigns = client.get("/campaigns", headers={"Authorization": f"Bearer {token}"})
    assert campaigns.status_code == 200, campaigns.text
    data = campaigns.json()
    assert len(data) == 1
    assert data[0]["name"] == "Campaign Test Co"


def test_create_product_without_campaign_id_creates_default(local_auth_only):
    suffix = uuid.uuid4().hex[:8]
    email = f"product-camp-{suffix}@example.com"

    register = client.post(
        "/auth/register",
        json={
            "name": "Product Camp",
            "email": email,
            "password": "secret123",
            "company_name": "Product Camp Co",
        },
    )
    token = register.json()["access_token"]

    product = client.post(
        "/products",
        headers={"Authorization": f"Bearer {token}"},
        json={"product_type": "NFC Business Card"},
    )
    assert product.status_code == 201, product.text
    assert product.json()["campaign_id"] > 0
