from pydantic import BaseModel, field_validator
from typing import Optional
import re


class VillageBase(BaseModel):
    village_name: str
    district_id: Optional[int] = None

    @field_validator("village_name")
    @classmethod
    def validate_village_name(cls, value: str) -> str:
        if not re.match(r"^[a-zA-Z\s]+$", value):
            raise ValueError("Village name can contain only letters and spaces.")
        return value


class VillageCreate(VillageBase):
    pass


class VillageOut(VillageBase):
    id: int
    district_name: Optional[str] = "Wayanad"
    state_name: Optional[str] = "Kerala"

    class Config:
        from_attributes = True