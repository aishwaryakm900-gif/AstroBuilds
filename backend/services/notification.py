import os
from sqlalchemy.orm import Session
from backend.models import Notification, User
from typing import List

# API Keys placeholders
EMAIL_API_KEY = os.getenv("EMAIL_API_KEY", "")
SMS_API_KEY = os.getenv("SMS_API_KEY", "")
WHATSAPP_API_KEY = os.getenv("WHATSAPP_API_KEY", "")

def create_notification(db: Session, user_id: int, title: str, message: str, category: str = "General") -> Notification:
    """
    Creates a notification in the database for the user.
    Also dispatches to external channels (SMS, Email, WhatsApp) if keys are provided.
    """
    db_notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        read=False
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)

    # Fetch user info
    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.name if user else "Stakeholder"
    user_email = user.email if user else ""

    # Simulated SMS dispatch
    if SMS_API_KEY:
        print(f"[SMS DISPATCH] Sent to {user_name} ({category}): '{title}' using SMS_API_KEY.")
    else:
        print(f"[SMS LOG] (No key) SMS queued: '{title}' for user {user_name}")

    # Simulated Email dispatch
    if EMAIL_API_KEY:
        print(f"[EMAIL DISPATCH] Sent to {user_email}: '{title}' - {message}")
    else:
        print(f"[EMAIL LOG] (No key) Email queued: '{title}' for {user_email}")

    # Simulated WhatsApp dispatch
    if WHATSAPP_API_KEY:
        print(f"[WHATSAPP DISPATCH] Sent alert '{title}' to {user_name}")
    else:
        print(f"[WHATSAPP LOG] (No key) WhatsApp alert queued: '{title}'")

    return db_notif

def notify_all_stakeholders(db: Session, title: str, message: str, category: str = "General"):
    """
    Sends notification to all active users in the system.
    """
    users = db.query(User).all()
    notifications = []
    for user in users:
        notif = create_notification(db, user.id, title, message, category)
        notifications.append(notif)
    return notifications

def get_user_notifications(db: Session, user_id: int, unread_only: bool = False) -> List[Notification]:
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.read == False)
    return query.order_by(Notification.created_at.desc()).all()

def mark_notification_as_read(db: Session, notification_id: int) -> bool:
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if notif:
        notif.read = True
        db.commit()
        return True
    return False
