"""Assign business cards to company users

Revision ID: 013
Revises: 012
"""

from alembic import op
import sqlalchemy as sa

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("assigned_user_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_products_assigned_user_id",
        "products",
        "users",
        ["assigned_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_products_assigned_user_id",
        "products",
        ["assigned_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_products_assigned_user_id", table_name="products")
    op.drop_constraint("fk_products_assigned_user_id", "products", type_="foreignkey")
    op.drop_column("products", "assigned_user_id")
