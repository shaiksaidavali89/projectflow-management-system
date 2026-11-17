
from pydantic import BaseModel, Field, ConfigDict, EmailStr


class UserManagementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str = Field(min_length=3, max_length=50)


class UserStatusUpdate(BaseModel):
    is_active: bool
