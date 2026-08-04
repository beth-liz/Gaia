from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
from datetime import datetime


class IncidentAssignment(Base):
    __tablename__ = "incident_assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # Head Officer / RFO
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # Assigned Officer / Guard
    dispatched_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    status = Column(String(50), default="Assigned")  # Assigned, Ready For Dispatch, Dispatched, In Progress, Resolved, Closed
    notes = Column(Text, nullable=True)
    report_url = Column(String(255), nullable=True)

    priority = Column(String(30), default="High")  # Low, Medium, High, Critical
    estimated_response_time = Column(String(50), nullable=True)  # e.g. "30 Mins", "1 Hour"
    instructions = Column(Text, nullable=True)
    mission_notes = Column(Text, nullable=True)
    assignment_remarks = Column(Text, nullable=True)
    assignment_category = Column(String(50), default="Field Patrol")  # Emergency Patrol, Tranquilizer Team, Rescue, Inspection
    emergency_level = Column(String(30), default="Level 2")  # Level 1, Level 2, Level 3

    actions_taken = Column(Text, nullable=True)
    damage_assessment = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    field_photos = Column(Text, nullable=True)  # JSON string of photo URLs

    assigned_at = Column(DateTime, default=datetime.utcnow)
    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", backref="assignments", lazy="joined")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id], lazy="joined")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], lazy="joined")
    dispatched_by = relationship("User", foreign_keys=[dispatched_by_id], lazy="joined")
