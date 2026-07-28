from sqlalchemy import Column, Integer, String, DateTime
from app.database.base import Base
from datetime import datetime


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True)

    user = Column(String(100))

    action = Column(String(255))

    timestamp = Column(DateTime, default=datetime.utcnow)