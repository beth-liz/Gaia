from pydantic import BaseModel
from datetime import datetime


class AnimalDetectionCreate(BaseModel):
    animal_name: str
    confidence: float
    image_path: str
    station_id: int


class AnimalDetectionResponse(BaseModel):
    id: int
    animal_name: str
    confidence: float
    image_path: str
    station_id: int
    detected_at: datetime

    class Config:
        from_attributes = True