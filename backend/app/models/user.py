"""User authentication and profile model."""

import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, CheckConstraint, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.customer import Customer
    from app.models.organization import Organization
    from app.models.password_reset import PasswordResetToken


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """User account entity for authentication and RBAC."""

    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'staff', 'customer')",
            name="chk_user_role_valid",
        ),
    )

    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        String(50),
        default="customer",
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    organization: Mapped[Optional["Organization"]] = relationship(
        back_populates="users",
    )
    customer: Mapped[Optional["Customer"]] = relationship(
        back_populates="user",
        uselist=False,
    )
    reset_tokens: Mapped[List["PasswordResetToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        back_populates="user",
    )
