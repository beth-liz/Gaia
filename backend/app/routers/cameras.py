from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database.deps import get_db
from app.models.camera import Camera
from app.models.monitoring_station import MonitoringStation
from app.schemas.camera import CameraCreate, CameraOut
from app.utils.deps import get_current_user
from app.core.security import verify_token
from app.services.ai_service import get_ai_service

router = APIRouter(prefix="/api/cameras", tags=["Cameras"])

@router.get("/station/{station_id}")
def get_cameras_for_station(
    station_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # RBAC logic: Admins can see all. Range Forest Officers can only see their station.
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to access camera monitoring")
        
    if current_user.role != "Admin":
        if current_user.station_id != station_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this station's cameras")
            
    cameras = db.query(Camera).filter(Camera.monitoring_station_id == station_id).all()
    
    # Return formatted data
    result = []
    for c in cameras:
        result.append({
            "id": c.id,
            "camera_name": c.camera_name,
            "camera_code": c.camera_code,
            "monitoring_station_id": c.monitoring_station_id,
            "location_name": c.location_name,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "status": c.status,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        })
    return result

@router.get("/")
def get_all_cameras(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admins can view all cameras")
    cameras = db.query(Camera).all()
    result = []
    for c in cameras:
        result.append({
            "id": c.id,
            "camera_name": c.camera_name,
            "camera_code": c.camera_code,
            "monitoring_station_id": c.monitoring_station_id,
            "location_name": c.location_name,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "status": c.status,
            "created_at": c.created_at,
            "updated_at": c.updated_at
        })
    return result

@router.post("/", status_code=201)
def create_camera(
    data: CameraCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # RBAC: Only Admin, Range Forest Officer, and Officer can add cameras
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to register cameras")

    # If not Admin, station must match current_user.station_id
    if current_user.role != "Admin":
        if not current_user.station_id:
            raise HTTPException(status_code=400, detail="Officer has no assigned monitoring station")
        if data.monitoring_station_id != current_user.station_id:
            raise HTTPException(
                status_code=403, 
                detail="Officers can only register cameras for their assigned monitoring station"
            )

    # Verify monitoring station exists
    station = db.query(MonitoringStation).filter(MonitoringStation.id == data.monitoring_station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Selected monitoring station does not exist")

    # Check unique camera code (case-insensitive)
    existing_code = db.query(Camera).filter(Camera.camera_code.ilike(data.camera_code.strip())).first()
    if existing_code:
        raise HTTPException(
            status_code=400, 
            detail=f"Camera code '{data.camera_code}' is already registered to camera '{existing_code.camera_name}'"
        )

    # Create new Camera
    new_cam = Camera(
        camera_name=data.camera_name.strip(),
        camera_code=data.camera_code.strip().upper(),
        monitoring_station_id=data.monitoring_station_id,
        location_name=data.location_name.strip() if data.location_name else f"{station.station_name} Field Sector",
        latitude=data.latitude,
        longitude=data.longitude,
        status=data.status or "Active"
    )
    db.add(new_cam)
    db.commit()
    db.refresh(new_cam)

    return {
        "id": new_cam.id,
        "camera_name": new_cam.camera_name,
        "camera_code": new_cam.camera_code,
        "monitoring_station_id": new_cam.monitoring_station_id,
        "location_name": new_cam.location_name,
        "latitude": new_cam.latitude,
        "longitude": new_cam.longitude,
        "status": new_cam.status,
        "created_at": new_cam.created_at,
        "updated_at": new_cam.updated_at
    }


@router.get("/{camera_id}")
def get_camera_by_id(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to access camera monitoring")
        
    if current_user.role != "Admin":
        if current_user.station_id != camera.monitoring_station_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this camera")
            
    return {
        "id": camera.id,
        "camera_name": camera.camera_name,
        "camera_code": camera.camera_code,
        "monitoring_station_id": camera.monitoring_station_id,
        "location_name": camera.location_name,
        "latitude": camera.latitude,
        "longitude": camera.longitude,
        "status": camera.status,
        "created_at": camera.created_at,
        "updated_at": camera.updated_at,
        "station_name": camera.monitoring_station.station_name
    }

import os
import shutil
import uuid
from datetime import datetime
from typing import Optional

class SimulateCaptureRequest(BaseModel):
    test_image: Optional[str] = None

@router.get("/{camera_id}/captures")
def get_camera_captures(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to access camera captures")

    if current_user.role != "Admin" and current_user.station_id != camera.monitoring_station_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this camera's captures")

    from app.models.camera_capture import CameraCapture
    from sqlalchemy.orm import joinedload
    import os
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

    captures = db.query(CameraCapture).options(
        joinedload(CameraCapture.ai_result),
        joinedload(CameraCapture.detection_event)
    ).filter(CameraCapture.camera_id == camera_id).order_by(CameraCapture.captured_at.desc()).all()
    
    valid_captures = []
    for cap in captures:
        img_path = cap.image_path
        if not img_path or not isinstance(img_path, str) or not img_path.strip():
            continue
        clean_img = img_path.strip()
        candidate1 = os.path.join(base_dir, "app", *clean_img.strip("/").split("/"))
        candidate2 = os.path.join(base_dir, *clean_img.strip("/").split("/"))
        if not (os.path.exists(candidate1) or os.path.exists(candidate2) or os.path.exists(clean_img)):
            continue
        valid_captures.append(cap)

    return [
        {
            "id": cap.id,
            "camera_id": cap.camera_id,
            "monitoring_station_id": cap.monitoring_station_id,
            "image_path": cap.image_path,
            "latitude": cap.latitude,
            "longitude": cap.longitude,
            "status": cap.status,
            "captured_at": cap.captured_at,
            "ai_result": {
                "processing_status": cap.ai_result[0].processing_status,
                "overall_species": cap.ai_result[0].overall_species,
                "overall_confidence": cap.ai_result[0].overall_confidence,
                "animal_count": cap.ai_result[0].animal_count,
                "detections": cap.ai_result[0].detections,
                "failure_reason": cap.ai_result[0].failure_reason,
                "detection_event": {
                    "id": cap.detection_event[0].id,
                    "event_code": f"CDE-{cap.detection_event[0].id:06d}",
                    "status": cap.detection_event[0].status
                } if cap.detection_event else None
            } if cap.ai_result else None
        } for cap in valid_captures
    ]

import random

def _collect_available_test_images() -> list:
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    images = []
    
    # 1. ai/test_images
    dir1 = os.path.join(base_dir, "..", "ai", "test_images")
    if os.path.exists(dir1):
        for f in os.listdir(dir1):
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                images.append(f)
                
    # 2. ai/speciesnet_test/images
    dir2 = os.path.join(base_dir, "..", "ai", "speciesnet_test", "images")
    if os.path.exists(dir2):
        for root, dirs, files in os.walk(dir2):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    rel_dir = os.path.relpath(root, dir2)
                    if rel_dir == ".":
                        images.append(f)
                    else:
                        images.append(f"{rel_dir}/{f}".replace("\\", "/"))
                        
    return sorted(list(set(images)))

def _execute_ai_for_capture(capture, camera, db: Session):
    from app.models.camera_capture_result import CameraCaptureAIResult
    from app.models.camera_detection_event import CameraDetectionEvent

    # Get or create AI result
    ai_result = db.query(CameraCaptureAIResult).filter(CameraCaptureAIResult.capture_id == capture.id).first()
    if not ai_result:
        ai_result = CameraCaptureAIResult(capture_id=capture.id, processing_status="PROCESSING")
        db.add(ai_result)
        db.commit()
        db.refresh(ai_result)
    else:
        ai_result.processing_status = "PROCESSING"
        db.commit()
        db.refresh(ai_result)
        
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        rel_path = capture.image_path.lstrip("/")
        abs_path = os.path.join(base_dir, "app", rel_path)
        
        ai_service = get_ai_service()
        result_data = ai_service.analyze_image(abs_path)
        
        ai_result.processing_status = "COMPLETED"
        ai_result.overall_species = result_data.get("overall_species")
        ai_result.overall_confidence = result_data.get("overall_confidence")
        ai_result.animal_count = result_data.get("animal_count", 0)
        ai_result.detections = result_data.get("detections", [])
        ai_result.processed_at = datetime.utcnow()
        
        # Create Detection Event only if animals were actually detected
        is_supported_wildlife = ai_result.animal_count > 0 and ai_result.overall_species and ai_result.overall_species.lower() not in ["none", "no animal", "blank", "vehicle", "human"]
        if is_supported_wildlife:
            existing_event = db.query(CameraDetectionEvent).filter(CameraDetectionEvent.camera_capture_id == capture.id).first()
            if not existing_event:
                new_event = CameraDetectionEvent(
                    camera_id=camera.id,
                    camera_capture_id=capture.id,
                    monitoring_station_id=camera.monitoring_station_id,
                    species=ai_result.overall_species,
                    confidence=ai_result.overall_confidence,
                    animal_count=ai_result.animal_count,
                    latitude=camera.latitude,
                    longitude=camera.longitude,
                    status="PENDING_REVIEW"
                )
                db.add(new_event)
        
    except Exception as e:
        ai_result.processing_status = "FAILED"
        ai_result.failure_reason = str(e)
        
    db.commit()
    db.refresh(ai_result)
    
    det_event = db.query(CameraDetectionEvent).filter(CameraDetectionEvent.camera_capture_id == capture.id).first()
    
    return {
        "id": ai_result.id,
        "capture_id": ai_result.capture_id,
        "processing_status": ai_result.processing_status,
        "overall_species": ai_result.overall_species,
        "overall_confidence": ai_result.overall_confidence,
        "animal_count": ai_result.animal_count,
        "detections": ai_result.detections,
        "failure_reason": ai_result.failure_reason,
        "processed_at": ai_result.processed_at,
        "detection_event": {
            "id": det_event.id,
            "event_code": f"CDE-{det_event.id:06d}",
            "status": det_event.status
        } if det_event else None
    }

@router.post("/captures/{capture_id}/process-ai")
def process_capture_ai(
    capture_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.models.camera_capture import CameraCapture
    capture = db.query(CameraCapture).filter(CameraCapture.id == capture_id).first()
    if not capture:
        raise HTTPException(status_code=404, detail="Capture not found")
        
    camera = db.query(Camera).filter(Camera.id == capture.camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera for this capture not found")
        
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to process camera captures")

    if current_user.role != "Admin" and current_user.station_id != camera.monitoring_station_id:
        raise HTTPException(status_code=403, detail="Not authorized to process this capture")

    return _execute_ai_for_capture(capture, camera, db)

@router.post("/{camera_id}/simulate-capture")
def simulate_camera_capture(
    camera_id: int,
    payload: SimulateCaptureRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to simulate capture for this camera")

    if current_user.role != "Admin" and current_user.station_id != camera.monitoring_station_id:
        raise HTTPException(status_code=403, detail="Not authorized to simulate capture for this camera")
        
    if camera.status.lower() != "active":
        raise HTTPException(status_code=400, detail="Camera is currently inactive and cannot simulate a capture.")

    available_images = _collect_available_test_images()
    if not available_images:
        raise HTTPException(status_code=400, detail="No eligible test images found in repository.")

    chosen_image = payload.test_image
    if not chosen_image or chosen_image == "AUTOMATIC" or not chosen_image.strip():
        chosen_image = random.choice(available_images)

    # Validate test image path
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    potential_paths = [
        os.path.join(base_dir, "..", "ai", "test_images", chosen_image),
        os.path.join(base_dir, "..", "ai", "speciesnet_test", "images", chosen_image.replace("/", os.sep))
    ]
    
    source_path = None
    for p in potential_paths:
        if os.path.exists(p) and os.path.isfile(p):
            source_path = p
            break
            
    if not source_path:
        raise HTTPException(status_code=400, detail=f"Test image '{chosen_image}' does not exist.")

    # Create destination
    dest_dir = os.path.join(base_dir, "app", "static", "uploads", "camera_captures")
    os.makedirs(dest_dir, exist_ok=True)
    
    ext = os.path.splitext(source_path)[1]
    new_filename = f"camera_{camera_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(dest_dir, new_filename)
    
    shutil.copy2(source_path, dest_path)
    
    relative_path = f"/static/uploads/camera_captures/{new_filename}"

    from app.models.camera_capture import CameraCapture
    capture = CameraCapture(
        camera_id=camera.id,
        monitoring_station_id=camera.monitoring_station_id,
        image_path=relative_path,
        latitude=camera.latitude,
        longitude=camera.longitude,
        status="SIMULATED"
    )
    db.add(capture)
    db.commit()
    db.refresh(capture)
    
    # Automatically execute AI pipeline for end-to-end integration
    ai_summary = _execute_ai_for_capture(capture, camera, db)
    
    return {
        "id": capture.id,
        "camera_id": capture.camera_id,
        "monitoring_station_id": capture.monitoring_station_id,
        "image_path": capture.image_path,
        "latitude": capture.latitude,
        "longitude": capture.longitude,
        "status": capture.status,
        "captured_at": capture.captured_at,
        "ai_result": ai_summary
    }

@router.get("/test-images/available")
def get_available_test_images(current_user = Depends(get_current_user)):
    if current_user.role not in ["Admin", "Range Forest Officer", "Officer"]:
        raise HTTPException(status_code=403, detail="Not authorized to access test images")
    return {"images": _collect_available_test_images()}

@router.get("/test-images/preview")
def preview_test_image(
    image: str,
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # Authenticate via Authorization header or token query parameter
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split(" ")[1]
    elif token:
        auth_token = token
        
    if not auth_token:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    payload = verify_token(auth_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    email = payload.get("sub") or payload.get("email")
    role = payload.get("role")
    
    # Verify user permissions
    if role not in ["Admin", "Range Forest Officer", "Officer"]:
        from app.models.user import User
        user = db.query(User).filter(User.email == email).first()
        if not user or user.role not in ["Admin", "Range Forest Officer", "Officer"]:
            raise HTTPException(status_code=403, detail="Not authorized to preview test images")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    clean_image = image.strip().lstrip("/\\")
    potential_paths = [
        os.path.join(base_dir, "..", "ai", "test_images", clean_image),
        os.path.join(base_dir, "..", "ai", "speciesnet_test", "images", clean_image.replace("/", os.sep))
    ]
    
    source_path = None
    for p in potential_paths:
        if os.path.exists(p) and os.path.isfile(p):
            source_path = p
            break
            
    if not source_path:
        raise HTTPException(status_code=404, detail="Test image not found")
        
    from fastapi.responses import FileResponse
    return FileResponse(source_path)


