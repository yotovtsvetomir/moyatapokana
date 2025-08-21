"""describe your migration

Revision ID: a44b8c4a680f
Revises: 8b74ae674288
Create Date: 2025-08-02 06:43:12.515915
"""

from typing import Sequence, Union
from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a44b8c4a680f'
down_revision: Union[str, Sequence[str], None] = '8b74ae674288'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create unique index only if it doesn't already exist
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);'
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the index if it exists
    op.execute('DROP INDEX IF EXISTS ix_users_email;')
