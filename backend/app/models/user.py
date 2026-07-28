from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from app.database.base import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(100), unique=True, nullable=False)

    phone = Column(String(20), unique=True)

    password = Column(String(255), nullable=False)

    role = Column(String(20), nullable=False)

    is_verified = Column(Boolean, default=False)

    is_active = Column(Boolean, default=True)

    village_id = Column(Integer, ForeignKey("villages.id"), nullable=True)

    must_change_password = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )