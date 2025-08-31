"""merge multiple heads

Revision ID: 0ac1e4c8b73a
Revises: 1b7b12a1e120, 20250901_add_full_name_ilike_index, 20250831_add_guest_trgm_index
Create Date: 2025-08-31 09:17:35.232173

"""

# revision identifiers, used by Alembic.
revision: str = "0ac1e4c8b73a"
down_revision: tuple[str, ...] = (
    "1b7b12a1e120",
    "a1b2c3_add_full_name_ilike",
    "20250831_add_guest_trgm_index",
)
branch_labels: None = None
depends_on: None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
