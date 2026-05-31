"""Add company brand kit fields for NFC cards

Revision ID: 008
Revises: 007
"""

from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("brand_logo_url", sa.String(length=500), nullable=True))
    op.add_column("companies", sa.Column("brand_color", sa.String(length=20), nullable=True))
    op.add_column("companies", sa.Column("brand_tagline", sa.String(length=500), nullable=True))
    op.add_column("companies", sa.Column("brand_website", sa.String(length=500), nullable=True))
    op.add_column("companies", sa.Column("brand_phone", sa.String(length=50), nullable=True))
    op.add_column("companies", sa.Column("default_meeting_url", sa.String(length=500), nullable=True))
    op.add_column("companies", sa.Column("default_pdf_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("companies", "default_pdf_url")
    op.drop_column("companies", "default_meeting_url")
    op.drop_column("companies", "brand_phone")
    op.drop_column("companies", "brand_website")
    op.drop_column("companies", "brand_tagline")
    op.drop_column("companies", "brand_color")
    op.drop_column("companies", "brand_logo_url")
