import sys
import os
from sqlalchemy import text
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, SessionLocal
from app.models.inventory import InventoryCategory

def run_migration():
    print("=== STARTING INVENTORY PHASE 17 MIGRATION ===")
    db = SessionLocal()
    try:
        with engine.begin() as conn:
            # 1. Add procurement_type column to inventory_categories
            print("1. Adding procurement_type column to inventory_categories...")
            conn.execute(text(
                "ALTER TABLE inventory_categories ADD COLUMN IF NOT EXISTS procurement_type VARCHAR(30) DEFAULT 'LOCAL_ALLOWED' NOT NULL;"
            ))

            # 2. Add vendor & invoice columns to inventory_transactions
            print("2. Adding vendor & invoice fields to inventory_transactions...")
            conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(100);"))
            conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);"))
            conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP WITHOUT TIME ZONE;"))
            conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS purchase_cost DOUBLE PRECISION;"))
            conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS gst_tax DOUBLE PRECISION;"))
            conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS allocation_reference VARCHAR(100);"))
            conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS received_date TIMESTAMP WITHOUT TIME ZONE;"))
            conn.execute(text("ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS admin_dispatch_number VARCHAR(100);"))

            # 3. Add request_type & expected_date to equipment_requests
            print("3. Adding request_type & expected_date to equipment_requests...")
            conn.execute(text("ALTER TABLE equipment_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(30) DEFAULT 'GUARD_REQUEST';"))
            conn.execute(text("ALTER TABLE equipment_requests ADD COLUMN IF NOT EXISTS expected_date TIMESTAMP WITHOUT TIME ZONE;"))

        # 4. Populate default procurement rules per category
        print("4. Updating procurement rules for categories...")
        admin_only_names = [
            "Electronics", "Surveillance", "Optics", "Communication",
            "Navigation", "Rescue Equipment", "Refillable Kit", "Permanent Asset"
        ]

        local_allowed_names = [
            "Consumable", "Medical Supplies", "Safety Equipment", "Protective Gear",
            "Maintenance", "Camping Equipment", "Tools", "Emergency Supplies"
        ]

        for cat in db.query(InventoryCategory).all():
            c_name = cat.name.strip()
            if any(a.lower() in c_name.lower() for a in admin_only_names):
                cat.procurement_type = "ADMIN_ONLY"
            else:
                cat.procurement_type = "LOCAL_ALLOWED"

        db.commit()
        print("   Successfully updated procurement rules for categories.")
        print("=== INVENTORY PHASE 17 MIGRATION COMPLETE ===")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
