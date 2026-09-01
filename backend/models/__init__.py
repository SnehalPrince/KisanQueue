"""
models/__init__.py — Import all models so Alembic autogenerate sees them.
"""
from models.audit_log import AuditLog
from models.base import Base
from models.capacity_update import CapacityUpdate
from models.centre import Centre
from models.farmer import Farmer
from models.notification import Notification
from models.officer import Officer
from models.payment_status import PaymentStatus
from models.processing_event import ProcessingEvent
from models.procurement_record import ProcurementRecord
from models.qr_token import QRToken
from models.queue_entry import QueueEntry
from models.user import User
from models.whatsapp_session import WhatsAppSession

__all__ = [
    "Base",
    "User",
    "Farmer",
    "Officer",
    "Centre",
    "CapacityUpdate",
    "QueueEntry",
    "QRToken",
    "ProcessingEvent",
    "ProcurementRecord",
    "PaymentStatus",
    "AuditLog",
    "Notification",
    "WhatsAppSession",
]
