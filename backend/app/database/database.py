from sqlalchemy import create_engine

from app.core.config import settings

if settings.DATABASE_URL:
    db_url = settings.DATABASE_URL
    # SQLAlchemy requires postgresql:// instead of postgres:// (common in Render / Heroku / Neon connection strings)
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    DATABASE_URL = db_url
else:
    DATABASE_URL = (
        f"postgresql://{settings.POSTGRES_USER}:"
        f"{settings.POSTGRES_PASSWORD}@"
        f"{settings.POSTGRES_SERVER}:"
        f"{settings.POSTGRES_PORT}/"
        f"{settings.POSTGRES_DB}"
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)