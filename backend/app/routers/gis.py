from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.database.deps import get_db
from app.models.user import User
from app.models.incident import Incident
from app.models.monitoring_station import MonitoringStation
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
    # Query incidents
    query = db.query(Incident).filter(
        Incident.latitude.isnot(None),
        Incident.longitude.isnot(None)
    )

    # Role based filtering
    if current_user.role in ["Range Forest Officer", "Head Forest Officer"] and current_user.station_id:
        query = query.filter(Incident.station_id == current_user.station_id)
    # Forest Guard? Maybe they only see assigned ones, but maybe we let them see station ones or all depending on rules. Let's just let them see station ones if they have a station, otherwise all? Or only assigned?
    elif current_user.role == "Forest Guard":
        # Can restrict to their station if they belong to one, or assigned incidents. 
        # For a GIS view, seeing the range is useful. Let's show incidents for their station.
        if current_user.station_id:
            query = query.filter(Incident.station_id == current_user.station_id)

    # Apply filters
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(Incident.created_at >= cutoff)
    
    if species:
        # Match case-insensitive
        query = query.filter(Incident.animal_type.ilike(f"%{species}%"))
        
    if status:
        query = query.filter(Incident.status == status)

    incidents = query.all()

    # Query monitoring stations
    stations_query = db.query(MonitoringStation).filter(
        MonitoringStation.latitude.isnot(None),
        MonitoringStation.longitude.isnot(None)
    )
    if current_user.role in ["Range Forest Officer", "Head Forest Officer", "Forest Guard"] and current_user.station_id:
        stations_query = stations_query.filter(MonitoringStation.id == current_user.station_id)

    stations = stations_query.all()

    # Map incidents to GISFeature format
    features = []
    
    # Calculate stats
    total_incidents = len(incidents)
    active_incidents = 0
    resolved_incidents = 0
    
    for inc in incidents:
        if inc.status in ["Pending Review", "Assigned", "Travelling", "Reached Site", "Action In Progress", "Awaiting Verification"]:
            active_incidents += 1
            node_status = "warning" if inc.severity == "High" else "active"
        elif inc.status in ["Verified", "Closed"]:
            resolved_incidents += 1
            node_status = "offline"
        else:
            node_status = "active"

        features.append({
            "id": f"INC-{inc.reference_id or inc.id}",
            "db_id": inc.id,
            "type": "incident",
            "name": inc.incident_category or "Incident",
            "lat": inc.latitude,
            "lng": inc.longitude,
            "status": node_status,
            "species": inc.animal_type or inc.animal or "Unknown",
            "timestamp": inc.created_at.isoformat() if inc.created_at else None,
            "details": f"Status: {inc.status} | Severity: {inc.severity} | Location: {inc.village.village_name if inc.village else 'Unknown'}",
            "severity": inc.severity
        })

    for st in stations:
        features.append({
            "id": f"ST-{st.id}",
            "db_id": st.id,
            "type": "camera", # Use camera type for station for icon
            "name": st.station_name,
            "lat": st.latitude,
            "lng": st.longitude,
            "status": "active",
            "details": f"Address: {st.address}"
        })

    return {
        "features": features,
        "analytics": {
            "total_incidents": total_incidents,
            "active_incidents": active_incidents,
            "resolved_incidents": resolved_incidents,
            "stations_count": len(stations)
        }
    }
