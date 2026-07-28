from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# -----------------------------
# User Registration Schema
# -----------------------------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: str
    village_id: Optional[int] = None


# -----------------------------
# User Login Schema
# -----------------------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -----------------------------
# User Update Schema
# -----------------------------
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


# -----------------------------
# User Response Schema
# -----------------------------
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str]
    role: str
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# -----------------------------
# User Password Change Schema
# -----------------------------
class UserChangePassword(BaseModel):
    old_password: str
    new_password: str


# -----------------------------
# Token & Login Response Schema
# -----------------------------
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse