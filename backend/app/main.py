from fastapi import FastAPI
from sqlalchemy import text

from app.database.database import engine
from app.database.base import Base

# Import all models before create_all()
import app.models

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed database
from app.database.seed import run_seed
run_seed()

from app.routers import auth
from app.core.security import hash_password, verify_password

app = FastAPI(title="Gaia API")

# Routers
app.include_router(auth.router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Gaia API"
    }


@app.get("/test-db")
def test_database():

    try:

        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "Database Connected Successfully"
        }

    except Exception as e:

        return {
            "status": "Connection Failed",
            "error": str(e)
        }


@app.get("/test-password")
def test_password():

    password = "Gaia123"

    hashed = hash_password(password)

    verified = verify_password(password, hashed)

    return {
        "Original Password": password,
        "Hashed Password": hashed,
        "Password Verified": verified
    }