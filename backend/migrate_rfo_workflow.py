import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.database import engine
from app.database.base import Base
import app.models

def run_migration():
    print("Beginning RFO & Guard Workflow Migration...")

    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        cols_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'incident_assignments'")).fetchall()
        existing_cols = [r[0] for r in cols_res]

        new_cols = {
            "priority": "VARCHAR(30) DEFAULT 'High'",
            "estimated_response_time": "VARCHAR(50)",
            "assignment_remarks": "TEXT",
            "actions_taken": "TEXT",
            "damage_assessment": "TEXT",
            "recommendations": "TEXT",
            "field_photos": "TEXT",
            "completed_at": "TIMESTAMP WITHOUT TIME ZONE"
        }

        for col, col_type in new_cols.items():
            if col not in existing_cols:
                print(f"Adding column '{col}' to incident_assignments table...")
                conn.execute(text(f"ALTER TABLE incident_assignments ADD COLUMN {col} {col_type}"))

    print("RFO & Guard Workflow Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
