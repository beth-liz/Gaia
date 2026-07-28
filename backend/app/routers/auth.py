"""
Gaia Authentication Router
--------------------------
This router defines HTTP endpoints for user registration, authentication (login),
profile retrieval, and password updates. It acts as the controller layer,
delegating business logic to the auth service and enforcing authorization rules.
"""

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
from app.utils.deps import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_optional_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Optional dependency to detect if the request is initiated by an authenticated Admin.
    
    Why it exists:
    This allows the public `/register` endpoint to be accessed anonymously (resulting in a default pending Villager account)
    or by an Admin (who is allowed to specify roles like Officer/Admin and auto-approves them).
    """
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
    """
    Register a user account.
    
    Registration Rules:
    - **Self-registration (Public):** Allowed only for Villagers. The role is automatically forced to "Villager", and verification status is set to "Pending" (is_verified = False).
    - **Admin registration:** If authorized as an Admin, users with other roles (Officer, Admin) can be created. Officers are initialized with a forced password change on first login.
    """
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
    """
    Authenticate user credentials.
    
    Login Rules:
    - Verifies username (email) and password.
    - If the user is a Villager, prevents login if their account is not approved yet (is_verified is False).
    - Returns a JWT access token and user profile details upon successful authentication.
    """
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
    """
    Get profile information of the current logged-in user.
    
    How it works:
    - Enforces Bearer Token authentication via the `Depends(get_current_user)` dependency.
    - Decodes the token, verifies the user exists and is active, and returns the user object.
    """
    return current_user


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
    """
    Update the password for the current authenticated user.
    
    Flow:
    - Authenticates the current user.
    - Validates the old password.
    - Hashes and saves the new password.
    - Resets the `must_change_password` flag to False.
    """
    return auth_service.change_user_password(
        current_user=current_user,
        old_password=data.old_password,
        new_password=data.new_password,
        db=db
    )