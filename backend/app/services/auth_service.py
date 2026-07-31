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
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
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
    user = db.query(User).filter(User.email == login_data.email).first()
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