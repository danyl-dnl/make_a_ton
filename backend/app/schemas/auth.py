"""Pydantic schemas for Authentication and RBAC."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import validate_password_strength


class UserRegisterRequest(BaseModel):
    """Schema for public customer self-registration."""

    email: EmailStr = Field(..., description="Customer email address")
    password: str = Field(..., min_length=9, description="Password meeting complexity requirements")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name of customer")
    role: Optional[str] = Field("customer", description="Registration role (strictly customer)")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("password")
    @classmethod
    def check_password_complexity(cls, v: str) -> str:
        validate_password_strength(v)
        return v

    @field_validator("role")
    @classmethod
    def restrict_public_role(cls, v: Optional[str]) -> str:
        if v and v.strip().lower() not in ("customer", ""):
            raise ValueError("Public registration is strictly permitted for 'customer' role only.")
        return "customer"


class StaffCreateRequest(BaseModel):
    """Schema for admin-only staff account creation."""

    email: EmailStr = Field(..., description="Staff member email address")
    password: str = Field(..., min_length=9, description="Staff initial password")
    full_name: str = Field(..., min_length=2, max_length=255, description="Full name of staff member")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("password")
    @classmethod
    def check_password_complexity(cls, v: str) -> str:
        validate_password_strength(v)
        return v


class UserLoginRequest(BaseModel):
    """Schema for user credentials authentication."""

    email: EmailStr = Field(..., description="Registered account email")
    password: str = Field(..., description="Account password")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserResponse(BaseModel):
    """Safe public user representation without sensitive fields."""

    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT bearer access token response payload."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse
