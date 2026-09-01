"""
models/qr_token.py — QR token record (1:1 with queue_entry).

Stores the HMAC signature hash so we can verify without needing the
original payload (which is embedded in the QR code itself).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, uuid_pk


class QRToken(Base):
    __tablename__ = "qr_tokens"

    id: Mapped[str] = uuid_pk()
    queue_entry_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("queue_entries.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    # HMAC-SHA256 hex digest of the base64url payload string
    hmac_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    is_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    queue_entry: Mapped["QueueEntry"] = relationship("QueueEntry", back_populates="qr_token")

    def __repr__(self) -> str:
        return (
            f"<QRToken queue_entry_id={self.queue_entry_id!r} "
            f"used={self.is_used} revoked={self.is_revoked}>"
        )
