import logging
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.security import verify_token
from app.database.deps import get_db
from app.models.user import User

logger = logging.getLogger("gaia.auth")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    payload = verify_token(token)
    if not payload:
        logger.warning("JWT verify_token returned None for request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.info(f"[AUTH LOG] Decoded JWT Token Payload: {payload}")
    
    email: str = payload.get("sub") or payload.get("email")
    if not email:
        logger.warning("No email/sub found in JWT token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        logger.warning(f"User email {email} from JWT payload not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        logger.warning(f"User {email} account is inactive")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )
        
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role
        
        is_allowed = False
        for allowed in self.allowed_roles:
            if allowed == user_role:
                is_allowed = True
                break
            # Normalize officer roles so Range Forest Officer, Forest Guard, and Officer pass officer checks
            if allowed in ["Range Forest Officer", "Forest Guard", "Officer"]:
                if user_role in ["Range Forest Officer", "Forest Guard", "Officer", "Admin"]:
                    is_allowed = True
                    break

        if not is_allowed:
            logger.warning(f"Role permission denied for user {current_user.email}. User role: '{user_role}', Allowed: {self.allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(self.allowed_roles)}"
            )
        return current_user


# Reusable role-based dependencies
get_current_admin = RoleChecker(["Admin"])
get_current_rfo = RoleChecker(["Range Forest Officer", "Officer", "Admin"])
get_current_guard = RoleChecker(["Forest Guard", "Range Forest Officer", "Officer", "Admin"])
get_current_villager = RoleChecker(["Villager"])
get_current_officer_or_admin = RoleChecker(["Admin", "Range Forest Officer", "Forest Guard", "Officer"])
