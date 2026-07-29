from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.user import User
from app.models.incident import Incident
from app.models.incident_assignment import IncidentAssignment
from app.models.notification import Notification
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

    rfos_count = db.query(User).filter(User.role == "Range Forest Officer").count()
    guards_count = db.query(User).filter(User.role == "Forest Guard").count()
    total_officers = rfos_count + guards_count

    available_guards_count = db.query(User).filter(
        User.role == "Forest Guard",
        User.is_active == True,
        User.work_status == "Available"
    ).count()

    total_incidents = db.query(Incident).count()
    open_incidents = db.query(Incident).filter(Incident.status.in_(["Pending", "Assigned", "In Progress"])).count()
    resolved_incidents = db.query(Incident).filter(Incident.status == "Completed").count()
    pending_incidents = db.query(Incident).filter(Incident.status == "Pending").count()

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
        guard_completed = len([a for a in assignments if a.status == "Completed"])

    # Villager specific counts
    my_reports_count = 0
    my_open_reports = 0
    if role == "Villager":
        my_reports_count = db.query(Incident).filter(Incident.reporter_id == current_user.id).count()
        my_open_reports = db.query(Incident).filter(
            Incident.reporter_id == current_user.id,
            Incident.status.in_(["Pending", "Assigned", "In Progress"])
        ).count()

    return {
        "user_role": role,
        "total_villagers": total_villagers,
        "approved_villagers": approved_villagers,
        "pending_villagers": pending_villagers,
        "total_officers": total_officers,
        "rfos_count": rfos_count,
        "guards_count": guards_count,
        "available_guards_count": available_guards_count,
        "total_incidents": total_incidents,
        "open_incidents": open_incidents,
        "resolved_incidents": resolved_incidents,
        "pending_incidents": pending_incidents,
        "unread_notifications": unread_notifications,
        "guard_assigned": guard_assigned,
        "guard_completed": guard_completed,
        "my_reports_count": my_reports_count,
        "my_open_reports": my_open_reports
    }
