from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.base import Base

class CameraCaptureAIResult(Base):
    __tablename__ = "camera_capture_ai_results"

    id = Column(Integer, primary_key=True, index=True)
    capture_id = Column(Integer, ForeignKey("camera_captures.id"), unique=True, nullable=False, index=True)
    
    processing_status = Column(String, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    
    overall_species = Column(String, nullable=True)
    overall_confidence = Column(Float, nullable=True)
    animal_count = Column(Integer, default=0)
    
    detections = Column(JSON, nullable=True)  # Bounding boxes and individual confidences
    failure_reason = Column(String, nullable=True)
    
    processed_at = Column(DateTime(timezone=True), server_default=func.now())

    capture = relationship("CameraCapture", backref="ai_result")
