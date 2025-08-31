# alembic revision: add_full_name_ilike_index
from alembic import op

# revision identifiers
revision = "a1b2c3_add_full_name_ilike"
down_revision = "1b7b12a1e120"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_guest_full_name_trgm_ilike
        ON guests
        USING gin (full_name gin_trgm_ops);
    """)


def downgrade():
    op.execute("""
        DROP INDEX IF EXISTS idx_guest_full_name_trgm_ilike;
    """)
