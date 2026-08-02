from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.deps import get_db
from app.models.user import User
from app.models.incident import Incident
from app.models.incident_assignment import IncidentAssignment
from app.models.notification import Notification
from app.models.monitoring_station import MonitoringStation
from app.models.district import District
from app.models.state import State
from app.utils.deps import get_current_user

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard Stats"]
)


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve real-time database metric statistics based on user role."""
    role = current_user.role

    total_villagers = db.query(User).filter(User.role == "Villager").count()
    approved_villagers = db.query(User).filter(User.role == "Villager", User.is_verified == True).count()
    pending_villagers = db.query(User).filter(User.role == "Villager", User.is_verified == False).count()

    rfos_count = db.query(User).filter(User.role.in_(["Range Forest Officer", "Officer"])).count()
    guards_count = db.query(User).filter(User.role == "Forest Guard").count()
    total_officers = rfos_count + guards_count

    available_guards_count = db.query(User).filter(
        User.role == "Forest Guard",
        User.is_active == True,
        User.work_status == "Available"
    ).count()

    busy_guards_count = db.query(User).filter(
        User.role == "Forest Guard",
        User.is_active == True,
        User.work_status == "Busy"
    ).count()

    # Stations Missing Head RFO
    stations_missing_head_officer = db.query(MonitoringStation).filter(
        (MonitoringStation.head_officer_id == None) | (MonitoringStation.status == "No Head Officer Assigned")
    ).count()

    # Hierarchy counts
    total_stations = db.query(MonitoringStation).count()
    total_districts = db.query(District).count()
    total_states = db.query(State).count()

    # Incident Metrics
    total_incidents = db.query(Incident).count()
    open_incidents = db.query(Incident).filter(
        Incident.status.in_(["Pending Review", "Under Review", "Awaiting Information", "Assigned", "In Progress", "Pending"])
    ).count()

    incidents_awaiting_review = db.query(Incident).filter(
        Incident.status.in_(["Pending Review", "Under Review", "Resolved"])
    ).count()

    incidents_in_progress = db.query(Incident).filter(
        Incident.status.in_(["Assigned", "In Progress"])
    ).count()

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    resolved_today = db.query(Incident).filter(
        Incident.status.in_(["Resolved", "Completed"]),
        Incident.date_reported == today_str
    ).count()

    month_str = datetime.utcnow().strftime("%Y-%m")
    closed_this_month = db.query(Incident).filter(
        Incident.status == "Closed",
        Incident.date_reported.like(f"{month_str}%")
    ).count()

    unread_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    # Guard specific counts
    guard_assigned = 0
    guard_completed = 0
    if role == "Forest Guard":
        assignments = db.query(IncidentAssignment).filter(IncidentAssignment.assigned_to_id == current_user.id).all()
        guard_assigned = len([a for a in assignments if a.status in ["Assigned", "In Progress"]])
        guard_completed = len([a for a in assignments if a.status in ["Completed", "Closed"]])

    # Villager specific counts
    my_reports_count = 0
    my_open_reports = 0
    if role == "Villager":
        my_reports_count = db.query(Incident).filter(Incident.reporter_id == current_user.id).count()
        my_open_reports = db.query(Incident).filter(
            Incident.reporter_id == current_user.id,
            Incident.status.in_(["Pending Review", "Under Review", "Assigned", "In Progress"])
        ).count()

    return {
        "user_role": role,
        "total_villagers": total_villagers,
        "approved_villagers": approved_villagers,
        "pending_villagers": pending_villagers,
        "pending_approvals": pending_villagers,
        "total_officers": total_officers,
        "rfos_count": rfos_count,
        "guards_count": guards_count,
        "available_guards_count": available_guards_count,
        "busy_guards_count": busy_guards_count,
        "stations_missing_head_officer": stations_missing_head_officer,
        "monitoring_stations": total_stations,
        "total_stations": total_stations,
        "districts": total_districts,
        "total_districts": total_districts,
        "states": total_states,
        "total_states": total_states,
        "total_incidents": total_incidents,
        "open_incidents": open_incidents,
        "incidents_awaiting_review": incidents_awaiting_review,
        "incidents_in_progress": incidents_in_progress,
        "resolved_today": resolved_today,
        "closed_this_month": closed_this_month,
        "unread_notifications": unread_notifications,
        "guard_assigned": guard_assigned,
        "guard_completed": guard_completed,
        "my_reports_count": my_reports_count,
        "my_open_reports": my_open_reports
    }
