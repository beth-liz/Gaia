from pydantic import BaseModel
from typing import Optional


class MonitoringStationCreate(BaseModel):
    station_name: str
    latitude: float
    longitude: float
    village_id: int


class MonitoringStationUpdate(BaseModel):
    station_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MonitoringStationResponse(BaseModel):
    id: int
    station_name: str
    latitude: float
    longitude: float
    village_id: int

    class Config:
        from_attributes = True