import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.database import engine
from app.database.base import Base
import app.models

def run_migration_phase9():
    print("Beginning Phase 9 Migration...")

    # Ensure uploads directory exists
    static_uploads = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "static", "uploads", "profile")
    os.makedirs(static_uploads, exist_ok=True)
    print(f"Verified static uploads directory: {static_uploads}")

    with engine.begin() as conn:
        cols_res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")).fetchall()
        col_names = [r[0] for r in cols_res]

        if "profile_image" not in col_names:
            print("Adding profile_image column to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255)"))
            print("Added profile_image column.")
        else:
            print("profile_image column already exists.")

    print("Phase 9 Migration completed successfully!")

if __name__ == "__main__":
    run_migration_phase9()
