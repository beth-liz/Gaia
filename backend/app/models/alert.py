from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database.base import Base
from datetime import datetime


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)

    title = Column(String(150))

    message = Column(String(500))

    target_role = Column(String(30))

    is_sent = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)