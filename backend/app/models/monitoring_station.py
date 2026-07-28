from sqlalchemy import Column, Integer, String, Float
from app.database.base import Base


class MonitoringStation(Base):
    __tablename__ = "monitoring_stations"

    id = Column(Integer, primary_key=True)

    station_name = Column(String(100))

    latitude = Column(Float)

    longitude = Column(Float)

    location = Column(String(255))

    status = Column(String(30))