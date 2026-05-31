"""Extend hero_image_url for uploaded file URLs

Revision ID: 010
Revises: 009
"""

from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "products",
        "hero_image_url",
        existing_type=sa.String(length=500),
        type_=sa.String(length=2000),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "products",
        "hero_image_url",
        existing_type=sa.String(length=2000),
        type_=sa.String(length=500),
        existing_nullable=True,
    )
