"""
Gaia Database Seeding Utility
------------------------------
Seeds default Admin, State, District, Monitoring Stations, Villages, Designations, and Initial Officers.
"""

from sqlalchemy.orm import Session

from app.models.state import State
from app.models.district import District
from app.models.monitoring_station import MonitoringStation
from app.models.user import User
from app.models.village import Village
from app.models.designation import Designation
from app.models.camera import Camera
from app.core.security import hash_password
from app.database.session import SessionLocal


def seed_hierarchy(db: Session):
    state = db.query(State).filter(State.state_name == "Kerala").first()
    if not state:
        state = State(state_name="Kerala")
        db.add(state)
        db.commit()
        db.refresh(state)

    district = db.query(District).filter(District.district_name == "Wayanad").first()
    if not district:
        district = District(district_name="Wayanad", state_id=state.id)
        db.add(district)
        db.commit()
        db.refresh(district)

    stations = [
        {"name": "Muthanga Range Office", "phone": "04936-270001", "email": "muthanga@forest.kerala.gov.in", "lat": 11.6667, "lng": 76.3667, "desc": "Headquarters for Muthanga Range Operations"},
        {"name": "Sulthan Bathery Range Office", "phone": "04936-220234", "email": "bathery@forest.kerala.gov.in", "lat": 11.6624, "lng": 76.2570, "desc": "Central Wild Wildlife Division Bathery"},
        {"name": "Mananthavady Range Office", "phone": "04935-240245", "email": "mananthavady@forest.kerala.gov.in", "lat": 11.8028, "lng": 76.0035, "desc": "North Wayanad Forest Division"},
        {"name": "Tholpetty Range Office", "phone": "04935-250800", "email": "tholpetty@forest.kerala.gov.in", "lat": 11.9500, "lng": 75.9833, "desc": "Tholpetty Wildlife Range Base Station"},
        {"name": "Begur Range Office", "phone": "04935-241220", "email": "begur@forest.kerala.gov.in", "lat": 11.8700, "lng": 76.0800, "desc": "Begur Forest Range Monitoring Unit"},
        {"name": "Kurichiat Range Office", "phone": "04936-271150", "email": "kurichiat@forest.kerala.gov.in", "lat": 11.7200, "lng": 76.2800, "desc": "Kurichiat Wildlife Range Station"}
    ]

    for st in stations:
        exists = db.query(MonitoringStation).filter(MonitoringStation.station_name == st["name"]).first()
        if not exists:
            db.add(MonitoringStation(
                station_name=st["name"],
                district_id=district.id,
                address=f"Wayanad Forest Division, {st['name']}",
                phone=st["phone"],
                email=st["email"],
                latitude=st["lat"],
                longitude=st["lng"],
                status="Active",
                description=st["desc"]
            ))
    db.commit()


def seed_designations(db: Session):
    default_designations = [
        {"name": "Range Forest Officer", "desc": "Manages range operational incidents and officer assignments."},
        {"name": "Forest Guard", "desc": "Patrols assigned sectors and handles field incidents."}
    ]
    for d in default_designations:
        exists = db.query(Designation).filter(Designation.designation_name == d["name"]).first()
        if not exists:
            db.add(Designation(designation_name=d["name"], description=d["desc"]))
    db.commit()


def seed_villages(db: Session):
    district = db.query(District).filter(District.district_name == "Wayanad").first()
    d_id = district.id if district else None

    villages = [
        {"village_name": "Muthanga"},
        {"village_name": "Sultan Bathery"},
        {"village_name": "Pulpally"},
        {"village_name": "Mananthavady"},
        {"village_name": "Kattikulam"},
        {"village_name": "Meppadi"}
    ]

    for village in villages:
        exists = db.query(Village).filter(Village.village_name == village["village_name"]).first()
        if not exists:
            db.add(Village(village_name=village["village_name"], district_id=d_id))
        elif exists.district_id is None and d_id:
            exists.district_id = d_id
    db.commit()


from app.core.config import settings
import logging

logger = logging.getLogger("gaia.seed")


def seed_admin_user(db: Session):
    if not settings.SEED_ADMIN:
        logger.info("SEED_ADMIN is set to False; skipping Admin user seeding.")
        return

    admin_user = db.query(User).filter(User.role == "Admin").first()
    if admin_user:
        return

    is_prod = settings.ENVIRONMENT.lower() in ("production", "prod")

    # In production, require ADMIN_PASSWORD to be explicitly configured
    admin_password = settings.ADMIN_PASSWORD
    if is_prod and (not admin_password or not admin_password.strip()):
        raise ValueError(
            "Production configuration error: SEED_ADMIN=true but ADMIN_PASSWORD is not set. "
            "Please configure ADMIN_PASSWORD in your environment variables to create the initial Admin account safely, "
            "or set SEED_ADMIN=false if the Admin account has already been provisioned."
        )

    if not admin_password:
        admin_password = "AdminPassword123"

    default_admin = User(
        full_name=settings.ADMIN_NAME,
        email=settings.ADMIN_EMAIL,
        phone=settings.ADMIN_PHONE,
        password=hash_password(admin_password),
        role="Admin",
        is_verified=True,
        is_active=True,
        must_change_password=is_prod  # In production, enforce password change on first login
    )
    db.add(default_admin)
    db.commit()
    logger.info(f"Initial Admin account created for {settings.ADMIN_EMAIL}")


def seed_sample_officers(db: Session):
    # Only seed sample demo officers in development/staging environments
    if settings.ENVIRONMENT.lower() in ("production", "prod"):
        logger.info("Production mode detected: skipping demo officers seeding.")
        return

    rfo_desig = db.query(Designation).filter(Designation.designation_name == "Range Forest Officer").first()
    fg_desig = db.query(Designation).filter(Designation.designation_name == "Forest Guard").first()
    default_st = db.query(MonitoringStation).filter(MonitoringStation.station_name == "Muthanga Range Office").first()
    bathery_st = db.query(MonitoringStation).filter(MonitoringStation.station_name == "Sulthan Bathery Range Office").first()
    
    st_id1 = default_st.id if default_st else None
    st_id2 = bathery_st.id if bathery_st else st_id1

    # RFO
    if rfo_desig:
        exists_rfo = db.query(User).filter(User.email == "rfo@gaia.com").first()
        if not exists_rfo:
            db.add(User(
                full_name="Rajesh Kumar (RFO)",
                email="rfo@gaia.com",
                phone="9876500001",
                password=hash_password("OfficerPassword123"),
                role="Range Forest Officer",
                designation_id=rfo_desig.id,
                station_id=st_id1,
                station="Muthanga Range Office",
                is_verified=True,
                is_active=True,
                work_status="Available"
            ))

    # Forest Guards
    if fg_desig:
        guards_data = [
            ("Suresh V", "guard1@gaia.com", "9876500002", st_id1, "Muthanga Range Office"),
            ("Anil Kurien", "guard2@gaia.com", "9876500003", st_id2, "Sulthan Bathery Range Office")
        ]
        for name, email, phone, st_id, st_name in guards_data:
            exists_guard = db.query(User).filter(User.email == email).first()
            if not exists_guard:
                db.add(User(
                    full_name=f"{name} (Forest Guard)",
                    email=email,
                    phone=phone,
                    password=hash_password("GuardPassword123"),
                    role="Forest Guard",
                    designation_id=fg_desig.id,
                    station_id=st_id,
                    station=st_name,
                    is_verified=True,
                    is_active=True,
                    work_status="Available"
                ))
    db.commit()


def seed_inventory(db: Session):
    from datetime import datetime
    from app.models.inventory import (
        InventoryCategory,
        InventoryMaster,
        StationInventory,
        InventoryTransaction,
        KitMaster,
        KitItem,
    )

    # 1. Seed Categories
    cat_data = [
        {"name": "Permanent Asset", "desc": "Long-term reusable hardware, optics, electronics and vehicles.", "return_required": True, "consumable": False, "requires_refill": False},
        {"name": "Consumable", "desc": "Single-use field items deducted directly upon issue.", "return_required": False, "consumable": True, "requires_refill": False},
        {"name": "Refillable Kit", "desc": "Emergency medical / rescue kits requiring inspection and component refills.", "return_required": True, "consumable": False, "requires_refill": True},
    ]

    cat_map = {}
    for c in cat_data:
        cat_obj = db.query(InventoryCategory).filter(InventoryCategory.name == c["name"]).first()
        if not cat_obj:
            cat_obj = InventoryCategory(
                name=c["name"],
                description=c["desc"],
                return_required=c["return_required"],
                consumable=c["consumable"],
                requires_refill=c["requires_refill"],
            )
            db.add(cat_obj)
            db.flush()
        cat_map[c["name"]] = cat_obj

    db.commit()

    perm_cat = cat_map.get("Permanent Asset")
    cons_cat = cat_map.get("Consumable")
    refill_cat = cat_map.get("Refillable Kit")

    # 2. Seed Master Catalog
    master_items = [
        {"name": "GPS Device", "category": "Electronics", "cat_id": perm_cat.id if perm_cat else None, "unit": "Units", "min_stock": 5, "desc": "Garmin Handheld GPS Receiver."},
        {"name": "Walkie Talkie", "category": "Electronics", "cat_id": perm_cat.id if perm_cat else None, "unit": "Units", "min_stock": 10, "desc": "VHF High-frequency long-range radio transceiver."},
        {"name": "Drone", "category": "Surveillance", "cat_id": perm_cat.id if perm_cat else None, "unit": "Units", "min_stock": 2, "desc": "Thermal imaging aerial surveillance drone."},
        {"name": "Camera Trap", "category": "Surveillance", "cat_id": perm_cat.id if perm_cat else None, "unit": "Units", "min_stock": 15, "desc": "Motion-triggered infrared night-vision camera."},
        {"name": "Binoculars", "category": "Optics", "cat_id": perm_cat.id if perm_cat else None, "unit": "Units", "min_stock": 8, "desc": "10x50 waterproof field observation binoculars."},
        {"name": "Torch", "category": "Lighting", "cat_id": perm_cat.id if perm_cat else None, "unit": "Units", "min_stock": 12, "desc": "Heavy-duty tactical LED flashlight."},
        {"name": "Vehicle", "category": "Vehicles", "unit": "Units", "cat_id": perm_cat.id if perm_cat else None, "min_stock": 1, "desc": "4x4 All-terrain forest patrol vehicle."},
        {"name": "First Aid Kit", "category": "Refillable Kit", "cat_id": refill_cat.id if refill_cat else None, "unit": "Kits", "min_stock": 10, "desc": "Emergency medical response kit for field officers."},
        {"name": "Snake Bite Kit", "category": "Refillable Kit", "cat_id": refill_cat.id if refill_cat else None, "unit": "Kits", "min_stock": 5, "desc": "Anti-venom emergency response kit."},
        {"name": "Emergency Rescue Box", "category": "Refillable Kit", "cat_id": refill_cat.id if refill_cat else None, "unit": "Kits", "min_stock": 3, "desc": "Tactical rescue and evacuation kit."},
        {"name": "Battery", "category": "Consumable", "cat_id": cons_cat.id if cons_cat else None, "unit": "Packs", "min_stock": 20, "desc": "Rechargeable Li-ion battery pack for radios and torches."},
        {"name": "Torch Cell", "category": "Consumable", "cat_id": cons_cat.id if cons_cat else None, "unit": "Pieces", "min_stock": 30, "desc": "D-Cell heavy-duty flashlight batteries."},
        {"name": "Medical Gloves", "category": "Consumable", "cat_id": cons_cat.id if cons_cat else None, "unit": "Boxes", "min_stock": 15, "desc": "Nitrile protective surgical gloves."},
        {"name": "Water Bottle", "category": "Consumable", "cat_id": cons_cat.id if cons_cat else None, "unit": "Units", "min_stock": 25, "desc": "Insulated field canteen bottle."},
        {"name": "Fire Crackers", "category": "Consumable", "cat_id": cons_cat.id if cons_cat else None, "unit": "Boxes", "min_stock": 40, "desc": "Wildlife repellent audio pyrotechnics."},
    ]

    for item in master_items:
        exists = db.query(InventoryMaster).filter(InventoryMaster.item_name == item["name"]).first()
        if not exists:
            db.add(InventoryMaster(
                item_name=item["name"],
                category=item["category"],
                category_id=item.get("cat_id"),
                unit=item["unit"],
                minimum_stock=item["min_stock"],
                reorder_level=5,
                description=item["desc"],
                is_active=True
            ))
        else:
            if item.get("cat_id"):
                exists.category_id = item["cat_id"]
    db.commit()

    # 3. Seed initial station stock for Muthanga Range Office
    muthanga = db.query(MonitoringStation).filter(MonitoringStation.station_name == "Muthanga Range Office").first()
    rfo = db.query(User).filter(User.role == "Range Forest Officer").first()
    rfo_id = rfo.id if rfo else 1

    if muthanga:
        initial_stocks = [
            ("GPS Device", 20),
            ("Walkie Talkie", 30),
            ("Camera Trap", 25),
            ("Drone", 4),
            ("Binoculars", 15),
            ("First Aid Kit", 15),
            ("Snake Bite Kit", 6),
            ("Battery", 50),
            ("Medical Gloves", 30),
            ("Torch Cell", 60),
        ]
        for name, qty in initial_stocks:
            m_item = db.query(InventoryMaster).filter(InventoryMaster.item_name == name).first()
            if m_item:
                exists_st = db.query(StationInventory).filter(
                    StationInventory.station_id == muthanga.id,
                    StationInventory.inventory_master_id == m_item.id
                ).first()
                if not exists_st:
                    st_inv = StationInventory(
                        station_id=muthanga.id,
                        inventory_master_id=m_item.id,
                        current_quantity=qty,
                        available_quantity=qty,
                        reserved_quantity=0,
                        damaged_quantity=0,
                        status="Available"
                    )
                    db.add(st_inv)
                    db.flush()
                    db.add(InventoryTransaction(
                        station_inventory_id=st_inv.id,
                        transaction_type="STOCK_ADDED",
                        quantity=qty,
                        performed_by=rfo_id,
                        remarks="Initial station inventory setup."
                    ))

        # 4. Seed Refillable Kit #004
        fa_item = db.query(InventoryMaster).filter(InventoryMaster.item_name == "First Aid Kit").first()
        if fa_item:
            kit_exists = db.query(KitMaster).filter(KitMaster.kit_number == "First Aid Kit #004").first()
            if not kit_exists:
                kit_obj = KitMaster(
                    kit_number="First Aid Kit #004",
                    inventory_master_id=fa_item.id,
                    station_id=muthanga.id,
                    current_status="Available",
                    last_refilled_date=datetime.utcnow(),
                    notes="Standard emergency trauma & first aid kit."
                )
                db.add(kit_obj)
                db.flush()

                kit_components = [
                    ("Bandages", 10, 10, "Packs"),
                    ("Painkillers", 20, 20, "Tablets"),
                    ("Gauze", 15, 15, "Rolls"),
                    ("Cotton", 5, 5, "Rolls"),
                    ("Antiseptic", 2, 2, "Bottles"),
                    ("Scissors", 1, 1, "Units"),
                ]
                for c_name, req_q, cur_q, u in kit_components:
                    db.add(KitItem(
                        kit_id=kit_obj.id,
                        item_name=c_name,
                        required_quantity=req_q,
                        current_quantity=cur_q,
                        unit=u
                    ))

    db.commit()

def seed_cameras(db: Session):
    stations = db.query(MonitoringStation).all()
    locations = ["North Forest Area", "Water Source Area", "Forest Boundary"]
    
    for station in stations:
        for i in range(1, 4):
            # Create a simple unique short code
            short_name = station.station_name.split()[0].upper()
            cam_code = f"CAM-{short_name}-{i:02d}"
            
            exists = db.query(Camera).filter(Camera.camera_code == cam_code).first()
            if not exists:
                lat_offset = i * 0.002
                lng_offset = i * 0.002
                base_lat = station.latitude if station.latitude else 11.6
                base_lng = station.longitude if station.longitude else 76.2
                
                db.add(Camera(
                    camera_name=f"Camera {i:02d}",
                    camera_code=cam_code,
                    monitoring_station_id=station.id,
                    location_name=locations[i-1],
                    latitude=base_lat + lat_offset,
                    longitude=base_lng - lng_offset,
                    status="Active"
                ))
    db.commit()


def run_seed():
    db = SessionLocal()
    try:
        seed_hierarchy(db)
        seed_designations(db)
        seed_villages(db)
        seed_admin_user(db)
        seed_sample_officers(db)
        seed_inventory(db)
        seed_cameras(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()