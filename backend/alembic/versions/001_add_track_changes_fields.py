"""Add track changes fields to content blocks

Revision ID: 001_track_changes
Revises:
Create Date: 2025-10-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_track_changes'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Add track_changes_enabled and tracked_changes_metadata columns to content_blocks table"""

    # Add track_changes_enabled column (boolean, default False)
    op.add_column('content_blocks',
        sa.Column('track_changes_enabled', sa.Boolean(), nullable=True, server_default=sa.false())
    )

    # Add tracked_changes_metadata column (JSON, default empty dict)
    op.add_column('content_blocks',
        sa.Column('tracked_changes_metadata', sa.JSON(), nullable=True, server_default=sa.text("'{}'::json"))
    )


def downgrade():
    """Remove track changes fields"""
    op.drop_column('content_blocks', 'tracked_changes_metadata')
    op.drop_column('content_blocks', 'track_changes_enabled')
