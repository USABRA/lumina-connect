"""Add action to interactions for meeting clicks

Revision ID: 015
Revises: 014
"""

from alembic import op
import sqlalchemy as sa

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("interactions", sa.Column("action", sa.String(length=50), nullable=True))
    op.create_index("ix_interactions_action", "interactions", ["action"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_interactions_action", table_name="interactions")
    op.drop_column("interactions", "action")
