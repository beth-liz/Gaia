from sqlalchemy import Column, Integer, String
from app.database.base import Base


class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)

    village_name = Column(String(100), unique=True)

    district = Column(String(100))

    state = Column(String(100))