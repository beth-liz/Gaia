"""
Gaia Database Seeding Utility
------------------------------
Seeds the default Admin account and default Villages.
"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.village import Village
from app.core.security import hash_password
from app.database.session import SessionLocal


def seed_admin_user(db: Session):
    """
    Seeds a default Admin user if one does not already exist.
    """

    admin_user = db.query(User).filter(User.role == "Admin").first()

    if not admin_user:

        print("Seeding default Admin user...")

        default_admin = User(
            full_name="Gaia System Administrator",
            email="admin@gaia.com",
            phone="0000000000",
            password=hash_password("AdminPassword123"),
            role="Admin",
            is_verified=True,
            is_active=True,
            must_change_password=False
        )

        db.add(default_admin)
        db.commit()
        db.refresh(default_admin)

        print("Admin created successfully.")

    else:

        print("Admin already exists.")


def seed_villages(db: Session):
    """
    Seeds default villages used for Gaia.
    """

    villages = [

        {
            "village_name": "Muthanga",
            "district": "Wayanad",
            "state": "Kerala"
        },

        {
            "village_name": "Sultan Bathery",
            "district": "Wayanad",
            "state": "Kerala"
        },

        {
            "village_name": "Pulpally",
            "district": "Wayanad",
            "state": "Kerala"
        },

        {
            "village_name": "Mananthavady",
            "district": "Wayanad",
            "state": "Kerala"
        },

        {
            "village_name": "Kattikulam",
            "district": "Wayanad",
            "state": "Kerala"
        }

    ]

    for village in villages:

        exists = db.query(Village).filter(
            Village.village_name == village["village_name"]
        ).first()

        if not exists:

            db.add(
                Village(
                    village_name=village["village_name"],
                    district=village["district"],
                    state=village["state"]
                )
            )

    db.commit()

    print("Village seeding completed.")


def run_seed():

    db = SessionLocal()

    try:

        seed_admin_user(db)
        seed_villages(db)

    finally:

        db.close()


if __name__ == "__main__":
    run_seed()