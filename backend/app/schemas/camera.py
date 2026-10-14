from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class CameraBase(BaseModel):
    camera_name: str = Field(..., min_length=2, max_length=100)
    camera_code: str = Field(..., min_length=2, max_length=50)
    monitoring_station_id: int
    location_name: Optional[str] = Field(None, max_length=255)
    latitude: float
    longitude: float
    status: Optional[str] = "Active"

    @validator("camera_name", "camera_code")
    def not_empty_str(cls, v):
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or blank")
        return v.strip()

    @validator("latitude")
    def validate_latitude(cls, v):
        if v is None or v < -90.0 or v > 90.0:
            raise ValueError("Latitude must be between -90 and 90 degrees")
        return v

    @validator("longitude")
    def validate_longitude(cls, v):
        if v is None or v < -180.0 or v > 180.0:
            raise ValueError("Longitude must be between -180 and 180 degrees")
        return v

    @validator("status")
    def validate_status(cls, v):
        allowed = {"Active", "Inactive", "Maintenance"}
        if v and v.capitalize() in allowed:
            return v.capitalize()
        raise ValueError(f"Status must be one of: {', '.join(allowed)}")

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    camera_name: Optional[str] = Field(None, min_length=2, max_length=100)
    monitoring_station_id: Optional[int] = None
    location_name: Optional[str] = Field(None, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None

class CameraOut(BaseModel):
    id: int
    camera_name: str
    camera_code: str
    monitoring_station_id: int
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
