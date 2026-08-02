import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.deps import get_db
from app.models.animal_species import AnimalSpecies
from app.models.incident import Incident
from app.schemas.animal_species import AnimalSpeciesOut, AnimalSpeciesCreate, AnimalSpeciesUpdate
from app.utils.deps import get_current_admin, get_current_user

router = APIRouter(
    prefix="/api/animal-species",
    tags=["Animal Species"]
)


@router.get("", response_model=List[AnimalSpeciesOut])
def get_animal_species(
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(AnimalSpecies)
    if active_only:
        query = query.filter(AnimalSpecies.is_active == True)
    return query.order_by(AnimalSpecies.animal_name.asc()).all()


@router.get("/{species_id}", response_model=AnimalSpeciesOut)
def get_animal_species_by_id(
    species_id: int,
    db: Session = Depends(get_db)
):
    species = db.query(AnimalSpecies).filter(AnimalSpecies.id == species_id).first()
    if not species:
        raise HTTPException(status_code=404, detail="Animal species not found")
    return species


@router.post("", response_model=AnimalSpeciesOut, status_code=status.HTTP_201_CREATED)
def create_animal_species(
    data: AnimalSpeciesCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    existing = db.query(AnimalSpecies).filter(AnimalSpecies.animal_name.ilike(data.animal_name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Species '{data.animal_name}' already exists.")

    species = AnimalSpecies(
        animal_name=data.animal_name.strip(),
        scientific_name=data.scientific_name.strip() if data.scientific_name else None,
        category=data.category or "Mammal",
        danger_level=data.danger_level or "Medium",
        conservation_status=data.conservation_status or "Least Concern",
        description=data.description.strip() if data.description else None,
        image=data.image,
        is_active=data.is_active if data.is_active is not None else True
    )
    db.add(species)
    db.commit()
    db.refresh(species)
    return species


@router.put("/{species_id}", response_model=AnimalSpeciesOut)
def update_animal_species(
    species_id: int,
    data: AnimalSpeciesUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    species = db.query(AnimalSpecies).filter(AnimalSpecies.id == species_id).first()
    if not species:
        raise HTTPException(status_code=404, detail="Animal species not found")

    if data.animal_name is not None and data.animal_name.strip() != species.animal_name:
        existing = db.query(AnimalSpecies).filter(
            AnimalSpecies.animal_name.ilike(data.animal_name.strip()),
            AnimalSpecies.id != species_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Species '{data.animal_name}' already exists.")
        species.animal_name = data.animal_name.strip()

    if data.scientific_name is not None:
        species.scientific_name = data.scientific_name.strip() if data.scientific_name else None
    if data.category is not None:
        species.category = data.category
    if data.danger_level is not None:
        species.danger_level = data.danger_level
    if data.conservation_status is not None:
        species.conservation_status = data.conservation_status
    if data.description is not None:
        species.description = data.description.strip() if data.description else None
    if data.image is not None:
        species.image = data.image
    if data.is_active is not None:
        species.is_active = data.is_active

    db.commit()
    db.refresh(species)
    return species


@router.post("/{species_id}/upload-image", response_model=AnimalSpeciesOut)
async def upload_species_image(
    species_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    species = db.query(AnimalSpecies).filter(AnimalSpecies.id == species_id).first()
    if not species:
        raise HTTPException(status_code=404, detail="Animal species not found")

    upload_dir = os.path.join("app", "static", "uploads", "species")
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"species_{species_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        contents = await file.read()
        f.write(contents)

    species.image = f"/static/uploads/species/{filename}"
    db.commit()
    db.refresh(species)
    return species


@router.delete("/{species_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_animal_species(
    species_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    species = db.query(AnimalSpecies).filter(AnimalSpecies.id == species_id).first()
    if not species:
        raise HTTPException(status_code=404, detail="Animal species not found")

    # Deletion should be prevented if the species is already used in incidents
    incidents_count = db.query(Incident).filter(Incident.animal_species_id == species_id).count()
    if incidents_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete species '{species.animal_name}' because it is linked to {incidents_count} reported incident(s)."
        )

    db.delete(species)
    db.commit()
    return None
