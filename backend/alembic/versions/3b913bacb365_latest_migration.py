"""latest migration

Revision ID: 3b913bacb365
Revises: 5ec81c921137
Create Date: 2025-09-01 13:19:17.072927

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3b913bacb365"
down_revision: Union[str, Sequence[str], None] = "5ec81c921137"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add 'currency' column with default to avoid NOT NULL violation for existing rows
    op.add_column(
        "orders",
        sa.Column(
            "currency",
            sa.String(length=3),
            nullable=False,
            server_default="BGN",  # <- existing orders get 'BGN'
        ),
    )
    # Remove the server default if you want new rows to explicitly set currency
    op.alter_column("orders", "currency", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("orders", "currency")
