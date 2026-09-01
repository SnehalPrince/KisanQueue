"""
models/queue_entry.py — Queue entry for a farmer at a procurement centre.

Status machine (13_DATABASE_SCHEMA.md):
    WAITING -> CHECKED_IN -> PROCESSING -> COMPLETED
    WAITING/CHECKED_IN -> SKIPPED
    WAITING -> CANCELLED
    WAITING -> EXPIRED (cron)

Duplicate-prevention (two complementary layers):
  1. DB layer — partial unique index ``uq_queue_entry_active_per_farmer_centre``
     (migration 0002) enforces at most one entry with status IN
     ('WAITING', 'CHECKED_IN', 'PROCESSING') per (farmer_user_id, centre_id).
  2. App layer — ``generate_pass`` acquires a ``SELECT ... FOR UPDATE`` lock on
     the centre row, serialising concurrent queue-join requests and providing a
     clean 409 before the DB constraint is ever tested.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, uuid_pk

# Valid active statuses for the partial unique index
ACTIVE_STATUSES = ("WAITING", "CHECKED_IN", "PROCESSING")


class QueueEntry(Base, TimestampMixin):
    __tablename__ = "queue_entries"

    id: Mapped[str] = uuid_pk()
    centre_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("centres.id", ondelete="CASCADE"), nullable=False, index=True
    )
    farmer_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Token / position
    token_number: Mapped[int] = mapped_column(Integer, nullable=False)
    token_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)  # e.g. KQ-1047
    queue_position: Mapped[int | None] = mapped_column(Integer, nullable=True)
    eta_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    eta_confidence: Mapped[str | None] = mapped_column(String(10), nullable=True)  # HIGH|MEDIUM|LOW|NA

    # Crop & quantity
    crop: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity_quintals: Mapped[float] = mapped_column(Float, nullable=False)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="WAITING", index=True
    )

    # Timestamps (nullable — set only when the event occurs)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    processing_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    centre: Mapped["Centre"] = relationship("Centre", back_populates="queue_entries")
    farmer_user: Mapped["User"] = relationship("User", back_populates="queue_entries")
    qr_token: Mapped["QRToken | None"] = relationship(
        "QRToken", back_populates="queue_entry", uselist=False
    )
    processing_events: Mapped[list["ProcessingEvent"]] = relationship(
        "ProcessingEvent", back_populates="queue_entry", order_by="ProcessingEvent.occurred_at"
    )
    procurement_record: Mapped["ProcurementRecord | None"] = relationship(
        "ProcurementRecord", back_populates="queue_entry", uselist=False
    )

    # Table-level args (partial unique index must be done at migration level;
    # here we add a composite index for the common query pattern)
    __table_args__ = (
        Index("ix_queue_entries_centre_status", "centre_id", "status"),
        Index("ix_queue_entries_farmer_status", "farmer_user_id", "status"),
    )

    def __repr__(self) -> str:
        return (
            f"<QueueEntry token={self.token_code!r} "
            f"centre={self.centre_id!r} status={self.status!r}>"
        )
