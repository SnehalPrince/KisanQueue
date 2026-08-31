# 20 — Notification System

## Purpose
Notifications proactively push relevant information to farmers so they do not need to keep checking the app. This is especially important for:
- Farmers who are driving to the centre and cannot monitor the screen.
- Farmers waiting at home and relying on WhatsApp.
- ETA changes that meaningfully affect the farmer's travel decision.

---

## Channels

| Channel | MVP Status | Notes |
|---|---|---|
| **In-App (WebSocket push)** | ✅ MVP — active | Instant push to connected farmer clients via the existing WS gateway |
| **In-App (notification bell)** | ✅ MVP — active | Stored in `notifications` table; shown in header badge on next app open |
| **WhatsApp** | ⚠️ MVP — simulated | `MockNotificationAdapter` logs "would send"; real sending wired in production |
| **SMS** | ❌ Not in MVP | Architecture supports it; `SmsAdapter` stub exists; not wired in MVP |

---

## Notification Events & Triggers

| Event ID | Trigger | Channels (MVP) | Message (EN) | Message (HI) |
|---|---|---|---|---|
| `NOTIF_QUEUE_JOINED` | Farmer joins queue | In-App WS + In-App bell + WA (mock) | "Token 47 assigned. You are #14 in queue at Rajgarh Centre. Est. wait: ~87 min." | "टोकन 47 मिला। राजगढ़ केंद्र में 14वें नंबर पर हैं। अनुमानित प्रतीक्षा: ~87 मिनट।" |
| `NOTIF_ETA_INCREASED` | ETA increases by > 30 min | In-App WS + In-App bell + WA (mock) | "⚠️ Delay at Rajgarh Centre. New est. wait: ~145 min (Lifting delayed)." | "⚠️ राजगढ़ केंद्र में देरी। नया अनुमान: ~145 मिनट (उठान में देरी)।" |
| `NOTIF_ETA_DECREASED` | ETA decreases by > 20 min | In-App WS | "✅ Queue moving faster. New est. wait: ~60 min." | "✅ कतार तेज़ चल रही है। नया अनुमान: ~60 मिनट।" |
| `NOTIF_APPROACHING` | Farmer position ≤ 3 | In-App WS + In-App bell + WA (mock) | "🔔 Almost your turn! You are #3 in queue. Please be ready." | "🔔 आपकी बारी आने वाली है! आप 3वें नंबर पर हैं। तैयार रहें।" |
| `NOTIF_PROCESSING_STARTED` | Officer marks PROCESSING | In-App WS + In-App bell + WA (mock) | "✅ Your crop is being processed now." | "✅ आपकी फसल की प्रक्रिया शुरू हो गई है।" |
| `NOTIF_PROCESSING_COMPLETED` | Officer marks COMPLETED | In-App WS + In-App bell + WA (mock) | "🎉 Procurement complete! Wheat 38q, ₹86,450. Payment details coming soon." | "🎉 खरीद पूर्ण! गेहूं 38 क्विंटल, ₹86,450। भुगतान जल्द आएगा।" |
| `NOTIF_CENTRE_PAUSED` | Officer sets PAUSED | In-App WS + In-App bell + WA (mock) | "⏸️ Rajgarh Centre has paused operations. Please wait for update." | "⏸️ राजगढ़ केंद्र ने कार्य रोक दिया है। अपडेट की प्रतीक्षा करें।" |
| `NOTIF_CENTRE_RESUMED` | Officer sets status from PAUSED | In-App WS + In-App bell + WA (mock) | "▶️ Rajgarh Centre has resumed. New est. wait: ~90 min." | "▶️ राजगढ़ केंद्र ने कार्य फिर शुरू किया। अनुमानित: ~90 मिनट।" |
| `NOTIF_PAYMENT_UPDATED` | Payment status changes | In-App bell + WA (mock) | "💰 Payment status updated: ₹86,450 processed. UTR: XXXXXX." | "💰 भुगतान स्थिति: ₹86,450 प्रक्रियित। UTR: XXXXXX।" |

---

## Deduplication Logic

To avoid flooding the farmer:
- `NOTIF_ETA_INCREASED` is sent at most once per 15 minutes, even if multiple capacity updates occur.
- `NOTIF_APPROACHING` is sent once (when position first drops to ≤ 3), not on every subsequent position update.
- `NOTIF_ETA_DECREASED` is not sent if the farmer is already within 10 minutes of processing.

Deduplication is tracked in-memory (MVP — sufficient for single-process) or via `notifications.created_at` + event_type lookup (Post-MVP, database-backed).

---

## Notification Service Architecture

```python
# modules/notifications/service.py

class NotificationService:
    def __init__(self, adapter: NotificationAdapter):
        self.adapter = adapter  # MockNotificationAdapter in MVP

    async def dispatch(
        self,
        event_type: str,
        farmer_id: UUID,
        language: str,
        params: dict,
        db: AsyncSession
    ) -> None:
        # 1. Check deduplication rules
        if not self._should_send(event_type, farmer_id):
            return

        # 2. Format message in farmer's language
        message = MessageFormatter.format(event_type, language, params)

        # 3. Send via all eligible channels for this event
        await self._send_in_app(farmer_id, event_type, message, db)
        await self.adapter.send_message(farmer.phone, message)  # WA / SMS / mock

        # 4. Store in notifications table (for bell/history)
        await db.add(Notification(farmer_id=farmer_id, event_type=event_type, message=message, ...))

    def _should_send(self, event_type: str, farmer_id: UUID) -> bool:
        # Implements deduplication rules (in-memory cache for MVP)
        ...

    async def _send_in_app(self, farmer_id: UUID, event_type: str, message: str, db) -> None:
        # Sends via ConnectionManager.send_to_farmer() — already connected WS clients
        await connection_manager.send_to_farmer(str(farmer_id), {
            "event": event_type,
            "data": { "message": message }
        })
```

---

## Adapter Interface

```python
# modules/notifications/adapters/base.py
from abc import ABC, abstractmethod

class NotificationAdapter(ABC):
    @abstractmethod
    async def send_message(self, to_phone: str, body: str) -> bool: ...

# modules/notifications/adapters/mock.py
class MockNotificationAdapter(NotificationAdapter):
    async def send_message(self, to_phone: str, body: str) -> bool:
        logger.info(f"[MOCK NOTIFICATION] To: {to_phone} | Message: {body}")
        return True

# modules/notifications/adapters/whatsapp.py (production — not wired for MVP)
class WhatsAppAdapter(NotificationAdapter):
    async def send_message(self, to_phone: str, body: str) -> bool:
        # Call Twilio / Meta Cloud API
        ...
```

Adapter selection via config:
```python
# core/config.py
NOTIFICATION_ADAPTER = "mock"  # or "whatsapp" or "sms"
```

---

## Message Formatting

```python
# modules/notifications/formatter.py

TEMPLATES = {
    "en": {
        "NOTIF_QUEUE_JOINED": "Token {token_number} assigned. You are #{position} in queue at {centre_name}. Est. wait: ~{eta_minutes} min.",
        "NOTIF_ETA_INCREASED": "⚠️ Delay at {centre_name}. New est. wait: ~{eta_minutes} min ({reason}).",
        # ...
    },
    "hi": {
        "NOTIF_QUEUE_JOINED": "टोकन {token_number} मिला। {centre_name} में {position}वें नंबर पर हैं। अनुमानित प्रतीक्षा: ~{eta_minutes} मिनट।",
        "NOTIF_ETA_INCREASED": "⚠️ {centre_name} में देरी। नया अनुमान: ~{eta_minutes} मिनट ({reason})।",
        # ...
    }
}

class MessageFormatter:
    @staticmethod
    def format(event_type: str, language: str, params: dict) -> str:
        template = TEMPLATES.get(language, TEMPLATES["hi"]).get(event_type, "")
        return template.format(**params)
```

---

## In-App Notification Bell (UI)

- Header icon with unread count badge.
- Tapping opens a notification drawer showing last 20 notifications.
- Unread notifications highlighted.
- Each notification shows: message text, timestamp, event type icon.
- All text in the farmer's selected language.

---

## MVP Limitations (Explicitly Stated)

| Feature | MVP State | Production |
|---|---|---|
| Real WhatsApp delivery | ❌ Logged only | ✅ WhatsApp Cloud API / Twilio |
| Real SMS delivery | ❌ Not implemented | ✅ SMS gateway (e.g., Exotel, MSG91) |
| Push notifications (mobile) | ❌ Not implemented | ✅ Firebase Cloud Messaging |
| Notification preferences | ❌ Not implemented | ✅ Farmer can opt out per channel |
| Notification history persistence | ⚠️ Basic DB row | ✅ Full history with read receipts |

The demo script (`27_DEMO_SCRIPT.md`) explicitly labels WhatsApp as simulated — judges are told this is the production architecture, not a live integration.
