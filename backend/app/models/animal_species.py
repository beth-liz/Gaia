from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class AnimalSpecies(Base):
    __tablename__ = "animal_species"

    id = Column(Integer, primary_key=True, index=True)
    animal_name = Column(String(100), unique=True, nullable=False)
    scientific_name = Column(String(150), nullable=True)
    category = Column(String(50), nullable=False, default="Mammal")  # Mammal, Bird, Reptile, etc.
    danger_level = Column(String(30), nullable=False, default="Medium")  # Low, Medium, High, Critical
    conservation_status = Column(String(50), nullable=False, default="Least Concern")  # Least Concern, Near Threatened, Vulnerable, Endangered, Critically Endangered
    description = Column(Text, nullable=True)
    image = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    incidents = relationship("Incident", back_populates="animal_species_rel")
