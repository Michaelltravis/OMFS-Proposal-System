"""add section type labeling

Revision ID: 001
Revises:
Create Date: 2025-10-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create section_types table
    op.create_table('section_types',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('usage_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_section_types_id'), 'section_types', ['id'], unique=False)
    op.create_index(op.f('ix_section_types_name'), 'section_types', ['name'], unique=True)

    # Create content_block_section_types association table
    op.create_table('content_block_section_types',
        sa.Column('content_block_id', sa.Integer(), nullable=False),
        sa.Column('section_type_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['content_block_id'], ['content_blocks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['section_type_id'], ['section_types.id'], ondelete='CASCADE')
    )

    # Seed initial section types
    op.execute("""
        INSERT INTO section_types (name, display_name, description, color) VALUES
        ('technical_approach', 'Technical Approach', 'Detailed technical explanations with methodologies, technologies, and implementation strategies', '#3b82f6'),
        ('past_performance', 'Past Performance', 'Past performance narratives highlighting measurable outcomes and relevant experience', '#10b981'),
        ('executive_summary', 'Executive Summary', 'Concise, persuasive summaries highlighting key value propositions and differentiators', '#f59e0b'),
        ('qualifications', 'Qualifications', 'Organizational qualifications, team credentials, and capability statements', '#8b5cf6'),
        ('pricing', 'Pricing', 'Pricing narratives explaining cost structure and competitive advantages', '#06b6d4')
        ON CONFLICT (name) DO NOTHING;
    """)

    # Migrate existing section_type data to the new relationship
    # For each content block with a section_type, create a relationship to the corresponding section type
    op.execute("""
        INSERT INTO content_block_section_types (content_block_id, section_type_id)
        SELECT cb.id, st.id
        FROM content_blocks cb
        JOIN section_types st ON cb.section_type = st.name
        WHERE cb.section_type IS NOT NULL
        ON CONFLICT DO NOTHING;
    """)


def downgrade():
    # Drop association table
    op.drop_table('content_block_section_types')

    # Drop section_types table
    op.drop_index(op.f('ix_section_types_name'), table_name='section_types')
    op.drop_index(op.f('ix_section_types_id'), table_name='section_types')
    op.drop_table('section_types')
