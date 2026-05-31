from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Query, Session

from app.enums import UserRole
from app.models import Campaign, Product, User
from app.services.access import get_company_product, require_company


def is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN


def require_admin(user: User) -> None:
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


def validate_assigned_user_id(
    db: Session, company_id: int, assigned_user_id: Optional[int]
) -> Optional[int]:
    if assigned_user_id is None:
        return None
    assignee = (
        db.query(User.id)
        .filter(User.id == assigned_user_id, User.company_id == company_id)
        .one_or_none()
    )
    if assignee is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user must belong to your company",
        )
    return assigned_user_id


def apply_product_scope(query: Query, user: User) -> Query:
    if is_admin(user):
        return query
    return query.filter(Product.assigned_user_id == user.id)


def scoped_product_ids(
    user: User, product_ids: list[int], products_by_id: dict[int, Product]
) -> list[int]:
    if is_admin(user):
        return product_ids
    return [
        pid
        for pid in product_ids
        if products_by_id[pid].assigned_user_id == user.id
    ]


def get_scoped_company_product(
    db: Session, user: User, product_id: int, company_id: int
) -> Product:
    product = get_company_product(db, product_id, company_id)
    if is_admin(user):
        return product
    if product.assigned_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this card",
        )
    return product


def company_scoped_product_ids(db: Session, user: User, company_id: int) -> list[int]:
    query = (
        db.query(Product.id)
        .join(Campaign)
        .filter(Campaign.company_id == company_id)
    )
    query = apply_product_scope(query, user)
    return [row[0] for row in query.all()]


def resolve_assigned_user_id_for_create(
    user: User, requested: Optional[int]
) -> Optional[int]:
    require_company(user)
    if is_admin(user):
        return requested
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only admins can create business cards",
    )


def resolve_assigned_user_id_for_update(
    user: User, product: Product, requested: Optional[int], field_set: bool
) -> Optional[int]:
    if not field_set:
        return product.assigned_user_id
    if is_admin(user):
        return requested
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only admins can reassign cards",
    )
