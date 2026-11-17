
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "Planning"
    start_date: Optional[date] = None
    deadline: Optional[date] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    created_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProjectListResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: list[ProjectResponse]

