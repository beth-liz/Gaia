from pydantic import BaseModel
from typing import Optional


class VillageCreate(BaseModel):
    name: str
    district: str
    state: str


class VillageUpdate(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None


class VillageResponse(BaseModel):
    id: int
    name: str
    district: str
    state: str

    class Config:
        from_attributes = True