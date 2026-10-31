"""Authentication API endpoints: register, login, and admin staff creation."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    StaffCreateRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
    description="Public endpoint for customer self-registration. "
    "Creates user account and associated customer subscriber profile.",
)
async def register_customer(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new customer account (public endpoint)."""
    new_user = await AuthService.register_customer(db, payload)
    return UserResponse.model_validate(new_user)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user credentials",
    description="Validates email and password, returning a signed JWT bearer token "
    "with user profile upon successful authentication.",
)
async def login(
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate a user and return a JWT access token."""
    return await AuthService.authenticate_user(
        db, email=payload.email, password=payload.password
    )


@router.post(
    "/staff",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a staff account (admin only)",
    description="Admin-restricted endpoint for creating new staff user accounts. "
    "Requires a valid admin JWT bearer token.",
)
async def create_staff(
    payload: StaffCreateRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role(["admin"])),
) -> UserResponse:
    """Create a staff account (admin-only endpoint)."""
    staff_user = await AuthService.create_staff_user(db, payload)
    return UserResponse.model_validate(staff_user)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    description="Returns the profile of the currently authenticated user based on their JWT token.",
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Retrieve the profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)
