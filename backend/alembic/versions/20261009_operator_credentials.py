"""encrypted operator OAuth credentials

Revision ID: 20261009oauth
Revises: d0d0756a0096
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20261009oauth"
down_revision: str | Sequence[str] | None = "d0d0756a0096"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "operator_credentials",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("encrypted_access_token", sa.Text(), nullable=False),
        sa.Column("encrypted_refresh_token", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_operator_credentials_singleton"),
    )


def downgrade() -> None:
    op.drop_table("operator_credentials")
