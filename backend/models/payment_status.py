"""
models/payment_status.py — DBT payment status linked to procurement record.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, uuid_pk


class PaymentStatus(Base):
    __tablename__ = "payment_status"

    id: Mapped[str] = uuid_pk()
    procurement_record_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("procurement_records.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )  # PENDING | PROCESSING | PAID | FAILED
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    utr_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_mock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    procurement_record: Mapped["ProcurementRecord"] = relationship(
        "ProcurementRecord", back_populates="payment_status"
    )

    def __repr__(self) -> str:
        return f"<PaymentStatus status={self.status!r} amount={self.amount} mock={self.is_mock}>"
