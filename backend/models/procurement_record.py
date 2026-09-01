"""
models/procurement_record.py — Weighing and MSP calculation record.

Created when a queue entry reaches COMPLETED. Contains actual weight,
grade, MSP rate, and whether the data is from a mock adapter.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, uuid_pk


class ProcurementRecord(Base):
    __tablename__ = "procurement_records"

    id: Mapped[str] = uuid_pk()
    queue_entry_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("queue_entries.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    crop: Mapped[str] = mapped_column(String(50), nullable=False)
    actual_quantity_q: Mapped[float | None] = mapped_column(Float, nullable=True)
    declared_quantity_q: Mapped[float] = mapped_column(Float, nullable=False)
    grade: Mapped[str | None] = mapped_column(String(5), nullable=True)  # A | B | C
    msp_rate: Mapped[float] = mapped_column(Float, nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_mock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    source_system: Mapped[str] = mapped_column(String(50), nullable=False, default="MOCK")
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    queue_entry: Mapped["QueueEntry"] = relationship(
        "QueueEntry", back_populates="procurement_record"
    )
    payment_status: Mapped["PaymentStatus | None"] = relationship(
        "PaymentStatus", back_populates="procurement_record", uselist=False
    )

    def __repr__(self) -> str:
        return (
            f"<ProcurementRecord queue_entry={self.queue_entry_id!r} "
            f"total={self.total_amount} mock={self.is_mock}>"
        )
