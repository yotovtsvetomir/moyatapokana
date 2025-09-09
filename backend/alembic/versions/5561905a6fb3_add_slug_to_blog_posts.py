"""add slug to blog_posts

Revision ID: 5561905a6fb3
Revises: 3dc04b54e874
Create Date: 2025-09-09 11:54:08.319589

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5561905a6fb3'
down_revision: Union[str, Sequence[str], None] = '3dc04b54e874'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add slug column
    op.add_column('blog_posts', sa.Column('slug', sa.String(length=250), nullable=True))
    # Create a unique index on slug
    op.create_index('ix_blog_posts_slug', 'blog_posts', ['slug'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the index
    op.drop_index('ix_blog_posts_slug', table_name='blog_posts')
    # Drop the column
    op.drop_column('blog_posts', 'slug')
