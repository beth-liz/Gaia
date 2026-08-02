from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class OfficerPostingHistory(Base):
    __tablename__ = "officer_posting_history"

    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="SET NULL"), nullable=True)
    new_station_id = Column(Integer, ForeignKey("monitoring_stations.id", ondelete="SET NULL"), nullable=False)
    transfer_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    officer = relationship("User", foreign_keys=[officer_id], lazy="joined")
    old_station = relationship("MonitoringStation", foreign_keys=[old_station_id], lazy="joined")
    new_station = relationship("MonitoringStation", foreign_keys=[new_station_id], lazy="joined")
    transfer_by = relationship("User", foreign_keys=[created_by], lazy="joined")
