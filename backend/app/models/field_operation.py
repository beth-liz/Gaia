from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.base import Base
from datetime import datetime


class FieldOperation(Base):
    __tablename__ = "field_operations"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("incident_assignments.id", ondelete="SET NULL"), nullable=True)
    guard_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Step Progression: Pending Acceptance -> Mission Accepted -> Travelling -> Reached Site -> Initial Assessment -> Action In Progress -> Situation Controlled -> Evidence Uploaded -> Final Report Submitted
    current_step = Column(String(50), default="Pending Acceptance")

    # Step 1: Acceptance
    departure_time = Column(String(50), nullable=True)
    vehicle = Column(String(50), nullable=True)  # Forest Jeep, Patrol Bike, Foot Patrol, Rescue Van
    acceptance_remarks = Column(Text, nullable=True)

    # Step 2: Travelling
    travelling_start_time = Column(String(50), nullable=True)
    travelling_gps = Column(String(100), nullable=True)
    travelling_remarks = Column(Text, nullable=True)

    # Step 3: Reached Site
    arrival_time = Column(String(50), nullable=True)
    arrival_gps = Column(String(100), nullable=True)
    arrival_weather = Column(String(50), nullable=True)
    arrival_photos = Column(Text, nullable=True)  # JSON string
    arrival_remarks = Column(Text, nullable=True)

    # Step 4: Initial Assessment
    animal_present = Column(Boolean, default=True)
    animal_count = Column(Integer, default=1)
    animal_behaviour = Column(String(50), default="Calm")  # Aggressive, Calm, Frightened, Injured
    threat_level = Column(String(30), default="Medium")  # Low, Medium, High, Critical
    human_injury = Column(Boolean, default=False)
    livestock_damage = Column(Boolean, default=False)
    property_damage = Column(Boolean, default=False)
    assessment_photos = Column(Text, nullable=True)  # JSON
    assessment_videos = Column(Text, nullable=True)  # JSON
    assessment_remarks = Column(Text, nullable=True)

    # Step 5: Action Taken (Checklist)
    actions_checklist = Column(Text, nullable=True)  # JSON array: ["Patrolling", "Firecrackers", "Rescue", "Public Warning"]
    action_remarks = Column(Text, nullable=True)

    # Step 6: Situation Controlled
    outcome = Column(String(100), nullable=True)  # Animal Chased into Core Forest, Captured/Rescued, Monitored at Distance
    animal_direction = Column(String(50), nullable=True)  # North, South, East, West, Core Sanctuary
    distance_covered = Column(String(50), nullable=True)
    remaining_risk = Column(String(50), default="Low")  # None, Low, Medium, High
    situation_remarks = Column(Text, nullable=True)

    # Step 7: Evidence
    evidence_photos = Column(Text, nullable=True)  # JSON
    evidence_videos = Column(Text, nullable=True)  # JSON
    evidence_audio = Column(Text, nullable=True)  # JSON
    evidence_gps = Column(String(100), nullable=True)

    # Step 8: Reinforcement Request
    reinforcement_requested = Column(Boolean, default=False)
    reinforcement_reason = Column(Text, nullable=True)
    reinforcement_priority = Column(String(30), default="High")
    reinforcement_count = Column(Integer, default=2)
    reinforcement_status = Column(String(30), default="None")  # None, Requested, Approved, Rejected
    reinforcement_remarks = Column(Text, nullable=True)

    # Automated Final Report
    report_generated_content = Column(Text, nullable=True)
    officer_signature = Column(String(255), nullable=True)
    submitted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", backref="field_operations", lazy="joined")
    guard = relationship("User", foreign_keys=[guard_id], lazy="joined")
