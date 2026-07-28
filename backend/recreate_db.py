from sqlalchemy import create_engine
from app.database.base import Base
from app.database.database import engine

# Import all models to ensure metadata registers them
import app.models

print("Dropping all existing tables...")
Base.metadata.drop_all(bind=engine)
print("Recreating all tables from SQLAlchemy models...")
Base.metadata.create_all(bind=engine)
print("Database schema synchronized successfully.")
