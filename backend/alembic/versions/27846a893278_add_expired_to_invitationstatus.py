"""Add EXPIRED to invitationstatus enum"""

from alembic import op

# revision identifiers, used by Alembic
revision = "add_expired_to_invitationstatus"
down_revision = "5c8a87da9f73"
branch_labels = None
depends_on = None


def upgrade():
    # Add 'EXPIRED' to the existing enum
    op.execute("ALTER TYPE invitationstatus ADD VALUE 'EXPIRED';")


def downgrade():
    # Removing a value from a Postgres enum is tricky; often skipped
    pass
