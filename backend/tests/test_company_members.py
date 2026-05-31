"""Company member management (admin-only)."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _register_admin() -> tuple[str, str]:
    suffix = uuid.uuid4().hex[:8]
    email = f"admin-{suffix}@example.com"
    password = "secret123"
    response = client.post(
        "/auth/register",
        json={
            "name": "Company Admin",
            "email": email,
            "password": password,
            "company_name": f"Co {suffix}",
        },
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["user"]["role"] == "admin"
    return data["access_token"], email


def test_list_and_create_members_local_auth(local_auth_only):
    token, _admin_email = _register_admin()
    headers = {"Authorization": f"Bearer {token}"}

    empty = client.get("/companies/members", headers=headers)
    assert empty.status_code == 200
    assert len(empty.json()) == 1

    member_email = f"employee-{uuid.uuid4().hex[:8]}@example.com"
    created = client.post(
        "/companies/members",
        headers=headers,
        json={
            "name": "Employee One",
            "email": member_email,
            "password": "employee1",
            "role": "company_user",
        },
    )
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["email"] == member_email
    assert body["role"] == "company_user"
    assert body["temporary_password"] == "employee1"

    members = client.get("/companies/members", headers=headers)
    assert members.status_code == 200
    emails = {m["email"] for m in members.json()}
    assert member_email in emails

    employee_login = client.post(
        "/auth/login",
        json={"email": member_email, "password": "employee1"},
    )
    assert employee_login.status_code == 200
    assert employee_login.json()["user"]["role"] == "company_user"


def test_non_admin_cannot_list_members(local_auth_only):
    admin_token, _ = _register_admin()
    member_email = f"member-{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/companies/members",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "name": "Member",
            "email": member_email,
            "password": "memberpw1",
            "role": "company_user",
        },
    )
    login = client.post("/auth/login", json={"email": member_email, "password": "memberpw1"})
    member_token = login.json()["access_token"]

    denied = client.get(
        "/companies/members",
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert denied.status_code == 403
