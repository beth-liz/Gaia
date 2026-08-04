import json
from fastapi import APIRouter, Depends, HTTPException, status
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
        FieldOperation.incident_id == incident_id,
        FieldOperation.guard_id == guard_id
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


@router.get("/{incident_id}")
def get_incident_field_op(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get active field operation state for an incident."""
    op = db.query(FieldOperation).filter(FieldOperation.incident_id == incident_id).first()
    if not op:
        # Create for caller if guard
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
    dep_time = payload.get("departure_time", datetime.utcnow().strftime("%H:%M")).strip()
    vehicle = payload.get("vehicle", "Forest Patrol Jeep").strip()
    remarks = payload.get("remarks", "").strip()

    op = get_or_create_field_op(db, incident_id, guard.id)

    op.departure_time = dep_time
    op.vehicle = vehicle
    op.acceptance_remarks = remarks
    op.current_step = "Travelling"
    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        inc.status = "Travelling"
        inc.incident_status = "Travelling"
        db.commit()

    guard.work_status = "Busy"
    db.commit()

    log_activity(db, incident_id, guard.id, "Mission Accepted", f"Guard {guard.full_name} accepted mission. Vehicle: {vehicle}. Dep Time: {dep_time}.")
    return format_field_op_out(op)


# STEP 2: TRAVELLING
@router.post("/{incident_id}/step-travelling")
def step_travelling(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    op = get_or_create_field_op(db, incident_id, guard.id)
    op.travelling_start_time = payload.get("start_time", datetime.utcnow().strftime("%H:%M"))
    op.travelling_gps = payload.get("gps", "11.6667 N, 76.3667 E")
    op.travelling_remarks = payload.get("remarks", "").strip()
    op.current_step = "Reached Site"
    db.commit()

    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if inc:
        inc.status = "Travelling"
        inc.incident_status = "Travelling"
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
        inc.status = "Reached Site"
        inc.incident_status = "Reached Site"
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
        inc.status = "Initial Assessment"
        inc.incident_status = "Initial Assessment"
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
        inc.status = "Action In Progress"
        inc.incident_status = "Action In Progress"
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
        inc.status = "Situation Controlled"
        inc.incident_status = "Situation Controlled"
        db.commit()

    log_activity(db, incident_id, guard.id, "Situation Controlled", f"Outcome: {op.outcome}. Direction: {op.animal_direction}. Risk: {op.remaining_risk}.")
    return format_field_op_out(op)


# STEP 7: EVIDENCE UPLOAD
@router.post("/{incident_id}/step-evidence")
def step_evidence_upload(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    op = get_or_create_field_op(db, incident_id, guard.id)
    op.evidence_gps = payload.get("gps", "11.6667 N, 76.3667 E")
    op.current_step = "Final Report Submitted"
    db.commit()

    log_activity(db, incident_id, guard.id, "Evidence Uploaded", f"Field Evidence Captured. GPS: {op.evidence_gps}.")
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


# AUTOMATED FINAL REPORT GENERATION & SUBMISSION
@router.post("/{incident_id}/generate-submit-report")
def generate_and_submit_final_report(
    incident_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    signature = payload.get("signature", guard.full_name).strip()

    op = get_or_create_field_op(db, incident_id, guard.id)
    inc = db.query(Incident).filter(Incident.id == incident_id).first()

    now = datetime.utcnow()
    op.submitted_at = now
    op.officer_signature = signature
    op.current_step = "Final Report Submitted"

    # Compile Automated Report Markdown Content
    actions_list = []
    if op.actions_checklist:
        try:
            actions_list = json.loads(op.actions_checklist)
        except Exception:
            actions_list = [op.actions_checklist]

    guard_desig = (guard.designation.designation_name if guard and guard.designation else None) or guard.role or "Forest Guard"

    report_markdown = f"""
# OFFICIAL FIELD OPERATION MISSION REPORT
**Reference ID:** {inc.reference_id if inc else incident_id}
**Station Range:** {inc.station_name if inc else 'Muthanga HQ'}
**Dispatched Guard:** {guard.full_name} ({guard_desig})
**Submission Time:** {now.strftime('%Y-%m-%d %H:%M:%S UTC')}

---

### 1. TIMELINE & DEPLOYMENT
- **Departure Time:** {op.departure_time or 'N/A'} (Vehicle: {op.vehicle or 'Forest Patrol'})
- **Site Arrival:** {op.arrival_time or 'N/A'} @ GPS Coordinates: {op.arrival_gps or 'Captured'}
- **Weather Conditions:** {op.arrival_weather or 'Clear'}

---

### 2. INITIAL FIELD ASSESSMENT
- **Animal Observed:** {'Yes' if op.animal_present else 'No'} ({op.animal_count} count, Behaviour: {op.animal_behaviour})
- **Threat Level:** {op.threat_level}
- **Damage Summary:** Human Injury: {'YES' if op.human_injury else 'NO'}, Livestock: {'YES' if op.livestock_damage else 'NO'}, Property: {'YES' if op.property_damage else 'NO'}
- **Assessment Notes:** {op.assessment_remarks or 'Verified at site.'}

---

### 3. ACTIONS TAKEN & OPERATIONS
- **Action Checklist:** {', '.join(actions_list) if actions_list else 'Patrol & Monitoring'}
- **Field Remarks:** {op.action_remarks or 'Field operation executed cleanly.'}

---

### 4. SITUATION CONTROLLED & OUTCOME
- **Final Outcome:** {op.outcome or 'Animal Chased into Core Forest'}
- **Animal Direction:** {op.animal_direction or 'Core Sanctuary'}
- **Distance Covered:** {op.distance_covered or '1.2 km'}
- **Remaining Risk Level:** {op.remaining_risk or 'Low'}

---

### 5. OFFICER SIGNATURE & VALIDATION
**Verified & Signed By:** {signature}
**Designation:** {guard_desig}
**Timestamp:** {now.strftime('%Y-%m-%d %H:%M')}
"""

    op.report_generated_content = report_markdown
    db.commit()

    if inc:
        inc.status = "Awaiting Officer Approval"
        inc.incident_status = "Awaiting Officer Approval"
        db.commit()

    log_activity(db, incident_id, guard.id, "Final Report Submitted", f"Automated Field Report submitted by Guard {guard.full_name}.")

    # Notify Station RFO
    rfos = db.query(User).filter(
        User.station_id == (inc.station_id if inc else guard.station_id),
        User.role.in_(["Range Forest Officer", "Officer", "Admin"])
    ).all()

    for rfo in rfos:
        db.add(Notification(
            user_id=rfo.id,
            title=f"Field Report Submitted [{inc.reference_id if inc else incident_id}]",
            message=f"Guard {guard.full_name} submitted automated field report for RFO review."
        ))
    db.commit()

    return format_field_op_out(op)
