import sys
import os

# Ensure backend path is in python sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.database.database import engine
from app.database.session import SessionLocal
from app.database.base import Base

# Import models so Base metadata is populated
import app.models

def run_migration():
    print("Beginning Phase 3 Migration...")
    
    # 1. Create all missing tables via SQLAlchemy metadata
    Base.metadata.create_all(bind=engine)
    print("Tables created via metadata.")

    with engine.begin() as conn:
        # 2. Seed State: Kerala
        state_res = conn.execute(text("SELECT id FROM states WHERE state_name = 'Kerala'")).fetchone()
        if not state_res:
            conn.execute(text("INSERT INTO states (state_name, created_at, updated_at) VALUES ('Kerala', NOW(), NOW())"))
            kerala_id = conn.execute(text("SELECT id FROM states WHERE state_name = 'Kerala'")).fetchone()[0]
            print(f"Seeded State: Kerala (ID: {kerala_id})")
        else:
            kerala_id = state_res[0]
            print(f"State Kerala exists (ID: {kerala_id})")

        # 3. Seed District: Wayanad
        dist_res = conn.execute(text("SELECT id FROM districts WHERE district_name = 'Wayanad'")).fetchone()
        if not dist_res:
            conn.execute(text("INSERT INTO districts (district_name, state_id, created_at, updated_at) VALUES ('Wayanad', :state_id, NOW(), NOW())"), {"state_id": kerala_id})
            wayanad_id = conn.execute(text("SELECT id FROM districts WHERE district_name = 'Wayanad'")).fetchone()[0]
            print(f"Seeded District: Wayanad (ID: {wayanad_id})")
        else:
            wayanad_id = dist_res[0]
            print(f"District Wayanad exists (ID: {wayanad_id})")

        # 4. Alter villages table if district_id doesn't exist
        columns_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'villages'")).fetchall()
        col_names = [r[0] for r in columns_res]
        
        if "district_id" not in col_names:
            print("Adding district_id column to villages table...")
            conn.execute(text("ALTER TABLE villages ADD COLUMN district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL"))
        
        # Link all existing villages to Wayanad
        conn.execute(text("UPDATE villages SET district_id = :d_id WHERE district_id IS NULL"), {"d_id": wayanad_id})
        print("Updated villages to belong to Wayanad.")

        # If old text columns exist in villages, we can drop or keep them safely
        if "district" in col_names:
            print("Dropping legacy plain text district column from villages...")
            conn.execute(text("ALTER TABLE villages DROP COLUMN IF EXISTS district"))
        if "state" in col_names:
            print("Dropping legacy plain text state column from villages...")
            conn.execute(text("ALTER TABLE villages DROP COLUMN IF EXISTS state"))

        # 5. Check monitoring_stations table columns
        ms_cols_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'monitoring_stations'")).fetchall()
        ms_col_names = [r[0] for r in ms_cols_res]

        if "district_id" not in ms_col_names:
            conn.execute(text("ALTER TABLE monitoring_stations ADD COLUMN district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE"))
        if "address" not in ms_col_names:
            conn.execute(text("ALTER TABLE monitoring_stations ADD COLUMN address VARCHAR(255)"))
        if "phone" not in ms_col_names:
            conn.execute(text("ALTER TABLE monitoring_stations ADD COLUMN phone VARCHAR(30)"))
        if "email" not in ms_col_names:
            conn.execute(text("ALTER TABLE monitoring_stations ADD COLUMN email VARCHAR(100)"))
        if "description" not in ms_col_names:
            conn.execute(text("ALTER TABLE monitoring_stations ADD COLUMN description TEXT"))
        if "created_at" not in ms_col_names:
            conn.execute(text("ALTER TABLE monitoring_stations ADD COLUMN created_at TIMESTAMP DEFAULT NOW()"))
        if "updated_at" not in ms_col_names:
            conn.execute(text("ALTER TABLE monitoring_stations ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()"))

        # 6. Seed Monitoring Stations
        stations = [
            {"name": "Muthanga Range Office", "phone": "04936-270001", "email": "muthanga@forest.kerala.gov.in", "lat": 11.6667, "lng": 76.3667, "desc": "Headquarters for Muthanga Range Operations"},
            {"name": "Sulthan Bathery Range Office", "phone": "04936-220234", "email": "bathery@forest.kerala.gov.in", "lat": 11.6624, "lng": 76.2570, "desc": "Central Wild Wildlife Division Bathery"},
            {"name": "Mananthavady Range Office", "phone": "04935-240245", "email": "mananthavady@forest.kerala.gov.in", "lat": 11.8028, "lng": 76.0035, "desc": "North Wayanad Forest Division"},
            {"name": "Tholpetty Range Office", "phone": "04935-250800", "email": "tholpetty@forest.kerala.gov.in", "lat": 11.9500, "lng": 75.9833, "desc": "Tholpetty Wildlife Range Base Station"},
            {"name": "Begur Range Office", "phone": "04935-241220", "email": "begur@forest.kerala.gov.in", "lat": 11.8700, "lng": 76.0800, "desc": "Begur Forest Range Monitoring Unit"},
            {"name": "Kurichiat Range Office", "phone": "04936-271150", "email": "kurichiat@forest.kerala.gov.in", "lat": 11.7200, "lng": 76.2800, "desc": "Kurichiat Wildlife Range Station"}
        ]

        muthanga_id = None
        for st in stations:
            existing_st = conn.execute(text("SELECT id FROM monitoring_stations WHERE station_name = :name"), {"name": st["name"]}).fetchone()
            if not existing_st:
                conn.execute(
                    text("""
                        INSERT INTO monitoring_stations (station_name, district_id, address, phone, email, latitude, longitude, status, description, created_at, updated_at)
                        VALUES (:name, :d_id, :addr, :phone, :email, :lat, :lng, 'Active', :desc, NOW(), NOW())
                    """),
                    {
                        "name": st["name"],
                        "d_id": wayanad_id,
                        "addr": f"Wayanad Forest Division, {st['name']}",
                        "phone": st["phone"],
                        "email": st["email"],
                        "lat": st["lat"],
                        "lng": st["lng"],
                        "desc": st["desc"]
                    }
                )
                st_id = conn.execute(text("SELECT id FROM monitoring_stations WHERE station_name = :name"), {"name": st["name"]}).fetchone()[0]
                print(f"Seeded Station: {st['name']} (ID: {st_id})")
            else:
                st_id = existing_st[0]
                print(f"Station {st['name']} exists (ID: {st_id})")

            if st["name"] == "Muthanga Range Office":
                muthanga_id = st_id

        # 7. Modify users table to add station_id foreign key
        user_cols_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")).fetchall()
        user_col_names = [r[0] for r in user_cols_res]

        if "station_id" not in user_col_names:
            print("Adding station_id column to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN station_id INTEGER REFERENCES monitoring_stations(id) ON DELETE SET NULL"))

        # Link all officers with null station_id to Muthanga Range Office
        if muthanga_id:
            conn.execute(
                text("UPDATE users SET station_id = :st_id WHERE role IN ('Range Forest Officer', 'Forest Guard') AND station_id IS NULL"),
                {"st_id": muthanga_id}
            )
            print("Updated existing officers to default to Muthanga Range Office.")

    print("Phase 3 Migration finished successfully!")

if __name__ == "__main__":
    run_migration()
