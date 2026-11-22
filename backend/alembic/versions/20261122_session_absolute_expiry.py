"""Add the absolute (7-day) ceiling to user sessions; expires_at becomes the sliding idle expiry.

Revision ID: 20261122sessionabs
Revises: 20261113loginfail
"""

import sqlalchemy as sa

from alembic import op

revision = "20261122sessionabs"
down_revision = "20261113loginfail"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_sessions", sa.Column("absolute_expires_at", sa.DateTime(timezone=True), nullable=True))
    # Sessões abertas antes da mudança mantêm o expires_at e ganham o teto contado da criação.
    op.execute("UPDATE user_sessions SET absolute_expires_at = created_at + interval '7 days'")
    op.alter_column("user_sessions", "absolute_expires_at", nullable=False)


def downgrade() -> None:
    # As sessões continuam válidas até o expires_at; só o teto deixa de existir.
    op.drop_column("user_sessions", "absolute_expires_at")
