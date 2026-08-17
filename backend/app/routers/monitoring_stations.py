from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.deps import get_db
from app.models.monitoring_station import MonitoringStation
from app.models.district import District
from app.models.state import State
from app.models.user import User
from app.models.incident import Incident
from app.schemas.monitoring_station import (
    MonitoringStationCreate,
    MonitoringStationUpdate,
    MonitoringStationResponse,
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/monitoring-stations", tags=["Monitoring Stations"])


@router.get("", response_model=List[MonitoringStationResponse])
def get_monitoring_stations(
    district_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MonitoringStation)
    if district_id:
        query = query.filter(MonitoringStation.district_id == district_id)
    stations = query.all()

    res = []
    for st in stations:
        district_obj = db.query(District).filter(District.id == st.district_id).first()
        state_name = "Unknown"
        district_name = "Unknown"
        if district_obj:
            district_name = district_obj.district_name
            state_obj = db.query(State).filter(State.id == district_obj.state_id).first()
            if state_obj:
                state_name = state_obj.state_name

        officer_count = db.query(User).filter(
            User.station_id == st.id,
            User.role.in_(["Range Forest Officer", "Forest Guard"])
        ).count()

        head_officer_name = None
        if st.head_officer_id:
            head_user = db.query(User).filter(User.id == st.head_officer_id).first()
            if head_user:
                head_officer_name = head_user.full_name

        res.append(MonitoringStationResponse(
            id=st.id,
            station_name=st.station_name,
            district_id=st.district_id,
            address=st.address,
            phone=st.phone,
            email=st.email,
            latitude=st.latitude,
            longitude=st.longitude,
            status=st.status or "Active",
            description=st.description,
            district_name=district_name,
            state_name=state_name,
            officer_count=officer_count,
            head_officer_id=st.head_officer_id,
            head_officer_name=head_officer_name,
            created_at=st.created_at,
            updated_at=st.updated_at
        ))
    return res


@router.post("", response_model=MonitoringStationResponse, status_code=status.HTTP_201_CREATED)
def create_monitoring_station(
    data: MonitoringStationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    district = db.query(District).filter(District.id == data.district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="Selected District not found")

    existing = db.query(MonitoringStation).filter(
        MonitoringStation.station_name.ilike(data.station_name.strip()),
        MonitoringStation.district_id == data.district_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Station name already exists in this District")

    station = MonitoringStation(
        station_name=data.station_name.strip(),
        district_id=data.district_id,
        address=data.address,
        phone=data.phone,
        email=data.email,
        latitude=data.latitude,
        longitude=data.longitude,
        status=data.status or "Active",
        description=data.description
    )
    db.add(station)
    db.commit()
    db.refresh(station)

    state_obj = db.query(State).filter(State.id == district.state_id).first()

    return MonitoringStationResponse(
        id=station.id,
        station_name=station.station_name,
        district_id=station.district_id,
        address=station.address,
        phone=station.phone,
        email=station.email,
        latitude=station.latitude,
        longitude=station.longitude,
        status=station.status,
        description=station.description,
        district_name=district.district_name,
        state_name=state_obj.state_name if state_obj else "Unknown",
        officer_count=0,
        head_officer_id=None,
        head_officer_name=None,
        created_at=station.created_at,
        updated_at=station.updated_at
    )


@router.put("/{station_id}", response_model=MonitoringStationResponse)
def update_monitoring_station(
    station_id: int,
    data: MonitoringStationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    station = db.query(MonitoringStation).filter(MonitoringStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Monitoring Station not found")

    if data.district_id:
        district = db.query(District).filter(District.id == data.district_id).first()
        if not district:
            raise HTTPException(status_code=404, detail="Selected District not found")
        station.district_id = data.district_id

    if data.station_name:
        existing = db.query(MonitoringStation).filter(
            MonitoringStation.station_name.ilike(data.station_name.strip()),
            MonitoringStation.district_id == station.district_id,
            MonitoringStation.id != station_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Station name already exists in this District")
        station.station_name = data.station_name.strip()

    if data.address is not None:
        station.address = data.address
    if data.phone is not None:
        station.phone = data.phone
    if data.email is not None:
        station.email = data.email
    if data.latitude is not None:
        station.latitude = data.latitude
    if data.longitude is not None:
        station.longitude = data.longitude
    if data.status is not None:
        station.status = data.status
    if data.description is not None:
        station.description = data.description

    db.commit()
    db.refresh(station)

    district_obj = db.query(District).filter(District.id == station.district_id).first()
    state_name = "Unknown"
    district_name = "Unknown"
    if district_obj:
        district_name = district_obj.district_name
        state_obj = db.query(State).filter(State.id == district_obj.state_id).first()
        if state_obj:
            state_name = state_obj.state_name

    officer_count = db.query(User).filter(
        User.station_id == station.id,
        User.role.in_(["Range Forest Officer", "Forest Guard"])
    ).count()

    head_officer_name = None
    if station.head_officer_id:
        head_user = db.query(User).filter(User.id == station.head_officer_id).first()
        if head_user:
            head_officer_name = head_user.full_name

    return MonitoringStationResponse(
        id=station.id,
        station_name=station.station_name,
        district_id=station.district_id,
        address=station.address,
        phone=station.phone,
        email=station.email,
        latitude=station.latitude,
        longitude=station.longitude,
        status=station.status,
        description=station.description,
        district_name=district_name,
        state_name=state_name,
        officer_count=officer_count,
        head_officer_id=station.head_officer_id,
        head_officer_name=head_officer_name,
        created_at=station.created_at,
        updated_at=station.updated_at
    )


@router.delete("/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring_station(
    station_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    station = db.query(MonitoringStation).filter(MonitoringStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Monitoring Station not found")

    officers_count = db.query(User).filter(User.station_id == station_id).count()
    if officers_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete station: {officers_count} officer(s) are assigned to this station."
        )

    # Check incidents linked if any
    incidents_count = db.query(Incident).filter(Incident.station_id == station_id).count() if hasattr(Incident, 'station_id') else 0
    if incidents_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete station: {incidents_count} incident(s) are linked to this station."
        )

    db.delete(station)
    db.commit()
    return None
