from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta

from app.database.deps import get_db
from app.models.user import User
from app.models.incident import Incident
from app.models.monitoring_station import MonitoringStation
from app.models.camera import Camera
from app.models.camera_detection_event import CameraDetectionEvent
from app.models.camera_capture import CameraCapture
from app.models.animal_detection import AnimalDetection
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/gis", tags=["GIS"])

@router.get("/data")
def get_gis_data(
    days: Optional[int] = Query(None, description="Filter by last N days"),
    species: Optional[str] = Query(None, description="Filter by animal species"),
    status: Optional[str] = Query(None, description="Filter by incident status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    is_villager = current_user.role == "Villager"
    is_admin = current_user.role == "Admin"
    # Role-based station scope for RFO / Guard
    user_station_id = current_user.station_id if not is_admin and not is_villager else None

    # 1. Official Incidents (Admin sees all; Officers/Guards see station-scoped)
    all_incidents_query = db.query(Incident)
    if user_station_id:
        all_incidents_query = all_incidents_query.filter(Incident.station_id == user_station_id)

    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        all_incidents_query = all_incidents_query.filter(Incident.created_at >= cutoff)
    
    if species:
        from sqlalchemy import or_
        all_incidents_query = all_incidents_query.outerjoin(AnimalDetection, Incident.id == AnimalDetection.incident_id)
        all_incidents_query = all_incidents_query.filter(
            or_(
                Incident.animal_type.ilike(f"%{species}%"),
                AnimalDetection.normalized_species.ilike(f"%{species}%")
            )
        )
        
    if status:
        all_incidents_query = all_incidents_query.filter(Incident.status == status)

    all_incidents = all_incidents_query.all()

    # Track missing coords vs valid coords
    valid_incidents = []
    incidents_missing_coords = 0
    total_incidents = len(all_incidents)
    active_incidents = 0
    resolved_incidents = 0

    for inc in all_incidents:
        if inc.status in ["Pending Review", "Assigned", "Travelling", "Reached Site", "Action In Progress", "Awaiting Verification"]:
            active_incidents += 1
        elif inc.status in ["Verified", "Closed"]:
            resolved_incidents += 1

        if inc.latitude is not None and inc.longitude is not None:
            try:
                lat = float(inc.latitude)
                lng = float(inc.longitude)
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    valid_incidents.append((inc, lat, lng))
                else:
                    incidents_missing_coords += 1
            except (ValueError, TypeError):
                incidents_missing_coords += 1
        else:
            incidents_missing_coords += 1

    # 2. Cameras (Registered camera devices - Hidden from Villagers for sanctuary security)
    all_cameras = []
    if not is_villager:
        cam_query = db.query(Camera).options(joinedload(Camera.monitoring_station))
        if user_station_id:
            cam_query = cam_query.filter(Camera.monitoring_station_id == user_station_id)
        all_cameras = cam_query.all()

    valid_cameras = []
    cameras_missing_coords = 0
    for cam in all_cameras:
        if cam.latitude is not None and cam.longitude is not None:
            try:
                lat = float(cam.latitude)
                lng = float(cam.longitude)
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    valid_cameras.append((cam, lat, lng))
                else:
                    cameras_missing_coords += 1
            except (ValueError, TypeError):
                cameras_missing_coords += 1
        else:
            cameras_missing_coords += 1

    # 3. Camera Detection Events (Wildlife detections at camera sites - Hidden from Villagers)
    all_detections = []
    if not is_villager:
        det_query = db.query(CameraDetectionEvent).options(
            joinedload(CameraDetectionEvent.camera),
            joinedload(CameraDetectionEvent.monitoring_station),
            joinedload(CameraDetectionEvent.capture).joinedload(CameraCapture.ai_result),
            joinedload(CameraDetectionEvent.incident)
        )
        if user_station_id:
            det_query = det_query.filter(CameraDetectionEvent.monitoring_station_id == user_station_id)
        if days:
            cutoff = datetime.utcnow() - timedelta(days=days)
            det_query = det_query.filter(CameraDetectionEvent.detected_at >= cutoff)
        if species:
            det_query = det_query.filter(CameraDetectionEvent.species.ilike(f"%{species}%"))

        all_detections = det_query.all()

    valid_detections = []
    detections_missing_coords = 0

    for det in all_detections:
        # Determine coordinate: event lat/lng -> camera lat/lng -> capture lat/lng
        lat = det.latitude
        lng = det.longitude
        if (lat is None or lng is None) and det.camera:
            lat = det.camera.latitude
            lng = det.camera.longitude
        if (lat is None or lng is None) and det.capture:
            lat = det.capture.latitude
            lng = det.capture.longitude

        if lat is not None and lng is not None:
            try:
                plat = float(lat)
                plng = float(lng)
                if -90 <= plat <= 90 and -180 <= plng <= 180:
                    valid_detections.append((det, plat, plng))
                else:
                    detections_missing_coords += 1
            except (ValueError, TypeError):
                detections_missing_coords += 1
        else:
            detections_missing_coords += 1

    # 4. Monitoring Stations
    st_query = db.query(MonitoringStation)
    if user_station_id:
        st_query = st_query.filter(MonitoringStation.id == user_station_id)
    all_stations = st_query.all()
    valid_stations = []
    for st in all_stations:
        if st.latitude is not None and st.longitude is not None:
            try:
                lat = float(st.latitude)
                lng = float(st.longitude)
                if -90 <= lat <= 90 and -180 <= lng <= 180:
                    valid_stations.append((st, lat, lng))
            except (ValueError, TypeError):
                pass

    # Map features
    features = []

    # A. Official Incidents
    for inc, lat, lng in valid_incidents:
        if inc.status in ["Pending Review", "Assigned", "Travelling", "Reached Site", "Action In Progress", "Awaiting Verification"]:
            node_status = "critical" if inc.severity in ["Critical", "High"] else "warning"
        elif inc.status in ["Verified", "Closed"]:
            node_status = "offline"
        else:
            node_status = "active"

        detection = db.query(AnimalDetection).filter(AnimalDetection.incident_id == inc.id).order_by(AnimalDetection.detected_at.desc()).first()
        sp_name = inc.animal_type or inc.animal or "Wildlife"
        conf = None
        if detection and detection.confidence and detection.confidence > 0:
            sp_name = detection.normalized_species or detection.animal_name or sp_name
            conf = detection.confidence

        features.append({
            "id": f"INC-{inc.reference_id or inc.id}",
            "db_id": inc.id,
            "type": "incident",
            "name": inc.incident_title or inc.incident_category or "Human-Wildlife Conflict",
            "lat": lat,
            "lng": lng,
            "status": node_status,
            "species": sp_name,
            "confidence": conf,
            "timestamp": inc.created_at.isoformat() if inc.created_at else None,
            "village": inc.village.village_name if inc.village else (inc.location or "Sanctuary Sector"),
            "station": inc.station_rel.station_name if inc.station_rel else None,
            "details": f"Status: {inc.status} | Severity: {inc.severity} | Location: {inc.village.village_name if inc.village else (inc.location or 'Sector')}",
            "severity": inc.severity,
            "description": inc.description,
            "camera_detection_event_id": inc.camera_detection_event_id,
            "image": inc.photo_url
        })

    # B. Registered Cameras
    for cam, lat, lng in valid_cameras:
        cam_station_name = cam.monitoring_station.station_name if cam.monitoring_station else "Unknown Station"
        features.append({
            "id": f"CAM-{cam.id}",
            "db_id": cam.id,
            "type": "camera",
            "name": f"{cam.camera_name} ({cam.camera_code})",
            "camera_code": cam.camera_code,
            "lat": lat,
            "lng": lng,
            "status": "active" if cam.status == "Active" else "offline",
            "station": cam_station_name,
            "location_name": cam.location_name or "Perimeter Grid",
            "details": f"Station: {cam_station_name} | Code: {cam.camera_code} | Status: {cam.status}",
            "severity": "Low"
        })

    # C. Camera Wildlife Detections
    for det, lat, lng in valid_detections:
        cam_name = det.camera.camera_name if det.camera else "Camera Trap"
        st_name = det.monitoring_station.station_name if det.monitoring_station else "Station"
        linked_inc_ref = det.incident.reference_id if det.incident else None

        img_url = None
        if det.capture and det.capture.image_path:
            img_url = det.capture.image_path

        features.append({
            "id": f"DET-{det.id}",
            "db_id": det.id,
            "type": "detection",
            "name": f"Detection: {det.species} (x{det.animal_count})",
            "lat": lat,
            "lng": lng,
            "status": "critical" if det.status == "ACCEPTED" else ("warning" if det.status == "PENDING_REVIEW" else "offline"),
            "species": det.species,
            "animal_count": det.animal_count,
            "confidence": det.confidence,
            "review_status": det.status,
            "camera_name": cam_name,
            "station": st_name,
            "timestamp": det.detected_at.isoformat() if det.detected_at else None,
            "linked_incident_ref": linked_inc_ref,
            "image": img_url,
            "details": f"Camera: {cam_name} ({st_name}) | Species: {det.species} (x{det.animal_count}) | Review: {det.status}",
            "severity": "High" if det.status == "ACCEPTED" else "Medium"
        })

    # D. Monitoring Stations
    for st, lat, lng in valid_stations:
        features.append({
            "id": f"ST-{st.id}",
            "db_id": st.id,
            "type": "station",
            "name": st.station_name,
            "lat": lat,
            "lng": lng,
            "status": "active",
            "address": st.address,
            "details": f"Station Headquarters: {st.station_name} | Address: {st.address or 'Range HQ'}"
        })

    return {
        "features": features,
        "analytics": {
            "total_incidents": total_incidents,
            "valid_incidents": len(valid_incidents),
            "incidents_missing_coords": incidents_missing_coords,
            "active_incidents": active_incidents,
            "resolved_incidents": resolved_incidents,
            "total_cameras": len(all_cameras),
            "valid_cameras": len(valid_cameras),
            "cameras_missing_coords": cameras_missing_coords,
            "total_detections": len(all_detections),
            "valid_detections": len(valid_detections),
            "detections_missing_coords": detections_missing_coords,
            "stations_count": len(valid_stations)
        }
    }
