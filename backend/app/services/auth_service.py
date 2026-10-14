import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.core.security import hash_password, verify_password, create_access_token

logger = logging.getLogger("gaia.auth_service")


def format_user_payload(user: User) -> UserOut:
    st_name = None
    dist_name = None
    state_name = None
    st_id = user.station_id

    if user.station_rel:
        st_name = user.station_rel.station_name
        st_id = user.station_rel.id
        if user.station_rel.district:
            dist_name = user.station_rel.district.district_name
            if user.station_rel.district.state:
                state_name = user.station_rel.district.state.state_name
    elif user.station:
        st_name = user.station

    # Fallback for village district/state if user is Villager
    v_name = user.village.village_name if user.village else None
    if user.village and user.village.district_rel:
        if not dist_name:
            dist_name = user.village.district_rel.district_name
        if user.village.district_rel.state and not state_name:
            state_name = user.village.district_rel.state.state_name

    return UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_verified=user.is_verified,
        is_active=user.is_active,
        village_id=user.village_id,
        designation_id=user.designation_id,
        station_id=st_id,
        station=st_name or user.station,
        work_status=user.work_status or "Available",
        avatar_url=user.avatar_url,
        profile_image=user.profile_image or user.avatar_url,
        village_name=v_name,
        designation_name=user.designation.designation_name if user.designation else None,
        station_name=st_name,
        district_name=dist_name,
        state_name=state_name,
        created_at=user.created_at
    )


def register_user(user: UserCreate, db: Session, current_admin: Optional[User] = None) -> UserOut:
    norm_email = user.email.strip().lower()
    existing_user = db.query(User).filter(User.email.ilike(norm_email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    if user.phone:
        existing_phone = db.query(User).filter(User.phone == user.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number already exists."
            )

    if current_admin and current_admin.role == "Admin":
        role = user.role or "Villager"
        is_verified = True
        must_change_password = False
    else:
        role = "Villager"
        is_verified = False  # Pending administrator approval
        must_change_password = False

    hashed_password = hash_password(user.password)

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password=hashed_password,
        role=role,
        village_id=user.village_id,
        is_verified=is_verified,
        is_active=True,
        must_change_password=must_change_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return format_user_payload(new_user)


def authenticate_user(login_data: UserLogin, db: Session) -> dict:
    norm_email = login_data.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(norm_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your officer/user account has been deactivated. Please contact Gaia System Administrator."
        )

    token_payload = {
        "sub": user.email,
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "station_id": user.station_id,
        "designation_id": user.designation_id
    }
    
    print(f"[AUTH LOG] Generated JWT Payload for {user.email}: {token_payload}")
    logger.info(f"Generated JWT Payload for {user.email}: {token_payload}")

    access_token = create_access_token(data=token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": format_user_payload(user)
    }


def change_user_password(
    current_user: User,
    old_password: str,
    new_password: str,
    db: Session
) -> UserOut:
    if not verify_password(old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid current password."
        )

    current_user.password = hash_password(new_password)
    current_user.must_change_password = False

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return format_user_payload(current_user)


import secrets
import hashlib
from datetime import datetime, timedelta
from app.models.password_reset_code import PasswordResetCode
from app.services.email_service import send_password_reset_email
from app.core.config import settings

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def request_password_reset(email: str, db: Session) -> dict:
    norm_email = email.strip().lower()
    user = db.query(User).filter(User.email.ilike(norm_email)).first()

    # Generic response returned always to prevent account enumeration
    generic_response = {
        "message": "If an active account exists for this email address, a password reset verification code has been dispatched."
    }

    if not user:
        return generic_response

    if not user.is_active:
        return generic_response

    # Check cooldown: if a code was created less than 60 seconds ago, rate-limit resend
    recent_code = db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.created_at >= datetime.utcnow() - timedelta(seconds=60)
    ).first()
    if recent_code:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A reset code was requested recently. Please wait 60 seconds before requesting another code."
        )

    # Invalidate any existing unused reset codes for this user
    db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.is_used == False
    ).update({"is_used": True})

    # Generate a cryptographically secure 6-digit verification code
    code = f"{secrets.randbelow(900000) + 100000:06d}"
    code_hash = _hash_token(code)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)

    reset_record = PasswordResetCode(
        user_id=user.id,
        code_hash=code_hash,
        is_used=False,
        attempts=0,
        expires_at=expires_at
    )
    db.add(reset_record)
    db.commit()

    # Dispatch email
    sent_successfully = send_password_reset_email(user.email, user.full_name, code)
    if not sent_successfully:
        # If real SMTP sending failed, invalidate the created code so no phantom challenge is left active
        reset_record.is_used = True
        db.commit()
        logger.warning(f"Reset code for user {user.id} invalidated because email dispatch failed.")

    return generic_response


def verify_password_reset_code(email: str, code: str, db: Session) -> dict:
    norm_email = email.strip().lower()
    user = db.query(User).filter(User.email.ilike(norm_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or verification code."
        )

    # Find the active reset code
    reset_record = db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.is_used == False
    ).order_by(PasswordResetCode.id.desc()).first()

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active password reset request found. Please request a new code."
        )

    # Check expiration
    if reset_record.expires_at < datetime.utcnow():
        reset_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    # Check attempt limit (max 5 attempts per code)
    if reset_record.attempts >= 5:
        reset_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many incorrect attempts. This code has been invalidated. Please request a new code."
        )

    input_hash = _hash_token(code.strip())
    if reset_record.code_hash != input_hash:
        reset_record.attempts += 1
        db.commit()
        remaining = 5 - reset_record.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining."
        )

    # Code verified: generate a one-time reset token for Step 3
    reset_token = secrets.token_urlsafe(32)
    reset_record.reset_token_hash = _hash_token(reset_token)
    db.commit()

    return {
        "message": "Verification code accepted. Please set your new password.",
        "reset_token": reset_token
    }


def complete_password_reset(email: str, reset_token: str, new_password: str, db: Session) -> dict:
    norm_email = email.strip().lower()
    user = db.query(User).filter(User.email.ilike(norm_email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request. Please start the password reset process again."
        )

    token_hash = _hash_token(reset_token.strip())
    reset_record = db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.reset_token_hash == token_hash,
        PasswordResetCode.is_used == False
    ).first()

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token. Please request a new verification code."
        )

    if reset_record.expires_at < datetime.utcnow():
        reset_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset session has expired. Please request a new verification code."
        )

    # Invalidate token and update password
    reset_record.is_used = True
    user.password = hash_password(new_password)
    user.must_change_password = False

    db.commit()
    logger.info(f"Password reset successfully completed for user {user.email}")

    return {
        "message": "Your password has been reset successfully. You can now log in with your new password."
    }