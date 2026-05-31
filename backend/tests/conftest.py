"""Shared pytest fixtures."""

from __future__ import annotations

import pytest

from app.config import settings


@pytest.fixture
def local_auth_only(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force local JWT auth so register/login integration tests work without Firebase."""
    monkeypatch.setattr(settings, "firebase_project_id", "")
    monkeypatch.setattr(settings, "firebase_client_email", "")
    monkeypatch.setattr(settings, "firebase_private_key", "")
