"""Organization tenant model."""

from typing import TYPE_CHECKING, List
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.invoice import Invoice
    from app.models.plan import Plan
    from app.models.product import Product
    from app.models.subscription import Subscription
    from app.models.user import User


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Organization model representing tenant entities."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    billing_email: Mapped[str] = mapped_column(String(255), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    users: Mapped[List["User"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    customers: Mapped[List["Customer"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    products: Mapped[List["Product"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    plans: Mapped[List["Plan"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    subscriptions: Mapped[List["Subscription"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    invoices: Mapped[List["Invoice"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
    )
