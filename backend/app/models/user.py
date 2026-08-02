from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # Admin, Range Forest Officer, Forest Guard, Officer, Villager
    
    designation_id = Column(Integer, ForeignKey("designations.id"), nullable=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id"), nullable=True)
    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)

    station = Column(String(100), nullable=True)  # Backward compatibility string
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False)
    work_status = Column(String(30), default="Available")  # Available, Busy, On Leave, Training, Transferred

    avatar_url = Column(String(255), nullable=True)
    profile_image = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    designation = relationship("Designation", back_populates="users", lazy="joined")
    station_rel = relationship("MonitoringStation", foreign_keys=[station_id], back_populates="officers", lazy="joined")
    village = relationship("Village", back_populates="users", lazy="joined")