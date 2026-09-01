"""
models/officer.py — Officer companion table (1:1 with users).

password_hash is stored here (not on users) so farmer user rows never
carry a password field. See deviation D-2 in implementation_plan.md.
"""
from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, uuid_pk


class Officer(Base):
    __tablename__ = "officers"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    employee_id: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    centre_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("centres.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # bcrypt hash stored on officers only — never on farmer rows
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="officer_profile")
    centre: Mapped["Centre | None"] = relationship("Centre", back_populates="officers")

    def __repr__(self) -> str:
        return f"<Officer employee_id={self.employee_id!r} centre_id={self.centre_id!r}>"
