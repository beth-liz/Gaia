import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database.database import engine
from app.database.base import Base
import app.models
from app.models.animal_species import AnimalSpecies

def run_migration():
    print("Beginning Animal Species & Incident Schema Migration...")

    # Create static upload directories
    species_uploads = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "static", "uploads", "species")
    incidents_uploads = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "static", "uploads", "incidents")
    os.makedirs(species_uploads, exist_ok=True)
    os.makedirs(incidents_uploads, exist_ok=True)
    print("Verified static upload directories for species and incidents.")

    # Create tables
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        # Check columns on incidents table
        cols_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents'")).fetchall()
        existing_cols = [r[0] for r in cols_res]

        new_cols = [
            ("reference_id", "VARCHAR(50)"),
            ("incident_title", "VARCHAR(150)"),
            ("incident_category", "VARCHAR(50)"),
            ("animal_species_id", "INTEGER REFERENCES animal_species(id) ON DELETE SET NULL"),
            ("animal_type", "VARCHAR(100)"),
            ("latitude", "DOUBLE PRECISION"),
            ("longitude", "DOUBLE PRECISION"),
            ("address", "TEXT"),
            ("station_id", "INTEGER REFERENCES monitoring_stations(id) ON DELETE SET NULL"),
            ("district_id", "INTEGER REFERENCES districts(id) ON DELETE SET NULL"),
            ("state_id", "INTEGER REFERENCES states(id) ON DELETE SET NULL"),
            ("weather", "VARCHAR(50)"),
            ("people_injured", "BOOLEAN DEFAULT FALSE"),
            ("livestock_damage", "BOOLEAN DEFAULT FALSE"),
            ("property_damage", "BOOLEAN DEFAULT FALSE"),
            ("crop_damage", "BOOLEAN DEFAULT FALSE"),
            ("incident_status", "VARCHAR(50) DEFAULT 'Pending Review'"),
            ("reported_by", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
            ("reporter_role", "VARCHAR(50)"),
            ("images", "TEXT"),
        ]

        for col_name, col_type in new_cols:
            if col_name not in existing_cols:
                print(f"Adding column '{col_name}' to incidents table...")
                conn.execute(text(f"ALTER TABLE incidents ADD COLUMN {col_name} {col_type}"))

    # Seed Default Animal Species
    db = Session(bind=engine)
    try:
        species_seeds = [
            {
                "animal_name": "Elephant",
                "scientific_name": "Elephas maximus indicus",
                "category": "Mammal",
                "danger_level": "High",
                "conservation_status": "Endangered",
                "description": "Asian elephants are large terrestrial mammals requiring conflict avoidance corridors."
            },
            {
                "animal_name": "Tiger",
                "scientific_name": "Panthera tigris tigris",
                "category": "Mammal",
                "danger_level": "Critical",
                "conservation_status": "Endangered",
                "description": "Bengal tigers are apex predators protected in Wayanad tiger reserves."
            },
            {
                "animal_name": "Wild Boar",
                "scientific_name": "Sus scrofa cristatus",
                "category": "Mammal",
                "danger_level": "Medium",
                "conservation_status": "Least Concern",
                "description": "Wild boars frequently enter agricultural lands causing crop damage."
            },
            {
                "animal_name": "Monkey",
                "scientific_name": "Macaca radiata",
                "category": "Mammal",
                "danger_level": "Low",
                "conservation_status": "Least Concern",
                "description": "Bonnet macaques found in fringe forest villages and roadside human settlements."
            }
        ]

        for spec in species_seeds:
            existing = db.query(AnimalSpecies).filter(AnimalSpecies.animal_name == spec["animal_name"]).first()
            if not existing:
                print(f"Seeding Animal Species: {spec['animal_name']}")
                db.add(AnimalSpecies(**spec))
        
        db.commit()
        print("Default Animal Species seeded successfully.")

    finally:
        db.close()

    print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
