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
    print("Altering user table to add columns...")
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS village_id INTEGER REFERENCES villages(id) ON DELETE SET NULL;"))
    connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;"))
    print("Database altered successfully.")
