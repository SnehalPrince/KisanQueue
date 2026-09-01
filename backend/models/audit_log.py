"""
models/audit_log.py — Append-only security and operations audit log.

NEVER update or delete rows. The service layer exposes only INSERT.
This provides a tamper-evident trail per docs/19_AUTH_RBAC_SECURITY.md.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base, uuid_pk


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[str] = uuid_pk()
    action: Mapped[str] = mapped_column(
        String(80), nullable=False, index=True
    )  # e.g. OFFICER_CHECKIN | CAPACITY_UPDATE | QR_SCAN_FAILED
    performed_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    target_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # queue_entry | centre
    target_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    centre_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("centres.id", ondelete="SET NULL"), nullable=True, index=True
    )
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON or freeform
    request_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    def __repr__(self) -> str:
        return f"<AuditLog action={self.action!r} by={self.performed_by_id!r}>"
