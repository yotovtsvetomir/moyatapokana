"""merge heads

Revision ID: c6161484f247
Revises: 9d4503d55a5e, ea4baa10bc87
Create Date: 2025-09-09 12:29:05.583615

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6161484f247'
down_revision: Union[str, Sequence[str], None] = ('9d4503d55a5e', 'ea4baa10bc87')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
