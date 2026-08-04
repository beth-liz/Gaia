from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    reference_id = Column(String(50), unique=True, index=True, nullable=True)  # e.g., INC-2026-00015
    incident_title = Column(String(150), nullable=True)
    incident_category = Column(String(50), nullable=True, default="Wildlife Sighting")

    animal_species_id = Column(Integer, ForeignKey("animal_species.id", ondelete="SET NULL"), nullable=True)
    animal_type = Column(String(100), nullable=False)  # Synced with animal_name or custom input
    animal = Column(String(100), nullable=True)  # Backward compatibility alias

    severity = Column(String(30), nullable=False, default="Medium")  # Low, Medium, High, Critical
    description = Column(Text, nullable=True)

    # Location details
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location = Column(String(255), nullable=True)  # Short location/landmark description
    address = Column(Text, nullable=True)  # Reverse geocoded address

    village_id = Column(Integer, ForeignKey("villages.id", ondelete="SET NULL"), nullable=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="SET NULL"), nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="SET NULL"), nullable=True)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="SET NULL"), nullable=True)

    # Additional Details
    weather = Column(String(50), nullable=True, default="Sunny")
    people_injured = Column(Boolean, default=False)
    livestock_damage = Column(Boolean, default=False)
    property_damage = Column(Boolean, default=False)
    crop_damage = Column(Boolean, default=False)

    # Incident Status & Metadata
    status = Column(String(50), nullable=False, default="Pending Review")  # Pending Review, Assigned, Dispatched, Report Submitted, Report Approved, Verified, Closed
    incident_status = Column(String(50), nullable=True, default="Pending Review")

    reported_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Backward compatibility
    reporter_role = Column(String(50), nullable=True)

    photo_url = Column(String(255), nullable=True)
    images = Column(Text, nullable=True)  # JSON-encoded array of image URLs
    contact_number = Column(String(20), nullable=True)
    date_reported = Column(String(20), nullable=True)
    time_reported = Column(String(20), nullable=True)

    # Verification & Closure Fields
    verification_notes = Column(Text, nullable=True)
    verification_time = Column(DateTime, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    closed_at = Column(DateTime, nullable=True)
    closed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    final_closure_remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    animal_species_rel = relationship("AnimalSpecies", back_populates="incidents", lazy="joined")
    reporter_rel = relationship("User", foreign_keys=[reported_by], lazy="joined")
    reporter = relationship("User", foreign_keys=[reporter_id], lazy="joined")
    verified_by = relationship("User", foreign_keys=[verified_by_id], lazy="joined")
    closed_by = relationship("User", foreign_keys=[closed_by_id], lazy="joined")
    village = relationship("Village", lazy="joined")
    station_rel = relationship("MonitoringStation", lazy="joined")
    district_rel = relationship("District", lazy="joined")
    state_rel = relationship("State", lazy="joined")