from pydantic import BaseModel
from typing import Optional


class VillageBase(BaseModel):
    village_name: str
    district: Optional[str] = "Wayanad"
    state: Optional[str] = "Kerala"


class VillageCreate(VillageBase):
    pass


class VillageOut(VillageBase):
    id: int

    class Config:
        from_attributes = True