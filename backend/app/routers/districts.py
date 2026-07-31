from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.deps import get_db
from app.models.district import District
from app.models.state import State
from app.models.monitoring_station import MonitoringStation
from app.models.village import Village
from app.schemas.district import DistrictCreate, DistrictUpdate, DistrictResponse
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/districts", tags=["Districts"])


@router.get("", response_model=List[DistrictResponse])
def get_districts(
    state_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(District)
    if state_id:
        query = query.filter(District.state_id == state_id)
    districts = query.all()

    res = []
    for d in districts:
        st_count = db.query(MonitoringStation).filter(MonitoringStation.district_id == d.id).count()
        v_count = db.query(Village).filter(Village.district_id == d.id).count()
        state_obj = db.query(State).filter(State.id == d.state_id).first()

        res.append(DistrictResponse(
            id=d.id,
            district_name=d.district_name,
            state_id=d.state_id,
            state_name=state_obj.state_name if state_obj else "Unknown",
            station_count=st_count,
            village_count=v_count,
            status="Active",
            created_at=d.created_at,
            updated_at=d.updated_at
        ))
    return res


@router.post("", response_model=DistrictResponse, status_code=status.HTTP_201_CREATED)
def create_district(
    data: DistrictCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    state = db.query(State).filter(State.id == data.state_id).first()
    if not state:
        raise HTTPException(status_code=404, detail="Selected State not found")

    existing = db.query(District).filter(
        District.district_name.ilike(data.district_name.strip()),
        District.state_id == data.state_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="District already exists in this State")

    district = District(district_name=data.district_name.strip(), state_id=data.state_id)
    db.add(district)
    db.commit()
    db.refresh(district)

    return DistrictResponse(
        id=district.id,
        district_name=district.district_name,
        state_id=district.state_id,
        state_name=state.state_name,
        station_count=0,
        village_count=0,
        status="Active",
        created_at=district.created_at,
        updated_at=district.updated_at
    )


@router.put("/{district_id}", response_model=DistrictResponse)
def update_district(
    district_id: int,
    data: DistrictUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    if data.state_id:
        state = db.query(State).filter(State.id == data.state_id).first()
        if not state:
            raise HTTPException(status_code=404, detail="State not found")
        district.state_id = data.state_id

    if data.district_name:
        existing = db.query(District).filter(
            District.district_name.ilike(data.district_name.strip()),
            District.state_id == district.state_id,
            District.id != district_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="District already exists in this State")
        district.district_name = data.district_name.strip()

    db.commit()
    db.refresh(district)

    state_obj = db.query(State).filter(State.id == district.state_id).first()
    st_count = db.query(MonitoringStation).filter(MonitoringStation.district_id == district.id).count()
    v_count = db.query(Village).filter(Village.district_id == district.id).count()

    return DistrictResponse(
        id=district.id,
        district_name=district.district_name,
        state_id=district.state_id,
        state_name=state_obj.state_name if state_obj else "Unknown",
        station_count=st_count,
        village_count=v_count,
        status="Active",
        created_at=district.created_at,
        updated_at=district.updated_at
    )


@router.delete("/{district_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_district(
    district_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    district = db.query(District).filter(District.id == district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    st_count = db.query(MonitoringStation).filter(MonitoringStation.district_id == district_id).count()
    if st_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete district because {st_count} monitoring station(s) exist under it.")

    db.delete(district)
    db.commit()
    return None
