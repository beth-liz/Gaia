from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IncidentCreate(BaseModel):
    animal: str
    location: str
    village_id: int
    severity: str  # Low, Medium, High, Critical
    description: str
    photo_url: Optional[str] = None
    contact_number: Optional[str] = None
    date_reported: Optional[str] = None
    time_reported: Optional[str] = None


class IncidentAssign(BaseModel):
    assigned_to_id: int  # Forest Guard user ID
    notes: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: str  # In Progress, Completed, Rejected
    notes: Optional[str] = None
    report_url: Optional[str] = None


class IncidentOut(BaseModel):
    id: int
    reporter_id: int
    reporter_name: Optional[str] = None
    village_id: Optional[int] = None
    village_name: Optional[str] = None
    animal: str
    location: str
    severity: str
    description: Optional[str] = None
    status: str
    photo_url: Optional[str] = None
    contact_number: Optional[str] = None
    date_reported: Optional[str] = None
    time_reported: Optional[str] = None
    assigned_guard_id: Optional[int] = None
    assigned_guard_name: Optional[str] = None
    assignment_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True