"""Add event_tag to products, interactions, and leads

Revision ID: 014
Revises: 013
"""

from alembic import op
import sqlalchemy as sa

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("event_tag", sa.String(100), nullable=True))
    op.add_column("interactions", sa.Column("event_tag", sa.String(100), nullable=True))
    op.add_column("leads", sa.Column("event_tag", sa.String(100), nullable=True))
    op.create_index("ix_interactions_event_tag", "interactions", ["event_tag"], unique=False)
    op.create_index("ix_leads_event_tag", "leads", ["event_tag"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_leads_event_tag", table_name="leads")
    op.drop_index("ix_interactions_event_tag", table_name="interactions")
    op.drop_column("leads", "event_tag")
    op.drop_column("interactions", "event_tag")
    op.drop_column("products", "event_tag")
