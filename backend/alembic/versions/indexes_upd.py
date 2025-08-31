"""add full_name trigram indexes for ilike and similarity search

Revision ID: 20250901_full_name_trgm
Revises: 20250831_add_guest_trgm_index
Create Date: 2025-08-31 10:00:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "20250901_full_name_trgm"
down_revision = "20250831_add_guest_trgm_index"
branch_labels = None
depends_on = None


def upgrade():
    # Ensure the pg_trgm extension exists
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    # Drop old index if exists
    op.execute("DROP INDEX IF EXISTS idx_guest_full_name_trgm;")
    op.execute("DROP INDEX IF EXISTS idx_guest_full_name_trgm_ilike;")

    # Create GIN index for similarity search (%% operator)
    op.execute("""
        CREATE INDEX idx_guest_full_name_trgm
        ON guests
        USING gin (full_name gin_trgm_ops);
    """)

    # Optional: separate GIN index for ILIKE (if needed)
    op.execute("""
        CREATE INDEX idx_guest_full_name_trgm_ilike
        ON guests
        USING gin (full_name gin_trgm_ops);
    """)


def downgrade():
    op.execute("DROP INDEX IF EXISTS idx_guest_full_name_trgm;")
    op.execute("DROP INDEX IF EXISTS idx_guest_full_name_trgm_ilike;")
