from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db
from app.models.designation import Designation
from app.schemas.designation import DesignationCreate, DesignationUpdate, DesignationOut
from app.utils.deps import get_current_admin, get_current_user

router = APIRouter(
    prefix="/api/designations",
    tags=["Designations"]
)


@router.get("", response_model=List[DesignationOut])
def get_designations(db: Session = Depends(get_db)):
    """Fetch all designations from the database."""
    return db.query(Designation).order_by(Designation.designation_name.asc()).all()


@router.post("", response_model=DesignationOut, status_code=status.HTTP_201_CREATED)
def create_designation(
    data: DesignationCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Admin creates a new designation."""
    exists = db.query(Designation).filter(Designation.designation_name == data.designation_name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Designation already exists")
    
    new_d = Designation(
        designation_name=data.designation_name,
        description=data.description
    )
    db.add(new_d)
    db.commit()
    db.refresh(new_d)
    return new_d


@router.put("/{designation_id}", response_model=DesignationOut)
def update_designation(
    designation_id: int,
    data: DesignationUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Admin updates an existing designation."""
    d = db.query(Designation).filter(Designation.id == designation_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Designation not found")
    
    if data.designation_name is not None:
        d.designation_name = data.designation_name
    if data.description is not None:
        d.description = data.description

    db.commit()
    db.refresh(d)
    return d


@router.delete("/{designation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_designation(
    designation_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Admin deletes a designation."""
    d = db.query(Designation).filter(Designation.id == designation_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Designation not found")
    
    db.delete(d)
    db.commit()
    return None
