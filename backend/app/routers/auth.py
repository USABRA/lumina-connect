from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_flexible
from app.auth.firebase import verify_id_token
from app.auth.jwt_tokens import create_access_token
from app.auth.passwords import hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.enums import SubscriptionPlan, UserRole
from app.models import Company, User
from app.schemas import CompanyRead, UserRead
from app.services.platform import is_platform_admin

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthSyncRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    company_name: Optional[str] = Field(default=None, max_length=255)
    brand_logo_url: Optional[str] = Field(default=None, max_length=500)
    brand_color: Optional[str] = Field(default=None, max_length=20)


class AuthUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    avatar_url: Optional[str] = Field(default=None, max_length=2000)


class AuthMeResponse(BaseModel):
    user: UserRead
    company: Optional[CompanyRead] = None
    is_platform_admin: bool = False


class AuthStatusResponse(BaseModel):
    firebase_configured: bool
    local_auth_enabled: bool
    message: str


class AuthRegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    company_name: str = Field(min_length=1, max_length=255)
    brand_logo_url: Optional[str] = Field(default=None, max_length=500)
    brand_color: Optional[str] = Field(default=None, max_length=20)


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    company: Optional[CompanyRead] = None
    is_platform_admin: bool = False


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
            local_auth_enabled=False,
            message="Firebase Auth is configured",
        )
    return AuthStatusResponse(
        firebase_configured=False,
        local_auth_enabled=True,
        message="Local email/password auth is enabled. Set Firebase env vars to use Firebase instead.",
    )


def _build_auth_response(user: User, company: Company | None) -> AuthTokenResponse:
    return AuthTokenResponse(
        access_token=create_access_token(user.id),
        user=UserRead.model_validate(user),
        company=CompanyRead.model_validate(company) if company else None,
        is_platform_admin=is_platform_admin(user),
    )


def _build_me_response(user: User, company: Company | None) -> AuthMeResponse:
    return AuthMeResponse(
        user=UserRead.model_validate(user),
        company=CompanyRead.model_validate(company) if company else None,
        is_platform_admin=is_platform_admin(user),
    )


def _require_local_auth() -> None:
    if settings.firebase_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Local auth is disabled when Firebase is configured",
        )


@router.post("/register", response_model=AuthTokenResponse)
def register_user(
    body: AuthRegisterRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AuthTokenResponse:
    _require_local_auth()

    existing = db.query(User).filter(User.email == body.email.lower()).one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    company = Company(
        company_name=body.company_name,
        subscription_plan=SubscriptionPlan.FREE,
        brand_logo_url=body.brand_logo_url or None,
        brand_color=body.brand_color or None,
    )
    db.add(company)
    db.flush()

    user = User(
        name=body.name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        company_id=company.id,
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.refresh(company)

    return _build_auth_response(user, company)


@router.post("/login", response_model=AuthTokenResponse)
def login_user(
    body: AuthLoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> AuthTokenResponse:
    _require_local_auth()

    user = db.query(User).filter(User.email == body.email.lower()).one_or_none()
    if user is None or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    company = None
    if user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).one_or_none()

    return _build_auth_response(user, company)


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
                brand_logo_url=body.brand_logo_url or None,
                brand_color=body.brand_color or None,
            )
            db.add(company)
            db.flush()

            user = User(
                firebase_uid=firebase_uid,
                name=body.name,
                email=email,
                company_id=company.id,
                role=UserRole.ADMIN,
            )
            db.add(user)

    db.commit()
    db.refresh(user)

    company = None
    if user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).one_or_none()

    return _build_me_response(user, company)


@router.get("/me", response_model=AuthMeResponse)
def get_me(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> AuthMeResponse:
    company = None
    if user.company_id:
        company = db.query(Company).filter(Company.id == user.company_id).one_or_none()

    return _build_me_response(user, company)


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

    return _build_me_response(user, company)
