import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

from app.routers import (
    auth,
    designations,
    villages,
    users,
    incidents,
    notifications,
    dashboard,
    states,
    districts,
    monitoring_stations
)

app = FastAPI(title="Gaia Wildlife Operations API", version="2.0.0")

# CORS middleware for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for uploaded profile images & media
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include Routers
app.include_router(auth.router)
app.include_router(designations.router)
app.include_router(villages.router)
app.include_router(users.router)
app.include_router(incidents.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(states.router)
app.include_router(districts.router)
app.include_router(monitoring_stations.router)


@app.get("/")
def root():
    return {
        "app": "Gaia Wildlife Protection Platform API",
        "status": "Operational",
        "version": "2.0.0"
    }


@app.get("/test-db")
def test_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "Database Connected Successfully"}
    except Exception as e:
        return {"status": "Connection Failed", "error": str(e)}