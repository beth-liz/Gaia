from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db
from app.models.village import Village
from app.schemas.village import VillageCreate, VillageOut
from app.utils.deps import get_current_admin

router = APIRouter(
    prefix="/api/villages",
    tags=["Villages"]
)


@router.get("", response_model=List[VillageOut])
def get_villages(db: Session = Depends(get_db)):
    """Fetch all villages from database."""
    return db.query(Village).order_by(Village.village_name.asc()).all()


@router.post("", response_model=VillageOut, status_code=status.HTTP_201_CREATED)
def create_village(
    data: VillageCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Admin creates a new village entry."""
    exists = db.query(Village).filter(Village.village_name == data.village_name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Village already exists")
    
    v = Village(
        village_name=data.village_name,
        district=data.district,
        state=data.state
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v
