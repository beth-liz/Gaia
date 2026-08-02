from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
from datetime import datetime


class IncidentAssignment(Base):
    __tablename__ = "incident_assignments"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # RFO
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # Forest Guard
    status = Column(String(50), default="Assigned")  # Assigned, In Progress, Resolved, Awaiting Officer Approval, Closed
    notes = Column(Text, nullable=True)
    report_url = Column(String(255), nullable=True)

    priority = Column(String(30), default="High")  # Low, Medium, High, Critical
    estimated_response_time = Column(String(50), nullable=True)  # e.g. "30 Mins", "1 Hour"
    assignment_remarks = Column(Text, nullable=True)

    actions_taken = Column(Text, nullable=True)
    damage_assessment = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    field_photos = Column(Text, nullable=True)  # JSON string of photo URLs

    assigned_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", backref="assignments", lazy="joined")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id], lazy="joined")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], lazy="joined")
