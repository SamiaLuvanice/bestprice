"""Store web grounding (sources and Google suggestions) with assistant messages.

Revision ID: 20261104grounding
Revises: 20261026research
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "20261104grounding"
down_revision = "20261026research"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Nullable without default: existing messages keep NULL (no web search).
    op.add_column("research_messages", sa.Column("grounding", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("research_messages", "grounding")
