import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.database import engine
from app.models.user import User

def fix_officer_records():
    print("Fixing Officer authentication flags in database...")
    db = Session(bind=engine)
    try:
        officers = db.query(User).filter(User.role != "Villager", User.role != "Admin").all()
        count = 0
        for off in officers:
            off.must_change_password = False
            off.is_verified = True
            off.is_active = True
            count += 1
            print(f"Updated officer: {off.email} (Role: {off.role}, Station ID: {off.station_id})")
        
        db.commit()
        print(f"Successfully updated {count} officer record(s).")
    finally:
        db.close()

if __name__ == "__main__":
    fix_officer_records()
