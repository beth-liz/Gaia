from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re


class StateBase(BaseModel):
    state_name: str

    @field_validator("state_name")
    @classmethod
    def validate_state_name(cls, value: str) -> str:
        if not re.match(r"^[a-zA-Z\s]+$", value):
            raise ValueError("State name can contain only letters and spaces.")
        return value


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
