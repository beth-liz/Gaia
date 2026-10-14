import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("gaia.email_service")

def send_password_reset_email(to_email: str, recipient_name: str, code: str) -> bool:
    """
    Sends a 6-digit password reset code to the user's email via SMTP.
    If SMTP_USER or SMTP_PASSWORD is not configured, logs the code securely in development mode.
    """
    subject = "Gaia Security: Your Password Reset Verification Code"
    expire_minutes = settings.PASSWORD_RESET_EXPIRE_MINUTES

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050806; color: #F4F1EA; margin: 0; padding: 24px; }}
        .card {{ max-width: 540px; margin: 0 auto; background: #0c120e; border: 1px solid rgba(63, 191, 127, 0.3); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .brand {{ color: #3FBF7F; font-size: 20px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 24px; }}
        .greeting {{ font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 12px; }}
        .text {{ font-size: 14px; line-height: 1.6; color: #c4cdc8; margin-bottom: 24px; }}
        .code-container {{ background: #131c16; border: 2px dashed #3FBF7F; border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0; }}
        .code {{ font-size: 32px; font-weight: 900; letter-spacing: 0.25em; color: #3FBF7F; font-family: 'Courier New', monospace; }}
        .footer {{ font-size: 12px; color: #728178; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">Gaia Wildlife Surveillance</div>
        <div class="greeting">Hello {recipient_name},</div>
        <div class="text">
          A password reset request was initiated for your Gaia account. Use the verification code below to authorize setting a new password.
        </div>
        <div class="code-container">
          <div class="code">{code}</div>
        </div>
        <div class="text">
          This verification code will expire in <strong>{expire_minutes} minutes</strong>. If you did not request this password reset, please ignore this email or contact your Station Administrator immediately.
        </div>
        <div class="footer">
          &copy; 2026 Gaia Wildlife Protection Platform. This is an automated security transmission.
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = (
        f"Hello {recipient_name},\n\n"
        f"Your Gaia password reset verification code is: {code}\n\n"
        f"This code will expire in {expire_minutes} minutes.\n"
        f"If you did not request this, please ignore this email.\n"
    )

    # Check if real SMTP credentials are provided (and not dummy placeholder)
    is_placeholder_pwd = settings.SMTP_PASSWORD in ("", "REPLACE_WITH_THE_CONFIGURED_GMAIL_APP_PASSWORD", "YOUR_APP_PASSWORD")
    if not settings.SMTP_USER or is_placeholder_pwd:
        logger.warning(
            f"[EMAIL SERVICE - DEV SIMULATION] Real SMTP credentials not configured (SMTP_USER='{settings.SMTP_USER}', "
            f"SMTP_PASSWORD is placeholder/empty). Real email was NOT delivered to network."
        )
        print(f"\n=======================================================")
        print(f"[GAIA EMAIL DISPATCH - DEV SIMULATION ONLY]")
        print(f"Status: Real SMTP not configured (waiting for valid Gmail App Password in backend/.env).")
        print(f"Recipient: {to_email} ({recipient_name})")
        print(f"Verification Code: {code}")
        print(f"Expires In: {expire_minutes} minutes")
        print(f"=======================================================\n")
        # In development simulation, return True so local testing can proceed
        return True

    # Send via real SMTP server
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL or settings.SMTP_USER}>"
        msg["To"] = to_email

        msg.attach(MIMEText(plain_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        logger.info(f"Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT} for recipient {to_email}...")
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12)
            if settings.SMTP_TLS:
                server.starttls()

        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL or settings.SMTP_USER, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Real password reset email successfully delivered via SMTP to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(
            f"[SMTP AUTHENTICATION FAILED] Could not authenticate user '{settings.SMTP_USER}' with SMTP server. "
            f"Details: {auth_err.smtp_code} {auth_err.smtp_error.decode('utf-8', errors='ignore') if isinstance(auth_err.smtp_error, bytes) else auth_err.smtp_error}"
        )
        print(f"[SMTP AUTH ERROR] Failed to authenticate with Gmail SMTP. Check App Password. Code: {auth_err.smtp_code}")
        return False
    except smtplib.SMTPConnectError as conn_err:
        logger.error(f"[SMTP CONNECTION FAILED] Could not connect to {settings.SMTP_HOST}:{settings.SMTP_PORT}: {conn_err}")
        print(f"[SMTP CONNECTION ERROR] Could not connect to {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        return False
    except Exception as e:
        logger.error(f"Failed to dispatch password reset email to {to_email}: {type(e).__name__} - {e}")
        print(f"[EMAIL ERROR] Failed to dispatch via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT}): {type(e).__name__} - {e}")
        return False
