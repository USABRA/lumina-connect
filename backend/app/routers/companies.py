from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth as firebase_auth
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_flexible
from app.auth.firebase import create_firebase_user, get_firebase_uid_by_email
from app.auth.passwords import hash_password
from app.config import settings
from app.database import get_db
from app.enums import UserRole
from app.models import Company, User
from app.schemas import (
    CompanyBrandUpdate,
    CompanyMemberCreate,
    CompanyMemberCreateResponse,
    CompanyMemberRead,
    CompanyRead,
    TeamStructureUpdate,
)
from app.services.access import require_company
from app.services.permissions import require_admin

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/members", response_model=list[CompanyMemberRead])
def list_company_members(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> list[CompanyMemberRead]:
    require_admin(user)
    company_id = require_company(user)
    members = (
        db.query(User)
        .filter(User.company_id == company_id)
        .order_by(User.name)
        .all()
    )
    return [CompanyMemberRead.model_validate(m) for m in members]


@router.post("/members", response_model=CompanyMemberCreateResponse, status_code=status.HTTP_201_CREATED)
def create_company_member(
    body: CompanyMemberCreate,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> CompanyMemberCreateResponse:
    require_admin(user)
    company_id = require_company(user)

    email = body.email.lower()
    existing = db.query(User).filter(User.email == email).one_or_none()
    if existing is not None:
        if existing.company_id == company_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already a member of your company",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered in another account",
        )

    temporary_password: str | None = None
    login_hint: str | None = None
    firebase_uid: str | None = None
    password_hash: str | None = None

    if settings.firebase_configured:
        password = body.password or secrets.token_urlsafe(10)
        if body.password is None:
            temporary_password = password
        try:
            firebase_uid = create_firebase_user(
                email=email,
                password=password,
                display_name=body.name,
            )
            login_hint = (
                "Share the temporary password so they can sign in at /login. "
                "They should change it from Account after the first login."
            )
        except firebase_auth.EmailAlreadyExistsError:
            firebase_uid = get_firebase_uid_by_email(email)
            login_hint = (
                "This email already has a Firebase account. "
                "They can sign in at /login; their profile will link to your company automatically."
            )
    else:
        if not body.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required when creating members in local auth mode",
            )
        password_hash = hash_password(body.password)
        temporary_password = body.password
        login_hint = "Share this password so they can sign in at /login."

    member = User(
        name=body.name,
        email=email,
        company_id=company_id,
        role=body.role,
        firebase_uid=firebase_uid,
        password_hash=password_hash,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    return CompanyMemberCreateResponse(
        id=member.id,
        name=member.name,
        email=member.email,
        role=member.role,
        avatar_url=member.avatar_url,
        temporary_password=temporary_password,
        login_hint=login_hint,
    )


@router.get("/brand", response_model=CompanyRead)
def get_company_brand(
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> CompanyRead:
    company_id = require_company(user)
    company = db.query(Company).filter(Company.id == company_id).one_or_none()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return CompanyRead.model_validate(company)


@router.patch("/brand", response_model=CompanyRead)
def update_company_brand(
    body: CompanyBrandUpdate,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> CompanyRead:
    require_admin(user)
    company_id = require_company(user)
    company = db.query(Company).filter(Company.id == company_id).one_or_none()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(company, field, value or None)

    db.commit()
    db.refresh(company)
    return CompanyRead.model_validate(company)


@router.patch("/team-structure", response_model=CompanyRead)
def update_team_structure(
    body: TeamStructureUpdate,
    user: Annotated[User, Depends(get_current_user_flexible)],
    db: Annotated[Session, Depends(get_db)],
) -> CompanyRead:
    require_admin(user)
    company_id = require_company(user)
    company = db.query(Company).filter(Company.id == company_id).one_or_none()
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    company.team_structure = body.model_dump()
    db.commit()
    db.refresh(company)
    return CompanyRead.model_validate(company)
