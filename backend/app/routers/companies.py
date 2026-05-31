from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user_flexible
from app.database import get_db
from app.models import Company, User
from app.schemas import (
    CompanyBrandUpdate,
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
