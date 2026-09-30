from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ActivityLog, User
from ..schemas import ActivityLogResponse

router = APIRouter(prefix="/api/activity", tags=["Activity Logs"])


@router.get("/{user_id}", response_model=List[ActivityLogResponse], summary="Get full activity logs")
def get_user_activity(user_id: int = 1, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == user_id)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .all()
    )

    return [
        ActivityLogResponse(
            id=log.id,
            user_id=log.user_id,
            action=log.action,
            description=log.description,
            created_at=log.created_at,
            time_display=log.created_at.strftime("%I:%M %p, %b %d")
        )
        for log in logs
    ]
