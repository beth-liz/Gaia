
import os
import uuid
import json
from fastapi import UploadFile, File, Form
from fastapi.responses import FileResponse
from app.utils.pdf_generator import generate_incident_pdf
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import os, uuid
from fpdf import FPDF
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.deps import get_db
from app.models.incident import Incident
from app.models.incident_assignment import IncidentAssignment
from app.models.incident_activity import IncidentActivity
from app.models.field_operation import FieldOperation
from app.models.notification import Notification
from app.models.user import User
from app.utils.deps import get_current_user, get_current_guard, get_current_rfo

router = APIRouter(
    prefix="/api/field-ops",
    tags=["Field Operations"]
)


def log_activity(db: Session, incident_id: int, user_id: int, action: str, remarks: Optional[str] = None):
    act = IncidentActivity(
        incident_id=incident_id,
        user_id=user_id,
        action=action,
        remarks=remarks
    )
    db.add(act)
    db.commit()


def get_or_create_field_op(db: Session, incident_id: int, guard_id: int) -> FieldOperation:
    field_op = db.query(FieldOperation).filter(
        FieldOperation.incident_id == incident_id
    ).first()

    if not field_op:
        assign = db.query(IncidentAssignment).filter(
            IncidentAssignment.incident_id == incident_id,
            IncidentAssignment.assigned_to_id == guard_id
        ).order_by(IncidentAssignment.assigned_at.desc()).first()

        field_op = FieldOperation(
            incident_id=incident_id,
            assignment_id=assign.id if assign else None,
            guard_id=guard_id,
            current_step="Pending Acceptance"
        )
        db.add(field_op)
        db.commit()
        db.refresh(field_op)

    return field_op


def format_field_op_out(op: FieldOperation):
    parsed_actions = []
    if op.actions_checklist:
        try:
            parsed_actions = json.loads(op.actions_checklist)
        except Exception:
            parsed_actions = [op.actions_checklist]

    return {
        "id": op.id,
        "incident_id": op.incident_id,
        "guard_id": op.guard_id,
        "guard_name": op.guard.full_name if op.guard else "Forest Guard",
        "current_step": op.current_step or "Pending Acceptance",
        "departure_time": op.departure_time,
        "vehicle": op.vehicle,
        "acceptance_remarks": op.acceptance_remarks,
        "travelling_start_time": op.travelling_start_time,
        "travelling_gps": op.travelling_gps,
        "travelling_remarks": op.travelling_remarks,
        "arrival_time": op.arrival_time,
        "arrival_gps": op.arrival_gps,
        "arrival_weather": op.arrival_weather,
        "arrival_remarks": op.arrival_remarks,
        "animal_present": op.animal_present,
        "animal_count": op.animal_count,
        "animal_behaviour": op.animal_behaviour,
        "threat_level": op.threat_level,
        "human_injury": op.human_injury,
        "livestock_damage": op.livestock_damage,
        "property_damage": op.property_damage,
        "assessment_remarks": op.assessment_remarks,
        "actions_checklist": parsed_actions,
        "action_remarks": op.action_remarks,
        "outcome": op.outcome,
        "animal_direction": op.animal_direction,
        "distance_covered": op.distance_covered,
        "remaining_risk": op.remaining_risk,
        "situation_remarks": op.situation_remarks,
        "evidence_gps": op.evidence_gps,
        "reinforcement_requested": op.reinforcement_requested,
        "reinforcement_reason": op.reinforcement_reason,
        "reinforcement_priority": op.reinforcement_priority,
        "reinforcement_count": op.reinforcement_count,
        "reinforcement_status": op.reinforcement_status,
        "reinforcement_remarks": op.reinforcement_remarks,
        "report_generated_content": op.report_generated_content,
        "submitted_at": op.submitted_at.strftime("%Y-%m-%d %H:%M") if op.submitted_at else None,
        "updated_at": op.updated_at.strftime("%Y-%m-%d %H:%M") if op.updated_at else None
    }


@router.get("/{incident_id}/all")
def get_all_incident_field_ops(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ALL field operations for an incident — one per assigned guard.
    Used by the Head Officer progress view to see each guard's individual progress.
    """
    ops = db.query(FieldOperation).filter(
        FieldOperation.incident_id == incident_id
    ).order_by(FieldOperation.id.asc()).all()
    return [format_field_op_out(op) for op in ops]


@router.get("/{incident_id}")
def get_incident_field_op(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the calling user's own field operation for this incident (guard view)."""
    # If caller is a guard, show the field op
    op = db.query(FieldOperation).filter(
        FieldOperation.incident_id == incident_id
    ).first()
    if not op:
        # Fallback: first op in the incident (RFO/Admin viewing, or guard not yet assigned)
        op = db.query(FieldOperation).filter(
            FieldOperation.incident_id == incident_id
        ).first()
    if not op:
        # Create for guard caller
        op = get_or_create_field_op(db, incident_id, current_user.id)

    return format_field_op_out(op)


# STEP 1: ACCEPT MISSION
@router.post("/{incident_id}/accept")
def accept_mission(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")

    dep_time = payload.get("departure_time", datetime.utcnow().strftime("%H:%M")).strip()
    vehicle = payload.get("vehicle", "Forest Patrol Jeep").strip()
    remarks = payload.get("remarks", "").strip()

    op = get_or_create_field_op(db, incident_id, guard.id)

    # Update this specific Guard's IncidentAssignment status
    assignment = db.query(IncidentAssignment).filter(
        IncidentAssignment.incident_id == incident_id,
        IncidentAssignment.assigned_to_id == guard.id
    ).first()
    if assignment:
        assignment.status = "Accepted"
        
    db.commit()

    # Check all active assigned guards for this incident
    all_assignments = db.query(IncidentAssignment).filter(
        IncidentAssignment.incident_id == incident_id
    ).all()
    
    # We only care about latest assignment per guard in case of re-assignments
    latest_assignments = {}
    for a in all_assignments:
        if a.assigned_to_id not in latest_assignments or a.assigned_at > latest_assignments[a.assigned_to_id].assigned_at:
            latest_assignments[a.assigned_to_id] = a
            
    active_assignments = [a for a in latest_assignments.values() if a.status != "Removed"]
    
    all_accepted = True
    all_inventory_ready = True
    for a in active_assignments:
        if a.status != "Accepted" and a.status != "Completed":
            all_accepted = False
        if getattr(a, 'inventory_status', 'PENDING') not in ("READY", "NOT_REQUIRED"):
            all_inventory_ready = False

    # If this is the last guard to accept, OR if it's just a single guard, we can advance the mission
    op.departure_time = dep_time
    op.vehicle = vehicle
    op.acceptance_remarks = remarks
    
    if all_accepted:
        if all_inventory_ready:
            op.current_step = "Travelling"
        else:
            op.current_step = "Inventory Request"
    else:
        # Force it back to Pending Acceptance if not all accepted.
        if op.current_step in (None, "Pending Acceptance", "Inventory Request", "Travelling"):
            op.current_step = "Pending Acceptance"

    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        if inc.status not in ["Assigned", "Returned For Follow-up", "In Progress"]:
            raise HTTPException(status_code=400, detail="Cannot accept mission. Incident is not in Assigned or Returned state.")
        inc.status = "In Progress"
        inc.incident_status = "In Progress"
        db.commit()

    guard.work_status = "Busy"
    db.commit()

    log_activity(db, incident_id, guard.id, "Mission Accepted", f"Guard {guard.full_name} accepted mission. Vehicle: {vehicle}. Dep Time: {dep_time}.")
    return format_field_op_out(op)


# STEP 2: TRAVELLING
@router.post("/{incident_id}/no-inventory")
def declare_no_inventory(
    incident_id: int,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")
        
    assignment = db.query(IncidentAssignment).filter(
        IncidentAssignment.incident_id == incident_id,
        IncidentAssignment.assigned_to_id == guard.id,
        IncidentAssignment.status != 'Removed'
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=400, detail="Assignment not found.")
        
    assignment.inventory_status = "NOT_REQUIRED"
    db.commit()
    
    # Check if we can transition to travelling
    all_assignments = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == incident_id).all()
    latest_assignments = {}
    for a in all_assignments:
        if a.assigned_to_id not in latest_assignments or a.assigned_at > latest_assignments[a.assigned_to_id].assigned_at:
            latest_assignments[a.assigned_to_id] = a
            
    active_assignments = [a for a in latest_assignments.values() if a.status != "Removed"]
    
    all_accepted = True
    all_inventory_ready = True
    for a in active_assignments:
        if a.status not in ("Accepted", "Completed"):
            all_accepted = False
        if getattr(a, 'inventory_status', 'PENDING') not in ("READY", "NOT_REQUIRED"):
            all_inventory_ready = False
            
    op = get_or_create_field_op(db, incident_id, guard.id)
    if all_accepted and all_inventory_ready:
        op.current_step = "Travelling"
        db.commit()
        
    return format_field_op_out(op)

@router.post("/{incident_id}/step-travelling")
def step_travelling(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")
        
    # Get latest active assignments for this incident
    all_assignments = db.query(IncidentAssignment).filter(IncidentAssignment.incident_id == incident_id).all()
    latest_assignments = {}
    for a in all_assignments:
        if a.assigned_to_id not in latest_assignments or a.assigned_at > latest_assignments[a.assigned_to_id].assigned_at:
            latest_assignments[a.assigned_to_id] = a
            
    active_assignments = [a for a in latest_assignments.values() if a.status != "Removed"]
    
    pending_guards = []
    pending_inventory_guards = []
    
    for a in active_assignments:
        if a.status != "Accepted" and a.status != "Completed":
            # get name
            guard_user = db.query(User).filter(User.id == a.assigned_to_id).first()
            if guard_user:
                pending_guards.append(guard_user.full_name)
        elif getattr(a, 'inventory_status', 'PENDING') not in ("READY", "NOT_REQUIRED"):
            guard_user = db.query(User).filter(User.id == a.assigned_to_id).first()
            if guard_user:
                pending_inventory_guards.append(guard_user.full_name)
                
    if pending_guards:
        if len(pending_guards) == 1:
            msg = f"Waiting for {pending_guards[0]} to accept the mission before field operations can begin."
        elif len(pending_guards) == 2:
            msg = f"Waiting for {pending_guards[0]} and {pending_guards[1]} to accept the mission before field operations can begin."
        else:
            msg = f"Waiting for {', '.join(pending_guards[:-1])} and {pending_guards[-1]} to accept the mission before field operations can begin."
        raise HTTPException(status_code=400, detail=msg)
        
    if pending_inventory_guards:
        msg = f"Waiting for {', '.join(pending_inventory_guards)}'s inventory to be dispatched before travelling."
        raise HTTPException(status_code=400, detail=msg)

    op = get_or_create_field_op(db, incident_id, guard.id)
    op.travelling_start_time = payload.get("start_time", datetime.utcnow().strftime("%H:%M"))
    op.travelling_gps = payload.get("gps", "11.6667 N, 76.3667 E")
    op.travelling_remarks = payload.get("remarks", "").strip()
    op.current_step = "Reached Site"
    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        
        
        db.commit()

    log_activity(db, incident_id, guard.id, "Travelling", f"Guard en-route to field site. GPS: {op.travelling_gps}.")
    return format_field_op_out(op)


# STEP 3: REACHED SITE
@router.post("/{incident_id}/step-reached-site")
def step_reached_site(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    op = get_or_create_field_op(db, incident_id, guard.id)
    op.arrival_time = payload.get("arrival_time", datetime.utcnow().strftime("%H:%M"))
    op.arrival_gps = payload.get("gps", "11.6667 N, 76.3667 E")
    op.arrival_weather = payload.get("arrival_weather", "Sunny / Clear")
    op.arrival_remarks = payload.get("remarks", "").strip()
    op.current_step = "Initial Assessment"
    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        
        
        db.commit()

    log_activity(db, incident_id, guard.id, "Reached Site", f"Guard arrived at field site @ {op.arrival_time}. Weather: {op.arrival_weather}.")
    return format_field_op_out(op)


# STEP 4: INITIAL ASSESSMENT
@router.post("/{incident_id}/step-assessment")
def step_initial_assessment(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    op = get_or_create_field_op(db, incident_id, guard.id)
    op.animal_present = payload.get("animal_present", True)
    op.animal_count = payload.get("animal_count", 1)
    op.animal_behaviour = payload.get("animal_behaviour", "Calm")
    op.threat_level = payload.get("threat_level", "Medium")
    op.human_injury = payload.get("human_injury", False)
    op.livestock_damage = payload.get("livestock_damage", False)
    op.property_damage = payload.get("property_damage", False)
    op.assessment_remarks = payload.get("remarks", "").strip()
    op.current_step = "Action In Progress"
    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        
        
        db.commit()

    log_activity(db, incident_id, guard.id, "Initial Assessment", f"Assessment Completed: {op.animal_count} {op.animal_behaviour} animal(s). Threat: {op.threat_level}.")
    return format_field_op_out(op)


# STEP 5: ACTION TAKEN
@router.post("/{incident_id}/step-action-taken")
def step_action_taken(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    actions = payload.get("actions_checklist", [])
    remarks = payload.get("remarks", "").strip()

    if not remarks:
        raise HTTPException(status_code=400, detail="Action remarks are mandatory.")

    op = get_or_create_field_op(db, incident_id, guard.id)
    op.actions_checklist = json.dumps(actions) if isinstance(actions, list) else str(actions)
    op.action_remarks = remarks
    op.current_step = "Situation Controlled"
    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        
        
        db.commit()

    actions_str = ", ".join(actions) if isinstance(actions, list) else str(actions)
    log_activity(db, incident_id, guard.id, "Action Taken", f"Field Action: {actions_str}. Remarks: {remarks}")
    return format_field_op_out(op)


# STEP 6: SITUATION CONTROLLED
@router.post("/{incident_id}/step-situation-controlled")
def step_situation_controlled(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    op = get_or_create_field_op(db, incident_id, guard.id)
    op.outcome = payload.get("outcome", "Animal Chased into Core Forest").strip()
    op.animal_direction = payload.get("animal_direction", "Core Sanctuary Range").strip()
    op.distance_covered = payload.get("distance", "1.5 km").strip()
    op.remaining_risk = payload.get("remaining_risk", "Low").strip()
    op.situation_remarks = payload.get("remarks", "").strip()
    op.current_step = "Evidence Uploaded"
    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        
        
        db.commit()

    log_activity(db, incident_id, guard.id, "Situation Controlled", f"Outcome: {op.outcome}. Direction: {op.animal_direction}. Risk: {op.remaining_risk}.")
    return format_field_op_out(op)


# STEP 7: EVIDENCE UPLOAD
@router.post("/{incident_id}/step-evidence")
async def step_evidence_upload(
    incident_id: int,
    gps: str = Form("11.6667 N, 76.3667 E"),
    photos: list[UploadFile] | None = File(None),
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")
    op = get_or_create_field_op(db, incident_id, guard.id)
    op.evidence_gps = gps
    op.current_step = "Final Report"
    
    upload_dir = os.path.join("app", "static", "uploads", "evidence")
    os.makedirs(upload_dir, exist_ok=True)
    
    saved_photos = []
    if photos:
        for photo in photos:
            ext = os.path.splitext(photo.filename)[1] or ".jpg"
            filename = f"ev_{incident_id}_{uuid.uuid4().hex[:8]}{ext}"
            file_path = os.path.join(upload_dir, filename)
            with open(file_path, "wb") as f:
                f.write(await photo.read())
            saved_photos.append(f"/static/uploads/evidence/{filename}")
    
    import json
    op.evidence_photos = json.dumps(saved_photos)
    db.commit()

    log_activity(db, incident_id, guard.id, "Evidence Uploaded", f"Field Evidence Captured. Uploaded {len(photos)} photos.")
    return format_field_op_out(op)


# REINFORCEMENT REQUEST
@router.post("/{incident_id}/request-reinforcement")
def request_reinforcement(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    reason = payload.get("reason", "").strip()
    priority = payload.get("priority", "High")
    count = payload.get("count", 2)
    remarks = payload.get("remarks", "").strip()

    if not reason:
        raise HTTPException(status_code=400, detail="Reinforcement reason is required.")

    op = get_or_create_field_op(db, incident_id, guard.id)
    op.reinforcement_requested = True
    op.reinforcement_reason = reason
    op.reinforcement_priority = priority
    op.reinforcement_count = count
    op.reinforcement_status = "Requested"
    op.reinforcement_remarks = remarks
    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()

    # Notify Head Officer / RFO
    rfos = db.query(User).filter(
        User.station_id == (inc.station_id if inc else guard.station_id),
        User.role.in_(["Range Forest Officer", "Officer", "Admin"])
    ).all()

    for rfo in rfos:
        db.add(Notification(
            user_id=rfo.id,
            title=f"⚠ Reinforcement Requested [{inc.reference_id if inc else incident_id}]",
            message=f"Guard {guard.full_name} requested {count} additional officers. Reason: {reason} ({priority} Priority)."
        ))
    db.commit()

    log_activity(db, incident_id, guard.id, "Reinforcement Requested", f"Requested {count} officers ({priority} Priority). Reason: {reason}")
    return format_field_op_out(op)


# REINFORCEMENT APPROVAL
@router.post("/{incident_id}/approve-reinforcement")
def approve_reinforcement(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    op = db.query(FieldOperation).filter(FieldOperation.incident_id == incident_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Field operation not found.")

    op.reinforcement_status = "Approved"
    db.commit()

    log_activity(db, incident_id, current_user.id, "Reinforcement Approved", f"Reinforcement request approved by Head Officer {current_user.full_name}.")

    if op.guard_id:
        db.add(Notification(
            user_id=op.guard_id,
            title="Reinforcement Request Approved",
            message=f"Head Officer {current_user.full_name} approved your reinforcement request. Additional officers assigned."
        ))
        db.commit()

    return format_field_op_out(op)



import os
import uuid
from fastapi import UploadFile, File, Form


# AUTOMATED FINAL REPORT GENERATION

@router.post("/{incident_id}/generate-report")
async def generate_final_report(
    incident_id: int,
    signature_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")

    op = get_or_create_field_op(db, incident_id, guard.id)
    inc = db.query(Incident).filter(Incident.id == incident_id).first()

    # Save Signature
    upload_dir = os.path.join("app", "static", "uploads", "signatures")
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = os.path.splitext(signature_image.filename)[1] or ".jpg"
    filename = f"sig_{incident_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path_sig = os.path.join(upload_dir, filename)

    with open(file_path_sig, "wb") as f:
        contents = await signature_image.read()
        f.write(contents)
        
    op.officer_signature = f"/static/uploads/signatures/{filename}"
    db.commit()

    # Generate PDF
    report_dir = os.path.join("app", "static", "reports")
    os.makedirs(report_dir, exist_ok=True)
    pdf_filename = f"Gaia_Incident_INC-{inc.reference_id or incident_id}_Final_Report.pdf"
    pdf_path = os.path.join(report_dir, pdf_filename)
    
    activities = db.query(IncidentActivity).filter(IncidentActivity.incident_id == incident_id).order_by(IncidentActivity.created_at.asc()).all()

    generate_incident_pdf(inc, op, activities, guard, pdf_path)
    
    op.report_generated_content = f"/static/reports/{pdf_filename}"
    db.commit()

    return {"pdf_url": op.report_generated_content, "message": "Report generated successfully"}



@router.post("/{incident_id}/upload-report")
async def upload_manual_report(
    incident_id: int,
    report_pdf: UploadFile = File(...),
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can upload reports.")

    if not report_pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed for manual report upload.")

    op = get_or_create_field_op(db, incident_id, guard.id)
    inc = db.query(Incident).filter(Incident.id == incident_id).first()

    report_dir = os.path.join("app", "static", "reports")
    os.makedirs(report_dir, exist_ok=True)
    
    pdf_filename = f"Gaia_Incident_INC-{inc.reference_id or incident_id}_Manual_Report_{uuid.uuid4().hex[:8]}.pdf"
    pdf_path = os.path.join(report_dir, pdf_filename)

    with open(pdf_path, "wb") as f:
        contents = await report_pdf.read()
        f.write(contents)
        
    op.report_generated_content = f"/static/reports/{pdf_filename}"
    db.commit()

    return op


@router.post("/{incident_id}/step-return-inventory")
def step_return_inventory(
    incident_id: int,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")
        
    op = get_or_create_field_op(db, incident_id, guard.id)
    op.current_step = "Return Inventory"
    db.commit()
    
    return format_field_op_out(op)

@router.post("/{incident_id}/submit-report")

def submit_final_report(
    incident_id: int,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")

    op = get_or_create_field_op(db, incident_id, guard.id)
    inc = db.query(Incident).filter(Incident.id == incident_id).first()

    if not op.report_generated_content:
        raise HTTPException(status_code=400, detail="Final report PDF has not been generated yet.")

    now = datetime.utcnow()
    op.submitted_at = now
    op.current_step = "Final Report Submitted"
    db.commit()

    if inc:
        inc.status = "Awaiting Verification"
        inc.incident_status = "Awaiting Verification"
        db.commit()

    log_activity(db, incident_id, guard.id, "Final Report Submitted", f"Automated Field Report submitted by Guard {guard.full_name}.")

    rfos = db.query(User).filter(
        User.station_id == (inc.station_id if inc else guard.station_id),
        User.role.in_(["Range Forest Officer", "Officer", "Admin"])
    ).all()
    for rfo in rfos:
        db.add(Notification(
            user_id=rfo.id,
            title=f"Final Report Ready [INC-{inc.reference_id or incident_id}]",
            message=f"Guard {guard.full_name} submitted the final field report."
        ))
    db.commit()

    return format_field_op_out(op)
