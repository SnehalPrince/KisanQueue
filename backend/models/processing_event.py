"""
models/processing_event.py — Append-only audit of queue_entry state transitions.

Never update or delete rows. Provides full history for any queue entry.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, uuid_pk


class ProcessingEvent(Base):
    __tablename__ = "processing_events"

    id: Mapped[str] = uuid_pk()
    queue_entry_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("queue_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # JOINED | CHECKED_IN | PROCESSING_STARTED | COMPLETED | SKIPPED | CANCELLED | EXPIRED
    from_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    to_status: Mapped[str] = mapped_column(String(20), nullable=False)
    performed_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    queue_entry: Mapped["QueueEntry"] = relationship(
        "QueueEntry", back_populates="processing_events"
    )

    def __repr__(self) -> str:
        return (
            f"<ProcessingEvent type={self.event_type!r} "
            f"queue_entry_id={self.queue_entry_id!r}>"
        )
