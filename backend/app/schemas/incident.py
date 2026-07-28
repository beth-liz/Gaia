from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IncidentCreate(BaseModel):
    animal_type: str
    confidence: float
    location: str
    station_id: int


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    officer_id: Optional[int] = None


class IncidentResponse(BaseModel):
    id: int
    animal_type: str
    confidence: float
    location: str
    status: str
    station_id: int
    created_at: datetime

    class Config:
        from_attributes = True