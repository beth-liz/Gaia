from pydantic import BaseModel
from typing import Optional


class VillageBase(BaseModel):
    village_name: str
    district_id: Optional[int] = None


class VillageCreate(VillageBase):
    pass


class VillageOut(VillageBase):
    id: int
    district_name: Optional[str] = "Wayanad"
    state_name: Optional[str] = "Kerala"

    class Config:
        from_attributes = True