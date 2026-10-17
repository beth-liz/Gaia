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
    gis,
    auth,
    google_auth,
    designations,
    villages,
    users,
    incidents,
    notifications,
    dashboard,
    states,
    districts,
    monitoring_stations,
    animal_species,
    officers,
    field_ops,
    inventory,
    cameras
)

# Import settings
from app.core.config import settings

app = FastAPI(title="Gaia Wildlife Operations API", version="2.0.0")

# CORS middleware: strict configuration for production vs. permissive local development
is_prod = settings.ENVIRONMENT.lower() in ("production", "prod")
raw_cors = (settings.CORS_ORIGINS or "").strip()

if is_prod:
    # In production, require explicit frontend origins and do not permit wildcard or fallback
    if not raw_cors or raw_cors == "*":
        raise ValueError(
            "Production configuration error: CORS_ORIGINS must be set to the explicit frontend origin(s) "
            "(e.g., 'https://gaia.vercel.app') in production. Wildcard '*' or empty CORS_ORIGINS is prohibited."
        )
    origins = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]
    if not origins:
        raise ValueError("Production configuration error: No valid origins found in CORS_ORIGINS.")
else:
    # In development, support wildcard or explicit list, and include standard localhost dev servers
    if raw_cors == "*" or not raw_cors:
        origins = ["*"]
    else:
        origins = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

    dev_defaults = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    for dev_origin in dev_defaults:
        if dev_origin not in origins and "*" not in origins:
            origins.append(dev_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(google_auth.router)
app.include_router(designations.router)
app.include_router(villages.router)
app.include_router(users.router)
app.include_router(officers.router)
app.include_router(field_ops.router)
app.include_router(animal_species.router)
app.include_router(incidents.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(states.router)
app.include_router(districts.router)
app.include_router(monitoring_stations.router)
app.include_router(inventory.router)
app.include_router(gis.router)
app.include_router(cameras.router)

from app.routers import camera_detections
app.include_router(camera_detections.router)

from app.routers import ai
app.include_router(ai.router)


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
