from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)  # Admin, Range Forest Officer, Forest Guard, Villager
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    must_change_password = Column(Boolean, default=False)
    
    village_id = Column(Integer, ForeignKey("villages.id", ondelete="SET NULL"), nullable=True)
    designation_id = Column(Integer, ForeignKey("designations.id", ondelete="SET NULL"), nullable=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="SET NULL"), nullable=True)
    station = Column(String(100), nullable=True)
    work_status = Column(String(20), default="Available")  # Available, Busy
    avatar_url = Column(String(255), nullable=True)
    profile_image = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    village = relationship("Village", backref="users", lazy="joined")
    designation = relationship("Designation", backref="users", lazy="joined")
    station_rel = relationship("MonitoringStation", back_populates="officers", lazy="joined")