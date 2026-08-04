import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from app.database.deps import get_db
from app.models.incident import Incident
from app.models.animal_species import AnimalSpecies
from app.models.incident_assignment import IncidentAssignment
from app.models.incident_activity import IncidentActivity
from app.models.field_operation import FieldOperation
from app.models.notification import Notification
from app.models.user import User
from app.models.village import Village
from app.models.monitoring_station import MonitoringStation
from app.models.district import District
from app.models.state import State
from app.schemas.incident import IncidentCreate, IncidentOut, IncidentAssignMulti, AssignedOfficerOut
from app.schemas.incident_activity import IncidentActivityOut
from app.utils.deps import get_current_user, get_current_rfo, get_current_guard, get_current_officer_or_admin

router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"]
)


def generate_reference_id(db: Session) -> str:
    year = datetime.utcnow().year
    prefix = f"INC-{year}-"
    latest = db.query(Incident).filter(Incident.reference_id.like(f"{prefix}%")).order_by(Incident.id.desc()).first()
    
    if latest and latest.reference_id:
        try:
            seq_num = int(latest.reference_id.split("-")[-1]) + 1
        except ValueError:
            seq_num = db.query(Incident).count() + 1
    else:
        seq_num = db.query(Incident).count() + 1
        
    return f"{prefix}{seq_num:05d}"


def log_activity(db: Session, incident_id: int, user_id: int, action: str, remarks: Optional[str] = None):
    act = IncidentActivity(
        incident_id=incident_id,
        user_id=user_id,
        action=action,
        remarks=remarks
    )
    db.add(act)
    db.commit()


def format_incident_out(inc: Incident, db: Session, current_user: Optional[User] = None) -> IncidentOut:
    all_assignments = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == inc.id).order_by(IncidentAssignment.assigned_at.desc()).all()
    
    assigned_officers_list: List[AssignedOfficerOut] = []
    seen_officer_ids = set()

    for a in all_assignments:
        if a.assigned_to and a.assigned_to_id not in seen_officer_ids:
            seen_officer_ids.add(a.assigned_to_id)
            assigned_officers_list.append(AssignedOfficerOut(
                assignment_id=a.id,
                officer_id=a.assigned_to_id,
                full_name=a.assigned_to.full_name,
                designation=(a.assigned_to.designation.designation_name if a.assigned_to and a.assigned_to.designation else None) or a.assigned_to.role or "Forest Guard",
                work_status=a.assigned_to.work_status or "Available",
                avatar_url=a.assigned_to.avatar_url or a.assigned_to.profile_image,
                assigned_at=a.assigned_at.strftime("%Y-%m-%d %H:%M") if a.assigned_at else "",
                priority=a.priority or "High",
                estimated_response_time=a.estimated_response_time or "30 Mins",
                instructions=a.instructions or a.assignment_remarks or a.notes,
                dispatched_at=a.dispatched_at.strftime("%Y-%m-%d %H:%M") if a.dispatched_at else None
            ))

    first_assignment = all_assignments[0] if all_assignments else None
    assigned_guard_id = first_assignment.assigned_to_id if first_assignment else None
    assigned_guard_name = first_assignment.assigned_to.full_name if first_assignment and first_assignment.assigned_to else None
    assignment_notes = (first_assignment.notes or first_assignment.assignment_remarks) if first_assignment else None

    # Head Officer details for this station
    st_obj = db.query(MonitoringStation).filter(MonitoringStation.id == inc.station_id).first() if inc.station_id else None
    head_rfo_id = st_obj.head_officer_id if st_obj else None
    head_rfo_obj = db.query(User).filter(User.id == head_rfo_id).first() if head_rfo_id else None

    is_head_officer = False
    if current_user:
        if current_user.role != "Admin" and head_rfo_id and current_user.id == head_rfo_id:
            is_head_officer = True
        elif current_user.role in ["Range Forest Officer", "Officer"] and current_user.role != "Admin" and current_user.station_id == inc.station_id:
            is_head_officer = True

    parsed_images = []
    if inc.images:
        try:
            parsed_images = json.loads(inc.images)
        except Exception:
            parsed_images = [inc.images]
    elif inc.photo_url:
        parsed_images = [inc.photo_url]

    species_name = inc.animal_species_rel.animal_name if inc.animal_species_rel else inc.animal_type or inc.animal

    return IncidentOut(
        id=inc.id,
        reference_id=inc.reference_id or f"INC-2026-{inc.id:05d}",
        incident_title=inc.incident_title or f"{species_name} Sighting at {inc.location or 'Sector Range'}",
        incident_category=inc.incident_category or "Wildlife Sighting",
        animal_species_id=inc.animal_species_id,
        animal_species_name=species_name,
        animal_type=inc.animal_type or species_name,
        animal=species_name,
        severity=inc.severity,
        description=inc.description,
        latitude=inc.latitude,
        longitude=inc.longitude,
        location=inc.location or inc.address or "Sector Range",
        address=inc.address,
        village_id=inc.village_id,
        village_name=inc.village.village_name if inc.village else None,
        station_id=inc.station_id,
        station_name=inc.station_rel.station_name if inc.station_rel else None,
        district_id=inc.district_id,
        district_name=inc.district_rel.district_name if inc.district_rel else None,
        state_id=inc.state_id,
        state_name=inc.state_rel.state_name if inc.state_rel else None,
        weather=inc.weather or "Sunny",
        people_injured=inc.people_injured or False,
        livestock_damage=inc.livestock_damage or False,
        property_damage=inc.property_damage or False,
        crop_damage=inc.crop_damage or False,
        status=inc.status or "Pending Review",
        incident_status=inc.incident_status or inc.status or "Pending Review",
        reported_by=inc.reported_by or inc.reporter_id,
        reporter_name=inc.reporter_rel.full_name if inc.reporter_rel else (inc.reporter.full_name if inc.reporter else "Field User"),
        reporter_role=inc.reporter_role or (inc.reporter_rel.role if inc.reporter_rel else "Villager"),
        photo_url=inc.photo_url or (parsed_images[0] if parsed_images else None),
        images=parsed_images,
        contact_number=inc.contact_number,
        date_reported=inc.date_reported or inc.created_at.strftime("%Y-%m-%d"),
        time_reported=inc.time_reported or inc.created_at.strftime("%H:%M"),
        assigned_guard_id=assigned_guard_id,
        assigned_guard_name=assigned_guard_name,
        assignment_notes=assignment_notes,
        assigned_officers=assigned_officers_list,
        is_head_officer=is_head_officer,
        head_officer_id=head_rfo_id,
        head_officer_name=head_rfo_obj.full_name if head_rfo_obj else "Station Head Officer",
        verification_notes=inc.verification_notes,
        verification_time=inc.verification_time.strftime("%Y-%m-%d %H:%M") if inc.verification_time else None,
        verified_by_name=inc.verified_by.full_name if inc.verified_by else None,
        closed_at=inc.closed_at.strftime("%Y-%m-%d %H:%M") if inc.closed_at else None,
        closed_by_name=inc.closed_by.full_name if inc.closed_by else None,
        final_closure_remarks=inc.final_closure_remarks,
        created_at=inc.created_at
    )


@router.get("/analytics/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve operational analytics metrics."""
    total = db.query(Incident).count()
    active = db.query(Incident).filter(Incident.status != "Closed").count()
    closed = db.query(Incident).filter(Incident.status == "Closed").count()

    # Species frequency
    species_res = db.query(
        Incident.animal_type, func.count(Incident.id)
    ).group_by(Incident.animal_type).order_by(func.count(Incident.id).desc()).all()
    species_freq = [{"species": r[0] or "Wildlife", "count": r[1]} for r in species_res]

    # Station workload
    station_res = db.query(
        MonitoringStation.station_name, func.count(Incident.id)
    ).join(Incident, Incident.station_id == MonitoringStation.id).group_by(MonitoringStation.station_name).all()
    station_freq = [{"station": r[0], "count": r[1]} for r in station_res]

    return {
        "total_incidents": total,
        "active_incidents": active,
        "closed_incidents": closed,
        "avg_response_time_mins": 25.4,
        "avg_closure_time_hours": 3.8,
        "species_frequency": species_freq,
        "station_workload": station_freq,
        "active_guards": db.query(User).filter(User.role == "Forest Guard", User.is_active == True).count()
    }


@router.get("/queue", response_model=List[IncidentOut])
def get_rfo_incident_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident).filter(
        Incident.status.in_(["New", "Pending Review", "Under Review", "Pending", "Approved", "Awaiting Information", "Awaiting Officer Approval", "Final Report Submitted"])
    )
    if current_user.role != "Admin" and current_user.station_id:
        query = query.filter(Incident.station_id == current_user.station_id)

    incidents = query.order_by(Incident.created_at.desc()).all()
    return [format_incident_out(inc, db, current_user) for inc in incidents]


@router.get("/rfo/assignments")
def get_rfo_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    st_id = current_user.station_id
    query = db.query(IncidentAssignment).join(Incident, IncidentAssignment.incident_id == Incident.id)

    if current_user.role != "Admin" and st_id:
        query = query.filter(Incident.station_id == st_id)

    assignments = query.order_by(IncidentAssignment.assigned_at.desc()).all()

    out = []
    for a in assignments:
        latest_act = db.query(IncidentActivity).filter(
            IncidentActivity.incident_id == a.incident_id
        ).order_by(IncidentActivity.created_at.desc()).first()

        out.append({
            "id": a.id,
            "incident_id": a.incident_id,
            "incident_reference_id": a.incident.reference_id if a.incident else f"INC-{a.incident_id}",
            "incident_title": a.incident.incident_title if a.incident else "Wildlife Incident",
            "animal": a.incident.animal if a.incident else "Wildlife",
            "severity": a.incident.severity if a.incident else "Medium",
            "location": a.incident.location if a.incident else "Sector Range",
            "incident_status": a.incident.status if a.incident else a.status,
            "assigned_to_id": a.assigned_to_id,
            "assigned_to_name": a.assigned_to.full_name if a.assigned_to else "Forest Guard",
            "assigned_by_name": a.assigned_by.full_name if a.assigned_by else "Range Officer",
            "priority": a.priority or "High",
            "estimated_response_time": a.estimated_response_time or "30 Mins",
            "assignment_remarks": a.assignment_remarks or a.notes,
            "actions_taken": a.actions_taken,
            "damage_assessment": a.damage_assessment,
            "recommendations": a.recommendations,
            "latest_stage": latest_act.action if latest_act else a.status,
            "latest_update": latest_act.remarks if latest_act else "Dispatched to site",
            "latest_update_time": latest_act.created_at.strftime("%Y-%m-%d %H:%M") if latest_act else a.assigned_at.strftime("%Y-%m-%d %H:%M"),
            "assigned_at": a.assigned_at.strftime("%Y-%m-%d %H:%M"),
            "completed_at": a.completed_at.strftime("%Y-%m-%d %H:%M") if a.completed_at else None
        })
    return out


@router.post("/upload-images", response_model=List[str])
async def upload_incident_images(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 image uploads allowed per incident.")

    upload_dir = os.path.join("app", "static", "uploads", "incidents")
    os.makedirs(upload_dir, exist_ok=True)

    saved_urls = []
    for file in files:
        if not file.content_type.startswith("image/"):
            continue
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        filename = f"inc_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(upload_dir, filename)

        with open(file_path, "wb") as f:
            contents = await file.read()
            f.write(contents)

        saved_urls.append(f"/static/uploads/incidents/{filename}")

    return saved_urls


@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
def create_incident(
    data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "Forest Guard":
        raise HTTPException(status_code=403, detail="Forest Guards cannot create new incidents. Only Approved Villagers and RFOs can create incident reports.")

    species_obj = None
    if data.animal_species_id:
        species_obj = db.query(AnimalSpecies).filter(AnimalSpecies.id == data.animal_species_id).first()

    animal_name = species_obj.animal_name if species_obj else data.animal_type

    v_id = data.village_id or current_user.village_id
    v_obj = db.query(Village).filter(Village.id == v_id).first() if v_id else None
    
    st_id = data.station_id or current_user.station_id
    if not st_id and v_obj and v_obj.district_id:
        st_obj = db.query(MonitoringStation).filter(MonitoringStation.district_id == v_obj.district_id).first()
        if st_obj:
            st_id = st_obj.id

    dist_id = data.district_id
    if not dist_id and st_id:
        st_obj = db.query(MonitoringStation).filter(MonitoringStation.id == st_id).first()
        if st_obj:
            dist_id = st_obj.district_id
    if not dist_id and v_obj:
        dist_id = v_obj.district_id

    state_id = data.state_id
    if not state_id and dist_id:
        d_obj = db.query(District).filter(District.id == dist_id).first()
        if d_obj:
            state_id = d_obj.state_id

    ref_id = generate_reference_id(db)
    title = data.incident_title or f"{animal_name} Sighting"
    images_json = json.dumps(data.images) if data.images else None

    inc = Incident(
        reference_id=ref_id,
        incident_title=title,
        incident_category=data.incident_category or "Wildlife Sighting",
        animal_species_id=species_obj.id if species_obj else None,
        animal_type=animal_name,
        animal=animal_name,
        severity=data.severity or "Medium",
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        location=data.location or data.address or "Sector Range",
        address=data.address,
        village_id=v_id,
        station_id=st_id,
        district_id=dist_id,
        state_id=state_id,
        weather=data.weather or "Sunny",
        people_injured=data.people_injured or False,
        livestock_damage=data.livestock_damage or False,
        property_damage=data.property_damage or False,
        crop_damage=data.crop_damage or False,
        status="Reported",
        incident_status="Reported",
        reported_by=current_user.id,
        reporter_id=current_user.id,
        reporter_role=current_user.role,
        photo_url=data.images[0] if data.images else None,
        images=images_json,
        contact_number=data.contact_number or current_user.phone,
        date_reported=data.date_reported or datetime.utcnow().strftime("%Y-%m-%d"),
        time_reported=data.time_reported or datetime.utcnow().strftime("%H:%M")
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    log_activity(db, inc.id, current_user.id, "Reported", f"Villager/Reporter logged incident report [{ref_id}].")

    rfos = db.query(User).filter(
        User.station_id == st_id,
        User.role.in_(["Range Forest Officer", "Officer", "Admin"])
    ).all()
    for rfo in rfos:
        db.add(Notification(
            user_id=rfo.id,
            title=f"New Station Incident [{ref_id}]",
            message=f"{data.incident_category} ({animal_name}) reported at {inc.location}. Requires Review."
        ))
    db.commit()

    return format_incident_out(inc, db, current_user)


@router.get("", response_model=List[IncidentOut])
def get_incidents(
    status: Optional[str] = None,
    station_id: Optional[int] = None,
    district_id: Optional[int] = None,
    species_id: Optional[int] = None,
    severity: Optional[str] = None,
    date: Optional[str] = None,
    search: Optional[str] = None,
    my_reports_only: bool = False,
    assigned_to_me: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident)

    if current_user.role == "Villager" or my_reports_only:
        query = query.filter((Incident.reported_by == current_user.id) | (Incident.reporter_id == current_user.id))
    elif current_user.role in ["Range Forest Officer", "Officer"] and current_user.role != "Admin":
        if current_user.station_id:
            query = query.filter(Incident.station_id == current_user.station_id)
    elif current_user.role == "Forest Guard" or assigned_to_me:
        assignments = db.query(IncidentAssignment.incident_id).filter(
            IncidentAssignment.assigned_to_id == current_user.id
        ).all()
        assigned_ids = [a[0] for a in assignments]
        query = query.filter(Incident.id.in_(assigned_ids))

    if status and status != "all":
        query = query.filter((Incident.status.ilike(status)) | (Incident.incident_status.ilike(status)))
    if station_id:
        query = query.filter(Incident.station_id == station_id)
    if district_id:
        query = query.filter(Incident.district_id == district_id)
    if species_id:
        query = query.filter(Incident.animal_species_id == species_id)
    if severity and severity != "all":
        query = query.filter(Incident.severity.ilike(severity))
    if date:
        query = query.filter(Incident.date_reported == date)
    if search:
        s_term = f"%{search.strip()}%"
        query = query.filter(
            (Incident.reference_id.ilike(s_term)) |
            (Incident.incident_title.ilike(s_term)) |
            (Incident.animal_type.ilike(s_term)) |
            (Incident.location.ilike(s_term)) |
            (Incident.description.ilike(s_term))
        )

    incidents = query.order_by(Incident.created_at.desc()).all()
    return [format_incident_out(inc, db, current_user) for inc in incidents]


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident_by_id(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident record not found")
    return format_incident_out(inc, db, current_user)


@router.get("/{incident_id}/activities", response_model=List[IncidentActivityOut])
def get_incident_activities(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    activities = db.query(IncidentActivity).filter(
        IncidentActivity.incident_id == incident_id
    ).order_by(IncidentActivity.created_at.asc()).all()

    out = []
    for a in activities:
        out.append(IncidentActivityOut(
            id=a.id,
            incident_id=a.incident_id,
            user_id=a.user_id,
            user_name=a.user.full_name if a.user else "System",
            user_role=a.user.role if a.user else "System",
            action=a.action,
            remarks=a.remarks,
            created_at=a.created_at
        ))
    return out


# --- HEAD OFFICER PERMISSION CHECK ---

def verify_head_officer_permission(inc: Incident, user: User, db: Session):
    if user.role == "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin has read-only monitoring access. Operational actions can only be performed by the Station Head Officer."
        )

    st_obj = db.query(MonitoringStation).filter(MonitoringStation.id == inc.station_id).first() if inc.station_id else None
    head_officer_id = st_obj.head_officer_id if st_obj else None

    if head_officer_id and user.id == head_officer_id:
        return
    if user.role in ["Range Forest Officer", "Officer"] and user.station_id == inc.station_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only the Head Officer of the assigned monitoring station can perform operational actions."
    )


@router.post("/{incident_id}/approve", response_model=IncidentOut)
def approve_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    inc.status = "RFO Review"
    inc.incident_status = "RFO Review"
    db.commit()

    log_activity(db, inc.id, current_user.id, "Head Officer Approved", f"Incident verified and approved by Head Officer {current_user.full_name}.")
    return format_incident_out(inc, db, current_user)


@router.post("/{incident_id}/assign-multi", response_model=IncidentOut)
def assign_multiple_officers(
    incident_id: int,
    data: IncidentAssignMulti,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    if not data.officer_ids:
        raise HTTPException(status_code=400, detail="At least one officer must be selected for assignment.")

    selected_officers = db.query(User).filter(User.id.in_(data.officer_ids)).all()
    if len(selected_officers) != len(data.officer_ids):
        raise HTTPException(status_code=404, detail="One or more selected officers could not be found.")

    for off in selected_officers:
        if off.station_id != inc.station_id:
            raise HTTPException(
                status_code=400,
                detail=f"Officer {off.full_name} belongs to station #{off.station_id}, not incident station #{inc.station_id}."
            )
        if not off.is_active:
            raise HTTPException(status_code=400, detail=f"Officer {off.full_name} is inactive/suspended.")
        if off.work_status != "Available":
            raise HTTPException(status_code=400, detail=f"Officer {off.full_name} is currently {off.work_status} and cannot be assigned.")

    for off in selected_officers:
        assign = IncidentAssignment(
            incident_id=inc.id,
            assigned_by_id=current_user.id,
            assigned_to_id=off.id,
            priority=data.priority or "High",
            estimated_response_time=data.estimated_response_time or "30 Mins",
            instructions=data.instructions,
            mission_notes=data.mission_notes,
            assignment_category=data.assignment_category or "Field Patrol",
            emergency_level=data.emergency_level or "Level 2",
            status="Assigned"
        )
        db.add(assign)

        db.add(Notification(
            user_id=off.id,
            title=f"New Incident Assignment [{inc.reference_id}]",
            message=f"Head Officer {current_user.full_name} assigned you to '{inc.incident_title}' at {inc.location}."
        ))

        log_activity(db, inc.id, current_user.id, f"Officer Assigned: {off.full_name}", f"Assigned by Head Officer {current_user.full_name}. Priority: {data.priority}.")

    inc.status = "Officer Assignment"
    inc.incident_status = "Officer Assignment"
    db.commit()

    return format_incident_out(inc, db, current_user)


@router.post("/{incident_id}/dispatch", response_model=IncidentOut)
def dispatch_assigned_team(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    assignments = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == inc.id).all()
    if not assignments:
        raise HTTPException(status_code=400, detail="Cannot dispatch team. Zero officers assigned to this incident.")

    now = datetime.utcnow()
    dispatched_team_names = []
    for a in assignments:
        a.status = "Dispatched"
        a.dispatched_at = now
        a.dispatched_by_id = current_user.id

        if a.assigned_to:
            a.assigned_to.work_status = "Busy"
            dispatched_team_names.append(a.assigned_to.full_name)

            db.add(Notification(
                user_id=a.assigned_to.id,
                title=f"Field Mission Dispatched [{inc.reference_id}]",
                message=f"Head Officer {current_user.full_name} has dispatched you for incident '{inc.incident_title}' at {inc.location}."
            ))

    inc.status = "Dispatched"
    inc.incident_status = "Dispatched"
    db.commit()

    team_str = ", ".join(dispatched_team_names) if dispatched_team_names else "Field Officers"
    log_activity(db, inc.id, current_user.id, "Mission Dispatched", f"Team ({team_str}) dispatched by Head Officer {current_user.full_name}.")

    return format_incident_out(inc, db, current_user)


# --- REPORT REVIEW, VERIFICATION & CLOSURE ---

@router.post("/{incident_id}/approve-report", response_model=IncidentOut)
def approve_field_report(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    inc.status = "Report Approved"
    inc.incident_status = "Report Approved"
    db.commit()

    log_activity(db, inc.id, current_user.id, "Report Approved", f"Field Report approved by Head Officer {current_user.full_name}. Ready for Verification.")

    if inc.reported_by:
        db.add(Notification(
            user_id=inc.reported_by,
            title=f"Report Approved [{inc.reference_id}]",
            message=f"Field report for incident '{inc.incident_title}' has been reviewed and approved by Range Command."
        ))
        db.commit()

    return format_incident_out(inc, db, current_user)


@router.post("/{incident_id}/return-report", response_model=IncidentOut)
def return_field_report(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    remarks = payload.get("remarks", "").strip()
    if not remarks:
        raise HTTPException(status_code=400, detail="Correction remarks are required.")

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    inc.status = "Returned for Revision"
    inc.incident_status = "Returned for Revision"
    db.commit()

    log_activity(db, inc.id, current_user.id, "Report Returned", f"Field report returned for revision by Head Officer {current_user.full_name}. Notes: {remarks}")

    # Notify Guard
    op = db.query(FieldOperation).filter(FieldOperation.incident_id == inc.id).first()
    if op and op.guard_id:
        db.add(Notification(
            user_id=op.guard_id,
            title=f"Report Returned [{inc.reference_id}]",
            message=f"Head Officer {current_user.full_name} returned report for correction: {remarks}"
        ))
        db.commit()

    return format_incident_out(inc, db, current_user)


@router.post("/{incident_id}/verify", response_model=IncidentOut)
def verify_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notes = payload.get("notes", "").strip()
    if not notes:
        raise HTTPException(status_code=400, detail="Verification notes are required.")

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    if inc.status not in ["Report Approved", "Verified", "Closed"]:
        raise HTTPException(status_code=400, detail="Cannot verify incident before report approval.")

    now = datetime.utcnow()
    inc.status = "Verified"
    inc.incident_status = "Verified"
    inc.verification_notes = notes
    inc.verification_time = now
    inc.verified_by_id = current_user.id
    db.commit()

    log_activity(db, inc.id, current_user.id, "Verified", f"Incident verified by Head Officer {current_user.full_name}. Notes: {notes}")
    return format_incident_out(inc, db, current_user)


@router.post("/{incident_id}/close", response_model=IncidentOut)
def close_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    remarks = payload.get("remarks", "").strip()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    if inc.status not in ["Verified", "Closed"]:
        raise HTTPException(status_code=400, detail="Only verified incidents may be closed.")

    now = datetime.utcnow()
    inc.status = "Closed"
    inc.incident_status = "Closed"
    inc.closed_at = now
    inc.closed_by_id = current_user.id
    inc.final_closure_remarks = remarks or "Incident operation verified and closed."
    db.commit()

    # Release assigned officers back to Available
    assignments = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == inc.id).all()
    for a in assignments:
        if a.assigned_to:
            a.assigned_to.work_status = "Available"

    log_activity(db, inc.id, current_user.id, "Closed", f"Incident closed by Head Officer {current_user.full_name}. Final Remarks: {remarks}")

    if inc.reported_by:
        db.add(Notification(
            user_id=inc.reported_by,
            title=f"Incident Closed [{inc.reference_id}]",
            message=f"Incident '{inc.incident_title}' has been successfully verified and closed."
        ))
        db.commit()

    return format_incident_out(inc, db, current_user)


@router.post("/{incident_id}/reject", response_model=IncidentOut)
def reject_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reason = payload.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required.")

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    inc.status = "Rejected"
    inc.incident_status = "Rejected"
    db.commit()

    log_activity(db, inc.id, current_user.id, "Rejected", f"Incident rejected by Head Officer {current_user.full_name}. Reason: {reason}")
    return format_incident_out(inc, db, current_user)


@router.post("/{incident_id}/request-info", response_model=IncidentOut)
def request_info_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Request message is required.")

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    verify_head_officer_permission(inc, current_user, db)

    inc.status = "Awaiting Information"
    inc.incident_status = "Awaiting Information"
    db.commit()

    log_activity(db, inc.id, current_user.id, "Requested Information", f"More info requested by Head Officer {current_user.full_name}: {message}")
    return format_incident_out(inc, db, current_user)


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident record not found")

    if current_user.role != "Admin" and inc.reported_by != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied to delete this incident.")

    db.delete(inc)
    db.commit()
    return None
