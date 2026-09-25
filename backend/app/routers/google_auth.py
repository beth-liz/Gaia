from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
import logging

from app.core.config import settings
from app.database.deps import get_db
from app.models.user import User
from app.services.auth_service import format_user_payload
from app.core.security import create_access_token

logger = logging.getLogger("gaia.google_auth")

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

class GoogleAuthRequest(BaseModel):
    credential: str

@router.post(
    "/google",
    status_code=status.HTTP_200_OK,
    summary="Authenticate via Google Identity Services"
)
def google_auth(
    data: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    try:
        # Verify the Google ID token
        id_info = id_token.verify_oauth2_token(
            data.credential,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = id_info.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token does not contain an email address."
            )

        # Lookup user by email in PostgreSQL
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # User does not exist, return a custom status/payload indicating registration is required
            # and pre-fill details from Google.
            return {
                "needs_registration": True,
                "prefill": {
                    "full_name": id_info.get("name", ""),
                    "email": email,
                    "avatar_url": id_info.get("picture", "")
                }
            }

        # User exists, check if active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account has been deactivated. Please contact Gaia System Administrator."
            )

        # Generate Gaia JWT token (reusing same token generation logic as normal login)
        token_payload = {
            "sub": user.email,
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "station_id": user.station_id,
            "designation_id": user.designation_id
        }

        access_token = create_access_token(data=token_payload)
        logger.info(f"[AUTH LOG] Generated JWT Payload for {user.email} via Google Sign-In: {token_payload}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": format_user_payload(user)
        }

    except ValueError as e:
        # Invalid token
        logger.warning(f"Google token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credentials."
        )
    except Exception as e:
        logger.error(f"Error during Google authentication: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during Google authentication."
        )
