"""Customer subscriber profile model."""

import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.invoice import Invoice
    from app.models.organization import Organization
    from app.models.quotation import Quotation
    from app.models.subscription import Subscription
    from app.models.user import User


class Customer(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Customer entity representing billing and subscriber accounts."""

    __tablename__ = "customers"

    organization_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        unique=True,
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    tax_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    billing_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        back_populates="customer",
    )
    organization: Mapped[Optional["Organization"]] = relationship(
        back_populates="customers",
    )
    subscriptions: Mapped[List["Subscription"]] = relationship(
        back_populates="customer",
    )
    quotations: Mapped[List["Quotation"]] = relationship(
        back_populates="customer",
    )
    invoices: Mapped[List["Invoice"]] = relationship(
        back_populates="customer",
    )
