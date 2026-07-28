from pydantic import BaseModel
from datetime import datetime


class AlertCreate(BaseModel):
    incident_id: int
    alert_type: str
    message: str


class AlertResponse(BaseModel):
    id: int
    incident_id: int
    alert_type: str
    message: str
    sent_at: datetime

    class Config:
        from_attributes = True