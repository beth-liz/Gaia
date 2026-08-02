from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AnimalSpeciesBase(BaseModel):
    animal_name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = "Mammal"
    danger_level: Optional[str] = "Medium"
    conservation_status: Optional[str] = "Least Concern"
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = True


class AnimalSpeciesCreate(AnimalSpeciesBase):
    pass


class AnimalSpeciesUpdate(BaseModel):
    animal_name: Optional[str] = None
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    danger_level: Optional[str] = None
    conservation_status: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None


class AnimalSpeciesOut(AnimalSpeciesBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
