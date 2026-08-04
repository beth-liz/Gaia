import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.database import engine
from app.database.base import Base
import app.models

def run_migration():
    print("Beginning Multi-Officer Assignment & Dispatch Migration...")

    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        cols_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'incident_assignments'")).fetchall()
        existing_cols = [r[0] for r in cols_res]

        new_cols = {
            "dispatched_by_id": "INTEGER REFERENCES users(id) ON DELETE SET NULL",
            "instructions": "TEXT",
            "mission_notes": "TEXT",
            "assignment_category": "VARCHAR(50) DEFAULT 'Field Patrol'",
            "emergency_level": "VARCHAR(30) DEFAULT 'Level 2'",
            "dispatched_at": "TIMESTAMP WITHOUT TIME ZONE"
        }

        for col, col_type in new_cols.items():
            if col not in existing_cols:
                print(f"Adding column '{col}' to incident_assignments table...")
                conn.execute(text(f"ALTER TABLE incident_assignments ADD COLUMN {col} {col_type}"))

    print("Multi-Officer Assignment Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
