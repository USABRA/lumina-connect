from __future__ import annotations

from fastapi import HTTPException, status

from app.config import settings
from app.models import User


def is_platform_admin_email(email: str) -> bool:
    normalized = email.strip().lower()
    if not normalized:
        return False
    return normalized in settings.platform_admin_emails_list


def is_platform_admin(user: User) -> bool:
    return is_platform_admin_email(user.email)


def require_platform_admin(user: User) -> None:
    if not is_platform_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required",
        )
