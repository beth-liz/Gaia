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


def seed_admin_user(db: Session):
    admin_user = db.query(User).filter(User.role == "Admin").first()
    if not admin_user:
        default_admin = User(
            full_name="Gaia System Administrator",
            email="admin@gaia.com",
            phone="9876543210",
            password=hash_password("AdminPassword123"),
            role="Admin",
            is_verified=True,
            is_active=True,
            must_change_password=False
        )
        db.add(default_admin)
        db.commit()


def seed_sample_officers(db: Session):
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


def run_seed():
    db = SessionLocal()
    try:
        seed_hierarchy(db)
        seed_designations(db)
        seed_villages(db)
        seed_admin_user(db)
        seed_sample_officers(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()