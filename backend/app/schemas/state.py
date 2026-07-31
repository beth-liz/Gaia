from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StateBase(BaseModel):
    state_name: str


class StateCreate(StateBase):
    pass


class StateUpdate(BaseModel):
    state_name: Optional[str] = None


class StateResponse(StateBase):
    id: int
    district_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
