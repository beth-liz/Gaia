from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationOut
from app.utils.deps import get_current_user

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)


@router.get("", response_model=List[NotificationOut])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Fetch notifications for logged in user."""
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Count unread notifications for logged in user."""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Mark all notifications as read for logged in user."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "All notifications marked as read"}


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        db.delete(notif)
        db.commit()
    return None
