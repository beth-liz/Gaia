import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.deps import get_db
from app.models.incident import Incident
from app.models.animal_species import AnimalSpecies
from app.models.incident_assignment import IncidentAssignment
from app.models.incident_activity import IncidentActivity
from app.models.notification import Notification
from app.models.user import User
from app.models.village import Village
from app.models.monitoring_station import MonitoringStation
from app.models.district import District
from app.models.state import State
from app.schemas.incident import IncidentCreate, IncidentOut
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


def format_incident_out(inc: Incident, db: Session) -> IncidentOut:
    assignment = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == inc.id).order_by(IncidentAssignment.assigned_at.desc()).first()
    
    assigned_guard_id = assignment.assigned_to_id if assignment else None
    assigned_guard_name = assignment.assigned_to.full_name if assignment and assignment.assigned_to else None
    assignment_notes = (assignment.notes or assignment.assignment_remarks) if assignment else None

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
        created_at=inc.created_at
    )


@router.get("/queue", response_model=List[IncidentOut])
def get_rfo_incident_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve NEW and UNDER REVIEW incidents belonging ONLY to the logged-in officer's station."""
    query = db.query(Incident).filter(
        Incident.status.in_(["New", "Pending Review", "Under Review", "Pending", "Awaiting Information"])
    )
    if current_user.role != "Admin" and current_user.station_id:
        query = query.filter(Incident.station_id == current_user.station_id)

    incidents = query.order_by(Incident.created_at.desc()).all()
    return [format_incident_out(inc, db) for inc in incidents]


@router.get("/rfo/assignments")
def get_rfo_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all assignments issued by or belonging to the logged-in RFO's station."""
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
        status="Pending Review",
        incident_status="Pending Review",
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

    log_activity(db, inc.id, current_user.id, "Created", f"Incident reported by {current_user.full_name} ({current_user.role}).")

    # Notify Range Officers in Station
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

    return format_incident_out(inc, db)


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

    # Scoping
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

    # Filters
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
    return [format_incident_out(inc, db) for inc in incidents]


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident_by_id(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident record not found")
    return format_incident_out(inc, db)


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


# --- RFO DECISION ENDPOINTS ---

@router.post("/{incident_id}/reject", response_model=IncidentOut)
def reject_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    rfo=Depends(get_current_rfo)
):
    reason = payload.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required.")

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "Rejected"
    inc.incident_status = "Rejected"
    db.commit()

    log_activity(db, inc.id, rfo.id, "Rejected", f"Incident rejected by {rfo.full_name}. Reason: {reason}")

    if inc.reported_by:
        db.add(Notification(
            user_id=inc.reported_by,
            title=f"Incident [{inc.reference_id}] Rejected",
            message=f"Your incident report has been rejected. Reason: {reason}"
        ))
        db.commit()

    return format_incident_out(inc, db)


@router.post("/{incident_id}/request-info", response_model=IncidentOut)
def request_info_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    rfo=Depends(get_current_rfo)
):
    message = payload.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Request message is required.")

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "Awaiting Information"
    inc.incident_status = "Awaiting Information"
    db.commit()

    log_activity(db, inc.id, rfo.id, "Requested Information", f"More info requested by {rfo.full_name}: {message}")

    if inc.reported_by:
        db.add(Notification(
            user_id=inc.reported_by,
            title=f"More Info Required [{inc.reference_id}]",
            message=f"Range Officer requested additional information: {message}"
        ))
        db.commit()

    return format_incident_out(inc, db)


@router.post("/{incident_id}/verify-close", response_model=IncidentOut)
def verify_and_close_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    rfo=Depends(get_current_rfo)
):
    remarks = payload.get("remarks", "").strip()
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "Closed"
    inc.incident_status = "Closed"
    db.commit()

    log_activity(db, inc.id, rfo.id, "Verified & Closed", f"Verified and closed without field dispatch. Remarks: {remarks or 'No field visit required.'}")

    if inc.reported_by:
        db.add(Notification(
            user_id=inc.reported_by,
            title=f"Incident Closed [{inc.reference_id}]",
            message=f"Your incident report has been verified and closed by Range Forest Officer."
        ))
        db.commit()

    return format_incident_out(inc, db)


@router.post("/{incident_id}/assign", response_model=IncidentOut)
def assign_guard_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    rfo=Depends(get_current_rfo)
):
    guard_id = payload.get("assigned_to_id")
    priority = payload.get("priority", "High")
    estimated_time = payload.get("estimated_response_time", "30 Mins")
    remarks = payload.get("remarks", "").strip() or payload.get("notes", "").strip()

    if not guard_id:
        raise HTTPException(status_code=400, detail="Guard selection is required.")

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    guard = db.query(User).filter(User.id == guard_id, User.role == "Forest Guard").first()
    if not guard:
        raise HTTPException(status_code=404, detail="Selected Forest Guard not found.")

    if guard.work_status != "Available":
        raise HTTPException(status_code=400, detail=f"Guard {guard.full_name} is currently {guard.work_status} and cannot be assigned.")

    # Create assignment record
    assign = IncidentAssignment(
        incident_id=inc.id,
        assigned_by_id=rfo.id,
        assigned_to_id=guard.id,
        priority=priority,
        estimated_response_time=estimated_time,
        assignment_remarks=remarks,
        notes=remarks,
        status="Assigned"
    )
    db.add(assign)

    # Update Guard Work Status to Busy
    guard.work_status = "Busy"

    # Update Incident Status to Assigned
    inc.status = "Assigned"
    inc.incident_status = "Assigned"
    db.commit()

    log_activity(db, inc.id, rfo.id, "Assigned", f"Dispatched Forest Guard {guard.full_name} (Priority: {priority}, Est. Time: {estimated_time}). Remarks: {remarks or 'Immediate sector response required.'}")

    # Notify Guard
    db.add(Notification(
        user_id=guard.id,
        title=f"New Field Incident Assigned [{inc.reference_id}]",
        message=f"Priority: {priority}. You have been assigned to incident '{inc.incident_title}' at {inc.location}. Est response: {estimated_time}."
    ))
    db.commit()

    return format_incident_out(inc, db)


# --- GUARD FIELD WORKFLOW ENDPOINTS ---

@router.post("/{incident_id}/field-update", response_model=IncidentOut)
def field_update_incident(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard=Depends(get_current_guard)
):
    step_name = payload.get("step_name", "").strip()
    remarks = payload.get("remarks", "").strip()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if step_name in ["Travelling", "Reached Site", "Assessment Completed", "Action Taken"]:
        inc.status = "In Progress"
        inc.incident_status = "In Progress"
        db.commit()

    log_activity(db, inc.id, guard.id, step_name or "Updated", f"Guard Progress: {step_name}. Remarks: {remarks}")
    return format_incident_out(inc, db)


@router.post("/{incident_id}/submit-report", response_model=IncidentOut)
def submit_final_field_report(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard=Depends(get_current_guard)
):
    actions_taken = payload.get("actions_taken", "").strip()
    animal_observed = payload.get("animal_observed", "").strip()
    damage_assessment = payload.get("damage_assessment", "").strip()
    recommendations = payload.get("recommendations", "").strip()
    remarks = payload.get("remarks", "").strip()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "Awaiting Officer Approval"
    inc.incident_status = "Awaiting Officer Approval"

    # Update assignment
    assign = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == inc.id).order_by(IncidentAssignment.assigned_at.desc()).first()
    if assign:
        assign.actions_taken = actions_taken
        assign.damage_assessment = damage_assessment
        assign.recommendations = recommendations
        assign.completed_at = datetime.utcnow()
        assign.status = "Awaiting Officer Approval"

    summary = f"Field Report Submitted by {guard.full_name}. Actions: {actions_taken}. Observed: {animal_observed}. Assessment: {damage_assessment}. Recs: {recommendations}."
    db.commit()

    log_activity(db, inc.id, guard.id, "Resolved", summary)

    # Notify RFO of Station
    rfos = db.query(User).filter(
        User.station_id == inc.station_id,
        User.role.in_(["Range Forest Officer", "Officer", "Admin"])
    ).all()
    for rfo in rfos:
        db.add(Notification(
            user_id=rfo.id,
            title=f"Field Report Submitted [{inc.reference_id}]",
            message=f"Guard {guard.full_name} has completed field operation and submitted final report for Range Officer approval."
        ))
    db.commit()

    return format_incident_out(inc, db)


# --- RFO FINAL REVIEW ENDPOINTS ---

@router.post("/{incident_id}/approve-close", response_model=IncidentOut)
def approve_report_and_close(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    rfo=Depends(get_current_rfo)
):
    remarks = payload.get("remarks", "").strip()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "Closed"
    inc.incident_status = "Closed"

    # Set assigned guard work status back to Available
    assignment = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == inc.id).order_by(IncidentAssignment.assigned_at.desc()).first()
    if assignment:
        assignment.status = "Closed"
        assignment.completed_at = datetime.utcnow()
        if assignment.assigned_to:
            assignment.assigned_to.work_status = "Available"

    db.commit()

    log_activity(db, inc.id, rfo.id, "Closed", f"Report approved & incident closed by Range Officer {rfo.full_name}. Remarks: {remarks or 'Operation completed.'}")

    # Notify Guard & Reporter
    if assignment and assignment.assigned_to_id:
        db.add(Notification(
            user_id=assignment.assigned_to_id,
            title=f"Field Report Approved [{inc.reference_id}]",
            message=f"Your field report for incident '{inc.incident_title}' has been approved by RFO. Station status set to Available."
        ))

    if inc.reported_by:
        db.add(Notification(
            user_id=inc.reported_by,
            title=f"Incident Resolved & Closed [{inc.reference_id}]",
            message=f"Your wildlife incident report has been fully resolved and closed by Range Forest Command."
        ))

    db.commit()
    return format_incident_out(inc, db)


@router.post("/{incident_id}/return-correction", response_model=IncidentOut)
def return_report_for_correction(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    rfo=Depends(get_current_rfo)
):
    correction_notes = payload.get("correction_notes", "").strip() or payload.get("remarks", "").strip()
    if not correction_notes:
        raise HTTPException(status_code=400, detail="Correction notes are required when returning a report.")

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    inc.status = "In Progress"
    inc.incident_status = "In Progress"
    db.commit()

    log_activity(db, inc.id, rfo.id, "Returned for Correction", f"Returned for correction by {rfo.full_name}. Notes: {correction_notes}")

    assignment = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == inc.id).order_by(IncidentAssignment.assigned_at.desc()).first()
    if assignment:
        assignment.status = "In Progress"
        if assignment.assigned_to_id:
            db.add(Notification(
                user_id=assignment.assigned_to_id,
                title=f"Report Returned for Correction [{inc.reference_id}]",
                message=f"Range Officer returned your report for correction: {correction_notes}"
            ))
            db.commit()

    return format_incident_out(inc, db)


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
