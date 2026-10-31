"""Authentication business logic service."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    generate_secure_reset_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.customer import Customer
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.schemas.auth import StaffCreateRequest, TokenResponse, UserRegisterRequest, UserResponse


class AuthService:
    """Service handling user registration, authentication, tokens, and password reset."""

    @staticmethod
    async def register_customer(
        db: AsyncSession,
        payload: UserRegisterRequest,
    ) -> User:
        """Register a new customer account and create their subscriber profile."""
        # Verify email uniqueness
        existing_user = await db.scalar(
            select(User).where(User.email == payload.email)
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered.",
            )

        hashed = hash_password(payload.password)
        new_user = User(
            email=payload.email,
            hashed_password=hashed,
            full_name=payload.full_name,
            role="customer",
            is_active=True,
        )
        db.add(new_user)
        await db.flush()

        # Instantiate subscriber customer profile
        customer_profile = Customer(
            user_id=new_user.id,
            name=new_user.full_name,
            email=new_user.email,
            currency="USD",
            is_active=True,
        )
        db.add(customer_profile)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def create_staff_user(
        db: AsyncSession,
        payload: StaffCreateRequest,
    ) -> User:
        """Create a staff account (restricted to admin users)."""
        existing_user = await db.scalar(
            select(User).where(User.email == payload.email)
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered.",
            )

        hashed = hash_password(payload.password)
        staff_user = User(
            email=payload.email,
            hashed_password=hashed,
            full_name=payload.full_name,
            role="staff",
            is_active=True,
        )
        db.add(staff_user)
        await db.commit()
        await db.refresh(staff_user)
        return staff_user

    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str,
    ) -> TokenResponse:
        """Verify user credentials and generate a signed JWT bearer token."""
        normalized_email = email.strip().lower()
        user = await db.scalar(
            select(User).where(User.email == normalized_email)
        )

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated.",
            )

        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
        access_token = create_access_token(token_data)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    async def create_password_reset_token(
        db: AsyncSession,
        user_id: uuid.UUID,
        expires_minutes: int = 60,
    ) -> str:
        """Generate, hash, and persist a password reset token for a user."""
        raw_token, token_hash = generate_secure_reset_token()
        now_utc = datetime.now(timezone.utc)
        expires_at = now_utc + timedelta(minutes=expires_minutes)

        reset_record = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            is_used=False,
        )
        db.add(reset_record)
        await db.commit()
        return raw_token

    @staticmethod
    async def verify_password_reset_token(
        db: AsyncSession,
        raw_token: str,
    ) -> Optional[PasswordResetToken]:
        """Verify token hash existence, expiration, and unused status."""
        token_hash = hash_token(raw_token)
        now_utc = datetime.now(timezone.utc)

        token_record = await db.scalar(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.is_used.is_(False),
                PasswordResetToken.expires_at > now_utc,
            )
        )
        return token_record
