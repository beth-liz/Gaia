from sqlalchemy import text
from app.database.database import engine
from app.database.base import Base
import app.models

def migrate():
    print("Creating any missing database tables for Phase 11...")
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        print("Ensuring columns exist on inventory_master...")
        conn.execute(text("""
            ALTER TABLE inventory_master
            ADD COLUMN IF NOT EXISTS item_code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS item_type VARCHAR(30) DEFAULT 'PERSONAL',
            ADD COLUMN IF NOT EXISTS is_refillable BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS minimum_stock_default INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
        """))

        print("Ensuring columns exist on inventory_categories...")
        conn.execute(text("""
            ALTER TABLE inventory_categories
            ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
        """))

        print("Ensuring columns exist on station_inventory...")
        conn.execute(text("""
            ALTER TABLE station_inventory
            ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS issued_quantity INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS minimum_stock INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        """))

        print("Ensuring columns exist on equipment_requests...")
        conn.execute(text("""
            ALTER TABLE equipment_requests
            ADD COLUMN IF NOT EXISTS inventory_master_id INTEGER REFERENCES inventory_master(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM',
            ADD COLUMN IF NOT EXISTS remarks TEXT;
        """))

        print("Ensuring columns exist on equipment_assignments...")
        conn.execute(text("""
            ALTER TABLE equipment_assignments
            ADD COLUMN IF NOT EXISTS purpose TEXT;
        """))

        print("Ensuring columns exist on inventory_transactions...")
        conn.execute(text("""
            ALTER TABLE inventory_transactions
            ADD COLUMN IF NOT EXISTS quantity_before INTEGER,
            ADD COLUMN IF NOT EXISTS quantity_changed INTEGER,
            ADD COLUMN IF NOT EXISTS quantity_after INTEGER,
            ADD COLUMN IF NOT EXISTS reference_table VARCHAR(50),
            ADD COLUMN IF NOT EXISTS reference_id INTEGER;
        """))

        print("Ensuring columns exist on kit_masters & kit_items...")
        conn.execute(text("""
            ALTER TABLE kit_masters
            ADD COLUMN IF NOT EXISTS kit_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

            ALTER TABLE kit_items
            ADD COLUMN IF NOT EXISTS inventory_master_id INTEGER REFERENCES inventory_master(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS default_quantity INTEGER DEFAULT 1;
        """))

        # Sync total_quantity and issued_quantity for existing records
        conn.execute(text("""
            UPDATE station_inventory
            SET total_quantity = current_quantity,
                issued_quantity = reserved_quantity
            WHERE total_quantity = 0 AND current_quantity > 0;
        """))

        conn.commit()
        print("Migration for Phase 11 complete!")

if __name__ == "__main__":
    migrate()
