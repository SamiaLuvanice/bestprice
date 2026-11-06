"""Persist private purchase research and independent AI consumption counters.

Revision ID: 20261026research
Revises: 20261014rls
"""

import sqlalchemy as sa

from alembic import op

revision = "20261026research"
down_revision = "20261014rls"
branch_labels = None
depends_on = None


def owner_columns() -> list[sa.Column]:
    return [
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade() -> None:
    op.create_table("research_conversations", *owner_columns())
    op.create_index("ix_research_conversations_owner_expiry", "research_conversations", ["user_id", "expires_at"])
    op.create_table(
        "research_messages",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("conversation_id", sa.Uuid(), sa.ForeignKey("research_conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("conversation_id", "position", name="uq_research_message_position"),
    )
    op.create_index("ix_research_messages_conversation", "research_messages", ["conversation_id", "created_at"])
    op.create_table(
        "research_comparisons", *owner_columns(),
        sa.Column("use_case", sa.Text(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("analysis", sa.JSON(), nullable=True),
    )
    op.create_index("ix_research_comparisons_owner_expiry", "research_comparisons", ["user_id", "expires_at"])
    op.create_table(
        "research_comparison_products",
        sa.Column("comparison_id", sa.Uuid(), sa.ForeignKey("research_comparisons.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("position", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("details", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(18, 2), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("url", sa.String(2048), nullable=True),
        sa.CheckConstraint("price IS NULL OR price > 0", name="ck_research_product_price_positive"),
        sa.CheckConstraint("position >= 0 AND position < 3", name="ck_research_product_position"),
    )
    op.create_table(
        "research_ai_requests",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("request_id", sa.Uuid(), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("target_id", sa.Uuid(), nullable=True),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("state", sa.String(16), nullable=False),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("error", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "request_id", name="uq_research_ai_request_owner_id"),
    )
    op.create_index("ix_research_ai_requests_target", "research_ai_requests", ["target_id", "kind", "state"])
    op.create_table(
        "research_ai_usage",
        sa.Column("key", sa.String(160), primary_key=True),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    for table in ("research_conversations", "research_messages", "research_comparisons", "research_comparison_products", "research_ai_requests", "research_ai_usage"):
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table in ("research_ai_usage", "research_ai_requests", "research_comparison_products", "research_comparisons", "research_messages", "research_conversations"):
        op.drop_table(table)
