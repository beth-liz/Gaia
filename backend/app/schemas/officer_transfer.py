from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OfficerTransferCreate(BaseModel):
    new_station_id: int
    reason: Optional[str] = None
    effective_date: Optional[str] = None


class OfficerPostingHistoryOut(BaseModel):
    id: int
    officer_id: int
    officer_name: Optional[str] = None
    old_station_id: Optional[int] = None
    old_station_name: Optional[str] = None
    new_station_id: int
    new_station_name: Optional[str] = None
    transfer_date: datetime
    reason: Optional[str] = None
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True
