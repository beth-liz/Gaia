import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database.database import engine
from app.database.base import Base
import app.models
from app.models.monitoring_station import MonitoringStation
from app.models.user import User

def run_migration():
    print("Beginning Phase 2 Operational Workflow Schema Migration...")

    # Create tables
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        # Check column on monitoring_stations table
        cols_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'monitoring_stations'")).fetchall()
        existing_cols = [r[0] for r in cols_res]

        if "head_officer_id" not in existing_cols:
            print("Adding 'head_officer_id' column to monitoring_stations table...")
            conn.execute(text("ALTER TABLE monitoring_stations ADD COLUMN head_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL"))

    # Sync Head RFOs for Stations
    db = Session(bind=engine)
    try:
        stations = db.query(MonitoringStation).all()
        for st in stations:
            # Find RFO in station
            rfo = db.query(User).filter(
                User.station_id == st.id,
                User.role.in_(["Range Forest Officer", "Officer"]),
                User.is_active == True
            ).first()

            if rfo:
                st.head_officer_id = rfo.id
                if st.status == "No Head Officer Assigned":
                    st.status = "Active"
                print(f"Station '{st.station_name}' linked Head Officer RFO: {rfo.full_name} ({rfo.email})")
            else:
                st.status = "No Head Officer Assigned"
                st.head_officer_id = None
                print(f"Station '{st.station_name}' has NO Head Officer. Set status to 'No Head Officer Assigned'.")

        db.commit()
        print("Phase 2 Station Head Officer Sync completed.")
    finally:
        db.close()

    print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
