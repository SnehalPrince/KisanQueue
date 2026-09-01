"""
modules/procurement/router.py — Procurement and payment endpoints.

Routes:
    GET /v1/procurement/{pass_id}  — Get procurement record for a pass
    GET /v1/payment/{pass_id}      — Get payment status for a pass
"""
from __future__ import annotations

import structlog
from fastapi import APIRouter
from sqlalchemy import select

from core.dependencies import AnyAuthenticatedUser, DbSession
from core.exceptions import PaymentNotFoundError, ProcurementNotFoundError
from models.payment_status import PaymentStatus
from models.procurement_record import ProcurementRecord
from models.queue_entry import QueueEntry

router = APIRouter()
log = structlog.get_logger(__name__)


@router.get("/procurement/{pass_id}")
async def get_procurement(pass_id: str, db: DbSession, payload: AnyAuthenticatedUser) -> dict:
    """Return procurement record for a queue entry (by pass_id = queue_entry_id)."""
    # Verify pass exists
    qe_result = await db.execute(select(QueueEntry).where(QueueEntry.id == pass_id))
    qe = qe_result.scalar_one_or_none()
    if qe is None:
        raise ProcurementNotFoundError()

    result = await db.execute(
        select(ProcurementRecord).where(ProcurementRecord.queue_entry_id == pass_id)
    )
    rec = result.scalar_one_or_none()
    if rec is None:
        raise ProcurementNotFoundError()

    return {
        "id": rec.id,
        "pass_id": pass_id,
        "crop": rec.crop,
        "declared_quantity_q": rec.declared_quantity_q,
        "actual_quantity_q": rec.actual_quantity_q,
        "grade": rec.grade,
        "msp_rate": rec.msp_rate,
        "total_amount": rec.total_amount,
        "is_verified": rec.is_verified,
        "is_mock": rec.is_mock,
        "source_system": rec.source_system,
        "completed_at": rec.completed_at.isoformat(),
    }


@router.get("/payment/{pass_id}")
async def get_payment(pass_id: str, db: DbSession, payload: AnyAuthenticatedUser) -> dict:
    """Return payment status for a pass (by pass_id = queue_entry_id)."""
    # Fetch via procurement record
    proc_result = await db.execute(
        select(ProcurementRecord).where(ProcurementRecord.queue_entry_id == pass_id)
    )
    proc = proc_result.scalar_one_or_none()
    if proc is None:
        raise PaymentNotFoundError()

    pay_result = await db.execute(
        select(PaymentStatus).where(PaymentStatus.procurement_record_id == proc.id)
    )
    pay = pay_result.scalar_one_or_none()
    if pay is None:
        raise PaymentNotFoundError()

    return {
        "id": pay.id,
        "pass_id": pass_id,
        "status": pay.status,
        "amount": pay.amount,
        "utr_number": pay.utr_number,
        "bank_reference": pay.bank_reference,
        "paid_at": pay.paid_at.isoformat() if pay.paid_at else None,
        "is_mock": pay.is_mock,
    }
