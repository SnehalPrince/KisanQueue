"""
core/config.py — pydantic-settings configuration for KisanQueue backend.

All values are loaded from environment variables (or .env file in development).
Any required variable without a value will raise a validation error at startup —
fail loudly, never silently use a default secret.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    APP_VERSION: str = "1.0.0"

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        ...,
        description="async SQLAlchemy URL — must begin with postgresql+asyncpg://",
    )
    # Optional separate URL for Alembic (direct Supabase connection, not pooled).
    ALEMBIC_DATABASE_URL: str | None = None

    # ── Authentication ───────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 h

    # ── QR Token ─────────────────────────────────────────────────────────────
    QR_HMAC_SECRET: str = Field(..., min_length=32)

    # ── OTP ──────────────────────────────────────────────────────────────────
    OTP_MOCK_ENABLED: bool = True
    OTP_MOCK_CODE: str = "1234"
    OTP_EXPIRY_SECONDS: int = 300

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173"

    # ── Rate Limiting ────────────────────────────────────────────────────────
    RATE_LIMIT_OTP_PER_PHONE_PER_HOUR: int = 5
    RATE_LIMIT_GLOBAL_PER_USER_PER_MINUTE: int = 60

    # ── Notifications ────────────────────────────────────────────────────────
    NOTIFICATION_ADAPTER: Literal["mock", "whatsapp", "sms"] = "mock"

    # ── WhatsApp (optional — blank for MVP) ──────────────────────────────────
    WHATSAPP_PROVIDER: str | None = None
    WHATSAPP_ACCOUNT_SID: str | None = None
    WHATSAPP_AUTH_TOKEN: str | None = None
    WHATSAPP_FROM_NUMBER: str | None = None
    WHATSAPP_META_ACCESS_TOKEN: str | None = None
    WHATSAPP_META_PHONE_NUMBER_ID: str | None = None
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str | None = None
    WHATSAPP_APP_SECRET: str | None = None

    # ── SMS (optional — blank for MVP) ───────────────────────────────────────
    SMS_PROVIDER: str | None = None
    SMS_API_KEY: str | None = None
    SMS_SENDER_ID: str | None = None

    # ── Government Integration ───────────────────────────────────────────────
    GOV_ADAPTER: Literal["mock", "euparjan", "ekharid", "anaaj_kharid"] = "mock"
    EUPARJAN_API_BASE_URL: str | None = None
    EUPARJAN_API_KEY: str | None = None
    EKHARID_API_BASE_URL: str | None = None
    EKHARID_API_KEY: str | None = None

    # ── Logging ──────────────────────────────────────────────────────────────
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "json"

    # ── Seed ─────────────────────────────────────────────────────────────────
    SEED_ADMIN_PASSWORD: str | None = None

    # ── Derived helpers ──────────────────────────────────────────────────────
    @property
    def cors_origins_list(self) -> list[str]:
        """Split comma-separated CORS_ORIGINS into a list."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def alembic_url(self) -> str:
        """Return ALEMBIC_DATABASE_URL if set, else DATABASE_URL."""
        return self.ALEMBIC_DATABASE_URL or self.DATABASE_URL

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v.startswith("postgresql"):
            raise ValueError("DATABASE_URL must be a PostgreSQL URL")
        return v

    @model_validator(mode="after")
    def secrets_must_differ(self) -> "Settings":
        if self.JWT_SECRET_KEY == self.QR_HMAC_SECRET:
            raise ValueError(
                "JWT_SECRET_KEY and QR_HMAC_SECRET must be different values"
            )
        return self

    @model_validator(mode="after")
    def production_checks(self) -> "Settings":
        if self.APP_ENV == "production":
            if self.DEBUG:
                raise ValueError("DEBUG must be False in production")
            if self.OTP_MOCK_ENABLED:
                raise ValueError(
                    "OTP_MOCK_ENABLED must be False in production — use real SMS"
                )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return singleton Settings instance (cached after first call)."""
    return Settings()


# Convenience alias used throughout the codebase
settings = get_settings()
