from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import re


class AnimalSpeciesBase(BaseModel):
    animal_name: str
    scientific_name: Optional[str] = None
    category: Optional[str] = "Mammal"
    danger_level: Optional[str] = "Medium"
    conservation_status: Optional[str] = "Least Concern"
    description: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = True

    @field_validator("animal_name")
    @classmethod
    def validate_animal_name(cls, value: str) -> str:
        if not re.match(r"^[a-zA-Z\s]+$", value):
            raise ValueError("Animal species name can contain only letters and spaces.")
        return value


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
