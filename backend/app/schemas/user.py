import re
import unicodedata
from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional
from datetime import datetime


def validate_full_name(v: str) -> str:
    if not v or not v.strip():
        raise ValueError("Full name cannot be empty.")
    # Trim and collapse extra consecutive spaces
    cleaned = re.sub(r"\s+", " ", v.strip())
    # Reject if length is too short
    if len(cleaned) < 2:
        raise ValueError("Full name must be at least 2 characters long.")
    if len(cleaned) > 100:
        raise ValueError("Full name cannot exceed 100 characters.")
    # Allow alphabetic characters and spaces only.
    # Support accented and international Unicode letters (categories 'L' and spaces 'Z')
    for char in cleaned:
        category = unicodedata.category(char)
        if not (category.startswith("L") or category == "Zs"):
            raise ValueError("Full name must contain alphabetic characters and spaces only. Digits, punctuation, and symbols are not allowed.")
    return cleaned


def validate_phone_number(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    val = v.strip()
    if not val:
        raise ValueError("Phone number cannot be empty.")
    # Allow leading '+' optionally, followed by digits only
    if not re.match(r"^\+?[0-9]{10,15}$", val):
        raise ValueError("Invalid phone number format. Please enter a valid 10-digit mobile number (e.g. 9876543210 or +919876543210).")
    # If 10 digits without country code, ensure it starts with standard Indian mobile prefix [6-9]
    digits_only = re.sub(r"\D", "", val)
    if len(digits_only) == 10:
        if digits_only[0] not in "6789":
            raise ValueError("10-digit mobile number must start with 6, 7, 8, or 9.")
        return digits_only
    elif len(digits_only) == 12 and digits_only.startswith("91"):
        if digits_only[2] not in "6789":
            raise ValueError("Indian mobile number with +91 must start with 6, 7, 8, or 9.")
        return digits_only[2:]  # normalize to 10-digit format consistent with database
    return digits_only


def validate_password_strength(v: str) -> str:
    if not v or len(v) < 6:
        raise ValueError("Password must be at least 6 characters long.")
    if len(v) > 128:
        raise ValueError("Password cannot exceed 128 characters.")
    return v


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

    @validator("full_name")
    def check_full_name(cls, v):
        return validate_full_name(v)

    @validator("phone")
    def check_phone(cls, v):
        return validate_phone_number(v)

    @validator("password")
    def check_password(cls, v):
        return validate_password_strength(v)

    @validator("email")
    def normalize_email(cls, v):
        return v.strip().lower()


class VillagerRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str
    village_id: int

    @validator("full_name")
    def check_full_name(cls, v):
        return validate_full_name(v)

    @validator("phone")
    def check_phone(cls, v):
        res = validate_phone_number(v)
        if not res:
            raise ValueError("Phone number is required.")
        return res

    @validator("password")
    def check_password(cls, v):
        return validate_password_strength(v)

    @validator("email")
    def normalize_email(cls, v):
        return v.strip().lower()


class PasswordResetRequest(BaseModel):
    email: EmailStr

    @validator("email")
    def normalize_email(cls, v):
        return v.strip().lower()


class PasswordResetVerify(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)

    @validator("email")
    def normalize_email(cls, v):
        return v.strip().lower()

    @validator("code")
    def check_code(cls, v):
        val = v.strip()
        if not re.match(r"^\d{6}$", val):
            raise ValueError("Verification code must be exactly 6 digits.")
        return val


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str
    confirm_password: str

    @validator("email")
    def normalize_email(cls, v):
        return v.strip().lower()

    @validator("new_password")
    def check_password(cls, v):
        return validate_password_strength(v)

    @validator("confirm_password")
    def check_passwords_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("New password and confirm password do not match.")
        return v


class VillagerApprovalUpdate(BaseModel):
    is_approved: bool


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