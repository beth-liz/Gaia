import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models.inventory import InventoryCategory, InventoryMaster

def cleanup():
    db = SessionLocal()
    try:
        print("=== STARTING CATEGORY CLEANUP ===")
        # Find target singular categories
        refillable_singular = db.query(InventoryCategory).filter(InventoryCategory.name == "Refillable Kit").first()
        consumable_singular = db.query(InventoryCategory).filter(InventoryCategory.name == "Consumable").first()

        if not refillable_singular:
            refillable_singular = InventoryCategory(name="Refillable Kit", active=True, return_required=True, requires_refill=True)
            db.add(refillable_singular)
            db.flush()

        if not consumable_singular:
            consumable_singular = InventoryCategory(name="Consumable", active=True, return_required=False, consumable=True)
            db.add(consumable_singular)
            db.flush()

        # Find duplicate plural categories
        refillable_plural = db.query(InventoryCategory).filter(InventoryCategory.name == "Refillable Kits").first()
        consumable_plural = db.query(InventoryCategory).filter(InventoryCategory.name == "Consumables").first()

        # Migrate any items referencing the plural category_id
        if refillable_plural:
            db.query(InventoryMaster).filter(InventoryMaster.category_id == refillable_plural.id).update(
                {InventoryMaster.category_id: refillable_singular.id, InventoryMaster.category: "Refillable Kit"},
                synchronize_session=False
            )
            db.delete(refillable_plural)
            print("Deleted duplicate category 'Refillable Kits'.")

        if consumable_plural:
            db.query(InventoryMaster).filter(InventoryMaster.category_id == consumable_plural.id).update(
                {InventoryMaster.category_id: consumable_singular.id, InventoryMaster.category: "Consumable"},
                synchronize_session=False
            )
            db.delete(consumable_plural)
            print("Deleted duplicate category 'Consumables'.")

        # Also update any item string categories
        db.query(InventoryMaster).filter(InventoryMaster.category == "Refillable Kits").update(
            {InventoryMaster.category: "Refillable Kit", InventoryMaster.category_id: refillable_singular.id},
            synchronize_session=False
        )
        db.query(InventoryMaster).filter(InventoryMaster.category == "Consumables").update(
            {InventoryMaster.category: "Consumable", InventoryMaster.category_id: consumable_singular.id},
            synchronize_session=False
        )

        db.commit()
        print("=== CATEGORY CLEANUP SUCCESSFUL ===")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Cleanup failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
