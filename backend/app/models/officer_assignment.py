from sqlalchemy import Column, Integer, String, DateTime
from app.database.base import Base
from datetime import datetime


class OfficerAssignment(Base):
    __tablename__ = "officer_assignments"

    id = Column(Integer, primary_key=True)

    officer_name = Column(String(100))

    incident_id = Column(Integer)

    assignment_status = Column(String(50))

    assigned_at = Column(DateTime, default=datetime.utcnow)