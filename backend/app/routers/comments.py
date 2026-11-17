
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Task, TaskComment, ActivityLog
from app.schemas.comment import CommentCreate, CommentResponse
from app.utils.dependencies import get_current_user

router = APIRouter(
    prefix="/comments",
    tags=["Task Comments"]
)


@router.post("/task/{task_id}", response_model=CommentResponse)
def add_comment(
    task_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_comment = TaskComment(
        task_id=task_id,
        user_id=current_user.id,
        comment=comment_data.comment
    )

    db.add(new_comment)

    activity = ActivityLog(
        user_id=current_user.id,
        project_id=task.project_id,
        task_id=task.id,
        action="Comment Added",
        details=f"Comment added to task: {task.title}"
    )

    db.add(activity)
    db.commit()
    db.refresh(new_comment)

    return new_comment


@router.get("/task/{task_id}", response_model=list[CommentResponse])
def get_task_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return (
        db.query(TaskComment)
        .filter(TaskComment.task_id == task_id)
        .order_by(TaskComment.created_at.desc())
        .all()
    )
