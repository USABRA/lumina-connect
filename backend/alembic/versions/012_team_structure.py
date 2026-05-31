"""Team structure and role assignment for business cards

Revision ID: 012
Revises: 011
"""

from alembic import op
import sqlalchemy as sa

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("companies", sa.Column("team_structure", sa.JSON(), nullable=True))
    op.add_column("products", sa.Column("team_role_id", sa.String(length=100), nullable=True))
    op.create_index("ix_products_team_role_id", "products", ["team_role_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_products_team_role_id", table_name="products")
    op.drop_column("products", "team_role_id")
    op.drop_column("companies", "team_structure")
