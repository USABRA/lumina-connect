"""Add landing page customization fields to products

Revision ID: 003
Revises: 002
Create Date: 2026-05-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("landing_headline", sa.String(length=255), nullable=True))
    op.add_column("products", sa.Column("landing_description", sa.Text(), nullable=True))
    op.add_column("products", sa.Column("logo_url", sa.String(length=500), nullable=True))
    op.add_column("products", sa.Column("video_url", sa.String(length=500), nullable=True))
    op.add_column("products", sa.Column("pdf_url", sa.String(length=500), nullable=True))
    op.add_column("products", sa.Column("meeting_url", sa.String(length=500), nullable=True))
    op.add_column(
        "products",
        sa.Column("contact_form_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column("products", "contact_form_enabled")
    op.drop_column("products", "meeting_url")
    op.drop_column("products", "pdf_url")
    op.drop_column("products", "video_url")
    op.drop_column("products", "logo_url")
    op.drop_column("products", "landing_description")
    op.drop_column("products", "landing_headline")
