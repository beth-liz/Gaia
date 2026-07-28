from pydantic import BaseModel
from datetime import datetime


class OfficerAssignmentCreate(BaseModel):
    officer_id: int
    incident_id: int


class OfficerAssignmentResponse(BaseModel):
    id: int
    officer_id: int
    incident_id: int
    assigned_at: datetime

    class Config:
        from_attributes = True