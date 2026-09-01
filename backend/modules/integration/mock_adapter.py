"""
modules/integration/mock_adapter.py — Mock government procurement adapter.

Returns seeded demo data. Used when GOV_ADAPTER=mock (default for MVP/demo).
All records carry is_mock=True and source_system="MOCK".
"""
from __future__ import annotations

from modules.integration.base import GovernmentProcurementAdapter, PaymentInfo, ProcurementInfo


class MockGovernmentProcurementAdapter(GovernmentProcurementAdapter):
    """Mock adapter — returns synthesised demo data without any external calls."""

    async def get_procurement_record(self, queue_entry_id: str) -> ProcurementInfo:
        # Return a plausible mock record.
        # In reality this would fetch from the DB based on the queue_entry_id
        # after it's been created by the officer complete flow.
        return ProcurementInfo(
            crop="Wheat",
            declared_quantity_q=40.5,
            actual_quantity_q=40.5,
            grade="A",
            msp_rate=2275.0,
            total_amount=92137.5,
            is_verified=False,
            is_mock=True,
            source_system="MOCK",
        )

    async def get_payment_status(self, queue_entry_id: str) -> PaymentInfo:
        return PaymentInfo(
            status="PENDING",
            amount=92137.5,
            utr_number=None,
            bank_reference=None,
            is_mock=True,
        )


# ── EUparjan stub ──────────────────────────────────────────────────────────────
class EUparjanAdapter(GovernmentProcurementAdapter):
    """Stub for MP e-Uparjan integration — raises NotImplementedError."""

    async def get_procurement_record(self, queue_entry_id: str) -> ProcurementInfo:
        raise NotImplementedError("EUparjan integration not yet implemented")

    async def get_payment_status(self, queue_entry_id: str) -> PaymentInfo:
        raise NotImplementedError("EUparjan integration not yet implemented")


def get_gov_adapter() -> GovernmentProcurementAdapter:
    """Factory — returns the correct adapter based on GOV_ADAPTER env var."""
    from core.config import settings
    if settings.GOV_ADAPTER == "euparjan":
        return EUparjanAdapter()
    return MockGovernmentProcurementAdapter()
