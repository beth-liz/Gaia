from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any


class AnimalDetectionCreate(BaseModel):
    animal_name: str
    normalized_species: Optional[str] = None
    confidence: float
    count: Optional[int] = 1
    bounding_boxes: Optional[Any] = None
    image_path: str
    station_id: Optional[int] = None
    incident_id: Optional[int] = None
    model_info: Optional[str] = None


class AnimalDetectionResponse(BaseModel):
    id: int
    animal_name: str
    normalized_species: Optional[str] = None
    confidence: float
    count: Optional[int]
    bounding_boxes: Optional[Any] = None
    image_path: str
    station_id: Optional[int]
    incident_id: Optional[int]
    model_info: Optional[str]
    detected_at: datetime

    class Config:
        from_attributes = True