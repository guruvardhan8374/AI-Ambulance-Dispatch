from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    def password_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Password cannot be empty or whitespace only.")
        return v

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "CALLER"
    phone: Optional[str] = None

    @field_validator("password")
    def password_complexity_check(cls, v):
        if not v or len(v.strip()) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password length cannot exceed 72 bytes.")
        return v

    @field_validator("role")
    def validate_role(cls, v):
        valid_roles = ["CALLER", "DRIVER", "HOSPITAL", "DISPATCHER"]
        if v.upper() not in valid_roles:
            raise ValueError(f"Role must be one of: {', '.join(valid_roles)}")
        return v.upper()

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    full_name: str
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True
