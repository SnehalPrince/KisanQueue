"""
models/capacity_update.py — Append-only capacity update log for centres.

Never UPDATE a row — always INSERT a new one. The latest row per centre
defines the current state.

Status values: NORMAL | BUSY | LIFTING_DELAYED | REDUCED_CAPACITY | PAUSED
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, uuid_pk


class CapacityUpdate(Base):
    __tablename__ = "capacity_updates"

    id: Mapped[str] = uuid_pk()
    centre_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("centres.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # NORMAL | BUSY | LIFTING_DELAYED | REDUCED_CAPACITY | PAUSED
    capacity_factor: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    active_counters: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_by_officer_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("officers.id", ondelete="SET NULL"), nullable=True
    )
    effective_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    centre: Mapped["Centre"] = relationship("Centre", back_populates="capacity_updates")

    def __repr__(self) -> str:
        return (
            f"<CapacityUpdate centre_id={self.centre_id!r} "
            f"status={self.status!r} factor={self.capacity_factor}>"
        )
