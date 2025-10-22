"""add google drive integration

Revision ID: 003
Revises: 002
Create Date: 2025-10-22

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Create google_drive_credentials table
    op.create_table('google_drive_credentials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('access_token', sa.Text(), nullable=False),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('token_uri', sa.String(), nullable=True),
        sa.Column('client_id', sa.String(), nullable=True),
        sa.Column('client_secret', sa.String(), nullable=True),
        sa.Column('scopes', sa.Text(), nullable=True),
        sa.Column('expiry', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_google_drive_credentials_id'), 'google_drive_credentials', ['id'], unique=False)
    op.create_index(op.f('ix_google_drive_credentials_is_active'), 'google_drive_credentials', ['is_active'], unique=False)


def downgrade():
    # Drop google_drive_credentials table
    op.drop_index(op.f('ix_google_drive_credentials_is_active'), table_name='google_drive_credentials')
    op.drop_index(op.f('ix_google_drive_credentials_id'), table_name='google_drive_credentials')
    op.drop_table('google_drive_credentials')
