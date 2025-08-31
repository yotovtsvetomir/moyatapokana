"""merge heads

Revision ID: 6c295123cc00
Revises: 9f237d3ab084, 20250901_full_name_trgm
Create Date: 2025-08-31 09:47:06.097909

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c295123cc00'
down_revision: Union[str, Sequence[str], None] = ('9f237d3ab084', '20250901_full_name_trgm')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
