"""
models/user.py — Core users table (farmers and officers both have a user row).

Role ENUM values: FARMER | OFFICER | ADMIN
Language ENUM values: hi | en | pa | mr | gu
"""
from __future__ import annotations

import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin, uuid_pk


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = uuid_pk()
    phone: Mapped[str | None] = mapped_column(String(15), unique=True, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # FARMER | OFFICER | ADMIN
    preferred_language: Mapped[str] = mapped_column(String(5), nullable=False, default="hi")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    farmer_profile: Mapped["Farmer | None"] = relationship(
        "Farmer", back_populates="user", uselist=False, lazy="select"
    )
    officer_profile: Mapped["Officer | None"] = relationship(
        "Officer", back_populates="user", uselist=False, lazy="select"
    )
    queue_entries: Mapped[list["QueueEntry"]] = relationship(
        "QueueEntry", back_populates="farmer_user", lazy="select"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id!r} phone={self.phone!r} role={self.role!r}>"
