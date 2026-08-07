import sys
import os
from sqlalchemy import text
from datetime import datetime

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, SessionLocal
from app.models.inventory import InventoryCategory, InventoryMaster

DEFAULT_CATEGORIES = [
    {"name": "Electronics", "description": "Electronic sensors, GPS, devices, and communication hardware", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Communication", "description": "VHF radios, walkie-talkies, satellite phones", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Safety Equipment", "description": "Helmets, high-vis vests, body armor, safety harnesses", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Medical Supplies", "description": "First aid consumables, bandages, antiseptics, medications", "return_required": False, "consumable": True, "requires_refill": False},
    {"name": "Consumable", "description": "Batteries, tranquillizers, tranquilizer darts, disposable gear", "return_required": False, "consumable": True, "requires_refill": False},
    {"name": "Refillable Kit", "description": "Emergency medical boxes, snake bite kits, trauma kits", "return_required": True, "consumable": False, "requires_refill": True},
    {"name": "Surveillance", "description": "Camera traps, night vision scopes, thermal cameras", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Optics", "description": "Binoculars, spotting scopes, rangefinders", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Tools", "description": "Machetes, rope cutters, multi-tools, flashlights", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Camping Equipment", "description": "Tents, sleeping bags, raincoats, field tarps", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Protective Gear", "description": "Snake-proof gaiters, tactical boots, gloves", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Navigation", "description": "Handheld GPS units, compasses, field maps", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Rescue Equipment", "description": "Stretcher, tranquilizer guns, animal capture nets, ropes", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Maintenance", "description": "Vehicle tools, generator spare parts, battery chargers", "return_required": True, "consumable": False, "requires_refill": False},
    {"name": "Emergency Supplies", "description": "Emergency flares, searchlights, sirens", "return_required": True, "consumable": False, "requires_refill": False},
]

def run_migration():
    print("=== STARTING INVENTORY PHASE 16 MIGRATION ===")
    db = SessionLocal()
    try:
        with engine.begin() as conn:
            # 1. Add created_by & updated_by columns to inventory_master table if missing
            print("1. Ensuring created_by & updated_by columns exist on inventory_master...")
            conn.execute(text("ALTER TABLE inventory_master ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;"))
            conn.execute(text("ALTER TABLE inventory_master ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;"))

        # 2. Seed default categories
        print("2. Seeding default categories in inventory_categories...")
        created_count = 0
        for cat_data in DEFAULT_CATEGORIES:
            existing = db.query(InventoryCategory).filter(
                InventoryCategory.name.ilike(cat_data["name"])
            ).first()
            if not existing:
                cat = InventoryCategory(
                    name=cat_data["name"],
                    description=cat_data["description"],
                    active=True,
                    return_required=cat_data["return_required"],
                    consumable=cat_data["consumable"],
                    requires_refill=cat_data["requires_refill"],
                    created_at=datetime.utcnow()
                )
                db.add(cat)
                created_count += 1
        db.commit()
        print(f"   Successfully seeded {created_count} new categories.")

        # 3. Connect existing master items to category_id
        print("3. Linking existing Inventory Master records to category_id...")
        all_cats = {c.name.lower(): c.id for c in db.query(InventoryCategory).all()}
        default_cat_id = all_cats.get("electronics", 1)

        masters = db.query(InventoryMaster).all()
        linked_count = 0
        for m in masters:
            if not m.category_id or m.category_id not in all_cats.values():
                cat_lower = m.category.lower() if m.category else "electronics"
                matched_id = all_cats.get(cat_lower, default_cat_id)
                m.category_id = matched_id
                linked_count += 1
        db.commit()
        print(f"   Successfully linked {linked_count} master items to database categories.")

        print("=== INVENTORY PHASE 16 MIGRATION COMPLETE ===")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
