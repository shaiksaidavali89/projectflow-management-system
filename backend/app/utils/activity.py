from app.models.models import ActivityLog


def log_activity(
    db,
    user_id: int,
    action: str,
    details: str,
    project_id: int = None,
    task_id: int = None
):
    activity = ActivityLog(
        user_id=user_id,
        project_id=project_id,
        task_id=task_id,
        action=action,
        details=details
    )

    db.add(activity)