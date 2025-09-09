"""add more fields to blogpost

Revision ID: 9d4503d55a5e
Revises: 5561905a6fb3
Create Date: 2025-09-09 12:23:59.495619

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d4503d55a5e'
down_revision: Union[str, Sequence[str], None] = '5561905a6fb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
