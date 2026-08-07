import sys
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.inventory import InventoryCategory, InventoryMaster, StationInventory
from app.models.monitoring_station import MonitoringStation

SUGGESTED_ITEMS = {
    "Consumable": [
        ("Battery", "Packs", "CONSUMABLE", "CONSUMABLE", 20, 100),
        ("Torch Cell", "Packs", "CONSUMABLE", "CONSUMABLE", 15, 80),
        ("Drinking Water Pack", "Boxes", "CONSUMABLE", "CONSUMABLE", 10, 50),
    ],
    "Safety Equipment": [
        ("Safety Helmet", "Units", "PERSONAL", "RETURNABLE", 5, 25),
        ("Reflective Jacket", "Units", "PERSONAL", "RETURNABLE", 5, 30),
        ("Safety Gloves", "Pairs", "CONSUMABLE", "CONSUMABLE", 10, 50),
    ],
    "Medical Supplies": [
        ("Sterile Gauze Roll", "Packs", "CONSUMABLE", "CONSUMABLE", 10, 40),
        ("Antiseptic Ointment", "Tubes", "CONSUMABLE", "CONSUMABLE", 15, 50),
        ("Burn Dressing Kit", "Kits", "KIT", "RETURNABLE", 5, 20),
    ],
    "Tools": [
        ("Axe", "Units", "PERSONAL", "RETURNABLE", 3, 15),
        ("Machete", "Units", "PERSONAL", "RETURNABLE", 5, 20),
        ("Multi Tool Kit", "Sets", "PERSONAL", "RETURNABLE", 3, 15),
    ],
    "Camping Equipment": [
        ("Sleeping Bag", "Units", "PERSONAL", "RETURNABLE", 5, 20),
        ("Camping Tent", "Units", "PERSONAL", "RETURNABLE", 3, 12),
        ("Portable Stove", "Units", "PERSONAL", "RETURNABLE", 2, 10),
    ],
    "Protective Gear": [
        ("Rain Coat", "Units", "PERSONAL", "RETURNABLE", 5, 25),
        ("Gum Boots", "Pairs", "PERSONAL", "RETURNABLE", 5, 25),
        ("Face Shield", "Units", "PERSONAL", "RETURNABLE", 5, 20),
    ],
    "Maintenance": [
        ("Tool Box", "Sets", "PERSONAL", "RETURNABLE", 2, 10),
        ("Lubricant Spray", "Cans", "CONSUMABLE", "CONSUMABLE", 5, 30),
        ("Repair Toolkit", "Kits", "PERSONAL", "RETURNABLE", 2, 10),
    ],
    "Emergency Supplies": [
        ("Emergency Light", "Units", "PERSONAL", "RETURNABLE", 5, 25),
        ("Rescue Rope", "Meters", "PERSONAL", "RETURNABLE", 10, 100),
        ("Emergency Whistle", "Units", "PERSONAL", "RETURNABLE", 10, 50),
    ],
    "Permanent Asset": [
        ("Office Computer", "Units", "PERSONAL", "RETURNABLE", 2, 8),
        ("Office Printer", "Units", "PERSONAL", "RETURNABLE", 1, 4),
        ("Generator", "Units", "PERSONAL", "RETURNABLE", 1, 3),
    ],
    "Refillable Kit": [
        ("Trauma Kit", "Kits", "KIT", "RETURNABLE", 3, 10),
        ("Medical Response Box", "Boxes", "KIT", "RETURNABLE", 2, 8),
        ("Rescue Backpack", "Kits", "KIT", "RETURNABLE", 3, 12),
    ],
    "Electronics": [
        ("Walkie Talkie", "Units", "PERSONAL", "RETURNABLE", 5, 25),
        ("GPS Device", "Units", "PERSONAL", "RETURNABLE", 3, 15),
        ("Solar Power Bank", "Units", "PERSONAL", "RETURNABLE", 5, 20),
    ],
    "Communication": [
        ("Satellite Phone", "Units", "PERSONAL", "RETURNABLE", 2, 8),
        ("Wireless Radio", "Units", "PERSONAL", "RETURNABLE", 5, 20),
        ("Signal Booster", "Units", "PERSONAL", "RETURNABLE", 2, 10),
    ],
    "Surveillance": [
        ("Camera Trap", "Units", "PERSONAL", "RETURNABLE", 5, 20),
        ("Drone", "Units", "PERSONAL", "RETURNABLE", 2, 6),
        ("Motion Detection Camera", "Units", "PERSONAL", "RETURNABLE", 3, 15),
    ],
    "Optics": [
        ("Binoculars", "Units", "PERSONAL", "RETURNABLE", 5, 25),
        ("Thermal Night Scope", "Units", "PERSONAL", "RETURNABLE", 2, 8),
        ("Range Finder", "Units", "PERSONAL", "RETURNABLE", 3, 12),
    ],
    "Navigation": [
        ("Compass", "Units", "PERSONAL", "RETURNABLE", 5, 30),
        ("GPS Tracker", "Units", "PERSONAL", "RETURNABLE", 5, 20),
        ("Topographic Map Kit", "Kits", "PERSONAL", "RETURNABLE", 3, 15),
    ],
    "Rescue Equipment": [
        ("Rescue Stretcher", "Units", "PERSONAL", "RETURNABLE", 2, 10),
        ("Life Jacket", "Units", "PERSONAL", "RETURNABLE", 5, 25),
        ("Rescue Harness", "Units", "PERSONAL", "RETURNABLE", 3, 15),
    ],
}

def seed_missing_items():
    db: Session = SessionLocal()
    try:
        stations = db.query(MonitoringStation).all()
        if not stations:
            print("ERROR: No monitoring stations found!")
            return

        categories = db.query(InventoryCategory).all()
        print(f"Loaded {len(categories)} categories from database.")

        total_inserted = 0

        for cat in categories:
            # Query existing items in InventoryMaster for this category
            existing_items = db.query(InventoryMaster).filter(
                (InventoryMaster.category_id == cat.id) |
                (InventoryMaster.category.ilike(cat.name))
            ).all()

            count = len(existing_items)
            print(f"\nProcessing Category [{cat.id}] '{cat.name}': Currently has {count} items.")

            if count >= 3:
                print(f" -> Already has {count} (>= 3) items. Skipping insertion.")
                continue

            needed = 3 - count
            print(f" -> Needs {needed} more items to reach at least 3.")

            candidates = SUGGESTED_ITEMS.get(cat.name, [
                (f"{cat.name} Item A", "Units", "PERSONAL", "RETURNABLE", 5, 20),
                (f"{cat.name} Item B", "Units", "PERSONAL", "RETURNABLE", 5, 20),
                (f"{cat.name} Item C", "Units", "PERSONAL", "RETURNABLE", 5, 20),
            ])

            added_for_cat = 0

            for item_name, unit, item_type, usage_type, min_stock, init_qty in candidates:
                if added_for_cat >= needed:
                    break

                # Check if item_name already exists anywhere in InventoryMaster
                existing = db.query(InventoryMaster).filter(
                    InventoryMaster.item_name.ilike(item_name)
                ).first()

                if existing:
                    # Link category_id if missing
                    if not existing.category_id:
                        existing.category_id = cat.id
                        print(f"   - Linked existing item '{existing.item_name}' to category_id={cat.id}")
                    continue

                # Generate clean unique item_code
                clean_cat_prefix = "".join(e for e in cat.name if e.isalnum())[:3].upper()
                clean_item_suffix = "".join(e for e in item_name if e.isalnum())[:4].upper()
                item_code = f"EQ-{clean_cat_prefix}-{clean_item_suffix}"

                # Create new InventoryMaster entry
                master_item = InventoryMaster(
                    item_name=item_name,
                    item_code=item_code,
                    category=cat.name,
                    category_id=cat.id,
                    item_type=item_type,
                    item_usage_type=usage_type,
                    unit=unit,
                    minimum_stock=min_stock,
                    minimum_stock_default=min_stock,
                    reorder_level=min_stock,
                    active=True,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(master_item)
                db.flush()  # get master_item.id

                # Create StationInventory entries for all stations
                for st in stations:
                    st_inv = StationInventory(
                        station_id=st.id,
                        inventory_master_id=master_item.id,
                        total_quantity=init_qty,
                        current_quantity=init_qty,
                        available_quantity=init_qty,
                        issued_quantity=0,
                        reserved_quantity=0,
                        damaged_quantity=0,
                        minimum_stock=min_stock,
                        status="Available",
                        last_updated=datetime.utcnow(),
                    )
                    db.add(st_inv)

                added_for_cat += 1
                total_inserted += 1
                print(f"   + Inserted '{item_name}' (Code: {item_code}, Unit: {unit}, Init Qty: {init_qty}) under category '{cat.name}'.")

        db.commit()
        print(f"\nSUCCESS: Transaction committed cleanly! Inserted {total_inserted} new equipment items.")

    except Exception as e:
        db.rollback()
        print(f"ERROR: Transaction failed and rolled back! {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_missing_items()
