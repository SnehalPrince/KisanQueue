"""
models/farmer.py — Farmer companion table (1:1 with users).
"""
from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, uuid_pk


class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    aadhaar_last4: Mapped[str | None] = mapped_column(String(4), nullable=True)
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    primary_crop: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_whatsapp_linked: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="farmer_profile")

    def __repr__(self) -> str:
        return f"<Farmer user_id={self.user_id!r} village={self.village!r}>"
