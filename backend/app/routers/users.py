
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role
from app.schemas.user import (
    UserManagementResponse,
    UserRoleUpdate,
    UserStatusUpdate
)
from app.utils.dependencies import get_current_user, require_roles


router = APIRouter(
    prefix="/users",
    tags=["User Management"]
)


# View all users - Admin and Project Manager
@router.get("/", response_model=list[UserManagementResponse])
def get_all_users(
    current_user: User = Depends(
        require_roles("Admin", "Project Manager")
    ),
    db: Session = Depends(get_db)
):
    users = db.query(User, Role.name).join(
        Role, User.role_id == Role.id
    ).order_by(User.id).all()

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": role_name,
            "is_active": user.is_active
        }
        for user, role_name in users
    ]


# Change user role - Admin only
@router.put("/{user_id}/role", response_model=UserManagementResponse)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    role = db.query(Role).filter(
        Role.name == role_data.role
    ).first()

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    if user.id == current_user.id and role.name != "Admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot remove your own Admin role"
        )

    user.role_id = role.id
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": role.name,
        "is_active": user.is_active
    }


# Activate or deactivate user - Admin only
@router.patch("/{user_id}/status", response_model=UserManagementResponse)
def update_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.id == current_user.id and not status_data.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account"
        )

    user.is_active = status_data.is_active
    db.commit()
    db.refresh(user)

    role = db.query(Role).filter(
        Role.id == user.role_id
    ).first()

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": role.name if role else "Unknown",
        "is_active": user.is_active
    }
