from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.deps import get_db
from app.models.village import Village
from app.schemas.village import VillageCreate, VillageOut
from app.utils.deps import get_current_admin

router = APIRouter(
    prefix="/api/villages",
    tags=["Villages"]
)


@router.get("", response_model=List[VillageOut])
def get_villages(
    district_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Fetch all villages from database, optionally filtered by district_id."""
    query = db.query(Village)
    if district_id:
        query = query.filter(Village.district_id == district_id)
    return query.order_by(Village.village_name.asc()).all()


@router.post("", response_model=VillageOut, status_code=status.HTTP_201_CREATED)
def create_village(
    data: VillageCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Admin creates a new village entry."""
    exists = db.query(Village).filter(
        Village.village_name == data.village_name,
        Village.district_id == data.district_id
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Village already exists")
    
    v = Village(
        village_name=data.village_name,
        district_id=data.district_id
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return v
