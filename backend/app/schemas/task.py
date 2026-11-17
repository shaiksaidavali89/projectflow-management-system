
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    project_id: int
    assigned_to: Optional[int] = None
    priority: str = "Medium"
    status: str = "To Do"
    due_date: Optional[date] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    assigned_to: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    project_id: int
    assigned_to: Optional[int] = None
    created_by: int
    priority: str
    status: str
    due_date: Optional[date] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: list[TaskResponse]

