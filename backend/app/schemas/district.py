from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re


class DistrictBase(BaseModel):
    district_name: str
    state_id: int

    @field_validator("district_name")
    @classmethod
    def validate_district_name(cls, value: str) -> str:
        if not re.match(r"^[a-zA-Z\s]+$", value):
            raise ValueError("District name can contain only letters and spaces.")
        return value


class DistrictCreate(DistrictBase):
    pass


class DistrictUpdate(BaseModel):
    district_name: Optional[str] = None
    state_id: Optional[int] = None


class DistrictResponse(DistrictBase):
    id: int
    state_name: Optional[str] = None
    station_count: Optional[int] = 0
    village_count: Optional[int] = 0
    status: Optional[str] = "Active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
