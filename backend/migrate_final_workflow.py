import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.database import engine
from app.database.base import Base
import app.models

def run_migration():
    print("Beginning Final Workflow Migration (Verification & Closure)...")
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        cols_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents'")).fetchall()
        existing_cols = [r[0] for r in cols_res]

        new_cols = {
            "verification_notes": "TEXT",
            "verification_time": "TIMESTAMP WITHOUT TIME ZONE",
            "verified_by_id": "INTEGER REFERENCES users(id) ON DELETE SET NULL",
            "closed_at": "TIMESTAMP WITHOUT TIME ZONE",
            "closed_by_id": "INTEGER REFERENCES users(id) ON DELETE SET NULL",
            "final_closure_remarks": "TEXT"
        }

        for col, col_type in new_cols.items():
            if col not in existing_cols:
                print(f"Adding column '{col}' to incidents table...")
                conn.execute(text(f"ALTER TABLE incidents ADD COLUMN {col} {col_type}"))

    print("Final Workflow Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
