from sqlalchemy import create_engine, text
from app.core.config import settings

DATABASE_URL = (
    f"postgresql://{settings.POSTGRES_USER}:"
    f"{settings.POSTGRES_PASSWORD}@"
    f"{settings.POSTGRES_SERVER}:"
    f"{settings.POSTGRES_PORT}/"
    f"{settings.POSTGRES_DB}"
)

engine = create_engine(DATABASE_URL)

with engine.begin() as connection:
    print("Altering equipment_returns table...")
    connection.execute(text("ALTER TABLE equipment_returns ADD COLUMN IF NOT EXISTS return_destination VARCHAR(50) DEFAULT 'STATION';"))
    connection.execute(text("ALTER TABLE equipment_assignments ALTER COLUMN status TYPE VARCHAR(100);"))
    connection.execute(text("ALTER TABLE equipment_returns ALTER COLUMN status TYPE VARCHAR(100);"))
    print("Database migration completed successfully.")
