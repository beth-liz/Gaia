from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    village_name = Column(String(100), unique=True, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id", ondelete="SET NULL"), nullable=True)

    # Relationship
    district_rel = relationship("District", back_populates="villages")
    users = relationship("User", back_populates="village")