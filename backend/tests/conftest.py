"""Shared pytest fixtures."""

from __future__ import annotations

import pytest

from app.config import settings
from app.security.rate_limit import reset_rate_limits_for_tests


@pytest.fixture(autouse=True)
def _reset_rate_limits_between_tests():
    reset_rate_limits_for_tests()
    yield
    reset_rate_limits_for_tests()


@pytest.fixture
def local_auth_only(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force local JWT auth so register/login integration tests work without Firebase."""
    monkeypatch.setattr(settings, "firebase_project_id", "")
    monkeypatch.setattr(settings, "firebase_client_email", "")
    monkeypatch.setattr(settings, "firebase_private_key", "")
