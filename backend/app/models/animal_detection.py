from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database.base import Base
from datetime import datetime


class AnimalDetection(Base):
    __tablename__ = "animal_detections"

    id = Column(Integer, primary_key=True)

    animal_name = Column(String(100))

    confidence = Column(Float)

    image_path = Column(String(255))

    detected_at = Column(DateTime, default=datetime.utcnow)