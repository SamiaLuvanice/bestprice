"""Enable RLS on all BestPrice tables exposed by Supabase's public schema.

Revision ID: 20261014rls
Revises: 20261009safe
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20261014rls"
down_revision: str | Sequence[str] | None = "20261009safe"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PUBLIC_TABLES = (
    "alembic_version",
    "products",
    "users",
    "price_history",
    "product_events",
    "tracked_products",
    "user_sessions",
    "notifications",
    "price_alerts",
    "operator_credentials",
)


def upgrade() -> None:
    for table in PUBLIC_TABLES:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    # Disabling RLS would reopen tables to Supabase roles with existing grants.
    raise RuntimeError("Downgrade de RLS exige procedimento manual de segurança")
