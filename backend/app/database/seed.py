"""
Gaia Database Seeding Utility
------------------------------
Seeds default Admin, Villages, Designations, and Initial Officers.
"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.village import Village
from app.models.designation import Designation
from app.core.security import hash_password
from app.database.session import SessionLocal


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
    print("Designations seeded successfully.")


def seed_villages(db: Session):
    villages = [
        {"village_name": "Muthanga", "district": "Wayanad", "state": "Kerala"},
        {"village_name": "Sultan Bathery", "district": "Wayanad", "state": "Kerala"},
        {"village_name": "Pulpally", "district": "Wayanad", "state": "Kerala"},
        {"village_name": "Mananthavady", "district": "Wayanad", "state": "Kerala"},
        {"village_name": "Kattikulam", "district": "Wayanad", "state": "Kerala"},
        {"village_name": "Meppadi", "district": "Wayanad", "state": "Kerala"}
    ]

    for village in villages:
        exists = db.query(Village).filter(Village.village_name == village["village_name"]).first()
        if not exists:
            db.add(Village(village_name=village["village_name"], district=village["district"], state=village["state"]))
    db.commit()
    print("Village seeding completed.")


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
        print("Admin created successfully.")


def seed_sample_officers(db: Session):
    rfo_desig = db.query(Designation).filter(Designation.designation_name == "Range Forest Officer").first()
    fg_desig = db.query(Designation).filter(Designation.designation_name == "Forest Guard").first()

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
                station="Muthanga Range Headquarters",
                is_verified=True,
                is_active=True,
                work_status="Available"
            ))

    # Forest Guards
    if fg_desig:
        guards_data = [
            ("Suresh V", "guard1@gaia.com", "9876500002", "Muthanga Station"),
            ("Anil Kurien", "guard2@gaia.com", "9876500003", "Sultan Bathery Station")
        ]
        for name, email, phone, station in guards_data:
            exists_guard = db.query(User).filter(User.email == email).first()
            if not exists_guard:
                db.add(User(
                    full_name=f"{name} (Forest Guard)",
                    email=email,
                    phone=phone,
                    password=hash_password("GuardPassword123"),
                    role="Forest Guard",
                    designation_id=fg_desig.id,
                    station=station,
                    is_verified=True,
                    is_active=True,
                    work_status="Available"
                ))
    db.commit()
    print("Sample officers seeded successfully.")


def run_seed():
    db = SessionLocal()
    try:
        seed_designations(db)
        seed_villages(db)
        seed_admin_user(db)
        seed_sample_officers(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()