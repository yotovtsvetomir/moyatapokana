"""Add trigram index to guests first_name and last_name"""

from alembic import op

# revision identifiers, used by Alembic
revision = "20250831_add_guest_trgm_index"
down_revision = None  # or put the previous revision ID here
branch_labels = None
depends_on = None


def upgrade():
    # Enable pg_trgm extension (if not already)
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

    # Create GIN trigram index for first_name and last_name
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_guest_name_trgm
        ON guests
        USING gin (
            first_name gin_trgm_ops,
            last_name gin_trgm_ops
        );
        """
    )


def downgrade():
    # Drop the index if rolling back
    op.execute("DROP INDEX IF EXISTS idx_guest_name_trgm;")
