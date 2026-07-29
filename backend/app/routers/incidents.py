from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.deps import get_db
from app.models.incident import Incident
from app.models.incident_assignment import IncidentAssignment
from app.models.notification import Notification
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentAssign, IncidentStatusUpdate, IncidentOut
from app.utils.deps import get_current_user, get_current_rfo, get_current_guard, get_current_villager

router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"]
)


def format_incident_out(inc: Incident, db: Session) -> IncidentOut:
    assignment = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == inc.id).order_by(IncidentAssignment.assigned_at.desc()).first()
    
    assigned_guard_id = assignment.assigned_to_id if assignment else None
    assigned_guard_name = assignment.assigned_to.full_name if assignment and assignment.assigned_to else None
    assignment_notes = assignment.notes if assignment else None

    return IncidentOut(
        id=inc.id,
        reporter_id=inc.reporter_id,
        reporter_name=inc.reporter.full_name if inc.reporter else "Unknown",
        village_id=inc.village_id,
        village_name=inc.village.village_name if inc.village else "Unknown",
        animal=inc.animal,
        location=inc.location,
        severity=inc.severity,
        description=inc.description,
        status=inc.status,
        photo_url=inc.photo_url,
        contact_number=inc.contact_number,
        date_reported=inc.date_reported or inc.created_at.strftime("%Y-%m-%d"),
        time_reported=inc.time_reported or inc.created_at.strftime("%H:%M"),
        assigned_guard_id=assigned_guard_id,
        assigned_guard_name=assigned_guard_name,
        assignment_notes=assignment_notes,
        created_at=inc.created_at
    )


@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Villagers report a new wildlife incident."""
    inc = Incident(
        reporter_id=current_user.id,
        village_id=data.village_id,
        animal=data.animal,
        location=data.location,
        severity=data.severity,
        description=data.description,
        status="Pending",
        photo_url=data.photo_url,
        contact_number=data.contact_number or current_user.phone,
        date_reported=data.date_reported or datetime.utcnow().strftime("%Y-%m-%d"),
        time_reported=data.time_reported or datetime.utcnow().strftime("%H:%M")
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    # Notify RFOs and Admins about new incident
    rfos = db.query(User).filter(User.role.in_(["Range Forest Officer", "Admin"])).all()
    for rfo in rfos:
        db.add(Notification(
            user_id=rfo.id,
            title="New Incident Reported",
            message=f"New {data.severity} severity incident ({data.animal}) reported at {data.location}."
        ))
    db.commit()

    return format_incident_out(inc, db)


@router.get("", response_model=List[IncidentOut])
def get_incidents(
    status: Optional[str] = None,
    my_reports_only: bool = False,
    assigned_to_me: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident)

    if my_reports_only:
        query = query.filter(Incident.reporter_id == current_user.id)
    elif assigned_to_me and current_user.role == "Forest Guard":
        assignments = db.query(IncidentAssignment.incident_id).filter(
            IncidentAssignment.assigned_to_id == current_user.id
        ).all()
        inc_ids = [a[0] for a in assignments]
        query = query.filter(Incident.id.in_(inc_ids))

    if status:
        query = query.filter(Incident.status == status)

    incidents = query.order_by(Incident.created_at.desc()).all()
    return [format_incident_out(inc, db) for inc in incidents]


@router.post("/{incident_id}/assign", response_model=IncidentOut)
def assign_incident(
    incident_id: int,
    data: IncidentAssign,
    db: Session = Depends(get_db),
    current_rfo: User = Depends(get_current_rfo)
):
    """Range Forest Officer assigns an incident to an available Forest Guard."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    guard = db.query(User).filter(
        User.id == data.assigned_to_id,
        User.role == "Forest Guard"
    ).first()

    if not guard:
        raise HTTPException(status_code=400, detail="Invalid Forest Guard selection")
    
    if guard.work_status != "Available":
        raise HTTPException(status_code=400, detail="Forest Guard is currently busy on another incident")

    # Update incident status
    inc.status = "Assigned"

    # Set guard status to Busy
    guard.work_status = "Busy"

    # Create assignment record
    assignment = IncidentAssignment(
        incident_id=inc.id,
        assigned_by_id=current_rfo.id,
        assigned_to_id=guard.id,
        status="Assigned",
        notes=data.notes
    )
    db.add(assignment)

    # Notify Guard
    db.add(Notification(
        user_id=guard.id,
        title="Incident Assigned to You",
        message=f"You have been assigned to handle incident #{inc.id} ({inc.animal} at {inc.location})."
    ))

    # Notify Reporter
    if inc.reporter_id:
        db.add(Notification(
            user_id=inc.reporter_id,
            title="Incident Assignment Update",
            message=f"Your reported incident ({inc.animal}) has been assigned to Forest Guard {guard.full_name}."
        ))

    db.commit()
    db.refresh(inc)
    return format_incident_out(inc, db)


@router.post("/{incident_id}/update-status", response_model=IncidentOut)
def update_incident_status(
    incident_id: int,
    data: IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Forest Guard or RFO updates incident status / completes incident."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    inc.status = data.status

    # If completed or rejected, release the guard to Available status
    if data.status in ["Completed", "Rejected"]:
        latest_assignment = db.query(IncidentAssignment).filter(
            IncidentAssignment.incident_id == inc.id
        ).order_by(IncidentAssignment.assigned_at.desc()).first()

        if latest_assignment:
            guard = db.query(User).filter(User.id == latest_assignment.assigned_to_id).first()
            if guard:
                guard.work_status = "Available"
            latest_assignment.status = data.status
            if data.notes:
                latest_assignment.notes = data.notes
            if data.report_url:
                latest_assignment.report_url = data.report_url

    # Notify Reporter
    if inc.reporter_id:
        db.add(Notification(
            user_id=inc.reporter_id,
            title=f"Incident Status: {data.status}",
            message=f"Status for your reported incident ({inc.animal}) has been updated to {data.status}."
        ))

    db.commit()
    db.refresh(inc)
    return format_incident_out(inc, db)
