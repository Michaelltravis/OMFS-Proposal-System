"""Add section_type and tags_snapshot to content_versions

Revision ID: 002
Revises: 001
Create Date: 2025-10-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add section_type column to content_versions
    op.add_column('content_versions', sa.Column('section_type', sa.String(length=100), nullable=True))

    # Add tags_snapshot column to content_versions
    # Use JSON type which works for both PostgreSQL and SQLite
    op.add_column('content_versions', sa.Column('tags_snapshot', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove the added columns
    op.drop_column('content_versions', 'tags_snapshot')
    op.drop_column('content_versions', 'section_type')
