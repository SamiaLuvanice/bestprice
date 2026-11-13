"""Store login failures (keyed source and account hashes only) for the login rate limit.

Revision ID: 20261113loginfail
Revises: 20261106signup
"""

import sqlalchemy as sa

from alembic import op

revision = "20261113loginfail"
down_revision = "20261106signup"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "login_failures",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column("source_hash", sa.CHAR(64), nullable=False),
        sa.Column("account_hash", sa.CHAR(64), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_login_failures_source_hash_failed_at", "login_failures", ["source_hash", "failed_at"])
    op.create_index(
        "ix_login_failures_source_hash_account_hash_failed_at", "login_failures",
        ["source_hash", "account_hash", "failed_at"],
    )
    op.create_index("ix_login_failures_failed_at", "login_failures", ["failed_at"])
    op.execute("ALTER TABLE public.login_failures ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    # Só falhas temporárias do limite; nenhum dado de negócio é perdido.
    op.drop_table("login_failures")
