"""merge heads

Revision ID: d50b10c71689
Revises: 5ee69ce918cd, 20250831_add_full_name_index
Create Date: 2025-08-31 09:20:23.245994

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd50b10c71689'
down_revision: Union[str, Sequence[str], None] = ('5ee69ce918cd', '20250831_add_full_name_index')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
