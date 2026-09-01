from pydantic import BaseModel, Field

class SimulateMessageRequest(BaseModel):
    phone: str = Field(..., description="The phone number of the farmer")
    text: str = Field(..., description="The message sent by the farmer")

class SimulateMessageResponse(BaseModel):
    status: str
    reply: str
    action_link: dict | None = None
