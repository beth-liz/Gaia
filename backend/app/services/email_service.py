import base64
import json
import logging
import os
from email.message import EmailMessage
from html import escape
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.config import settings

logger = logging.getLogger("gaia.email_service")

BASE_DIR = Path(__file__).resolve().parents[2]
CREDENTIALS_FILE = BASE_DIR / "gmail_oauth_credentials.json"
TOKEN_FILE = BASE_DIR / "token.json"
GMAIL_SEND_SCOPE = ["https://www.googleapis.com/auth/gmail.send"]


def _get_gmail_service():
    """Create an authorized Gmail API client locally or on Render."""
    creds = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(
            str(TOKEN_FILE),
            GMAIL_SEND_SCOPE,
        )
    else:
        token_json = os.getenv("GMAIL_TOKEN_JSON", "").strip()
        if token_json:
            token_info = json.loads(token_json)
            creds = Credentials.from_authorized_user_info(
                token_info,
                GMAIL_SEND_SCOPE,
            )

    if not creds:
        raise RuntimeError(
            "Gmail OAuth token is missing. Configure token.json "
            "locally or GMAIL_TOKEN_JSON in the deployment environment."
        )

    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            if TOKEN_FILE.exists():
                TOKEN_FILE.write_text(
                    creds.to_json(),
                    encoding="utf-8",
                )
        else:
            raise RuntimeError(
                "Gmail OAuth credentials are invalid or expired. "
                "Reauthorize Gmail before sending email."
            )

    return build(
        "gmail",
        "v1",
        credentials=creds,
        cache_discovery=False,
    )



def send_password_reset_email(
    to_email: str,
    recipient_name: str,
    code: str,
) -> bool:
    """Send a Gaia password-reset code using the Gmail API."""
    subject = "Gaia Security: Your Password Reset Verification Code"
    expire_minutes = settings.PASSWORD_RESET_EXPIRE_MINUTES

    # Escape user-provided values before inserting them into HTML.
    safe_name = escape(recipient_name or "User")
    safe_code = escape(code)

    html_content = f"""\
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: Arial, sans-serif; background-color: #050806;
      color: #F4F1EA; margin: 0; padding: 24px; }}
    .card {{ max-width: 540px; margin: 0 auto; background: #0c120e;
      border: 1px solid rgba(63, 191, 127, 0.3); border-radius: 16px;
      padding: 32px; }}
    .brand {{ color: #3FBF7F; font-size: 20px; font-weight: 800;
      letter-spacing: 0.1em; margin-bottom: 24px; }}
    .greeting {{ font-size: 18px; font-weight: 600; color: #ffffff;
      margin-bottom: 12px; }}
    .text {{ font-size: 14px; line-height: 1.6; color: #c4cdc8;
      margin-bottom: 24px; }}
    .code-container {{ background: #131c16; border: 2px dashed #3FBF7F;
      border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0; }}
    .code {{ font-size: 32px; font-weight: 900; letter-spacing: 0.25em;
      color: #3FBF7F; font-family: 'Courier New', monospace; }}
    .footer {{ font-size: 12px; color: #728178; margin-top: 32px;
      border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Gaia Wildlife Surveillance</div>
    <div class="greeting">Hello {safe_name},</div>
    <div class="text">
      A password reset request was initiated for your Gaia account.
      Use the verification code below to authorize setting a new password.
    </div>
    <div class="code-container"><div class="code">{safe_code}</div></div>
    <div class="text">
      This verification code will expire in
      <strong>{expire_minutes} minutes</strong>.
      If you did not request this password reset, please ignore this email
      or contact your Station Administrator.
    </div>
    <div class="footer">
      &copy; 2026 Gaia Wildlife Protection Platform.
      This is an automated security transmission.
    </div>
  </div>
</body>
</html>
"""

    plain_content = (
        f"Hello {recipient_name or 'User'},\n\n"
        f"Your Gaia password reset verification code is: {code}\n\n"
        f"This code will expire in {expire_minutes} minutes.\n"
        "If you did not request this, please ignore this email.\n"
    )

    sender_email = (
        getattr(settings, "GMAIL_API_SENDER_EMAIL", "")
        or settings.SMTP_FROM_EMAIL
        or settings.SMTP_USER
    )

    if not sender_email:
        logger.error("Gmail API sending failed: sender email is not configured.")
        return False

    try:
        message = EmailMessage()
        message["To"] = to_email
        message["From"] = sender_email
        message["Subject"] = subject
        message.set_content(plain_content)
        message.add_alternative(html_content, subtype="html")

        encoded_message = base64.urlsafe_b64encode(
            message.as_bytes()
        ).decode("utf-8")

        service = _get_gmail_service()
        service.users().messages().send(
            userId="me",
            body={"raw": encoded_message},
        ).execute()

        logger.info(
            "Password-reset email accepted by Gmail API for recipient %s",
            to_email,
        )
        return True

    except HttpError as exc:
        logger.error(
            "Gmail API rejected the password-reset email for %s (HTTP %s).",
            to_email,
            getattr(exc.resp, "status", "unknown"),
        )
        return False

    except Exception as exc:
        # Do not log the reset code, token contents, or exception details.
        logger.error(
            "Gmail API password-reset delivery failed for %s (%s).",
            to_email,
            type(exc).__name__,
        )
        return False
