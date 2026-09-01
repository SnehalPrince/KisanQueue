"""Initial schema — all KisanQueue tables.

Revision ID: 0001
Revises:
Create Date: 2026-09-01
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("phone", sa.String(15), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("preferred_language", sa.String(5), nullable=False, server_default="hi"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)

    # ── centres ───────────────────────────────────────────────────────────────
    op.create_table(
        "centres",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("hindi_name", sa.String(200), nullable=True),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("district", sa.String(100), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("avg_processing_minutes", sa.Integer(), nullable=False, server_default="25"),
        sa.Column("daily_capacity", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("active_counters_default", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("supported_crops", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("msp_rates", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── farmers ───────────────────────────────────────────────────────────────
    op.create_table(
        "farmers",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("aadhaar_last4", sa.String(4), nullable=True),
        sa.Column("village", sa.String(100), nullable=True),
        sa.Column("district", sa.String(100), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("primary_crop", sa.String(50), nullable=True),
        sa.Column("is_whatsapp_linked", sa.Boolean(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    # ── officers ──────────────────────────────────────────────────────────────
    op.create_table(
        "officers",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("employee_id", sa.String(50), nullable=False),
        sa.Column("centre_id", sa.String(36), nullable=True),
        sa.Column("password_hash", sa.String(128), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["centre_id"], ["centres.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("employee_id"),
    )
    op.create_index("ix_officers_employee_id", "officers", ["employee_id"])
    op.create_index("ix_officers_centre_id", "officers", ["centre_id"])

    # ── capacity_updates ──────────────────────────────────────────────────────
    op.create_table(
        "capacity_updates",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("centre_id", sa.String(36), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("capacity_factor", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("active_counters", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("updated_by_officer_id", sa.String(36), nullable=True),
        sa.Column("effective_from", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["centre_id"], ["centres.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["updated_by_officer_id"], ["officers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_capacity_updates_centre_id", "capacity_updates", ["centre_id"])
    op.create_index("ix_capacity_updates_effective_from", "capacity_updates", ["effective_from"])

    # ── queue_entries ─────────────────────────────────────────────────────────
    op.create_table(
        "queue_entries",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("centre_id", sa.String(36), nullable=False),
        sa.Column("farmer_user_id", sa.String(36), nullable=False),
        sa.Column("token_number", sa.Integer(), nullable=False),
        sa.Column("token_code", sa.String(20), nullable=False),
        sa.Column("queue_position", sa.Integer(), nullable=True),
        sa.Column("eta_minutes", sa.Integer(), nullable=True),
        sa.Column("eta_confidence", sa.String(10), nullable=True),
        sa.Column("crop", sa.String(50), nullable=False),
        sa.Column("quantity_quintals", sa.Float(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="WAITING"),
        sa.Column("joined_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("processing_started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["centre_id"], ["centres.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["farmer_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_code"),
    )
    op.create_index("ix_queue_entries_centre_status", "queue_entries", ["centre_id", "status"])
    op.create_index("ix_queue_entries_farmer_status", "queue_entries", ["farmer_user_id", "status"])
    op.create_index("ix_queue_entries_status", "queue_entries", ["status"])
    # Partial unique index: farmer can have at most one active entry per centre
    op.execute(
        """
        CREATE UNIQUE INDEX uq_queue_entries_active_farmer_centre
        ON queue_entries (centre_id, farmer_user_id)
        WHERE status IN ('WAITING', 'CHECKED_IN', 'PROCESSING')
        """
    )

    # ── qr_tokens ─────────────────────────────────────────────────────────────
    op.create_table(
        "qr_tokens",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("queue_entry_id", sa.String(36), nullable=False),
        sa.Column("hmac_hash", sa.String(64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("is_used", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("is_revoked", sa.Boolean(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["queue_entry_id"], ["queue_entries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("queue_entry_id"),
    )
    op.create_index("ix_qr_tokens_queue_entry_id", "qr_tokens", ["queue_entry_id"])

    # ── processing_events ─────────────────────────────────────────────────────
    op.create_table(
        "processing_events",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("queue_entry_id", sa.String(36), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("from_status", sa.String(20), nullable=True),
        sa.Column("to_status", sa.String(20), nullable=False),
        sa.Column("performed_by_id", sa.String(36), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["queue_entry_id"], ["queue_entries.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["performed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_processing_events_queue_entry_id", "processing_events", ["queue_entry_id"])

    # ── procurement_records ───────────────────────────────────────────────────
    op.create_table(
        "procurement_records",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("queue_entry_id", sa.String(36), nullable=False),
        sa.Column("crop", sa.String(50), nullable=False),
        sa.Column("actual_quantity_q", sa.Float(), nullable=True),
        sa.Column("declared_quantity_q", sa.Float(), nullable=False),
        sa.Column("grade", sa.String(5), nullable=True),
        sa.Column("msp_rate", sa.Float(), nullable=False),
        sa.Column("total_amount", sa.Float(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("is_mock", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("source_system", sa.String(50), nullable=False, server_default="MOCK"),
        sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["queue_entry_id"], ["queue_entries.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("queue_entry_id"),
    )
    op.create_index("ix_procurement_records_queue_entry_id", "procurement_records", ["queue_entry_id"])

    # ── payment_status ────────────────────────────────────────────────────────
    op.create_table(
        "payment_status",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("procurement_record_id", sa.String(36), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("utr_number", sa.String(50), nullable=True),
        sa.Column("bank_reference", sa.String(100), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_mock", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["procurement_record_id"], ["procurement_records.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("procurement_record_id"),
    )

    # ── audit_log ─────────────────────────────────────────────────────────────
    op.create_table(
        "audit_log",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("performed_by_id", sa.String(36), nullable=True),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_id", sa.String(36), nullable=True),
        sa.Column("centre_id", sa.String(36), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("request_id", sa.String(36), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["performed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["centre_id"], ["centres.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_log_action", "audit_log", ["action"])
    op.create_index("ix_audit_log_performed_by_id", "audit_log", ["performed_by_id"])
    op.create_index("ix_audit_log_target_id", "audit_log", ["target_id"])
    op.create_index("ix_audit_log_occurred_at", "audit_log", ["occurred_at"])

    # ── notifications ─────────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("event_type", sa.String(60), nullable=False),
        sa.Column("title_en", sa.String(200), nullable=False),
        sa.Column("title_hi", sa.String(200), nullable=True),
        sa.Column("body_en", sa.Text(), nullable=False),
        sa.Column("body_hi", sa.Text(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("related_queue_entry_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["related_queue_entry_id"], ["queue_entries.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("audit_log")
    op.drop_table("payment_status")
    op.drop_table("procurement_records")
    op.drop_table("processing_events")
    op.drop_table("qr_tokens")
    op.drop_table("queue_entries")
    op.drop_table("capacity_updates")
    op.drop_table("officers")
    op.drop_table("farmers")
    op.drop_table("centres")
    op.drop_table("users")
