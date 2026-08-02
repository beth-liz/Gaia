from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IncidentActivityCreate(BaseModel):
    action: str
    remarks: Optional[str] = None


class IncidentActivityOut(BaseModel):
    id: int
    incident_id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
