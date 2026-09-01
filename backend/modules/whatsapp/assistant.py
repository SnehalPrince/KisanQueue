from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.farmer import Farmer
from models.whatsapp_session import WhatsAppSession
import structlog
from datetime import datetime

log = structlog.get_logger(__name__)

async def process_whatsapp_message(db: AsyncSession, phone: str, text: str) -> tuple[str, dict | None]:
    """
    Processes incoming text, updates state if in onboarding, 
    and returns (reply_text, action_link).
    """
    text_lower = text.lower().strip()
    
    # 1. Lookup Farmer
    farmer = await get_farmer_by_phone(db, phone)
    
    # 2. Check if active session exists
    session = await get_or_create_session(db, phone)
    
    if not farmer:
        return await handle_onboarding(db, session, text)
        
    # Returning Farmer logic
    is_hindi = True if farmer.preferred_language == 'hi' else False
    farmer_name = farmer.name or "Kisan"
    
    if any(kw in text_lower for kw in ["status", "स्थिति", "mandi", "eta", "कतार"]):
        return await handle_status_query(db, farmer, is_hindi)
    elif any(kw in text_lower for kw in ["pass", "पास", "qr", "slot", "टोकन", "1"]):
        return await handle_pass_query(db, farmer, is_hindi)
    elif any(kw in text_lower for kw in ["msp", "भाव", "payment", "भुगतान", "dbt", "रुपये", "5"]):
        return handle_msp_query(is_hindi)
    elif "cancel" in text_lower or "रद्द" in text_lower:
        return await handle_cancel_query(db, farmer, is_hindi)
    else:
        return handle_default_help(is_hindi)

async def get_farmer_by_phone(db: AsyncSession, phone: str) -> Farmer | None:
    # Look for Farmer profile where user.phone == phone, or farmer.contact_number == phone
    # Assuming farmer has user_id, let's query farmer joined with user if needed.
    # For now just query farmer by their user account if phone is linked there, or mock it if phone matches mock pattern.
    from models.user import User
    result = await db.execute(
        select(Farmer).join(User).where(User.phone == phone)
    )
    return result.scalar()

async def get_or_create_session(db: AsyncSession, phone: str) -> WhatsAppSession:
    result = await db.execute(select(WhatsAppSession).where(WhatsAppSession.phone_number == phone))
    session = result.scalar()
    if not session:
        session = WhatsAppSession(phone_number=phone, state="INIT", context={})
        db.add(session)
        await db.flush()
    return session

async def handle_onboarding(db: AsyncSession, session: WhatsAppSession, text: str) -> tuple[str, dict | None]:
    state = session.state
    ctx = session.context or {}
    
    if state == "INIT":
        session.state = "AWAITING_NAME"
        await db.commit()
        return (
            "नमस्ते! 🌾 KisanQueue में आपका स्वागत है।\n"
            "हम आपका किसान प्रोफ़ाइल केवल एक बार सेट करेंगे।\n"
            "कृपया अपना नाम बताएं:",
            None
        )
    elif state == "AWAITING_NAME":
        ctx["name"] = text.strip()
        session.context = ctx
        session.state = "AWAITING_LOCATION"
        await db.commit()
        return (
            f"धन्यवाद {ctx['name']} जी! आपका गाँव और जिला क्या है?",
            None
        )
    elif state == "AWAITING_LOCATION":
        ctx["location"] = text.strip()
        
        # Here we would normally create the User and Farmer records.
        # For MVP/Simulator, we'll just mock completion.
        session.state = "COMPLETED"
        await db.commit()
        
        return (
            "✅ प्रोफ़ाइल सफलतापूर्वक सेट हो गई!\n"
            f"नाम: {ctx.get('name')}\n"
            f"स्थान: {ctx.get('location')}\n"
            "अब आप कभी भी फसल बेचने, कतार देखने या भुगतान जानने के लिए बस मुझे संदेश भेज सकते हैं!",
            None
        )
        
    return ("आपका प्रोफ़ाइल सेट है! (Your profile is set!)", None)

async def handle_status_query(db: AsyncSession, farmer: Farmer, is_hindi: bool) -> tuple[str, dict | None]:
    """Return real centre status and ETA from the farmer's active queue entry."""
    from models.queue_entry import QueueEntry
    from models.capacity_update import CapacityUpdate
    from models.centre import Centre

    # Find farmer's active queue entry
    entry_result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.farmer_user_id == farmer.user_id,
            QueueEntry.status.in_(("WAITING", "CHECKED_IN", "PROCESSING")),
        ).limit(1)
    )
    entry = entry_result.scalar_one_or_none()

    if entry is None:
        no_pass = "आपका कोई सक्रिय पास नहीं है। KisanQueue ऐप से पास बनाएं।" if is_hindi \
            else "You have no active queue pass. Generate one via the KisanQueue app."
        return no_pass, {"label": "पास बनाएं" if is_hindi else "Get a Pass", "url": "/centres"}

    # Get latest capacity update for the centre
    cap_result = await db.execute(
        select(CapacityUpdate)
        .where(CapacityUpdate.centre_id == entry.centre_id)
        .order_by(CapacityUpdate.effective_from.desc())
        .limit(1)
    )
    cap = cap_result.scalar_one_or_none()

    centre_result = await db.execute(select(Centre).where(Centre.id == entry.centre_id))
    centre = centre_result.scalar_one_or_none()
    centre_name = (centre.hindi_name if is_hindi and centre else (centre.name if centre else "केंद्र"))

    status_str = cap.status if cap else "NORMAL"
    counters = cap.active_counters if cap else 2
    eta = entry.eta_minutes
    pos = entry.queue_position

    STATUS_HI = {"NORMAL": "सामान्य", "BUSY": "व्यस्त", "LIFTING_DELAYED": "उठान देरी", "PAUSED": "बंद"}
    STATUS_EN = {"NORMAL": "Normal", "BUSY": "Busy", "LIFTING_DELAYED": "Lifting Delayed", "PAUSED": "Paused"}

    if is_hindi:
        reply = (
            f"📊 **{centre_name} - लाइव रिपोर्ट:**\n"
            f"• स्थिति: **{STATUS_HI.get(status_str, status_str)}**\n"
            f"• सक्रिय कांटे: **{counters}**\n"
            f"• आपकी कतार स्थिति: **#{pos}**\n"
            f"• अनुमानित प्रतीक्षा: **{'~' + str(eta) + ' मिनट' if eta else 'N/A'}**\n"
            + (f"• अधिकारी नोट: {cap.note}" if cap and cap.note else "")
        )
    else:
        reply = (
            f"📊 **{centre_name} - Live Status:**\n"
            f"• Status: **{STATUS_EN.get(status_str, status_str)}**\n"
            f"• Active Counters: **{counters}**\n"
            f"• Your Queue Position: **#{pos}**\n"
            f"• Est. Wait: **{'~' + str(eta) + ' min' if eta else 'N/A'}**\n"
            + (f"• Officer Note: {cap.note}" if cap and cap.note else "")
        )
    link = {"label": "लाइव कतार पृष्ठ खोलें" if is_hindi else "Open Live Queue Tracker", "url": "/queue"}
    return reply, link

async def handle_pass_query(db: AsyncSession, farmer: Farmer, is_hindi: bool) -> tuple[str, dict | None]:
    """Return the farmer's real active pass details from the DB."""
    from models.queue_entry import QueueEntry

    entry_result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.farmer_user_id == farmer.user_id,
            QueueEntry.status.in_(("WAITING", "CHECKED_IN", "PROCESSING")),
        ).limit(1)
    )
    entry = entry_result.scalar_one_or_none()

    if entry is None:
        no_pass = "आपके पास कोई सक्रिय पास नहीं है। ऐप से नया पास बनाएं।" if is_hindi \
            else "You have no active pass. Generate a new pass from the app."
        return no_pass, {"label": "पास बनाएं" if is_hindi else "Get a Pass", "url": "/centres"}

    CROP_HI = {"wheat": "गेहूं", "soybean": "सोयाबीन", "paddy": "धान", "barley": "जौ"}
    crop_display = CROP_HI.get(entry.crop, entry.crop) if is_hindi else entry.crop.capitalize()

    if is_hindi:
        reply = (
            f"🎫 **आपका डिजिटल किसान पास:**\n"
            f"• टोकन: **{entry.token_code}**\n"
            f"• फसल: **{crop_display}**\n"
            f"• मात्रा: **{entry.quantity_quintals} क्विंटल**\n"
            f"• स्थिति: **{entry.status}**\n"
            f"• गेट चेक-इन पर यह क्यूआर दिखाएं।"
        )
    else:
        reply = (
            f"🎫 **Your Digital Kisan Pass:**\n"
            f"• Token: **{entry.token_code}**\n"
            f"• Crop: **{crop_display}**\n"
            f"• Quantity: **{entry.quantity_quintals} Qtl**\n"
            f"• Status: **{entry.status}**\n"
            f"• Show this QR at the gate."
        )
    link = {"label": "डिजिटल पास (QR) देखें" if is_hindi else "View Digital QR Pass",
            "url": f"/pass/{entry.id}"}
    return reply, link

def handle_msp_query(is_hindi: bool) -> tuple[str, dict | None]:
    reply = (
        "💰 **एमएसपी दरें व डीबीटी भुगतान स्थिति:**\n"
        "• गेहूं (Wheat): **₹2,275/क्विंटल**\n"
        "• सोयाबीन (Soybean): **₹4,600/क्विंटल**\n"
        "• धान (Paddy): **₹2,183/क्विंटल**\n"
        "• भुगतान 48 घंटों में आपके बैंक खाते में आ जाएगा।"
    ) if is_hindi else (
        "💰 **Government MSP Rates & DBT Status:**\n"
        "• Wheat: **₹2,275 / Quintal**\n"
        "• Soybean: **₹4,600 / Quintal**\n"
        "• Paddy: **₹2,183 / Quintal**\n"
        "• Payments are credited within 48 hours."
    )
    link = {"label": "उपार्जन रसीद देखें" if is_hindi else "View Receipt", "url": "/procurement/rec-1"}
    return reply, link

async def handle_cancel_query(db: AsyncSession, farmer: Farmer, is_hindi: bool) -> tuple[str, dict | None]:
    """Actually cancel the farmer's WAITING pass, or return an honest error if there's nothing to cancel."""
    from models.queue_entry import QueueEntry
    from modules.qr.service import QRService

    entry_result = await db.execute(
        select(QueueEntry).where(
            QueueEntry.farmer_user_id == farmer.user_id,
            QueueEntry.status == "WAITING",
        ).limit(1)
    )
    entry = entry_result.scalar_one_or_none()

    if entry is None:
        # Check if they have any active (non-WAITING) entry
        active_result = await db.execute(
            select(QueueEntry).where(
                QueueEntry.farmer_user_id == farmer.user_id,
                QueueEntry.status.in_(("CHECKED_IN", "PROCESSING")),
            ).limit(1)
        )
        active = active_result.scalar_one_or_none()
        if active:
            msg = (
                f"आपका पास ({active.token_code}) अभी **{active.status}** है — इसे रद्द नहीं किया जा सकता।\n"
                "कृपया मंडी अधिकारी से संपर्क करें।"
            ) if is_hindi else (
                f"Your pass ({active.token_code}) is currently **{active.status}** and cannot be cancelled.\n"
                "Please contact the mandi officer."
            )
        else:
            msg = ("रद्द करने के लिए कोई सक्रिय पास नहीं है।" if is_hindi
                   else "You have no active pass to cancel.")
        return msg, None

    # Cancel the WAITING entry
    entry.status = "CANCELLED"
    await QRService.revoke(entry.id, db)

    try:
        from modules.officer.router import _recalculate_and_broadcast
        await _recalculate_and_broadcast(entry.centre_id, db)
    except Exception as e:
        log.warning("whatsapp.cancel_broadcast_failed", error=str(e))

    log.info("whatsapp.pass_cancelled", token=entry.token_code, farmer_id=farmer.user_id)
    msg = (
        f"✅ आपका पास **{entry.token_code}** रद्द कर दिया गया है।\nआप नया पास बना सकते हैं।"
    ) if is_hindi else (
        f"✅ Your pass **{entry.token_code}** has been cancelled.\nYou can generate a new pass."
    )
    return msg, {"label": "नया पास बनाएं" if is_hindi else "Get a New Pass", "url": "/centres"}

def handle_default_help(is_hindi: bool) -> tuple[str, dict | None]:
    reply = (
        "🚜 **मंडी गेट चेक-इन सहायता:**\n"
        "1 - पास देखें\n"
        "2 - मंडी स्थिति\n"
        "3 - एमएसपी दरें\n"
        "कृपया एक विकल्प चुनें या अपना प्रश्न पूछें।"
    ) if is_hindi else (
        "🚜 **Mandi Gate Check-in Assistance:**\n"
        "1 - View Pass\n"
        "2 - Mandi Status\n"
        "3 - MSP Rates\n"
        "Reply with a number or ask your query."
    )
    return reply, None
