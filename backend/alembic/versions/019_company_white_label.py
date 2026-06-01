"""Company white-label branding fields

Revision ID: 019
Revises: 018
"""

import sqlalchemy as sa
from alembic import op

revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("white_label_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "companies",
        sa.Column("hide_platform_branding", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("companies", sa.Column("brand_display_name", sa.String(length=255), nullable=True))
    op.add_column("companies", sa.Column("brand_favicon_url", sa.String(length=500), nullable=True))
    op.add_column("companies", sa.Column("brand_secondary_color", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("companies", "brand_secondary_color")
    op.drop_column("companies", "brand_favicon_url")
    op.drop_column("companies", "brand_display_name")
    op.drop_column("companies", "hide_platform_branding")
    op.drop_column("companies", "white_label_enabled")
