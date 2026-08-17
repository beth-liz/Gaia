import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import SessionLocal
from app.models.monitoring_station import MonitoringStation

def inspect():
    db = SessionLocal()
    try:
        print("Monitoring Stations:")
        stations = db.query(MonitoringStation).all()
        for s in stations:
            print(f"ID: {s.id}, Name: '{s.station_name}', Head Officer ID: {s.head_officer_id}, Status: '{s.status}'")
    finally:
        db.close()

if __name__ == "__main__":
    inspect()
