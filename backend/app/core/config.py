import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    # Environment Mode
    ENVIRONMENT: str = "development"

    # Database connection parameters
    # In production (e.g. Render with Neon), DATABASE_URL is typically provided directly.
    DATABASE_URL: str | None = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "gaia"

    # CORS Allowed Origins (comma-separated string or list in production)
    CORS_ORIGINS: str = "*"

    # Default Admin Seed configuration
    # In production, set SEED_ADMIN=true and provide secure credentials if initial admin is desired.
    SEED_ADMIN: bool = True
    ADMIN_EMAIL: str = "admin@gaia.com"
    ADMIN_PASSWORD: str | None = None
    ADMIN_NAME: str = "Gaia System Administrator"
    ADMIN_PHONE: str = "9876543210"

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    GOOGLE_CLIENT_ID: str = "YOUR_GOOGLE_CLIENT_ID_HERE"

    # SMTP Configuration for Password Reset and Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@gaia.org"
    SMTP_FROM_NAME: str = "Gaia Wildlife Operations"
    SMTP_TLS: bool = True
    PASSWORD_RESET_EXPIRE_MINUTES: int = 10

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()