
from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse
)
from app.utils.dependencies import get_current_user, require_roles
from app.utils.activity import log_activity


router = APIRouter(
    prefix="/projects",
    tags=["Project Management"]
)


VALID_PROJECT_STATUSES = [
    "Planning",
    "In Progress",
    "On Hold",
    "Completed"
]

ALLOWED_SORT_FIELDS = [
    "created_at",
    "name",
    "deadline",
    "start_date",
    "status"
]


# 1. Create project
@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin", "Project Manager"))
):
    if project_data.status not in VALID_PROJECT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid project status")

    if (
        project_data.start_date
        and project_data.deadline
        and project_data.deadline < project_data.start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="Deadline cannot be before start date"
        )

    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        status=project_data.status,
        start_date=project_data.start_date,
        deadline=project_data.deadline,
        created_by=current_user.id
    )

    db.add(new_project)
    db.flush()

    log_activity(
        db=db,
        user_id=current_user.id,
        project_id=new_project.id,
        action="Project Created",
        details=f"Project '{new_project.name}' was created."
    )

    db.commit()
    db.refresh(new_project)

    return new_project


# 2. View all projects with search, filters, sorting and pagination
@router.get("/", response_model=ProjectListResponse)
def get_all_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if sort_by not in ALLOWED_SORT_FIELDS:
        raise HTTPException(status_code=400, detail="Invalid sort field")

    if sort_order not in ["asc", "desc"]:
        raise HTTPException(
            status_code=400,
            detail="Sort order must be asc or desc"
        )

    if status_filter and status_filter not in VALID_PROJECT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid project status")

    query = db.query(Project)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            Project.name.ilike(search_term)
            | Project.description.ilike(search_term)
        )

    if status_filter:
        query = query.filter(Project.status == status_filter)

    total = query.count()
    sort_column = getattr(Project, sort_by)

    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    projects = (
        query
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": ceil(total / limit) if total else 0,
        "items": projects
    }


# 3. View project by ID
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


# 4. Update project
@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin", "Project Manager"))
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_data.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is None:
        raise HTTPException(
            status_code=400,
            detail="Project name cannot be null"
        )

    new_status = update_data.get("status", project.status)

    if new_status not in VALID_PROJECT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid project status")

    new_start = update_data.get("start_date", project.start_date)
    new_deadline = update_data.get("deadline", project.deadline)

    if new_start and new_deadline and new_deadline < new_start:
        raise HTTPException(
            status_code=400,
            detail="Deadline cannot be before start date"
        )

    for field, value in update_data.items():
        setattr(project, field, value)

    try:
        log_activity(
            db=db,
            user_id=current_user.id,
            project_id=project.id,
            action="Project Updated",
            details=f"Project '{project.name}' was updated."
        )

        db.commit()
        db.refresh(project)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Unable to update project because of a database constraint."
        )

    return project


# 5. Delete project
@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin", "Project Manager"))
):
    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        log_activity(
            db=db,
            user_id=current_user.id,
            project_id=project.id,
            action="Project Deleted",
            details=f"Project '{project.name}' was deleted."
        )

        db.delete(project)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Cannot delete this project because related records exist."
        )

    return {"message": "Project deleted successfully"}
