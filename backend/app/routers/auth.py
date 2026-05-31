from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_flexible
from app.auth.firebase import verify_id_token
from app.config import settings
from app.database import get_db
from app.enums import SubscriptionPlan, UserRole
from app.models import Company, User
from app.schemas import CompanyRead, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthSyncRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    company_name: Optional[str] = Field(default=None, max_length=255)


class AuthUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    avatar_url: Optional[str] = Field(default=None, max_length=2000)


class AuthMeResponse(BaseModel):
    user: UserRead
    company: Optional[CompanyRead] = None


class AuthStatusResponse(BaseModel):
    firebase_configured: bool
    message: str


def _get_bearer_token(authorization: Annotated[Optional[str], Header()] = None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )
    return authorization.split(" ", 1)[1]


@router.get("/status", response_model=AuthStatusResponse)
def auth_status() -> AuthStatusResponse:
    if settings.firebase_configured:
        return AuthStatusResponse(
            firebase_configured=True,
            message="Firebase Auth is configured",
        )
    return AuthStatusResponse(
        firebase_configured=False,
        message="Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env",
    )


@router.post("/sync", response_model=AuthMeResponse)
def sync_user(
    body: AuthSyncRequest,
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[Optional[str], Header()] = None,
) -> AuthMeResponse:
    token = _get_bearer_token(authorization)

    if not settings.firebase_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Auth is not configured on the server",
        )

    try:
        decoded = verify_id_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    firebase_uid = decoded.get("uid")
    email = decoded.get("email")
    if not firebase_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing uid or email",
        )

    user = db.query(User).filter(User.firebase_uid == firebase_uid).one_or_none()
    if user is None:
        user = db.query(User).filter(User.email == email).one_or_none()
        if user is not None:
            user.firebase_uid = firebase_uid
            if body.name:
                user.name = body.name
        else:
            company_name = body.company_name or f"{body.name}'s Company"
            company = Company(
                company_name=company_name,
                subscription_plan=SubscriptionPlan.FREE,
            )
            db.add(company)
            db.flush()

            user = User(
                firebase_uid=firebase_uid,
                name=body.name,
                email=email,
                company_id=company.id,
                role=UserRole.COMPANY_USER,
            )
            db.add(user)

    db.commit()
    db.refresh(user)

    company = None
    if user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).one_or_none()

    return AuthMeResponse(
        user=UserRead.model_validate(user),
        company=CompanyRead.model_validate(company) if company else None,
    )


@router.get("/me", response_model=AuthMeResponse)
def get_me(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> AuthMeResponse:
    company = None
    if user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).one_or_none()

    return AuthMeResponse(
        user=UserRead.model_validate(user),
        company=CompanyRead.model_validate(company) if company else None,
    )


@router.patch("/me", response_model=AuthMeResponse)
def update_me(
    body: AuthUpdateRequest,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> AuthMeResponse:
    if body.name is not None:
        user.name = body.name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url or None

    db.commit()
    db.refresh(user)

    company = None
    if user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).one_or_none()

    return AuthMeResponse(
        user=UserRead.model_validate(user),
        company=CompanyRead.model_validate(company) if company else None,
    )
