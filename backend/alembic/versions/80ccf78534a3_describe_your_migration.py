"""describe your migration

Revision ID: 80ccf78534a3
Revises: 952971f15644
Create Date: 2025-08-17 03:00:04.707795

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "80ccf78534a3"
down_revision: Union[str, Sequence[str], None] = "952971f15644"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Step 1: add with a server_default so existing rows get ''
    op.add_column(
        "users", sa.Column("first_name", sa.String(), nullable=False, server_default="")
    )
    op.add_column(
        "users", sa.Column("last_name", sa.String(), nullable=False, server_default="")
    )

    # Step 2: remove the server_default if you don’t want it applied to *future* inserts
    op.alter_column("users", "first_name", server_default=None)
    op.alter_column("users", "last_name", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
