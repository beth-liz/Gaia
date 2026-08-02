from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class IncidentActivity(Base):
    __tablename__ = "incident_activities"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)  # Created, Reviewed, Verified, Assigned, Reached Site, Updated, Resolved, Closed, Returned, Transferred
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", lazy="joined")
    user = relationship("User", lazy="joined")
