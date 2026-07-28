"""
Gaia Authentication Service
---------------------------
This service handles all core business logic for user authentication, registration,
login validation, password hashing, and password management.

Key Authentication Flow:
1. Registration: Checks for email duplication. Ensures public signups are limited to the Villager role (pending admin verification). Allows Admin users to create Officers/Admins with temporary passwords.
2. Login: Verifies the user exists, matches credentials, is active, and verifies Villagers are approved. Returns a JWT.
3. Password Change: Allows users to change their password, updating the database and resetting forced change flags.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import hash_password, verify_password, create_access_token


def register_user(user: UserCreate, db: Session, current_admin: Optional[User] = None) -> User:
    """
    Registers a new user in the system based on roles and registration rules.
    
    Rules:
    - If register is called publicly (no current_admin), the role is forced to 'Villager' and is_verified=False (Pending).
    - If register is called by an Admin, any role (Admin/Officer/Villager) can be created.
    - If an Officer is created by an Admin, the temporary password triggers the must_change_password flag.
    - Checks for duplicate emails.
    """
    # 1. Check if email is already taken
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 2. Determine role, verification status, and password change flag
    if current_admin and current_admin.role == "Admin":
        # Admin is registering the user. Admin can specify any role.
        role = user.role
        is_verified = True  # Admin created users are pre-verified
        # If Admin creates an Officer, force password change on first login.
        must_change_password = True if role == "Officer" else False
    else:
        # Public self-registration (Villager self-register only)
        role = "Villager"
        is_verified = False  # Pending administrator approval
        must_change_password = False

    # 3. Hash the password before storing it
    hashed_password = hash_password(user.password)

    # 4. Instantiate the User database model
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
    return new_user


def authenticate_user(login_data: UserLogin, db: Session) -> dict:
    """
    Validates user credentials and generates a JWT access token.
    
    Rules:
    - Verifies email exists.
    - Verifies password hashes match.
    - Blocks login if the account is deactivated (is_active = False).
    - Blocks login if the user is a Villager and is not approved yet (is_verified = False).
    """
    # 1. Fetch user from database
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 2. Verify hashed password
    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 3. Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your account has been deactivated. Please contact support."
        )

    # 4. Prevent login if Villager is not approved (is_verified is False)
    if user.role == "Villager" and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your registration request is pending administrator approval."
        )

    # 5. Generate Access Token containing email claim
    access_token = create_access_token(data={"sub": user.email, "role": user.role})

    # Return token details and user profile info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


def change_user_password(
    current_user: User,
    old_password: str,
    new_password: str,
    db: Session
) -> User:
    """
    Changes a user's password after verifying their current password.
    Resets the must_change_password flag to False.
    """
    # 1. Verify old password matches
    if not verify_password(old_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid current password."
        )

    # 2. Hash and update new password
    current_user.password = hash_password(new_password)
    # Reset forced change flag
    current_user.must_change_password = False

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user