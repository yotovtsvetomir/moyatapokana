"""add full_name ilike index

Revision ID: c3aed64b0df4
Revises: 0ac1e4c8b73a
Create Date: 2025-08-31 09:18:15.418745

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3aed64b0df4'
down_revision: Union[str, Sequence[str], None] = '0ac1e4c8b73a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
