"""add folder_id to google_drive_credentials

Revision ID: c7c15d9206d1
Revises: 003
Create Date: 2025-10-22 14:36:44.601152

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7c15d9206d1'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add folder_id column to google_drive_credentials
    op.add_column('google_drive_credentials', sa.Column('folder_id', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove folder_id column from google_drive_credentials
    op.drop_column('google_drive_credentials', 'folder_id')
