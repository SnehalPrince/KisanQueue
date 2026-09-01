"""
models/whatsapp_session.py — Tracks onboarding state for farmers via WhatsApp.
"""
from __future__ import annotations

import datetime
from uuid import uuid4

from sqlalchemy import JSON, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class WhatsAppSession(Base):
    __tablename__ = "whatsapp_sessions"

    phone_number: Mapped[str] = mapped_column(String, primary_key=True)
    state: Mapped[str] = mapped_column(String, nullable=False, default="INIT")
    context: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    def __repr__(self) -> str:
        return f"<WhatsAppSession phone={self.phone_number} state={self.state}>"
