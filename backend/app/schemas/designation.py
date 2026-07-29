from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DesignationBase(BaseModel):
    designation_name: str
    description: Optional[str] = None


class DesignationCreate(DesignationBase):
    pass


class DesignationUpdate(BaseModel):
    designation_name: Optional[str] = None
    description: Optional[str] = None


class DesignationOut(DesignationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
