"""Normalize enum columns to lowercase values used by Alembic schema

Revision ID: 018
Revises: 017
"""

from alembic import op

revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None

_ROLE_MAP = {
    "ADMIN": "admin",
    "COMPANY_USER": "company_user",
}
_STATUS_MAP = {
    "ACTIVE": "active",
    "INACTIVE": "inactive",
    "ARCHIVED": "archived",
}
_PLAN_MAP = {
    "FREE": "free",
    "STARTER": "starter",
    "PRO": "pro",
}


def _normalize(table: str, column: str, mapping: dict[str, str]) -> None:
    for old, new in mapping.items():
        op.execute(
            f"UPDATE {table} SET {column} = '{new}' WHERE {column} = '{old}'"
        )


def upgrade() -> None:
    _normalize("users", "role", _ROLE_MAP)
    _normalize("products", "status", _STATUS_MAP)
    _normalize("companies", "subscription_plan", _PLAN_MAP)


def downgrade() -> None:
    reverse_role = {v: k for k, v in _ROLE_MAP.items()}
    reverse_status = {v: k for k, v in _STATUS_MAP.items()}
    reverse_plan = {v: k for k, v in _PLAN_MAP.items()}
    _normalize("users", "role", reverse_role)
    _normalize("products", "status", reverse_status)
    _normalize("companies", "subscription_plan", reverse_plan)
