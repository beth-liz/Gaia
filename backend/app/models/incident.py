from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
from datetime import datetime


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)
    animal = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    severity = Column(String(20), nullable=False, default="Medium")
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="Pending")  # Pending, Assigned, In Progress, Completed, Rejected
    photo_url = Column(String(255), nullable=True)
    contact_number = Column(String(20), nullable=True)
    date_reported = Column(String(20), nullable=True)
    time_reported = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], lazy="joined")
    village = relationship("Village", lazy="joined")