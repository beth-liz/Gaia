from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class IncidentCreate(BaseModel):
    incident_title: Optional[str] = None
    incident_category: Optional[str] = "Wildlife Sighting"
    animal_species_id: Optional[int] = None
    animal_type: str
    severity: Optional[str] = "Medium"
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[str] = None
    address: Optional[str] = None
    village_id: Optional[int] = None
    station_id: Optional[int] = None
    district_id: Optional[int] = None
    state_id: Optional[int] = None
    weather: Optional[str] = "Sunny"
    people_injured: Optional[bool] = False
    livestock_damage: Optional[bool] = False
    property_damage: Optional[bool] = False
    crop_damage: Optional[bool] = False
    contact_number: Optional[str] = None
    date_reported: Optional[str] = None
    time_reported: Optional[str] = None
    images: Optional[List[str]] = []


class IncidentAssign(BaseModel):
    assigned_to_id: int
    notes: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class IncidentOut(BaseModel):
    id: int
    reference_id: Optional[str] = None
    incident_title: Optional[str] = None
    incident_category: Optional[str] = "Wildlife Sighting"
    animal_species_id: Optional[int] = None
    animal_species_name: Optional[str] = None
    animal_type: str
    animal: str
    severity: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[str] = None
    address: Optional[str] = None
    village_id: Optional[int] = None
    village_name: Optional[str] = None
    station_id: Optional[int] = None
    station_name: Optional[str] = None
    district_id: Optional[int] = None
    district_name: Optional[str] = None
    state_id: Optional[int] = None
    state_name: Optional[str] = None
    weather: Optional[str] = "Sunny"
    people_injured: bool = False
    livestock_damage: bool = False
    property_damage: bool = False
    crop_damage: bool = False
    status: str
    incident_status: Optional[str] = "Pending Review"
    reported_by: Optional[int] = None
    reporter_name: Optional[str] = None
    reporter_role: Optional[str] = None
    photo_url: Optional[str] = None
    images: List[str] = []
    contact_number: Optional[str] = None
    date_reported: Optional[str] = None
    time_reported: Optional[str] = None
    assigned_guard_id: Optional[int] = None
    assigned_guard_name: Optional[str] = None
    assignment_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True