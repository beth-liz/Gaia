import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, SessionLocal
from app.models.inventory import InventoryMaster

def run_migration():
    print("=== STARTING INVENTORY PHASE 18 MIGRATION ===")
    try:
        with engine.begin() as conn:
            print("1. Adding total_quantity column to inventory_master...")
            conn.execute(text(
                "ALTER TABLE inventory_master ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 100 NOT NULL;"
            ))
        print("=== INVENTORY PHASE 18 MIGRATION COMPLETE ===")
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
