from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base

class CameraDetectionEvent(Base):
    __tablename__ = "camera_detection_events"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False, index=True)
    camera_capture_id = Column(Integer, ForeignKey("camera_captures.id"), unique=True, nullable=False, index=True)
    monitoring_station_id = Column(Integer, ForeignKey("monitoring_stations.id"), nullable=False, index=True)
    
    species = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    animal_count = Column(Integer, default=1)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    status = Column(String, default="PENDING_REVIEW")  # PENDING_REVIEW, ACCEPTED, REJECTED
    
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String, nullable=True)
    
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    camera = relationship("Camera", backref="detection_events")
    capture = relationship("CameraCapture", backref="detection_event")
    monitoring_station = relationship("MonitoringStation")
    reviewer = relationship("User")
