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
        return handle_cancel_query(is_hindi)
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
    # Placeholder for actual queue status check
    reply = (
        "📊 **राजगढ़ उपार्जन केंद्र - लाइव रिपोर्ट:**\n"
        "• स्थिति: **सामान्य रूप से चालू**\n"
        "• सक्रिय कांटे: **4 काउंटर**\n"
        "• अनुमानित प्रतीक्षा: **~15 मिनट**\n"
        "• अधिकारी नोट: \"सभी किसान समय पर आएं\""
    ) if is_hindi else (
        "📊 **Rajgarh Procurement Centre - Live Status:**\n"
        "• Condition: **NORMAL**\n"
        "• Active Counters: **4**\n"
        "• Estimated Queue Wait: **~15 mins**\n"
        "• Mandi Note: \"Arrive on time\""
    )
    link = {"label": "लाइव कतार पृष्ठ खोलें" if is_hindi else "Open Live Queue Tracker", "url": "/queue"}
    return reply, link

async def handle_pass_query(db: AsyncSession, farmer: Farmer, is_hindi: bool) -> tuple[str, dict | None]:
    reply = (
        f"🎫 **आपका डिजिटल किसान पास:**\n"
        f"• किसान: **{farmer.name}**\n"
        f"• फसल: **गेहूं (Wheat)**\n"
        f"• गेट चेक-इन पर यह क्यूआर दिखाएं।"
    ) if is_hindi else (
        f"🎫 **Your Digital Kisan Pass:**\n"
        f"• Farmer: **{farmer.name}**\n"
        f"• Crop: **Wheat**\n"
        f"• Present this QR code at Gate 1."
    )
    link = {"label": "डिजिटल पास (QR) देखें" if is_hindi else "View Digital QR Pass", "url": "/pass/PASS-123"}
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

def handle_cancel_query(is_hindi: bool) -> tuple[str, dict | None]:
    return ("आपका पास रद्द कर दिया गया है।" if is_hindi else "Your pass has been cancelled.", None)

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
