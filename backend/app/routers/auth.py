from fastapi import APIRouter, Depends, status, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError

from app.core.config import settings
from app.database.deps import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    TokenResponse,
    UserChangePassword
)
from app.services import auth_service
from app.services.auth_service import format_user_payload
from app.utils.deps import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_optional_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email = payload.get("sub")
        if email:
            user = db.query(User).filter(User.email == email).first()
            if user and user.role == "Admin" and user.is_active:
                return user
    except JWTError:
        return None
    return None


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user"
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_admin: Optional[User] = Depends(get_optional_admin)
):
    return auth_service.register_user(user, db, current_admin=current_admin)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login"
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    return auth_service.authenticate_user(login_data, db)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user details"
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return format_user_payload(current_user)


@router.post(
    "/change-password",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Change user password"
)
def change_password(
    data: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return auth_service.change_user_password(
        current_user=current_user,
        old_password=data.old_password,
        new_password=data.new_password,
        db=db
    )