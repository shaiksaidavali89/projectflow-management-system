
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Project, ProjectMember, User
from app.schemas.member import (
    ProjectMemberCreate,
    ProjectMemberResponse
)
from app.utils.dependencies import (
    get_current_user,
    require_roles
)

router = APIRouter(
    prefix="/projects",
    tags=["Project Members"]
)


# Add a member to a project
@router.post(
    "/{project_id}/members",
    response_model=ProjectMemberResponse
)
def add_project_member(
    project_id: int,
    member_data: ProjectMemberCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Admin", "Project Manager")
    )
):

    project = db.query(Project).filter(
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    user = db.query(User).filter(
        User.id == member_data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot add an inactive user"
        )

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member_data.user_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="User is already a project member"
        )

    new_member = ProjectMember(
        project_id=project_id,
        user_id=member_data.user_id
    )

    db.add(new_member)

    try:
        db.commit()
        db.refresh(new_member)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Unable to add project member"
        )

    return new_member


# View all members of a project
@router.get(
    "/{project_id}/members",
    response_model=list[ProjectMemberResponse]
)
def get_project_members(
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

    return db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id
    ).all()


# Remove a member from a project
@router.delete("/{project_id}/members/{user_id}")
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles("Admin", "Project Manager")
    )
):

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Project member not found"
        )

    db.delete(member)
    db.commit()

    return {
        "message": "Project member removed successfully"
    }
