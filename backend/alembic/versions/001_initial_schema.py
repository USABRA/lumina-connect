"""Initial schema — all Phase 2 tables

Revision ID: 001
Revises:
Create Date: 2026-05-30

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column(
            "subscription_plan",
            sa.Enum("free", "starter", "pro", name="subscriptionplan", native_enum=False),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=True),
        sa.Column(
            "role",
            sa.Enum("admin", "company_user", name="userrole", native_enum=False),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "campaigns",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_campaigns_company_id"), "campaigns", ["company_id"], unique=False)

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("campaign_id", sa.Integer(), nullable=False),
        sa.Column("unique_code", sa.String(length=100), nullable=False),
        sa.Column("product_type", sa.String(length=100), nullable=False),
        sa.Column("qr_url", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", "archived", name="productstatus", native_enum=False),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_campaign_id"), "products", ["campaign_id"], unique=False)
    op.create_index(op.f("ix_products_unique_code"), "products", ["unique_code"], unique=True)

    op.create_table(
        "interactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("device_type", sa.String(length=50), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_interactions_product_id"), "interactions", ["product_id"], unique=False)

    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("company", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_leads_product_id"), "leads", ["product_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_leads_product_id"), table_name="leads")
    op.drop_table("leads")
    op.drop_index(op.f("ix_interactions_product_id"), table_name="interactions")
    op.drop_table("interactions")
    op.drop_index(op.f("ix_products_unique_code"), table_name="products")
    op.drop_index(op.f("ix_products_campaign_id"), table_name="products")
    op.drop_table("products")
    op.drop_index(op.f("ix_campaigns_company_id"), table_name="campaigns")
    op.drop_table("campaigns")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_table("companies")
