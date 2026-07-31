from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MonitoringStationBase(BaseModel):
    station_name: str
    district_id: int
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = "Active"
    description: Optional[str] = None


class MonitoringStationCreate(MonitoringStationBase):
    pass


class MonitoringStationUpdate(BaseModel):
    station_name: Optional[str] = None
    district_id: Optional[int] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None
    description: Optional[str] = None


class MonitoringStationResponse(MonitoringStationBase):
    id: int
    district_name: Optional[str] = None
    state_name: Optional[str] = None
    officer_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True