import os
from sqlalchemy import create_engine, inspect
from app.core.config import settings

DATABASE_URL = (
    f"postgresql://{settings.POSTGRES_USER}:"
    f"{settings.POSTGRES_PASSWORD}@"
    f"{settings.POSTGRES_SERVER}:"
    f"{settings.POSTGRES_PORT}/"
    f"{settings.POSTGRES_DB}"
)

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

print("Tables in DB:", inspector.get_table_names())
if "users" in inspector.get_table_names():
    print("Columns in users:")
    for col in inspector.get_columns("users"):
        print(f"  {col['name']}: {col['type']}")
else:
    print("users table does not exist yet!")
