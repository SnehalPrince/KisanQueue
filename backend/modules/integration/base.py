"""
modules/integration/base.py — Abstract government procurement adapter.

Implements the interface from docs/21_INTEGRATION_STRATEGY.md.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ProcurementInfo:
    crop: str
    declared_quantity_q: float
    actual_quantity_q: float | None
    grade: str | None
    msp_rate: float
    total_amount: float
    is_verified: bool
    is_mock: bool
    source_system: str


@dataclass
class PaymentInfo:
    status: str  # PENDING | PROCESSING | PAID | FAILED
    amount: float
    utr_number: str | None
    bank_reference: str | None
    is_mock: bool


class GovernmentProcurementAdapter(ABC):
    """Abstract base class for government procurement system integrations."""

    @abstractmethod
    async def get_procurement_record(self, queue_entry_id: str) -> ProcurementInfo:
        """Fetch procurement weighing record for a completed queue entry."""
        ...

    @abstractmethod
    async def get_payment_status(self, queue_entry_id: str) -> PaymentInfo:
        """Fetch DBT payment status for a completed queue entry."""
        ...
