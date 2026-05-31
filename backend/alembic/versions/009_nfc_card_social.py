"""Add LinkedIn and WhatsApp fields for NFC cards

Revision ID: 009
Revises: 008
"""

from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("linkedin_url", sa.String(length=500), nullable=True))
    op.add_column("products", sa.Column("whatsapp", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "whatsapp")
    op.drop_column("products", "linkedin_url")
