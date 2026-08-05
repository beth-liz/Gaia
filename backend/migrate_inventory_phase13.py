from sqlalchemy import text
from app.database.database import engine
from app.database.base import Base
import app.models

def migrate():
    print("Creating any missing database tables for Phase 13...")
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        print("Ensuring expiry columns exist on inventory_master & station_inventory...")
        conn.execute(text("""
            ALTER TABLE inventory_master
            ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS manufacture_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50);

            ALTER TABLE station_inventory
            ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS manufacture_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50);
        """))

        print("Ensuring repair_cost column exists on damaged_equipment...")
        conn.execute(text("""
            ALTER TABLE damaged_equipment
            ADD COLUMN IF NOT EXISTS repair_cost INTEGER DEFAULT 0;
        """))

        conn.commit()
        print("Migration for Phase 13 complete!")

if __name__ == "__main__":
    migrate()
