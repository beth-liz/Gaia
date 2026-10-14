from pydantic import BaseModel, validator, Field
from typing import Optional, List, Any
from datetime import datetime


class IncidentCreate(BaseModel):
    incident_title: Optional[str] = None
    incident_category: Optional[str] = "Wildlife Sighting"
    animal_species_id: Optional[int] = None
    animal_type: str = Field(..., min_length=1)
    severity: Optional[str] = "Medium"
    description: Optional[str] = None
    latitude: float = Field(..., description="Latitude coordinate between -90 and 90")
    longitude: float = Field(..., description="Longitude coordinate between -180 and 180")
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
    reporter_name: Optional[str] = None
    date_reported: Optional[str] = None
    time_reported: Optional[str] = None
    images: List[str] = Field(..., description="At least one valid uploaded image is required")

    @validator("latitude")
    def validate_latitude(cls, v):
        if v is None or v < -90.0 or v > 90.0:
            raise ValueError("Latitude must be a valid number between -90.0 and 90.0 degrees")
        return v

    @validator("longitude")
    def validate_longitude(cls, v):
        if v is None or v < -180.0 or v > 180.0:
            raise ValueError("Longitude must be a valid number between -180.0 and 180.0 degrees")
        return v

    @validator("location", always=True)
    def validate_location(cls, v, values):
        address = values.get("address")
        loc_val = (v or "").strip() or (address or "").strip()
        if not loc_val:
            raise ValueError("A confirmed, non-empty incident location or address is required")
        return loc_val

    @validator("images")
    def validate_images(cls, v):
        if not v or not isinstance(v, list) or len(v) == 0:
            raise ValueError("At least one incident photograph must be uploaded before submitting")
        cleaned = [img.strip() for img in v if isinstance(img, str) and img.strip()]
        if not cleaned:
            raise ValueError("At least one valid non-empty incident photograph URL must be provided")
        return cleaned


class IncidentAssignMulti(BaseModel):
    officer_ids: List[int]
    priority: Optional[str] = "High"
    estimated_response_time: Optional[str] = "30 Mins"
    instructions: Optional[str] = None
    mission_notes: Optional[str] = None
    assignment_category: Optional[str] = "Field Patrol"
    emergency_level: Optional[str] = "Level 2"


class AssignedOfficerOut(BaseModel):
    assignment_id: int
    officer_id: int
    full_name: str
    designation: Optional[str] = "Forest Guard"
    work_status: Optional[str] = "Available"
    avatar_url: Optional[str] = None
    assigned_at: str
    assignment_status: Optional[str] = "Assigned"
    inventory_status: Optional[str] = "PENDING"
    accepted_at: Optional[str] = None
    priority: Optional[str] = "High"
    estimated_response_time: Optional[str] = "30 Mins"
    instructions: Optional[str] = None
    dispatched_at: Optional[str] = None


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
    assigned_officers: List[AssignedOfficerOut] = []
    is_head_officer: bool = False
    head_officer_id: Optional[int] = None
    head_officer_name: Optional[str] = None

    # Verification & Closure Fields
    verification_notes: Optional[str] = None
    verification_time: Optional[str] = None
    verified_by_name: Optional[str] = None
    closed_at: Optional[str] = None
    closed_by_name: Optional[str] = None
    final_closure_remarks: Optional[str] = None

    # AI Detection Fields
    ai_status: Optional[str] = "Pending"
    ai_species: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_count: Optional[int] = None
    ai_bounding_boxes: Optional[Any] = None
    ai_model_info: Optional[str] = None
    ai_results: List[Any] = []

    # Camera Provenance Fields
    camera_detection_event_id: Optional[int] = None

    created_at: datetime

    class Config:
        from_attributes = True