"""prevent reuse of ambiguous one-time OAuth refresh tokens

Revision ID: 20261009safe
Revises: 20261009oauth
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20261009safe"
down_revision: str | Sequence[str] | None = "20261009oauth"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("operator_credentials", sa.Column("refresh_blocked", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("operator_credentials", sa.Column("refresh_retry_after_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("operator_credentials", "refresh_retry_after_at")
    op.drop_column("operator_credentials", "refresh_blocked")
