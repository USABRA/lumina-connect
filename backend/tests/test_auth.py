"""Auth tests for local JWT register/login flow."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.auth.jwt_tokens import create_access_token, decode_access_token
from app.auth.passwords import hash_password, verify_password
from app.main import app

client = TestClient(app)


def test_hash_and_verify_password():
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed)
    assert not verify_password("wrong", hashed)


def test_create_and_decode_token():
    token = create_access_token(42)
    assert decode_access_token(token) == 42


def test_register_login_and_me(local_auth_only):
    suffix = uuid.uuid4().hex[:8]
    email = f"auth-test-{suffix}@example.com"
    password = "secret123"

    register = client.post(
        "/auth/register",
        json={
            "name": "Auth Test",
            "email": email,
            "password": password,
            "company_name": "Auth Test Co",
        },
    )
    assert register.status_code == 200, register.text
    register_data = register.json()
    assert register_data["user"]["email"] == email
    assert register_data["user"]["role"] == "admin"
    assert register_data["company"]["company_name"] == "Auth Test Co"
    token = register_data["access_token"]

    duplicate = client.post(
        "/auth/register",
        json={
            "name": "Auth Test",
            "email": email,
            "password": password,
            "company_name": "Another Co",
        },
    )
    assert duplicate.status_code == 409

    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    assert login.json()["access_token"]

    wrong_password = client.post("/auth/login", json={"email": email, "password": "bad"})
    assert wrong_password.status_code == 401

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["user"]["email"] == email


def test_auth_status_local_mode(local_auth_only):
    response = client.get("/auth/status")
    assert response.status_code == 200
    data = response.json()
    assert data["local_auth_enabled"] is True
