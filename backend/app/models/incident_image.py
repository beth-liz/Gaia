import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship

from app.database.base import Base


class IncidentImage(Base):
    __tablename__ = "incident_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    image_bytes = Column(LargeBinary, nullable=False)

    # Optional incident association (since image is uploaded before incident creation)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True, index=True)

    # Uploader tracking
    uploader_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", backref="stored_images", foreign_keys=[incident_id], lazy="joined")
    uploader = relationship("User", foreign_keys=[uploader_id], lazy="joined")
