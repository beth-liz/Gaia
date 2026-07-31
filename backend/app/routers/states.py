from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db
from app.models.state import State
from app.models.district import District
from app.schemas.state import StateCreate, StateUpdate, StateResponse
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/states", tags=["States"])


@router.get("", response_model=List[StateResponse])
def get_states(db: Session = Depends(get_db)):
    states = db.query(State).all()
    res = []
    for s in states:
        d_count = db.query(District).filter(District.state_id == s.id).count()
        res.append(StateResponse(
            id=s.id,
            state_name=s.state_name,
            district_count=d_count,
            created_at=s.created_at,
            updated_at=s.updated_at
        ))
    return res


@router.post("", response_model=StateResponse, status_code=status.HTTP_201_CREATED)
def create_state(
    data: StateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    existing = db.query(State).filter(State.state_name.ilike(data.state_name.strip())).first()
    if existing:
        raise HTTPException(status_code=400, detail="State with this name already exists")

    state = State(state_name=data.state_name.strip())
    db.add(state)
    db.commit()
    db.refresh(state)

    return StateResponse(
        id=state.id,
        state_name=state.state_name,
        district_count=0,
        created_at=state.created_at,
        updated_at=state.updated_at
    )


@router.put("/{state_id}", response_model=StateResponse)
def update_state(
    state_id: int,
    data: StateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    state = db.query(State).filter(State.id == state_id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    if data.state_name:
        existing = db.query(State).filter(
            State.state_name.ilike(data.state_name.strip()),
            State.id != state_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="State with this name already exists")
        state.state_name = data.state_name.strip()

    db.commit()
    db.refresh(state)

    d_count = db.query(District).filter(District.state_id == state.id).count()
    return StateResponse(
        id=state.id,
        state_name=state.state_name,
        district_count=d_count,
        created_at=state.created_at,
        updated_at=state.updated_at
    )


@router.delete("/{state_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_state(
    state_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    state = db.query(State).filter(State.id == state_id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    # Check if districts exist
    d_count = db.query(District).filter(District.state_id == state_id).count()
    if d_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete state because {d_count} district(s) are linked to it."
        )

    db.delete(state)
    db.commit()
    return None
