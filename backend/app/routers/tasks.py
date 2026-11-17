
from math import ceil
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_

from app.database import get_db
from app.models import Task, Project, User
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse
)
from app.utils.dependencies import (
    get_current_user,
    require_roles
)
from app.utils.activity import log_activity


router = APIRouter(
    prefix="/tasks",
    tags=["Task Management"]
)


VALID_PRIORITIES = [
    "Low",
    "Medium",
    "High",
    "Critical"
]

VALID_STATUSES = [
    "To Do",
    "In Progress",
    "Review",
    "Completed"
]

ALLOWED_SORT_FIELDS = [
    "created_at",
    "title",
    "due_date",
    "priority",
    "status"
]


# Validate task priority and status
def validate_task_values(priority, task_status):
    if priority is not None and priority not in VALID_PRIORITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Priority must be one of: {', '.join(VALID_PRIORITIES)}"
        )

    if task_status is not None and task_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {', '.join(VALID_STATUSES)}"
        )


# Validate assigned user
def validate_assigned_user(db, assigned_to):
    if assigned_to is not None:
        user = db.query(User).filter(
            User.id == assigned_to
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=400,
                detail="Cannot assign a task to an inactive user"
            )


# 1. Create a task
@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED
)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Admin", "Project Manager")
    )
):
    project = db.query(Project).filter(
        Project.id == task_data.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    validate_task_values(
        task_data.priority,
        task_data.status
    )

    validate_assigned_user(
        db,
        task_data.assigned_to
    )

    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        project_id=task_data.project_id,
        assigned_to=task_data.assigned_to,
        created_by=current_user.id,
        priority=task_data.priority,
        status=task_data.status,
        due_date=task_data.due_date
    )

    db.add(new_task)
    db.flush()

    log_activity(
        db=db,
        user_id=current_user.id,
        project_id=new_task.project_id,
        task_id=new_task.id,
        action="Task Created",
        details=f"Task '{new_task.title}' was created."
    )

    db.commit()
    db.refresh(new_task)

    return new_task


# 2. View all tasks with search, filters, sorting and pagination
@router.get(
    "/",
    response_model=TaskListResponse
)
def get_all_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = None,
    project_id: Optional[int] = None,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if sort_by not in ALLOWED_SORT_FIELDS:
        raise HTTPException(
            status_code=400,
            detail=f"Sort by must be one of: {', '.join(ALLOWED_SORT_FIELDS)}"
        )

    if sort_order not in ["asc", "desc"]:
        raise HTTPException(
            status_code=400,
            detail="Sort order must be asc or desc"
        )

    validate_task_values(priority, status_filter)

    query = db.query(Task)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Task.title.ilike(search_term),
                Task.description.ilike(search_term)
            )
        )

    if status_filter:
        query = query.filter(Task.status == status_filter)

    if priority:
        query = query.filter(Task.priority == priority)

    if project_id is not None:
        query = query.filter(Task.project_id == project_id)

    total = query.count()
    sort_column = getattr(Task, sort_by)

    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    tasks = (
        query
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    total_pages = ceil(total / limit) if total > 0 else 0

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
        "items": tasks
    }


# 3. View tasks for a project
@router.get(
    "/project/{project_id}",
    response_model=list[TaskResponse]
)
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return (
        db.query(Task)
        .filter(Task.project_id == project_id)
        .order_by(Task.id.desc())
        .all()
    )


# 4. View a task by ID
@router.get(
    "/{task_id}",
    response_model=TaskResponse
)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


# 5. Update a task
@router.put(
    "/{task_id}",
    response_model=TaskResponse
)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Admin", "Project Manager")
    )
):
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    update_data = task_data.model_dump(exclude_unset=True)

    if "title" in update_data and update_data["title"] is None:
        raise HTTPException(
            status_code=400,
            detail="Task title cannot be null"
        )

    if "priority" in update_data and update_data["priority"] is None:
        raise HTTPException(
            status_code=400,
            detail="Task priority cannot be null"
        )

    if "status" in update_data and update_data["status"] is None:
        raise HTTPException(
            status_code=400,
            detail="Task status cannot be null"
        )

    validate_task_values(
        update_data.get("priority"),
        update_data.get("status")
    )

    if "assigned_to" in update_data:
        validate_assigned_user(
            db,
            update_data["assigned_to"]
        )

    for field, value in update_data.items():
        setattr(task, field, value)

    try:
        log_activity(
            db=db,
            user_id=current_user.id,
            project_id=task.project_id,
            task_id=task.id,
            action="Task Updated",
            details=f"Task '{task.title}' was updated."
        )

        db.commit()
        db.refresh(task)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Unable to update task because of a database constraint."
        )

    return task


# 6. Delete a task
@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Admin", "Project Manager")
    )
):
    task = db.query(Task).filter(
        Task.id == task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    try:
        log_activity(
            db=db,
            user_id=current_user.id,
            project_id=task.project_id,
            task_id=task.id,
            action="Task Deleted",
            details=f"Task '{task.title}' was deleted."
        )

        db.delete(task)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this task because related records exist."
        )

    return {
        "message": "Task deleted successfully"
    }
