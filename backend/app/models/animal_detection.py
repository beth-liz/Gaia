from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from app.database.base import Base
from datetime import datetime
from sqlalchemy.orm import relationship


class AnimalDetection(Base):
    __tablename__ = "animal_detections"

    id = Column(Integer, primary_key=True)

    animal_name = Column(String(100))
    normalized_species = Column(String(100), nullable=True)
    confidence = Column(Float)
    count = Column(Integer, default=1)
    
    # Store bounding boxes array
    bounding_boxes = Column(JSON, nullable=True)

    image_path = Column(String(255))
    
    # Required for architecture compatibility with schemas and incidents
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="SET NULL"), nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    
    # Store model metadata
    model_info = Column(String(255), nullable=True)

    detected_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    station = relationship("MonitoringStation")
    incident = relationship("Incident")