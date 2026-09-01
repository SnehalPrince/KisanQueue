"""Add partial unique index: one active queue entry per farmer per centre.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-01

The partial unique index enforces the invariant stated in queue_entry.py's
docstring: a farmer may have at most one entry with status IN
('WAITING', 'CHECKED_IN', 'PROCESSING') at a given centre.

The application-level FOR UPDATE lock in generate_pass handles the common
case; this index is the database-level backstop that makes the guarantee
hard — surviving application bugs, direct DB writes, and lock timeouts.

Note on partial index syntax: PostgreSQL supports WHERE clauses on unique
indexes. SQLAlchemy's create_index with postgresql_where provides this.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0002"
down_revision = "a6f6f53d7c77"
branch_labels = None
depends_on = None

# The statuses that constitute an "active" entry.
_ACTIVE_STATUSES = ("WAITING", "CHECKED_IN", "PROCESSING")


def upgrade() -> None:
    # Partial unique index: one active entry per (farmer, centre).
    # Uses a raw DDL string for the WHERE clause — SQLAlchemy's
    # postgresql_where on create_index requires the text() construct
    # but raw DDL is simpler and unambiguous for Alembic's autogenerate.
    op.execute(
        """
        CREATE UNIQUE INDEX uq_queue_entry_active_per_farmer_centre
        ON queue_entries (farmer_user_id, centre_id)
        WHERE status IN ('WAITING', 'CHECKED_IN', 'PROCESSING')
        """
    )


def downgrade() -> None:
    op.execute(
        "DROP INDEX IF EXISTS uq_queue_entry_active_per_farmer_centre"
    )
