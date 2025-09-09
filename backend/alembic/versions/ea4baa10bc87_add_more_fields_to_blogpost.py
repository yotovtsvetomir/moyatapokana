"""add more fields to blogpost

Revision ID: ea4baa10bc87
Revises: 5561905a6fb3
Create Date: 2025-09-09 12:24:48.855262

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea4baa10bc87'
down_revision: Union[str, Sequence[str], None] = '5561905a6fb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add authored_by column (nullable)
    op.add_column('blog_posts', sa.Column('authored_by', sa.String(length=200), nullable=True))
    
    # Add created_at column (non-nullable, default now)
    op.add_column(
        'blog_posts', 
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    
    # Add updated_at column (non-nullable, default now, updated on row modification)
    op.add_column(
        'blog_posts',
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('blog_posts', 'updated_at')
    op.drop_column('blog_posts', 'created_at')
    op.drop_column('blog_posts', 'authored_by')
