from sqlalchemy import Column, Integer, String, DateTime
from app.database.base import Base
from datetime import datetime


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True)

    animal = Column(String(100))

    location = Column(String(255))

    severity = Column(String(20))

    status = Column(String(20))

    reported_time = Column(DateTime, default=datetime.utcnow)