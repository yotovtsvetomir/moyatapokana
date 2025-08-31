# alembic revision: add_full_name_field_and_index
from alembic import op

# revision identifiers
revision = "20250831_add_full_name_index"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Drop the column if it exists (safe for reruns)
    op.execute("ALTER TABLE guests DROP COLUMN IF EXISTS full_name;")

    # Add the generated column
    op.execute("""
        ALTER TABLE guests
        ADD COLUMN full_name text
        GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;
    """)

    # Create GiST index for trigram similarity
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_guest_full_name_gist
        ON guests
        USING gist (full_name gist_trgm_ops);
    """)


def downgrade():
    # Drop the index and column if they exist
    op.execute("DROP INDEX IF EXISTS idx_guest_full_name_gist;")
    op.execute("ALTER TABLE guests DROP COLUMN IF EXISTS full_name;")
