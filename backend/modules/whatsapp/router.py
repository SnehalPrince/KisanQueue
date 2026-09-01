"""
modules/whatsapp/router.py — WhatsApp webhook and simulator API.
"""
from fastapi import APIRouter
from core.dependencies import DbSession
from modules.whatsapp.schemas import SimulateMessageRequest, SimulateMessageResponse
from modules.whatsapp.assistant import process_whatsapp_message
import structlog

router = APIRouter()
log = structlog.get_logger(__name__)


@router.post("/simulate", response_model=SimulateMessageResponse)
async def simulate_whatsapp_message(
    payload: SimulateMessageRequest,
    db: DbSession
) -> SimulateMessageResponse:
    """
    Simulates receiving a WhatsApp message from a farmer.
    This is used by the frontend simulator to trigger the backend conversational agent.
    """
    log.info(f"[WhatsApp Simulator] Received from {payload.phone}: {payload.text}")
    
    reply_text, action_link = await process_whatsapp_message(db, payload.phone, payload.text)
    
    return SimulateMessageResponse(
        status="ok",
        reply=reply_text,
        action_link=action_link
    )
