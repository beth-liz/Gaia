import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.monitoring_station import MonitoringStation

def execute_update():
    # Transaction 1: Update user role
    db1 = SessionLocal()
    try:
        rajesh = db1.query(User).filter(User.id == 2).first()
        if rajesh:
            print(f"Current: User ID: {rajesh.id}, Name: '{rajesh.full_name}', Role: '{rajesh.role}'")
            rajesh.role = "Forest Guard"
            rajesh.designation_id = 2
            rajesh.full_name = "Rajesh Kumar (Forest Guard)"
            db1.commit()
            print("User transaction committed successfully.")
        else:
            print("Rajesh Kumar (ID 2) not found!")
    except Exception as e:
        db1.rollback()
        print("Error during user update:", e)
    finally:
        db1.close()

    # Transaction 2: Update station head officer
    db2 = SessionLocal()
    try:
        muthanga = db2.query(MonitoringStation).filter(MonitoringStation.id == 1).first()
        if muthanga:
            print(f"Current Station: ID: {muthanga.id}, Name: '{muthanga.station_name}', Head Officer: {muthanga.head_officer_id}")
            muthanga.head_officer_id = 9  # Randy Bane
            muthanga.status = "Active"
            db2.commit()
            print("Station transaction committed successfully.")
        else:
            print("Muthanga Range Office not found!")
    except Exception as e:
        db2.rollback()
        print("Error during station update:", e)
    finally:
        db2.close()

if __name__ == "__main__":
    execute_update()
