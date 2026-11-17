
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ActivityLog
from app.schemas.activity import ActivityLogResponse
from app.utils.dependencies import require_roles

router = APIRouter(
    prefix="/activity-logs",
    tags=["Activity Logs"]
)


@router.get("/", response_model=list[ActivityLogResponse])
def get_activity_logs(
    project_id: Optional[int] = None,
    task_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Admin", "Project Manager")
    )
):
    query = db.query(ActivityLog)

    if project_id is not None:
        query = query.filter(
            ActivityLog.project_id == project_id
        )

    if task_id is not None:
        query = query.filter(
            ActivityLog.task_id == task_id
        )

    return (
        query.order_by(ActivityLog.created_at.desc())
        .all()
    )
