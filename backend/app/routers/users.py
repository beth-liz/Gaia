from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.deps import get_db
from app.models.user import User
from app.models.designation import Designation
from app.models.village import Village
from app.schemas.user import UserOut, OfficerCreate, OfficerUpdate, UserProfileUpdate
from app.core.security import hash_password, verify_password
from app.utils.deps import get_current_admin, get_current_user

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


def format_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_verified=user.is_verified,
        is_active=user.is_active,
        village_id=user.village_id,
        designation_id=user.designation_id,
        station=user.station,
        work_status=user.work_status or "Available",
        avatar_url=user.avatar_url,
        village_name=user.village.village_name if user.village else None,
        designation_name=user.designation.designation_name if user.designation else None,
        created_at=user.created_at
    )


# --- VILLAGER MANAGEMENT ---

@router.get("/villagers", response_model=List[UserOut])
def get_villagers(
    status: Optional[str] = None,  # 'pending', 'approved'
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    query = db.query(User).filter(User.role == "Villager")
    if status == "pending":
        query = query.filter(User.is_verified == False)
    elif status == "approved":
        query = query.filter(User.is_verified == True)
    
    users = query.order_by(User.created_at.desc()).all()
    return [format_user_out(u) for u in users]


@router.put("/villagers/{user_id}/approve", response_model=UserOut)
def approve_villager(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id, User.role == "Villager").first()
    if not user:
        raise HTTPException(status_code=404, detail="Villager not found")
    
    user.is_verified = True
    db.commit()
    db.refresh(user)
    return format_user_out(user)


@router.put("/villagers/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_villager(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id, User.role == "Villager").first()
    if not user:
        raise HTTPException(status_code=404, detail="Villager not found")
    
    db.delete(user)
    db.commit()
    return None


# --- OFFICER MANAGEMENT ---

@router.get("/officers", response_model=List[UserOut])
def get_officers(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    query = db.query(User).filter(User.role.in_(["Range Forest Officer", "Forest Guard"]))
    if role:
        query = query.filter(User.role == role)
    
    officers = query.order_by(User.full_name.asc()).all()
    return [format_user_out(u) for u in officers]


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
    
    role = desig.designation_name
    
    officer = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password=hash_password(data.temporary_password),
        role=role,
        designation_id=data.designation_id,
        station=data.station,
        is_verified=True,
        is_active=True,
        work_status="Available",
        must_change_password=True
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)
    return format_user_out(officer)


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
    if data.station is not None:
        officer.station = data.station
    if data.is_active is not None:
        officer.is_active = data.is_active
    if data.designation_id is not None:
        desig = db.query(Designation).filter(Designation.id == data.designation_id).first()
        if desig:
            officer.designation_id = desig.id
            officer.role = desig.designation_name

    db.commit()
    db.refresh(officer)
    return format_user_out(officer)


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
    return format_user_out(officer)


@router.delete("/officers/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_officer(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    officer = db.query(User).filter(User.id == user_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    db.delete(officer)
    db.commit()
    return None


@router.get("/guards/available", response_model=List[UserOut])
def get_available_guards(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Fetch Forest Guards who are Active and Available."""
    guards = db.query(User).filter(
        User.role == "Forest Guard",
        User.is_active == True,
        User.work_status == "Available"
    ).all()
    return [format_user_out(g) for g in guards]


# --- PROFILE ENDPOINTS ---

@router.get("/profile", response_model=UserOut)
def get_profile(user: User = Depends(get_current_user)):
    return format_user_out(user)


@router.put("/profile", response_model=UserOut)
def update_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.full_name:
        current_user.full_name = data.full_name
    if data.phone:
        current_user.phone = data.phone
    if data.avatar_url:
        current_user.avatar_url = data.avatar_url
    
    if data.new_password:
        if not data.current_password or not verify_password(data.current_password, current_user.password):
            raise HTTPException(status_code=400, detail="Current password incorrect")
        current_user.password = hash_password(data.new_password)
        current_user.must_change_password = False

    db.commit()
    db.refresh(current_user)
    return format_user_out(current_user)
