from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database.deps import get_db
from app.models.user import User
from app.models.monitoring_station import MonitoringStation
from app.models.incident_assignment import IncidentAssignment
from app.models.incident import Incident
from app.services.auth_service import format_user_payload
from app.utils.deps import get_current_rfo, get_current_user

router = APIRouter(
    prefix="/api/officers",
    tags=["Officers Workflow"]
)


@router.get("/guards")
def get_station_guards_workflow(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve Forest Guards belonging to the officer's assigned station with live workload statistics."""
    st_id = current_user.station_id
    if not st_id:
        # If user is Admin without assigned station, fetch all guards
        if current_user.role == "Admin":
            guards = db.query(User).filter(User.role == "Forest Guard").all()
        else:
            return []
    else:
        guards = db.query(User).filter(
            User.role == "Forest Guard",
            User.station_id == st_id
        ).all()

    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    out = []
    for g in guards:
        payload = format_user_payload(g)

        # Calculate assignments today
        assignments_today = db.query(IncidentAssignment).filter(
            IncidentAssignment.assigned_to_id == g.id,
            IncidentAssignment.assigned_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
        ).count()

        # Calculate current active workload
        current_workload = db.query(IncidentAssignment).filter(
            IncidentAssignment.assigned_to_id == g.id,
            IncidentAssignment.status.in_(["Assigned", "In Progress", "Travelling", "Reached Site", "Assessment Completed", "Action Taken"])
        ).count()

        payload["assignments_today"] = assignments_today
        payload["current_workload"] = current_workload
        payload["experience_years"] = "3+ Years"
        out.append(payload)

    return out


@router.get("/station-overview")
def get_station_overview_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detailed monitoring station overview metrics."""
    st_id = current_user.station_id
    if not st_id:
        st = db.query(MonitoringStation).first()
    else:
        st = db.query(MonitoringStation).filter(MonitoringStation.id == st_id).first()

    if not st:
        raise HTTPException(status_code=404, detail="Monitoring Station record not found.")

    total_guards = db.query(User).filter(
        User.station_id == st.id,
        User.role == "Forest Guard"
    ).count()

    available_guards = db.query(User).filter(
        User.station_id == st.id,
        User.role == "Forest Guard",
        User.work_status == "Available",
        User.is_active == True
    ).count()

    busy_guards = db.query(User).filter(
        User.station_id == st.id,
        User.role == "Forest Guard",
        User.work_status == "Busy",
        User.is_active == True
    ).count()

    open_incidents = db.query(Incident).filter(
        Incident.station_id == st.id,
        Incident.status.in_(["Pending Review", "Under Review", "Assigned", "In Progress", "Pending"])
    ).count()

    head_rfo = db.query(User).filter(User.id == st.head_officer_id).first() if st.head_officer_id else None

    return {
        "id": st.id,
        "station_name": st.station_name,
        "district_id": st.district_id,
        "district_name": st.district.district_name if st.district else "Wayanad",
        "state_name": st.district.state_rel.state_name if st.district and st.district.state_rel else "Kerala",
        "head_officer_id": st.head_officer_id,
        "head_officer_name": head_rfo.full_name if head_rfo else "No Head Officer Assigned",
        "head_officer_email": head_rfo.email if head_rfo else None,
        "phone": st.phone or "04936-270001",
        "email": st.email or "muthanga.range@keralaforest.gov.in",
        "address": st.address or "Muthanga Forest Range HQ, Wayanad Wildlife Sanctuary",
        "latitude": st.latitude or 11.6667,
        "longitude": st.longitude or 76.3667,
        "status": st.status,
        "total_guards": total_guards,
        "available_guards": available_guards,
        "busy_guards": busy_guards,
        "open_incidents": open_incidents
    }
