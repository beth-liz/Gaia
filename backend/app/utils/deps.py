"""
Gaia Authentication and Authorization Dependencies
--------------------------------------------------
This file defines FastAPI dependencies used to secure endpoints.
It uses OAuth2PasswordBearer to extract the Bearer token from the request headers,
decodes and validates the JWT, retrieves the current user from the database,
and performs role-based authorization checks.

How JWT Works in Gaia:
1. When a user logs in, the server generates a JSON Web Token (JWT) containing non-sensitive claims (like user email/ID and expiration).
2. The client receives this token and stores it.
3. For subsequent requests to protected endpoints, the client sends this token in the "Authorization" header as a "Bearer" token.
4. The server decodes the token using the secret key and verifies its signature and expiration.
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.security import verify_token
from app.database.deps import get_db
from app.models.user import User

# OAuth2PasswordBearer is a FastAPI class that looks for the Authorization header
# in the request. If the header is missing or doesn't start with "Bearer ",
# it automatically returns a 401 Unauthorized error.
# tokenUrl specifies the login endpoint where Swagger UI can fetch the token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Dependency that retrieves the current authenticated user from the JWT.
    
    Why it exists:
    Any endpoint that needs access to the logged-in user can add `current_user: User = Depends(get_current_user)`.
    
    Flow:
    1. Extract JWT token via oauth2_scheme.
    2. Decode token to extract the payload.
    3. Look up the user in the database using the email/subject stored in the payload.
    4. Enforce security constraints (e.g. user must be active, must change password if forced).
    """
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email: str = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Retrieve user from the database
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )
        
    # Force password change on first login for Officers or any user with must_change_password flag.
    # We bypass this check ONLY if they are requesting the change-password endpoint.
    if user.must_change_password and not request.url.path.endswith("/auth/change-password"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Password change required. You must change your temporary password before performing this action."
        )
        
    return user


class RoleChecker:
    """
    A class-based dependency for role-based access control (RBAC).
    
    How it works:
    Initialize it with allowed roles, e.g., `RoleChecker(["Admin", "Officer"])`.
    It can then be used as a FastAPI dependency: `Depends(RoleChecker(["Admin"]))`.
    """
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        """
        Invoked by FastAPI when checking permissions.
        """
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(self.allowed_roles)}"
            )
        return current_user


# Reusable role-based dependencies
get_current_admin = RoleChecker(["Admin"])
get_current_officer = RoleChecker(["Officer"])
get_current_villager = RoleChecker(["Villager"])
get_current_officer_or_admin = RoleChecker(["Admin", "Officer"])
