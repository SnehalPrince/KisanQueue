"""
models/notification.py — In-app notification records.

[Post-MVP] Table created now so the notification service can write to it
and the bell icon can show a real list (rather than a hardcoded list).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, uuid_pk


class Notification(Base):
    __tablename__ = "notifications"
    # NOTE: Provisioned early (schema-only) ahead of the POST-MVP notification
    # sending feature. The full notification pipeline is not yet live.

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[str] = mapped_column(
        String(60), nullable=False
    )  # NOTIF_QUEUE_JOINED | NOTIF_ETA_INCREASED | etc.
    title_en: Mapped[str] = mapped_column(String(200), nullable=False)
    title_hi: Mapped[str | None] = mapped_column(String(200), nullable=True)
    body_en: Mapped[str] = mapped_column(Text, nullable=False)
    body_hi: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    related_queue_entry_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("queue_entries.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification user={self.user_id!r} type={self.event_type!r} read={self.is_read}>"
