from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.deps import get_db
from app.models.user import User
from app.models.designation import Designation
from app.models.monitoring_station import MonitoringStation
from app.models.village import Village
from app.models.officer_posting_history import OfficerPostingHistory
from app.models.notification import Notification
from app.schemas.user import (
    UserOut,
    OfficerCreate,
    OfficerUpdate,
    VillagerApprovalUpdate
)
from app.schemas.officer_transfer import OfficerTransferCreate, OfficerPostingHistoryOut
from app.core.security import hash_password
from app.services.auth_service import format_user_payload
from app.utils.deps import get_current_admin, get_current_user

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


def format_user_out(user: User, db: Session) -> UserOut:
    return format_user_payload(user)


@router.get("/me", response_model=UserOut)
def get_me_profile(current_user: User = Depends(get_current_user)):
    return format_user_payload(current_user)


@router.get("/profile", response_model=UserOut)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return format_user_payload(current_user)


# --- VILLAGER MANAGEMENT ---

@router.get("/villagers", response_model=List[UserOut])
def get_villagers(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    query = db.query(User).filter(User.role == "Villager")
    
    if status_filter == "pending":
        query = query.filter(User.is_verified == False)
    elif status_filter == "approved":
        query = query.filter(User.is_verified == True)
        
    villagers = query.order_by(User.created_at.desc()).all()
    return [format_user_out(v, db) for v in villagers]


@router.put("/villagers/{user_id}/approve", response_model=UserOut)
def approve_villager(
    user_id: int,
    data: VillagerApprovalUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    villager = db.query(User).filter(User.id == user_id, User.role == "Villager").first()
    if not villager:
        raise HTTPException(status_code=404, detail="Villager account not found")

    villager.is_verified = data.is_approved
    villager.is_active = data.is_approved
    
    db.commit()
    db.refresh(villager)
    return format_user_out(villager, db)


# --- OFFICER MANAGEMENT & STATIONS ---

@router.get("/officers", response_model=List[UserOut])
def get_officers(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    query = db.query(User).filter(User.role.in_(["Range Forest Officer", "Forest Guard", "Officer"]))
    if role:
        query = query.filter(User.role == role)
    
    officers = query.order_by(User.full_name.asc()).all()
    return [format_user_out(u, db) for u in officers]


@router.post("/officers", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_officer(
    data: OfficerCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    exists = db.query(User).filter(User.email == data.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    desig = db.query(Designation).filter(Designation.id == data.designation_id).first()
    if not desig:
        raise HTTPException(status_code=400, detail="Invalid designation ID")

    station = db.query(MonitoringStation).filter(MonitoringStation.id == data.station_id).first()
    if not station:
        raise HTTPException(status_code=400, detail="Invalid monitoring station ID")
    
    role = desig.designation_name
    is_act = True if (data.status is None or data.status == "Active") else False

    # Validation 1: Only ONE Range Forest Officer per Station
    if role in ["Range Forest Officer", "Officer"]:
        existing_rfo = db.query(User).filter(
            User.station_id == station.id,
            User.role.in_(["Range Forest Officer", "Officer"]),
            User.is_active == True
        ).first()
        if existing_rfo or station.head_officer_id:
            raise HTTPException(
                status_code=400,
                detail="This station already has a Range Forest Officer. Transfer or replace the existing officer first."
            )

    # Validation 2: Forest Guard requires a Range Forest Officer at Station
    if role == "Forest Guard":
        rfo_at_station = db.query(User).filter(
            User.station_id == station.id,
            User.role.in_(["Range Forest Officer", "Officer"]),
            User.is_active == True
        ).first()
        if not rfo_at_station and not station.head_officer_id:
            raise HTTPException(
                status_code=400,
                detail="This station currently has no assigned Range Forest Officer. Please assign a head officer before adding Forest Guards."
            )

    officer = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password=hash_password(data.temporary_password),
        role=role,
        designation_id=data.designation_id,
        station_id=data.station_id,
        station=station.station_name,
        is_verified=True,
        is_active=is_act,
        work_status="Available",
        must_change_password=False
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)

    # If created as Head RFO, set station head_officer_id and active status
    if role in ["Range Forest Officer", "Officer"]:
        station.head_officer_id = officer.id
        station.status = "Active"
        db.commit()

    return format_user_out(officer, db)


@router.put("/officers/{user_id}", response_model=UserOut)
def update_officer(
    user_id: int,
    data: OfficerUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    officer = db.query(User).filter(User.id == user_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    if data.full_name is not None:
        officer.full_name = data.full_name
    if data.email is not None:
        officer.email = data.email
    if data.phone is not None:
        officer.phone = data.phone
    if data.is_active is not None:
        officer.is_active = data.is_active
    if data.designation_id is not None:
        desig = db.query(Designation).filter(Designation.id == data.designation_id).first()
        if desig:
            officer.designation_id = desig.id
            officer.role = desig.designation_name

    db.commit()
    db.refresh(officer)
    return format_user_out(officer, db)


# --- OFFICER TRANSFER WORKFLOW & HISTORY ---

@router.post("/officers/{user_id}/transfer", response_model=UserOut)
def transfer_officer(
    user_id: int,
    data: OfficerTransferCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    officer = db.query(User).filter(User.id == user_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    new_station = db.query(MonitoringStation).filter(MonitoringStation.id == data.new_station_id).first()
    if not new_station:
        raise HTTPException(status_code=404, detail="Target monitoring station not found")

    old_station_id = officer.station_id
    old_station = db.query(MonitoringStation).filter(MonitoringStation.id == old_station_id).first() if old_station_id else None

    if old_station_id == data.new_station_id:
        raise HTTPException(status_code=400, detail="Officer is already assigned to this station.")

    # Validation for RFO transfer
    if officer.role in ["Range Forest Officer", "Officer"]:
        existing_rfo_new = db.query(User).filter(
            User.station_id == new_station.id,
            User.role.in_(["Range Forest Officer", "Officer"]),
            User.is_active == True,
            User.id != officer.id
        ).first()
        if existing_rfo_new or (new_station.head_officer_id and new_station.head_officer_id != officer.id):
            raise HTTPException(
                status_code=400,
                detail="This station already has a Range Forest Officer. Transfer or replace the existing officer first."
            )

        # Clear head officer on old station
        if old_station and old_station.head_officer_id == officer.id:
            old_station.head_officer_id = None
            old_station.status = "No Head Officer Assigned"

        # Assign head officer on new station
        new_station.head_officer_id = officer.id
        new_station.status = "Active"

    # Validation for Guard transfer
    if officer.role == "Forest Guard":
        if not new_station.head_officer_id:
            rfo = db.query(User).filter(
                User.station_id == new_station.id,
                User.role.in_(["Range Forest Officer", "Officer"]),
                User.is_active == True
            ).first()
            if not rfo:
                raise HTTPException(
                    status_code=400,
                    detail="This station currently has no assigned Range Forest Officer. Please assign a head officer before adding Forest Guards."
                )

    # Record Transfer History
    history_entry = OfficerPostingHistory(
        officer_id=officer.id,
        old_station_id=old_station_id,
        new_station_id=new_station.id,
        reason=data.reason,
        created_by=admin.id
    )
    db.add(history_entry)

    # Update Officer Record
    officer.station_id = new_station.id
    officer.station = new_station.station_name
    officer.work_status = "Available"

    # Create Notification
    db.add(Notification(
        user_id=officer.id,
        title="Station Transfer Completed",
        message=f"You have been transferred from {old_station.station_name if old_station else 'Unassigned'} to {new_station.station_name}."
    ))

    db.commit()
    db.refresh(officer)
    return format_user_out(officer, db)


@router.get("/officers/{user_id}/transfer-history", response_model=List[OfficerPostingHistoryOut])
def get_officer_transfer_history(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    history = db.query(OfficerPostingHistory).filter(
        OfficerPostingHistory.officer_id == user_id
    ).order_by(OfficerPostingHistory.created_at.desc()).all()

    out = []
    for h in history:
        out.append(OfficerPostingHistoryOut(
            id=h.id,
            officer_id=h.officer_id,
            officer_name=h.officer.full_name if h.officer else None,
            old_station_id=h.old_station_id,
            old_station_name=h.old_station.station_name if h.old_station else "Unassigned",
            new_station_id=h.new_station_id,
            new_station_name=h.new_station.station_name if h.new_station else "Unassigned",
            transfer_date=h.transfer_date,
            reason=h.reason,
            created_by_name=h.transfer_by.full_name if h.transfer_by else "Admin"
        ))
    return out


@router.put("/officers/{user_id}/toggle-status", response_model=UserOut)
def toggle_officer_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    officer = db.query(User).filter(User.id == user_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    officer.is_active = not officer.is_active
    db.commit()
    db.refresh(officer)
    return format_user_out(officer, db)


@router.delete("/officers/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_officer(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    officer = db.query(User).filter(User.id == user_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    # If officer was head officer of station, update station status
    if officer.station_id:
        st = db.query(MonitoringStation).filter(MonitoringStation.id == officer.station_id).first()
        if st and st.head_officer_id == officer.id:
            st.head_officer_id = None
            st.status = "No Head Officer Assigned"

    db.delete(officer)
    db.commit()
    return None


@router.get("/guards/available", response_model=List[UserOut])
def get_available_guards(
    station_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User).filter(
        User.role == "Forest Guard",
        User.is_active == True,
        User.work_status == "Available"
    )
    
    target_st_id = station_id or current_user.station_id
    if target_st_id:
        query = query.filter(User.station_id == target_st_id)
        
    guards = query.order_by(User.full_name.asc()).all()
    return [format_user_out(g, db) for g in guards]
