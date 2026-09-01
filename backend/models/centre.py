"""
models/centre.py — Procurement centres table.

supported_crops stored as a JSON array string (for portability with
SQLite in tests). In production Postgres this could be ARRAY(Text).
"""
from __future__ import annotations

import json

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, uuid_pk


class Centre(Base, TimestampMixin):
    __tablename__ = "centres"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    hindi_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Operations
    avg_processing_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=25)
    daily_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    active_counters_default: Mapped[int] = mapped_column(Integer, nullable=False, default=2)

    # Supported crops stored as JSON array (e.g. '["Wheat","Soybean"]')
    _supported_crops_json: Mapped[str] = mapped_column(
        "supported_crops", Text, nullable=False, default="[]"
    )

    # MSP rates stored as JSON dict (e.g. '{"Wheat": 2275, "Soybean": 4600}')
    _msp_rates_json: Mapped[str] = mapped_column(
        "msp_rates", Text, nullable=False, default="{}"
    )

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    officers: Mapped[list["Officer"]] = relationship(
        "Officer", back_populates="centre", lazy="select"
    )
    capacity_updates: Mapped[list["CapacityUpdate"]] = relationship(
        "CapacityUpdate",
        back_populates="centre",
        order_by="CapacityUpdate.effective_from.desc()",
        lazy="select",
    )
    queue_entries: Mapped[list["QueueEntry"]] = relationship(
        "QueueEntry", back_populates="centre", lazy="select"
    )

    @property
    def supported_crops(self) -> list[str]:
        return json.loads(self._supported_crops_json)

    @supported_crops.setter
    def supported_crops(self, value: list[str]) -> None:
        self._supported_crops_json = json.dumps(value)

    @property
    def msp_rates(self) -> dict[str, float]:
        return json.loads(self._msp_rates_json)

    @msp_rates.setter
    def msp_rates(self, value: dict[str, float]) -> None:
        self._msp_rates_json = json.dumps(value)

    def __repr__(self) -> str:
        return f"<Centre id={self.id!r} name={self.name!r}>"
