from abc import ABC, abstractmethod
import structlog

log = structlog.get_logger(__name__)

class WhatsAppAdapter(ABC):
    @abstractmethod
    async def send_message(self, to_phone: str, body: str) -> bool:
        pass

    @abstractmethod
    async def send_pass_with_qr(self, to_phone: str, pass_summary: str, qr_image_url: str) -> bool:
        pass


class MockWhatsAppAdapter(WhatsAppAdapter):
    """Logs messages to stdout. The responses are returned to the simulator directly in MVP."""
    async def send_message(self, to_phone: str, body: str) -> bool:
        log.info(f"[MockWhatsApp] Sending to {to_phone}: {body}")
        return True

    async def send_pass_with_qr(self, to_phone: str, pass_summary: str, qr_image_url: str) -> bool:
        log.info(f"[MockWhatsApp] Sending pass to {to_phone}: {pass_summary} (QR: {qr_image_url})")
        return True
