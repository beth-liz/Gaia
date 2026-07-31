from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: Optional[str] = "Villager"
    village_id: Optional[int] = None


class VillagerRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    village_id: int


class OfficerCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    designation_id: int
    station_id: int
    temporary_password: str
    status: Optional[str] = "Active"


class OfficerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    designation_id: Optional[int] = None
    station_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserChangePassword(BaseModel):
    old_password: str
    new_password: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_image: Optional[str] = None


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_verified: bool
    is_active: bool
    village_id: Optional[int] = None
    designation_id: Optional[int] = None
    station_id: Optional[int] = None
    station: Optional[str] = None
    work_status: Optional[str] = "Available"
    avatar_url: Optional[str] = None
    profile_image: Optional[str] = None
    village_name: Optional[str] = None
    designation_name: Optional[str] = None
    station_name: Optional[str] = None
    district_name: Optional[str] = None
    state_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


UserResponse = UserOut


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut