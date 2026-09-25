import sys, re, json, datetime
with open('backend/app/routers/field_ops.py', 'r') as f:
    content = f.read()

new_endpoints = '''
import os
import uuid
from fastapi import UploadFile, File, Form

# AUTOMATED FINAL REPORT GENERATION
@router.post("/{incident_id}/generate-report")
def generate_final_report(
    incident_id: int,
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")

    op = get_or_create_field_op(db, incident_id, guard.id)
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    now = datetime.utcnow()

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
**Generation Time:** {now.strftime('%Y-%m-%d %H:%M:%S UTC')}

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
"""

    op.report_generated_content = report_markdown
    db.commit()
    
    return {"markdown": report_markdown}


# SUBMIT FINAL REPORT
@router.post("/{incident_id}/submit-report")
async def submit_final_report(
    incident_id: int,
    signature_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    guard: User = Depends(get_current_user)
):
    if guard.role != "Forest Guard":
        raise HTTPException(status_code=403, detail="Only assigned Forest Guards can update field operation progress.")

    op = get_or_create_field_op(db, incident_id, guard.id)
    inc = db.query(Incident).filter(Incident.id == incident_id).first()

    now = datetime.utcnow()
    op.submitted_at = now
    op.current_step = "Final Report Submitted"

    upload_dir = os.path.join("app", "static", "uploads", "signatures")
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = os.path.splitext(signature_image.filename)[1] or ".jpg"
    filename = f"sig_{incident_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        contents = await signature_image.read()
        f.write(contents)
        
    op.officer_signature = f"/static/uploads/signatures/{filename}"
    
    if op.report_generated_content:
        op.report_generated_content += f"\\n\\n### 5. OFFICER SIGNATURE & VALIDATION\\n**Verified & Signed By:** ![Signature]({op.officer_signature})\\n**Designation:** {guard.role}\\n**Timestamp:** {now.strftime('%Y-%m-%d %H:%M')}\\n"

    db.commit()

    if inc:
        inc.status = "Awaiting Verification"
        inc.incident_status = "Awaiting Verification"
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
'''

pattern = r'# AUTOMATED FINAL REPORT GENERATION & SUBMISSION.*?@router\.post\(\"/{incident_id}/generate-submit-report\"\).*?return format_field_op_out\(op\)'
content = re.sub(pattern, new_endpoints, content, flags=re.DOTALL)

with open('backend/app/routers/field_ops.py', 'w') as f:
    f.write(content)

print('Success')
