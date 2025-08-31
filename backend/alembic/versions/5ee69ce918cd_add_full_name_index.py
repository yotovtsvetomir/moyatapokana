"""add full_name ilike index

Revision ID: 5ee69ce918cd
Revises: c3aed64b0df4
Create Date: 2025-08-31 09:19:01.834886

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5ee69ce918cd'
down_revision: Union[str, Sequence[str], None] = 'c3aed64b0df4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
