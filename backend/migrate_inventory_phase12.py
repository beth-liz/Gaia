from sqlalchemy import text
from app.database.database import engine
from app.database.base import Base
import app.models

def migrate():
    print("Creating any missing database tables for Phase 12...")
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        print("Ensuring columns exist on inventory_master...")
        conn.execute(text("""
            ALTER TABLE inventory_master
            ADD COLUMN IF NOT EXISTS item_usage_type VARCHAR(20) DEFAULT 'RETURNABLE';
        """))

        print("Ensuring columns exist on equipment_assignments...")
        conn.execute(text("""
            ALTER TABLE equipment_assignments
            ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'MISSION',
            ADD COLUMN IF NOT EXISTS item_usage_type VARCHAR(20) DEFAULT 'RETURNABLE';
        """))

        print("Ensuring columns exist on damaged_equipment...")
        conn.execute(text("""
            ALTER TABLE damaged_equipment
            ADD COLUMN IF NOT EXISTS damage_severity VARCHAR(30) DEFAULT 'Minor';
        """))

        conn.commit()
        print("Migration for Phase 12 complete!")

if __name__ == "__main__":
    migrate()
