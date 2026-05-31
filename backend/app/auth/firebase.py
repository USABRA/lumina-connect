from __future__ import annotations

from typing import Any, Optional

import firebase_admin
from firebase_admin import auth, credentials

from app.config import settings

_app: Optional[Any] = None


def init_firebase() -> None:
    global _app
    if _app is not None or not settings.firebase_configured:
        return

    cred = credentials.Certificate(
        {
            "type": "service_account",
            "project_id": settings.firebase_project_id,
            "private_key": settings.firebase_private_key_value,
            "client_email": settings.firebase_client_email,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    )
    _app = firebase_admin.initialize_app(cred)


def verify_id_token(token: str) -> dict[str, Any]:
    if not settings.firebase_configured:
        raise RuntimeError("Firebase is not configured on the server")
    init_firebase()
    return auth.verify_id_token(token)


def create_firebase_user(*, email: str, password: str, display_name: str) -> str:
    """Create a Firebase Auth user; returns uid."""
    if not settings.firebase_configured:
        raise RuntimeError("Firebase is not configured on the server")
    init_firebase()
    record = auth.create_user(
        email=email,
        password=password,
        display_name=display_name,
    )
    return record.uid


def get_firebase_uid_by_email(email: str) -> str | None:
    if not settings.firebase_configured:
        return None
    init_firebase()
    try:
        record = auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        return None
    return record.uid
