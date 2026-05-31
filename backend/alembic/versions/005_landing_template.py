"""Add landing template and theme color to products

Revision ID: 005
Revises: 004
Create Date: 2026-05-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("landing_template", sa.String(length=50), nullable=False, server_default="classic"),
    )
    op.add_column("products", sa.Column("primary_color", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "primary_color")
    op.drop_column("products", "landing_template")
