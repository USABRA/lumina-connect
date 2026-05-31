"""Collaborative meeting sessions, participants, notes, reports

Revision ID: 016
Revises: 015
"""

from alembic import op
import sqlalchemy as sa

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "meeting_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("host_user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("share_token", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("event_tag", sa.String(length=100), nullable=True),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["host_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meeting_sessions_company_id", "meeting_sessions", ["company_id"])
    op.create_index("ix_meeting_sessions_share_token", "meeting_sessions", ["share_token"], unique=True)
    op.create_index("ix_meeting_sessions_status", "meeting_sessions", ["status"])

    op.create_table(
        "meeting_participants",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("meeting_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("company", sa.String(length=255), nullable=True),
        sa.Column("session_id", sa.String(length=64), nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["meeting_id"], ["meeting_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meeting_participants_meeting_id", "meeting_participants", ["meeting_id"])
    op.create_index(
        "ix_meeting_participants_session_id",
        "meeting_participants",
        ["session_id"],
        unique=True,
    )

    op.create_table(
        "meeting_notes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("meeting_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.JSON(), nullable=False),
        sa.Column("updated_by_participant_id", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["meeting_id"], ["meeting_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["updated_by_participant_id"],
            ["meeting_participants.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("meeting_id"),
    )

    op.create_table(
        "meeting_reports",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("meeting_id", sa.Integer(), nullable=False),
        sa.Column(
            "generated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("content_markdown", sa.Text(), nullable=False),
        sa.Column("content_json", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["meeting_id"], ["meeting_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_meeting_reports_meeting_id", "meeting_reports", ["meeting_id"])


def downgrade() -> None:
    op.drop_index("ix_meeting_reports_meeting_id", table_name="meeting_reports")
    op.drop_table("meeting_reports")
    op.drop_table("meeting_notes")
    op.drop_index("ix_meeting_participants_session_id", table_name="meeting_participants")
    op.drop_index("ix_meeting_participants_meeting_id", table_name="meeting_participants")
    op.drop_table("meeting_participants")
    op.drop_index("ix_meeting_sessions_status", table_name="meeting_sessions")
    op.drop_index("ix_meeting_sessions_share_token", table_name="meeting_sessions")
    op.drop_index("ix_meeting_sessions_company_id", table_name="meeting_sessions")
    op.drop_table("meeting_sessions")
