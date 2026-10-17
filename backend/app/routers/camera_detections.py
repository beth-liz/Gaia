from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database.deps import get_db
from app.models.camera_detection_event import CameraDetectionEvent
from app.models.camera_capture import CameraCapture
from app.utils.deps import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/camera-detections", tags=["Camera Detections"])

class RejectRequest(BaseModel):
    reason: str

@router.get("/")
def get_camera_detections(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to access camera detections")

    query = db.query(CameraDetectionEvent).options(
        joinedload(CameraDetectionEvent.camera),
        joinedload(CameraDetectionEvent.monitoring_station),
        joinedload(CameraDetectionEvent.capture).joinedload(CameraCapture.ai_result),
        joinedload(CameraDetectionEvent.reviewer),
        joinedload(CameraDetectionEvent.incident)
    )
    
    if current_user.role != "Admin":
        query = query.filter(CameraDetectionEvent.monitoring_station_id == current_user.station_id)
        
    events = query.order_by(CameraDetectionEvent.detected_at.desc()).all()
    
    import os
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

    valid_events = []
    for ev in events:
        img_path = ev.capture.image_path if ev.capture else None
        if not img_path or not isinstance(img_path, str) or not img_path.strip():
            continue
        
        # Verify physical accessibility of file
        clean_img = img_path.strip()
        candidate1 = os.path.join(base_dir, "app", *clean_img.strip("/").split("/"))
        candidate2 = os.path.join(base_dir, *clean_img.strip("/").split("/"))
        if not (os.path.exists(candidate1) or os.path.exists(candidate2) or os.path.exists(clean_img)):
            continue
            
        valid_events.append(ev)

    return [
        {
            "id": ev.id,
            "event_code": f"CDE-{ev.id:06d}",
            "camera_id": ev.camera_id,
            "camera_name": ev.camera.camera_name if ev.camera else None,
            "camera_capture_id": ev.camera_capture_id,
            "image_path": ev.capture.image_path if ev.capture else None,
            "ai_result": ev.capture.ai_result[0].detections if ev.capture and ev.capture.ai_result else None,
            "monitoring_station_id": ev.monitoring_station_id,
            "station_name": ev.monitoring_station.station_name if ev.monitoring_station else None,
            "species": ev.species,
            "confidence": ev.confidence,
            "animal_count": ev.animal_count,
            "latitude": ev.latitude,
            "longitude": ev.longitude,
            "status": ev.status,
            "detected_at": ev.detected_at,
            "reviewed_by": ev.reviewer.full_name if ev.reviewer else None,
            "reviewed_at": ev.reviewed_at,
            "rejection_reason": ev.rejection_reason,
            "incident_reference_id": ev.incident.reference_id if ev.incident else None,
            "incident_id": ev.incident.id if ev.incident else None
        } for ev in valid_events
    ]

@router.get("/{id}")
def get_camera_detection_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    ev = db.query(CameraDetectionEvent).options(
        joinedload(CameraDetectionEvent.camera),
        joinedload(CameraDetectionEvent.monitoring_station),
        joinedload(CameraDetectionEvent.capture).joinedload(CameraCapture.ai_result),
        joinedload(CameraDetectionEvent.reviewer),
        joinedload(CameraDetectionEvent.incident)
    ).filter(CameraDetectionEvent.id == id).first()
    
    if not ev:
        raise HTTPException(status_code=404, detail="Camera detection event not found")
        
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to access camera detections")

    if current_user.role != "Admin" and ev.monitoring_station_id != current_user.station_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this detection event")
        
    return {
        "id": ev.id,
        "event_code": f"CDE-{ev.id:06d}",
        "camera_id": ev.camera_id,
        "camera_name": ev.camera.camera_name if ev.camera else None,
        "camera_capture_id": ev.camera_capture_id,
        "image_path": ev.capture.image_path if ev.capture else None,
        "ai_result": ev.capture.ai_result[0].detections if ev.capture and ev.capture.ai_result else None,
        "monitoring_station_id": ev.monitoring_station_id,
        "station_name": ev.monitoring_station.station_name if ev.monitoring_station else None,
        "species": ev.species,
        "confidence": ev.confidence,
        "animal_count": ev.animal_count,
        "latitude": ev.latitude,
        "longitude": ev.longitude,
        "status": ev.status,
        "detected_at": ev.detected_at,
        "reviewed_by": ev.reviewer.full_name if ev.reviewer else None,
        "reviewed_at": ev.reviewed_at,
        "rejection_reason": ev.rejection_reason,
        "incident_reference_id": ev.incident.reference_id if ev.incident else None,
        "incident_id": ev.incident.id if ev.incident else None
    }

@router.post("/{id}/accept")
def accept_camera_detection(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    ev = db.query(CameraDetectionEvent).options(
        joinedload(CameraDetectionEvent.camera),
        joinedload(CameraDetectionEvent.monitoring_station)
    ).filter(CameraDetectionEvent.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Camera detection event not found")
        
    if current_user.role not in ["Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to review camera detections. Only Range Forest Officers may accept camera incident candidates.")

    if current_user.role != "Admin" and ev.monitoring_station_id != current_user.station_id:
        raise HTTPException(status_code=403, detail="Not authorized to process this detection event")
        
    if ev.status != "PENDING_REVIEW":
        raise HTTPException(status_code=400, detail="Only pending detections can be accepted.")

    from app.models.incident import Incident
    from app.models.animal_species import AnimalSpecies
    from app.routers.incidents import generate_reference_id
    import json
    
    # Duplicate protection check
    existing_incident = db.query(Incident).filter(Incident.camera_detection_event_id == ev.id).first()
    if existing_incident:
        # State anomaly: just return the existing incident if somehow it was created but detection was not marked accepted
        ev.status = "ACCEPTED"
        ev.reviewed_by_id = current_user.id
        ev.reviewed_at = datetime.utcnow()
        db.commit()
        return {"status": "success", "event_status": ev.status, "incident_reference_id": existing_incident.reference_id}

    ev.status = "ACCEPTED"
    ev.reviewed_by_id = current_user.id
    ev.reviewed_at = datetime.utcnow()
    
    # Try to find species ID
    species_obj = db.query(AnimalSpecies).filter(AnimalSpecies.animal_name.ilike(ev.species)).first()
    
    # Use generate_reference_id from incidents router
    ref_id = generate_reference_id(db)
    
    title = f"{ev.species} Sighting via Camera {ev.camera.camera_name if ev.camera else 'AI'}"
    
    # Detailed description
    desc = f"Source: Camera AI Detection\n" \
           f"Detection ID: CDE-{ev.id:06d}\n" \
           f"Camera: {ev.camera.camera_name if ev.camera else 'Unknown'}\n" \
           f"Station: {ev.monitoring_station.station_name if ev.monitoring_station else 'Unknown'}\n\n" \
           f"Species: {ev.species}\n" \
           f"Approximate Count: {ev.animal_count}\n" \
           f"AI Confidence: {ev.confidence * 100:.1f}%\n"

    # Create normal Gaia Incident
    new_inc = Incident(
        reference_id=ref_id,
        incident_title=title,
        incident_category="Wildlife Sighting",
        animal_species_id=species_obj.id if species_obj else None,
        animal_type=ev.species,
        animal=ev.species,
        severity="High" if ev.species.lower() in ["tiger", "elephant", "leopard", "bear"] else "Medium",
        description=desc,
        latitude=ev.latitude,
        longitude=ev.longitude,
        location=ev.monitoring_station.station_name if ev.monitoring_station else "Camera Location",
        station_id=ev.monitoring_station_id,
        status="Pending Review", # standard initial state
        incident_status="Pending Review",
        reporter_role="System / Camera AI",
        photo_url=ev.capture.image_path if ev.capture else None,
        images=json.dumps([ev.capture.image_path]) if ev.capture and ev.capture.image_path else None,
        camera_detection_event_id=ev.id,
        date_reported=ev.detected_at.strftime("%Y-%m-%d") if ev.detected_at else datetime.utcnow().strftime("%Y-%m-%d"),
        time_reported=ev.detected_at.strftime("%H:%M") if ev.detected_at else datetime.utcnow().strftime("%H:%M")
    )
    db.add(new_inc)
    db.flush()
    
    # Also seed AnimalDetection record for this incident from the capture AI result so AIAssessmentCard is populated immediately
    from app.models.animal_detection import AnimalDetection
    from app.models.camera_capture_result import CameraCaptureAIResult

    ai_res = None
    if ev.camera_capture_id:
        ai_res = db.query(CameraCaptureAIResult).filter(CameraCaptureAIResult.capture_id == ev.camera_capture_id).first()

    if ai_res and ai_res.processing_status == "COMPLETED":
        animal_det = AnimalDetection(
            animal_name=ai_res.overall_species or ev.species or "Unknown",
            normalized_species=ai_res.overall_species or ev.species or "Unknown",
            confidence=ai_res.overall_confidence if ai_res.overall_confidence is not None else ev.confidence,
            count=ai_res.animal_count if ai_res.animal_count is not None else ev.animal_count,
            bounding_boxes=ai_res.detections or [],
            image_path=ev.capture.image_path if ev.capture else None,
            station_id=ev.monitoring_station_id,
            incident_id=new_inc.id,
            model_info="MegaDetector v5a.0.1 + Google SpeciesNet v4.0.3a (Edge Camera Pipeline)"
        )
        db.add(animal_det)
    elif ev.capture and ev.capture.image_path:
        # Fallback if no detailed CameraCaptureAIResult row was found: seed from CameraDetectionEvent summary
        animal_det = AnimalDetection(
            animal_name=ev.species or "Unknown",
            normalized_species=ev.species or "Unknown",
            confidence=ev.confidence or 0.0,
            count=ev.animal_count or 1,
            bounding_boxes=[],
            image_path=ev.capture.image_path,
            station_id=ev.monitoring_station_id,
            incident_id=new_inc.id,
            model_info="Camera Detection Telemetry"
        )
        db.add(animal_det)
    
    try:
        db.commit()
        db.refresh(ev)
        db.refresh(new_inc)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create incident: {str(e)}")
        
    return {"status": "success", "event_status": ev.status, "incident_reference_id": new_inc.reference_id}

@router.post("/{id}/reject")
def reject_camera_detection(
    id: int,
    payload: RejectRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    ev = db.query(CameraDetectionEvent).filter(CameraDetectionEvent.id == id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Camera detection event not found")
        
    if current_user.role not in ["Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to review camera detections. Only Range Forest Officers may reject camera incident candidates.")

    if current_user.role != "Admin" and ev.monitoring_station_id != current_user.station_id:
        raise HTTPException(status_code=403, detail="Not authorized to process this detection event")
        
    if ev.status != "PENDING_REVIEW":
        raise HTTPException(status_code=400, detail="Only pending detections can be rejected.")
        
    if not payload.reason or not payload.reason.strip():
        raise HTTPException(status_code=400, detail="Rejection reason is required.")
        
    ev.status = "REJECTED"
    ev.reviewed_by_id = current_user.id
    ev.reviewed_at = datetime.utcnow()
    ev.rejection_reason = payload.reason.strip()
    
    db.commit()
    db.refresh(ev)
    return {"status": "success", "event_status": ev.status}
