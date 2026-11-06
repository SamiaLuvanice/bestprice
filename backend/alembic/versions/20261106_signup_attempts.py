"""Store signup attempts (keyed source hash only) for the per-source rate limit.

Revision ID: 20261106signup
Revises: 20261104grounding
"""

import sqlalchemy as sa

from alembic import op

revision = "20261106signup"
down_revision = "20261104grounding"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "signup_attempts",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column("source_hash", sa.CHAR(64), nullable=False),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_signup_attempts_source_hash_attempted_at", "signup_attempts", ["source_hash", "attempted_at"],
    )
    op.create_index("ix_signup_attempts_attempted_at", "signup_attempts", ["attempted_at"])
    op.execute("ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    # Só tentativas temporárias do limite; nenhum dado de negócio é perdido.
    op.drop_table("signup_attempts")
