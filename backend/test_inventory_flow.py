from sqlalchemy.orm import Session
from app.database.database import engine
from app.services import inventory_service

def test_flow():
    db = Session(engine)
    try:
        print("--- 1. Testing Categories ---")
        cats = inventory_service.get_categories_list(db)
        print(f"Categories Found: {len(cats)}")
        for c in cats:
            print(f" - {c['name']} (Consumable: {c['consumable']}, Return Required: {c['return_required']}, Refill Required: {c['requires_refill']})")

        print("\n--- 2. Testing Refillable Kits ---")
        kits = inventory_service.get_station_kits_list(db)
        print(f"Station Kits Found: {len(kits)}")
        for k in kits:
            print(f" - {k['kit_number']} | Status: {k['current_status']} | Items Count: {len(k['kit_items'])}")

        print("\n--- 3. Testing Summary Report ---")
        summary = inventory_service.get_inventory_summary_report(db)
        print(f"Total Master Items: {summary['total_master_items']}")
        print(f"Permanent Assets Count: {summary['permanent_assets_count']}")
        print(f"Consumables Count: {summary['consumables_count']}")
        print(f"Refillable Kits Count: {summary['refillable_kits_count']}")
        print(f"Pending Refills Count: {summary['pending_refills_count']}")
        print(f"Low Stock Count: {summary['low_stock_items_count']}")

        print("\n[SUCCESS] Inventory Phase 10 flow test completed cleanly.")

    finally:
        db.close()

if __name__ == "__main__":
    test_flow()
