"""Add hero image and highlight fields for landing pages

Revision ID: 006
Revises: 005
Create Date: 2026-05-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("products", sa.Column("hero_image_url", sa.String(length=500), nullable=True))
    op.add_column("products", sa.Column("highlight_1", sa.String(length=255), nullable=True))
    op.add_column("products", sa.Column("highlight_2", sa.String(length=255), nullable=True))
    op.add_column("products", sa.Column("highlight_3", sa.String(length=255), nullable=True))

    op.execute(
        "UPDATE products SET landing_template = 'showcase' WHERE landing_template IN "
        "('classic', 'lead_capture', 'minimal')"
    )
    op.execute(
        "UPDATE products SET landing_template = 'media_center' WHERE landing_template = 'video_first'"
    )
    op.execute(
        "UPDATE products SET landing_template = 'split' WHERE landing_template = 'brochure'"
    )


def downgrade() -> None:
    op.drop_column("products", "highlight_3")
    op.drop_column("products", "highlight_2")
    op.drop_column("products", "highlight_1")
    op.drop_column("products", "hero_image_url")
